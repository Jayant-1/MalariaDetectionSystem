"""
Supabase database operations for final schema
"""

import os
from supabase import create_client, Client
from datetime import datetime , date
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
import base64

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# =============================================================================
# BLOOD SAMPLES
# =============================================================================
async def create_blood_sample(patient_id: int, image_file: bytes, filename: str, metadata: dict):
    """
    Create blood sample record and upload image to Supabase Storage
    
    Args:
        patient_id: Patient ID
        image_file: Image bytes
        filename: Original filename
        metadata: Additional metadata
    """
    try:
        from datetime import datetime
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = filename.replace(" ", "_")
        unique_filename = f"{timestamp}_{safe_filename}"
        storage_path = f"blood_samples/{patient_id}/{unique_filename}"
        
        # Detect MIME type
        if filename.lower().endswith('.png'):
            mime_type = "image/png"
        elif filename.lower().endswith(('.jpg', '.jpeg')):
            mime_type = "image/jpeg"
        else:
            mime_type = "image/png"
        
        print(f"Uploading: {unique_filename}, Type: {mime_type}, Size: {len(image_file)} bytes")
        
        # Upload to Supabase Storage
        upload_result = supabase.storage.from_("malaria-images").upload(
            path=storage_path,
            file=image_file,
            file_options={
                "content-type": mime_type,
                "cache-control": "3600",
                "upsert": "false"
            }
        )
        
        # Get public URL
        storage_url = supabase.storage.from_("malaria-images").get_public_url(storage_path)
        
        # Insert blood sample record
        blood_sample_data = {
            "patient_id": patient_id,
            "sample_date": datetime.now().date().isoformat(),
            "image_path": storage_path,
            "storage_url": storage_url,
            "processing_status": "pending",
            "image_metadata": str(metadata)
        }
        
        response = supabase.table("blood_samples").insert(blood_sample_data).execute()
        
        if not response.data:
            raise Exception("Failed to insert blood sample record")
        
        return response.data[0]
        
    except Exception as e:
        print(f"Error in create_blood_sample: {e}")
        raise Exception(f"Failed to create blood sample: {str(e)}")

async def update_sample_status(
    sample_id: int,
    status: str,
    error_message: Optional[str] = None
):
    """Update blood sample processing status"""
    update_data = {"processing_status": status}
    if error_message:
        update_data["error_message"] = error_message
    
    supabase.table("blood_samples").update(update_data).eq("id", sample_id).execute()

async def get_blood_sample(sample_id: int) -> Optional[Dict[str, Any]]:
    """Get blood sample by ID"""
    result = supabase.table("blood_samples").select("*").eq("id", sample_id).single().execute()
    return result.data if result.data else None

# =============================================================================
# PREDICTIONS
# =============================================================================

async def save_prediction(sample_id: int, doctor_id: int, predicted_class: str, 
                         confidence_score: float, probabilities: dict, model_version: int):
    """Save prediction to database"""
    prediction_data = {
        "sample_id": sample_id,
        "doctor_id": doctor_id,
        "predicted_class": predicted_class,  # ✅ Add this
        "confidence_score": confidence_score,
        "probabilities": probabilities,
        "prediction_date": date.today().isoformat(),
        "model_version": model_version
    }
    response = supabase.table("predictions").insert(prediction_data).execute()
    return response.data[0]

