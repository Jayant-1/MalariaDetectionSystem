"""
FastAPI Application - MalariNet API
Complete integration with final database schema
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from tensorflow import keras
from typing import Optional, List
import logging
import time
from datetime import datetime, date
from config import (
    MODEL_PATH, MODEL_NAME, MODEL_VERSION, MODEL_PARAMETERS, MODEL_ACCURACY,
    CLASS_NAMES, IMAGE_SIZE, INPUT_CHANNELS, API_TITLE, API_DESCRIPTION,
    API_VERSION, CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS,
    CORS_ALLOW_HEADERS, API_HOST, API_PORT
)
from models import (
    CompletePredictionResponse, PredictionWithDetailsResponse,
    PatientHistoryResponse, DoctorStatsResponse, OrganizationStatsResponse,
    HealthResponse, ModelInfo, CreatePatientRequest, PatientResponse,
    BloodSampleResponse, PredictionResponse, DoctorResponse, APIResponse
)
from keras_layers import get_custom_objects
from preprocess import decode_image
from inference import basic_prediction, detailed_prediction, tta_prediction
from utils import generate_prediction_id, get_current_timestamp
from auth import get_current_user
from postgres_client import (
    init_database, get_public_reports, get_default_doctor, get_doctor_by_id,
    create_blood_sample, update_sample_status, get_blood_sample,
    save_prediction, save_prediction_details, get_prediction,
    get_predictions_by_patient, get_predictions_by_doctor,
    log_prediction_attempt, get_doctor_by_auth_id,
    update_doctor_last_login, get_doctor_stats,
    get_patient_history, get_patient, get_org_stats
)

# =============================================================================
# SETUP
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)

# Global model variable
model = None

# =============================================================================
# STARTUP/SHUTDOWN
# =============================================================================

@app.on_event("startup")
async def load_model():
    """Load ML model on startup"""
    global model
    try:
        init_database()
        logger.info("Database initialized successfully")
        logger.info(f"Loading model from {MODEL_PATH}...")
        model = keras.models.load_model(
            MODEL_PATH,
            custom_objects=get_custom_objects(),
            compile=False
        )
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    logger.info("Shutting down MalariNet API...")

# =============================================================================
# PUBLIC ENDPOINTS
# =============================================================================

@app.get("/", tags=["System"])
async def root():
    """API root endpoint"""
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None,
        timestamp=get_current_timestamp()
    )

@app.get("/model/info", response_model=ModelInfo, tags=["System"])
async def get_model_info():
    """Get ML model information"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return ModelInfo(
        model_name=MODEL_NAME,
        version=MODEL_VERSION,
        parameters=MODEL_PARAMETERS,
        input_shape=[IMAGE_SIZE, IMAGE_SIZE, INPUT_CHANNELS],
        classes=CLASS_NAMES,
        accuracy=MODEL_ACCURACY
    )

# =============================================================================
# MAIN PREDICTION ENDPOINT
# =============================================================================

