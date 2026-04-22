"""PostgreSQL database operations (Railway-compatible) for the final schema."""

import json
import os
import time
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def _get_conn_with_retry(max_retries=10, initial_delay=1):
    """
    Connect to database with exponential backoff retry logic.
    Useful for Railway where Postgres may be starting up.
    
    Args:
        max_retries: Maximum number of connection attempts
        initial_delay: Initial delay between retries in seconds
    
    Returns:
        Database connection
    
    Raises:
        RuntimeError: If DATABASE_URL is not set
        psycopg.OperationalError: If connection fails after all retries
    """
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Configure Railway Postgres DATABASE_URL."
        )
    
    delay = initial_delay
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return psycopg.connect(DATABASE_URL, autocommit=True, row_factory=dict_row)
        except psycopg.OperationalError as e:
            last_error = e
            if attempt < max_retries - 1:
                print(f"DB Connection attempt {attempt + 1}/{max_retries} failed. Retrying in {delay}s...")
                print(f"Error: {str(e)[:100]}")
                time.sleep(delay)
                delay = min(delay * 2, 30)  # Exponential backoff, max 30 seconds
            else:
                print(f"DB Connection failed after {max_retries} attempts")
    
    raise last_error


def _get_conn():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Configure Railway Postgres DATABASE_URL."
        )
    return psycopg.connect(DATABASE_URL, autocommit=True, row_factory=dict_row)


def init_database():
    """Create required tables (if missing) and seed minimal records.
    Uses connection retry logic for Railway Postgres startup delays."""
    with _get_conn_with_retry() as conn, conn.cursor() as cur:
        # Core entities
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS organizations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT,
                phone TEXT,
                email TEXT
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS doctor (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                org_id INTEGER REFERENCES organizations(id),
                specialty TEXT,
                license_number TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                last_login TIMESTAMPTZ,
                auth_user_id TEXT UNIQUE
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                date_registered DATE NOT NULL DEFAULT CURRENT_DATE,
                medical_record_number TEXT,
                patient_id TEXT UNIQUE,
                phone TEXT,
                address TEXT,
                emergency_contact TEXT,
                risk_factors JSONB,
                last_test_date TIMESTAMPTZ,
                created_by INTEGER
            );
            """
        )

        # Prediction workflow tables
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS blood_samples (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
                image_path TEXT NOT NULL,
                image_metadata TEXT,
                processing_status TEXT NOT NULL DEFAULT 'pending',
                error_message TEXT,
                storage_url TEXT,
                image_data BYTEA
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
                sample_id INTEGER NOT NULL REFERENCES blood_samples(id) ON DELETE CASCADE,
                doctor_id INTEGER NOT NULL REFERENCES doctor(id),
                predicted_class TEXT NOT NULL,
                confidence_score DOUBLE PRECISION NOT NULL,
                probabilities JSONB NOT NULL,
                prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
                model_version INTEGER NOT NULL DEFAULT 1
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS prediction_details (
                id SERIAL PRIMARY KEY,
                prediction_id INTEGER NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
                species_detected TEXT,
                parasite_count INTEGER,
                grad_cam_path TEXT,
                parasite_stage TEXT,
                attention_regions JSONB,
                image_quality_score INTEGER,
                analysis_duration_sec INTEGER,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS prediction_history (
                id SERIAL PRIMARY KEY,
                sample_id INTEGER REFERENCES blood_samples(id) ON DELETE SET NULL,
                doctor_id INTEGER NOT NULL REFERENCES doctor(id),
                endpoint_used TEXT NOT NULL,
                request_payload JSONB NOT NULL,
                status TEXT NOT NULL,
                response_payload JSONB NOT NULL,
                error_message TEXT,
                processing_time_ms INTEGER NOT NULL,
                model_version INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )

        # Helpful indexes
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_blood_samples_patient_id ON blood_samples(patient_id);"
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_predictions_sample_id ON predictions(sample_id);"
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_predictions_doctor_id ON predictions(doctor_id);"
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_prediction_history_doctor_id ON prediction_history(doctor_id);"
        )

        # Minimal seed data for smooth first run / demos
        cur.execute(
            """
            INSERT INTO organizations (id, name)
            VALUES (1, 'Default Organization')
            ON CONFLICT (id) DO NOTHING;
            """
        )
        cur.execute(
            """
            INSERT INTO doctor (id, name, org_id, specialty, license_number, is_active)
            VALUES (1, 'Default Doctor', 1, 'General Medicine', 'RAILWAY-DEFAULT', TRUE)
            ON CONFLICT (id) DO NOTHING;
            """
        )
        cur.execute(
            """
            INSERT INTO patients (id, name, age, gender, medical_record_number, patient_id)
            VALUES (1, 'Default Patient', 30, 'other', 'MRN-0001', 'P000001')
            ON CONFLICT (id) DO NOTHING;
            """
        )


# =============================================================================
# BLOOD SAMPLES
# =============================================================================

async def create_blood_sample(patient_id: int, image_file: bytes, filename: str, metadata: dict):
    """
    Create blood sample record in PostgreSQL.

    Supabase storage is removed; image bytes are stored in `blood_samples.image_data`.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = (filename or "upload.bin").replace(" ", "_")
    storage_path = f"blood_samples/{patient_id}/{timestamp}_{safe_filename}"

    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO blood_samples
                (patient_id, sample_date, image_path, image_metadata, processing_status, storage_url, image_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, patient_id, sample_date, image_path, image_metadata, processing_status, error_message, storage_url;
            """,
            (
                patient_id,
                date.today(),
                storage_path,
                json.dumps(metadata or {}),
                "pending",
                None,
                image_file,
            ),
        )
        return cur.fetchone()


async def update_sample_status(sample_id: int, status: str, error_message: Optional[str] = None):
    """Update blood sample processing status."""
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE blood_samples
            SET processing_status = %s,
                error_message = COALESCE(%s::text, error_message)
            WHERE id = %s;
            """,
            (status, error_message, sample_id),
        )