async def save_prediction_details(prediction_id: int, species_detected: str = None,
                                  parasite_count: int = None, image_quality_score: int = None):
    """Save detailed prediction analysis"""
    details_data = {
        "prediction_id": prediction_id,
        "species_detected": species_detected,
        "parasite_count": parasite_count,
        "image_quality_score": image_quality_score
    }
    
    try:
        response = supabase.table("prediction_details").insert(details_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error saving prediction details: {e}")
        return None


async def upload_gradcam(prediction_id: int, gradcam_base64: str) -> str:
    """Upload Grad-CAM image to Supabase Storage"""
    # Decode base64
    gradcam_bytes = base64.b64decode(gradcam_base64)
    
    # Upload to storage
    path = f"gradcam/{prediction_id}_gradcam.png"
    supabase.storage.from_("malaria-images").upload(path, gradcam_bytes)
    
    return path

async def get_prediction(prediction_id: int) -> Optional[Dict[str, Any]]:
    """Get prediction with details"""
    result = supabase.table("predictions").select(
        "*, prediction_details(*), blood_samples(*), doctor(name, specialty)"
    ).eq("id", prediction_id).single().execute()
    
    return result.data if result.data else None

async def get_predictions_by_patient(patient_id: int) -> List[Dict[str, Any]]:
    """Get all predictions for a patient"""
    result = supabase.table("predictions").select(
        "*, blood_samples!inner(patient_id)"
    ).eq("blood_samples.patient_id", patient_id).order(
        "prediction_date", desc=True
    ).execute()
    
    return result.data

async def get_predictions_by_doctor(doctor_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Get predictions made by a doctor"""
    result = supabase.table("predictions").select(
        "*, blood_samples(patient_id, sample_date)"
    ).eq("doctor_id", doctor_id).order(
        "prediction_date", desc=True
    ).limit(limit).execute()
    
    return result.data

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
    model_version: int = 1
):
    """
    Log prediction attempt for auditing
    
    Matches your schema:
    - sample_id (int4)
    - doctor_id (int8)
    - endpoint_used (varchar)
    - request_payload (jsonb)
    - status (varchar)
    - response_payload (jsonb)
    - error_message (text)
    - processing_time_ms (int4)
    - model_version (int2)
    """
    log_record = {
        "sample_id": sample_id,
        "doctor_id": doctor_id,
        "endpoint_used": endpoint,
        "request_payload": request_data,
        "status": status,
        "response_payload": response_data,
        "error_message": error,
        "processing_time_ms": processing_time_ms,
        "model_version": model_version
    }
    
    supabase.table("prediction_history").insert(log_record).execute()

# =============================================================================
# DOCTOR
# =============================================================================

async def get_doctor_by_auth_id(auth_user_id: str) -> Optional[Dict[str, Any]]:
    """Get doctor by Supabase auth user ID"""
    result = supabase.table("doctor").select("*").eq(
        "auth_user_id", auth_user_id
    ).single().execute()
    
    return result.data if result.data else None

async def update_doctor_last_login(doctor_id: int):
    """Update doctor's last login timestamp"""
    supabase.table("doctor").update({
        "last_login": datetime.now().isoformat()
    }).eq("id", doctor_id).execute()

async def get_doctor_stats(doctor_id: int) -> Dict[str, Any]:
    """Get statistics for a doctor"""
    # Total predictions
    predictions = supabase.table("predictions").select(
        "id", count="exact"
    ).eq("doctor_id", doctor_id).execute()
    
    # Predictions by class
    parasitized = supabase.table("predictions").select(
        "id", count="exact"
    ).eq("doctor_id", doctor_id).eq("predicted_class", "Parasitized").execute()
    
    return {
        "total_predictions": predictions.count,
        "parasitized_count": parasitized.count,
        "uninfected_count": predictions.count - parasitized.count
    }

# =============================================================================
# PATIENTS
# =============================================================================

async def get_patient(patient_id: int):
    """Get patient by ID"""
    try:
        response = supabase.table("patients").select("*").eq("id", patient_id).execute()
        
        # Check if patient exists
        if not response.data or len(response.data) == 0:
            return None
        
        return response.data[0]
        
    except Exception as e:
        print(f"Error getting patient: {e}")
        return None


async def get_patient_history(patient_id: int) -> Dict[str, Any]:
    """Get complete patient test history"""
    # Get all blood samples
    samples = supabase.table("blood_samples").select(
        "*, predictions(*)"
    ).eq("patient_id", patient_id).order("sample_date", desc=True).execute()
    
    return {
        "patient": await get_patient(patient_id),
        "test_history": samples.data
    }

# =============================================================================
# ORGANIZATION
# =============================================================================

async def get_org_doctors(org_id: int) -> List[Dict[str, Any]]:
    """Get all doctors in an organization"""
    result = supabase.table("doctor").select("*").eq("org_id", org_id).execute()
    return result.data

async def get_org_stats(org_id: int) -> Dict[str, Any]:
    """Get organization statistics"""
    # Get all doctors in org
    doctors = await get_org_doctors(org_id)
    doctor_ids = [d["id"] for d in doctors]
    
    # Get predictions count
    predictions = supabase.table("predictions").select(
        "id", count="exact"
    ).in_("doctor_id", doctor_ids).execute()
    
    return {
        "org_id": org_id,
        "total_doctors": len(doctors),
        "total_predictions": predictions.count
    }