@app.post("/predict/complete", tags=["Prediction"])
async def complete_prediction_workflow(
    file: UploadFile = File(..., description="Blood smear microscopy image"),
    patient_id: int = Query(..., description="Patient ID from database"),
    doctor_id: Optional[int] = Form(None, description="Doctor ID (optional when auth token is absent)"),
    prediction_type: str = Query("detailed", description="Prediction type: basic or detailed"),
    current_user: dict = Depends(get_current_user)
):
    """
    Complete malaria detection workflow with Railway Postgres
    
    Process:
    1. Resolve doctor (JWT user, explicit doctor_id, or default doctor)
    2. Validate patient exists
    3. Validate patient exists
    4. Create blood sample record in PostgreSQL
    5. Run ML prediction
    6. Save prediction results
    7. Log attempt to audit trail
    8. Return complete results
    
    Args:
        file: Blood smear image (JPG, PNG)
        patient_id: Patient ID from patients table
        prediction_type: "basic" or "detailed"
        
    Returns:
        Complete prediction response with all details
    """
    start_time = time.time()
    sample_id = None
    doctor = None
    
    try:
        # 1. Validate model is loaded
        if model is None:
            raise HTTPException(status_code=503, detail="ML model not loaded")
        
        # 2. Resolve doctor from auth user, explicit doctor_id, or fallback default
        doctor = None
        if current_user.get("user_id"):
            doctor = await get_doctor_by_auth_id(current_user["user_id"])
        if not doctor and doctor_id is not None:
            doctor = await get_doctor_by_id(doctor_id)
        if not doctor:
            doctor = await get_default_doctor()

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found. Provide doctor_id or create a doctor record."
            )
        
        # Update last login
        await update_doctor_last_login(doctor["id"])
        
        # 3. Validate patient exists
        patient = await get_patient(patient_id)
        if not patient:
            raise HTTPException(
                status_code=404,
                detail=f"Patient with ID {patient_id} not found"
            )
        
        logger.info(f"Doctor {doctor['name']} uploading sample for patient {patient['name']}")
        
        # 4. Read file and validate
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # 5. Create blood sample record in PostgreSQL
        try:
            blood_sample = await create_blood_sample(
                patient_id=patient_id,
                image_file=image_data,
                filename=file.filename,
                metadata={
                    "original_filename": file.filename,
                    "content_type": file.content_type,
                    "size_bytes": len(image_data),
                    "uploaded_by": doctor["id"]
                }
            )
            sample_id = blood_sample["id"]
            logger.info(f"Blood sample created: ID={sample_id}")
            
        except Exception as storage_error:
            logger.error(f"Storage error: {storage_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload image: {str(storage_error)}"
            )
        
        logger.info(f"Running {prediction_type} prediction...")
        # 6. Run ML prediction
        try:
            image = decode_image(image_data)
            
            if prediction_type == "detailed":
                result = detailed_prediction(model, image, include_gradcam=True)
            else:  # basic
                result = basic_prediction(model, image)
            
            logger.info(f"Prediction: {result['predicted_class']} (confidence: {result['confidence']:.2%})")
            
            # Log Grad-CAM status
            if "gradcam_image" in result:
                if result["gradcam_image"]:
                    logger.info("✅ Grad-CAM generated successfully")
                else:
                    logger.warning("⚠️ Grad-CAM is None")
            
        except Exception as ml_error:
            logger.error(f"ML prediction failed: {ml_error}", exc_info=True)
            await update_sample_status(sample_id, "failed", error_message=str(ml_error))
            raise HTTPException(
                status_code=500,
                detail=f"ML prediction failed: {str(ml_error)}"
            )

        # 7. Save prediction to database
        try:
            prediction = await save_prediction(
                sample_id=sample_id,
                doctor_id=doctor["id"],
                predicted_class=result["predicted_class"],
                confidence_score=result["confidence"],
                probabilities=result["probabilities"],
                model_version=1
            )
            
            # Save detailed analysis if available
            if prediction_type == "detailed":
                await save_prediction_details(
                    prediction_id=prediction["id"],
                    species_detected=result.get("species"),
                    parasite_count=result.get("parasite_count"),
                    image_quality_score=result.get("quality_score")
                )
            
            # Update sample status to completed
            await update_sample_status(sample_id, "completed")
            
        except Exception as db_error:
            logger.error(f"Database error: {db_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save prediction: {str(db_error)}"
            )
        
        # 8. Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        # 9. Log successful attempt
        try:
            await log_prediction_attempt(
                sample_id=sample_id,
                doctor_id=doctor["id"],
                endpoint="/predict/complete",
                request_data={
                    "patient_id": patient_id,
                    "prediction_type": prediction_type,
                    "filename": file.filename,
                    "file_size": len(image_data)
                },
                status="success",
                response_data={
                    "predicted_class": result["predicted_class"],
                    "confidence": result["confidence"],
                    "prediction_id": prediction["id"]
                },
                processing_time_ms=processing_time,
                model_version=1
            )
        except Exception as log_error:
            # Don't fail the request if logging fails
            logger.warning(f"Failed to log attempt: {log_error}")
        
        logger.info(f"✅ Prediction completed in {processing_time}ms")
        
        
        # 10. Return complete response
        return {
            "success": True,
            "message": "Prediction completed successfully",
            "blood_sample": {
                "id": blood_sample["id"],
                "patient_id": patient_id,
                "sample_date": blood_sample["sample_date"],
                "storage_url": blood_sample["storage_url"],
                "processing_status": "completed"
            },
            "prediction": {
                "id": prediction["id"],
                "predicted_class": result["predicted_class"],
                "confidence_score": result["confidence"],
                "probabilities": result["probabilities"],
                "prediction_date": prediction["prediction_date"]
            },
            "details": {
                "species_detected": result.get("species"),
                "parasite_count": result.get("parasite_count"),
                "image_quality_score": result.get("quality_score"),
                "uncertainty": result.get("uncertainty"),
                "confidence_level": result.get("confidence_level"),
                "recommendation": result.get("recommendation"),
                "gradcam_image": result.get("gradcam_image")  # Already base64 from inference.py
            },
            "metadata": {
                "doctor_id": doctor["id"],
                "doctor_name": doctor["name"],
                "processing_time_ms": processing_time,
                "model_version": 1,
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except HTTPException:
        raise
        
    except Exception as e:
        # Log failed attempt
        processing_time = int((time.time() - start_time) * 1000)
        
        if doctor:
            try:
                await log_prediction_attempt(
                    sample_id=sample_id,
                    doctor_id=doctor["id"],
                    endpoint="/predict/complete",
                    request_data={
                        "patient_id": patient_id,
                        "error": str(e)
                    },
                    status="failed",
                    response_data={},
                    error=str(e),
                    processing_time_ms=processing_time,
                    model_version=1
                )
            except:
                pass  # Don't fail on logging error
        
        logger.error(f"❌ Prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Prediction workflow failed: {str(e)}"
        )



# =============================================================================
# QUERY ENDPOINTS
# =============================================================================

@app.get("/predictions/{prediction_id}", response_model=PredictionWithDetailsResponse, tags=["Query"])
async def get_prediction_by_id(
    prediction_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete prediction details
    
    Returns prediction with all related data:
    - Prediction results
    - Detailed analysis (if available)
    - Blood sample information
    - Patient details
    - Doctor information
    """
    try:
        prediction = await get_prediction(prediction_id)
        
        if not prediction:
            raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found")
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patients/{patient_id}/history", response_model=PatientHistoryResponse, tags=["Query"])
async def get_patient_test_history(
    patient_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete patient test history
    
    Returns:
    - Patient details
    - All blood samples
    - All predictions
    - Latest result
    """
    try:
        history = await get_patient_history(patient_id)
        
        if not history["patient"]:
            raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/patient/{patient_id}", response_model=List[PredictionResponse], tags=["Query"])
async def get_predictions_for_patient(
    patient_id: int,
    limit: int = Query(50, description="Maximum number of results"),
    current_user: dict = Depends(get_current_user)
):
    """Get all predictions for a specific patient"""
    try:
        predictions = await get_predictions_by_patient(patient_id)
        return predictions[:limit]
        
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/predictions", response_model=List[PredictionResponse], tags=["Doctor"])
async def get_my_predictions(
    limit: int = Query(50, description="Maximum number of results"),
    offset: int = Query(0, description="Pagination offset"),
    doctor_id: Optional[int] = Query(None, description="Doctor ID fallback"),
    current_user: dict = Depends(get_current_user)
):
    """Get current doctor's prediction history"""
    try:
        doctor = None
        if current_user.get("user_id"):
            doctor = await get_doctor_by_auth_id(current_user["user_id"])
        if not doctor and doctor_id is not None:
            doctor = await get_doctor_by_id(doctor_id)
        if not doctor:
            doctor = await get_default_doctor()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        predictions = await get_predictions_by_doctor(doctor["id"], limit)
        return predictions[offset:offset+limit]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/stats", response_model=DoctorStatsResponse, tags=["Doctor"])
async def get_my_statistics(
    doctor_id: Optional[int] = Query(None, description="Doctor ID fallback"),
    current_user: dict = Depends(get_current_user)
):
    """Get current doctor's statistics"""
    try:
        doctor = None
        if current_user.get("user_id"):
            doctor = await get_doctor_by_auth_id(current_user["user_id"])
        if not doctor and doctor_id is not None:
            doctor = await get_doctor_by_id(doctor_id)
        if not doctor:
            doctor = await get_default_doctor()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        stats = await get_doctor_stats(doctor["id"])
        
        return DoctorStatsResponse(
            doctor=DoctorResponse(**doctor),
            **stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/profile", response_model=DoctorResponse, tags=["Doctor"])
async def get_my_profile(
    doctor_id: Optional[int] = Query(None, description="Doctor ID fallback"),
    current_user: dict = Depends(get_current_user)
):
    """Get current doctor's profile"""
    try:
        doctor = None
        if current_user.get("user_id"):
            doctor = await get_doctor_by_auth_id(current_user["user_id"])
        if not doctor and doctor_id is not None:
            doctor = await get_doctor_by_id(doctor_id)
        if not doctor:
            doctor = await get_default_doctor()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        return DoctorResponse(**doctor)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/organization/{org_id}/stats", response_model=OrganizationStatsResponse, tags=["Organization"])
async def get_organization_statistics(
    org_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get organization statistics (admin/manager only)"""
    try:
        # TODO: Add authorization check for admin/manager role
        stats = await get_org_stats(org_id)
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching org stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# LEGACY ENDPOINTS (for backward compatibility)
# =============================================================================

@app.post("/predict", tags=["Legacy"])
async def basic_predict(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Basic prediction endpoint (legacy)
    
    Note: Use /predict/complete for full workflow
    This endpoint only runs prediction without database operations
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        image_data = await file.read()
        image = decode_image(image_data)
        result = basic_prediction(model, image)
        
        return {
            "predicted_class": result["predicted_class"],
            "confidence": result["confidence"],
            "probabilities": result["probabilities"],
            "timestamp": get_current_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/public/reports", tags=["Public"])
async def get_patient_reports_public(
    patient_id: str = Query(..., example="P000123", description="Patient ID"),
    dob: str = Query(..., example="2000-01-15", description="Date of birth (YYYY-MM-DD)"),
):
    """
    Public endpoint for patients to view their reports
    No authentication required - uses patient_id + DOB for verification
    """
    try:
        result = await get_public_reports(patient_id, dob)
        if not result.get("success"):
            raise HTTPException(
                status_code=404,
                detail="Invalid patient ID or date of birth"
            )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Public report fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info"
    )