async def get_blood_sample(sample_id: int) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, patient_id, sample_date, image_path, image_metadata, processing_status, error_message, storage_url
            FROM blood_samples
            WHERE id = %s;
            """,
            (sample_id,),
        )
        return cur.fetchone()


# =============================================================================
# PREDICTIONS
# =============================================================================

async def save_prediction(
    sample_id: int,
    doctor_id: int,
    predicted_class: str,
    confidence_score: float,
    probabilities: dict,
    model_version: int,
):
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO predictions
                (sample_id, doctor_id, predicted_class, confidence_score, probabilities, prediction_date, model_version)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, sample_id, predicted_class, confidence_score, probabilities, prediction_date, model_version, doctor_id;
            """,
            (
                sample_id,
                doctor_id,
                predicted_class,
                confidence_score,
                Json(probabilities or {}),
                date.today(),
                model_version,
            ),
        )
        return cur.fetchone()


async def save_prediction_details(
    prediction_id: int,
    species_detected: str = None,
    parasite_count: int = None,
    image_quality_score: int = None,
):
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO prediction_details
                (prediction_id, species_detected, parasite_count, image_quality_score)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (prediction_id) DO UPDATE
            SET species_detected = EXCLUDED.species_detected,
                parasite_count = EXCLUDED.parasite_count,
                image_quality_score = EXCLUDED.image_quality_score
            RETURNING *;
            """,
            (prediction_id, species_detected, parasite_count, image_quality_score),
        )
        return cur.fetchone()


async def upload_gradcam(prediction_id: int, gradcam_base64: str) -> Optional[str]:
    """
    Legacy compatibility stub.
    Grad-CAM is returned inline in API responses; no external object storage is used.
    """
    return None


async def get_prediction(prediction_id: int) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                p.id AS prediction_id, p.sample_id, p.predicted_class, p.confidence_score, p.probabilities,
                p.prediction_date, p.model_version, p.doctor_id,
                d.id AS details_id, d.prediction_id AS details_prediction_id, d.species_detected, d.parasite_count,
                d.grad_cam_path, d.parasite_stage, d.attention_regions, d.image_quality_score,
                d.analysis_duration_sec, d.created_at AS details_created_at,
                bs.id AS sample_row_id, bs.patient_id AS sample_patient_id, bs.sample_date, bs.image_path,
                bs.image_metadata, bs.processing_status, bs.error_message, bs.storage_url,
                pt.id AS patient_row_id, pt.name AS patient_name, pt.age AS patient_age, pt.gender AS patient_gender,
                pt.date_registered, pt.medical_record_number, pt.phone AS patient_phone, pt.address AS patient_address,
                pt.emergency_contact, pt.risk_factors, pt.last_test_date, pt.created_by,
                dr.id AS doctor_row_id, dr.name AS doctor_name, dr.org_id, dr.specialty, dr.license_number,
                dr.is_active, dr.last_login
            FROM predictions p
            LEFT JOIN prediction_details d ON d.prediction_id = p.id
            JOIN blood_samples bs ON bs.id = p.sample_id
            JOIN patients pt ON pt.id = bs.patient_id
            JOIN doctor dr ON dr.id = p.doctor_id
            WHERE p.id = %s;
            """,
            (prediction_id,),
        )
        row = cur.fetchone()
        if not row:
            return None

        prediction = {
            "id": row["prediction_id"],
            "sample_id": row["sample_id"],
            "predicted_class": row["predicted_class"],
            "confidence_score": row["confidence_score"],
            "probabilities": row["probabilities"] or {},
            "prediction_date": row["prediction_date"],
            "model_version": row["model_version"],
            "doctor_id": row["doctor_id"],
        }

        details = None
        if row["details_id"] is not None:
            details = {
                "id": row["details_id"],
                "prediction_id": row["details_prediction_id"],
                "species_detected": row["species_detected"],
                "parasite_count": row["parasite_count"],
                "grad_cam_path": row["grad_cam_path"],
                "parasite_stage": row["parasite_stage"],
                "attention_regions": row["attention_regions"],
                "image_quality_score": row["image_quality_score"],
                "analysis_duration_sec": row["analysis_duration_sec"],
                "created_at": row["details_created_at"],
            }

        blood_sample = {
            "id": row["sample_row_id"],
            "patient_id": row["sample_patient_id"],
            "sample_date": row["sample_date"],
            "image_path": row["image_path"],
            "image_metadata": row["image_metadata"],
            "processing_status": row["processing_status"],
            "error_message": row["error_message"],
            "storage_url": row["storage_url"],
        }

        patient = {
            "id": row["patient_row_id"],
            "name": row["patient_name"],
            "age": row["patient_age"],
            "gender": row["patient_gender"],
            "date_registered": row["date_registered"],
            "medical_record_number": row["medical_record_number"],
            "phone": row["patient_phone"],
            "address": row["patient_address"],
            "emergency_contact": row["emergency_contact"],
            "risk_factors": row["risk_factors"],
            "last_test_date": row["last_test_date"],
            "created_by": row["created_by"],
        }

        doctor = {
            "id": row["doctor_row_id"],
            "name": row["doctor_name"],
            "org_id": row["org_id"],
            "specialty": row["specialty"],
            "license_number": row["license_number"],
            "is_active": row["is_active"],
            "last_login": row["last_login"],
        }

        return {
            "prediction": prediction,
            "details": details,
            "blood_sample": blood_sample,
            "patient": patient,
            "doctor": doctor,
        }


async def get_predictions_by_patient(patient_id: int) -> List[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                p.id, p.sample_id, p.predicted_class, p.confidence_score,
                p.probabilities, p.prediction_date, p.model_version, p.doctor_id
            FROM predictions p
            JOIN blood_samples bs ON bs.id = p.sample_id
            WHERE bs.patient_id = %s
            ORDER BY p.prediction_date DESC, p.id DESC;
            """,
            (patient_id,),
        )
        return cur.fetchall() or []


async def get_predictions_by_doctor(doctor_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id, sample_id, predicted_class, confidence_score, probabilities,
                prediction_date, model_version, doctor_id
            FROM predictions
            WHERE doctor_id = %s
            ORDER BY prediction_date DESC, id DESC
            LIMIT %s;
            """,
            (doctor_id, limit),
        )
        return cur.fetchall() or []


# =============================================================================
# PREDICTION HISTORY (Audit Log)
# =============================================================================

async def log_prediction_attempt(
    sample_id: Optional[int],
    doctor_id: int,
    endpoint: str,
    status: str,
    request_data: Dict,
    response_data: Dict,
    processing_time_ms: int,
    error: Optional[str] = None,
    model_version: int = 1,
):
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO prediction_history
                (sample_id, doctor_id, endpoint_used, request_payload, status, response_payload,
                 error_message, processing_time_ms, model_version)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                sample_id,
                doctor_id,
                endpoint,
                Json(request_data or {}),
                status,
                Json(response_data or {}),
                error,
                processing_time_ms,
                model_version,
            ),
        )


# =============================================================================
# DOCTOR
# =============================================================================

async def get_doctor_by_auth_id(auth_user_id: str) -> Optional[Dict[str, Any]]:
    if not auth_user_id:
        return None
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM doctor WHERE auth_user_id = %s LIMIT 1;", (auth_user_id,))
        return cur.fetchone()


async def get_doctor_by_id(doctor_id: int) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM doctor WHERE id = %s LIMIT 1;", (doctor_id,))
        return cur.fetchone()


async def get_default_doctor() -> Optional[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM doctor ORDER BY id ASC LIMIT 1;")
        return cur.fetchone()


async def update_doctor_last_login(doctor_id: int):
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE doctor SET last_login = %s WHERE id = %s;",
            (datetime.now(), doctor_id),
        )


async def get_doctor_stats(doctor_id: int) -> Dict[str, Any]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                COUNT(*)::int AS total_predictions,
                COUNT(*) FILTER (WHERE predicted_class = 'Parasitized')::int AS parasitized_count,
                COALESCE(AVG(confidence_score), 0)::float AS average_confidence,
                MAX(prediction_date) AS last_prediction_date
            FROM predictions
            WHERE doctor_id = %s;
            """,
            (doctor_id,),
        )
        row = cur.fetchone() or {}
        total = row.get("total_predictions", 0) or 0
        parasitized = row.get("parasitized_count", 0) or 0
        return {
            "total_predictions": total,
            "parasitized_count": parasitized,
            "uninfected_count": max(total - parasitized, 0),
            "average_confidence": row.get("average_confidence", 0.0) or 0.0,
            "last_prediction_date": row.get("last_prediction_date"),
        }


# =============================================================================
# PATIENTS
# =============================================================================

async def get_patient(patient_id: int) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM patients WHERE id = %s LIMIT 1;", (patient_id,))
        return cur.fetchone()


async def get_patient_history(patient_id: int) -> Dict[str, Any]:
    patient = await get_patient(patient_id)
    if not patient:
        return {"patient": None, "total_tests": 0, "test_history": [], "latest_result": None}

    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                bs.id AS blood_sample_id, bs.sample_date, bs.image_path, bs.image_metadata,
                bs.processing_status, bs.error_message, bs.storage_url,
                p.id AS prediction_id, p.predicted_class, p.confidence_score, p.probabilities,
                p.prediction_date, p.model_version, p.doctor_id, p.sample_id
            FROM blood_samples bs
            LEFT JOIN predictions p ON p.sample_id = bs.id
            WHERE bs.patient_id = %s
            ORDER BY bs.sample_date DESC, bs.id DESC, p.id DESC;
            """,
            (patient_id,),
        )
        rows = cur.fetchall() or []

    test_history: List[Dict[str, Any]] = []
    latest_result: Optional[Dict[str, Any]] = None

    for row in rows:
        entry = {
            "blood_sample": {
                "id": row["blood_sample_id"],
                "patient_id": patient_id,
                "sample_date": row["sample_date"],
                "image_path": row["image_path"],
                "image_metadata": row["image_metadata"],
                "processing_status": row["processing_status"],
                "error_message": row["error_message"],
                "storage_url": row["storage_url"],
            },
            "prediction": None,
        }
        if row["prediction_id"] is not None:
            pred = {
                "id": row["prediction_id"],
                "sample_id": row["sample_id"],
                "predicted_class": row["predicted_class"],
                "confidence_score": row["confidence_score"],
                "probabilities": row["probabilities"] or {},
                "prediction_date": row["prediction_date"],
                "model_version": row["model_version"],
                "doctor_id": row["doctor_id"],
            }
            entry["prediction"] = pred
            if latest_result is None:
                latest_result = pred

        test_history.append(entry)

    return {
        "patient": patient,
        "total_tests": len(test_history),
        "test_history": test_history,
        "latest_result": latest_result,
    }


# =============================================================================
# ORGANIZATION
# =============================================================================

async def get_org_doctors(org_id: int) -> List[Dict[str, Any]]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM doctor WHERE org_id = %s;", (org_id,))
        return cur.fetchall() or []


async def get_org_stats(org_id: int) -> Dict[str, Any]:
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM organizations WHERE id = %s LIMIT 1;", (org_id,))
        org = cur.fetchone()

        if not org:
            org = {
                "id": org_id,
                "name": f"Organization {org_id}",
                "address": None,
                "phone": None,
                "email": None,
            }

        cur.execute(
            """
            SELECT
                COUNT(*)::int AS total_doctors,
                COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active_doctors
            FROM doctor
            WHERE org_id = %s;
            """,
            (org_id,),
        )
        doctors = cur.fetchone() or {"total_doctors": 0, "active_doctors": 0}

        cur.execute(
            """
            SELECT COUNT(*)::int AS total_predictions
            FROM predictions p
            JOIN doctor d ON d.id = p.doctor_id
            WHERE d.org_id = %s;
            """,
            (org_id,),
        )
        total_predictions = (cur.fetchone() or {}).get("total_predictions", 0)

        cur.execute(
            """
            SELECT COUNT(*)::int AS total_patients
            FROM patients
            WHERE created_by IN (SELECT id FROM doctor WHERE org_id = %s)
               OR created_by IS NULL;
            """,
            (org_id,),
        )
        total_patients = (cur.fetchone() or {}).get("total_patients", 0)

    return {
        "organization": {
            "id": org.get("id"),
            "name": org.get("name"),
            "address": org.get("address"),
            "phone": org.get("phone"),
            "email": org.get("email"),
        },
        "total_doctors": doctors.get("total_doctors", 0),
        "active_doctors": doctors.get("active_doctors", 0),
        "total_predictions": total_predictions or 0,
        "total_patients": total_patients or 0,
    }


async def get_public_reports(patient_public_id: str, dob: str) -> Dict[str, Any]:
    """Public report lookup using patient_id + date_registered."""
    with _get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT *
            FROM patients
            WHERE patient_id = %s
              AND date_registered = %s::date
            LIMIT 1;
            """,
            (patient_public_id, dob),
        )
        patient = cur.fetchone()
        if not patient:
            return {"success": False, "patient": None, "reports": []}

        cur.execute(
            """
            SELECT
                bs.id, bs.sample_date, bs.image_path, bs.image_metadata, bs.processing_status, bs.error_message, bs.storage_url,
                p.id AS prediction_id, p.predicted_class, p.confidence_score, p.probabilities, p.prediction_date, p.model_version, p.doctor_id
            FROM blood_samples bs
            LEFT JOIN predictions p ON p.sample_id = bs.id
            WHERE bs.patient_id = %s
            ORDER BY bs.sample_date DESC, bs.id DESC, p.id DESC;
            """,
            (patient["id"],),
        )
        rows = cur.fetchall() or []

    reports: List[Dict[str, Any]] = []
    for row in rows:
        report = {
            "id": row["id"],
            "sample_date": row["sample_date"],
            "image_path": row["image_path"],
            "image_metadata": row["image_metadata"],
            "processing_status": row["processing_status"],
            "error_message": row["error_message"],
            "storage_url": row["storage_url"],
            "predictions": [],
        }
        if row["prediction_id"] is not None:
            report["predictions"].append(
                {
                    "id": row["prediction_id"],
                    "predicted_class": row["predicted_class"],
                    "confidence_score": row["confidence_score"],
                    "probabilities": row["probabilities"] or {},
                    "prediction_date": row["prediction_date"],
                    "model_version": row["model_version"],
                    "doctor_id": row["doctor_id"],
                }
            )
        reports.append(report)

    return {
        "success": True,
        "patient": {
            "name": patient.get("name"),
            "age": patient.get("age"),
            "patient_id": patient.get("patient_id"),
            "gender": patient.get("gender"),
        },
        "reports": reports,
    }
