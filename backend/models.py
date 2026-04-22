"""
Pydantic models for FastAPI request/response validation
Updated to match final database schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# =============================================================================
# REQUEST MODELS
# =============================================================================

class PredictionRequest(BaseModel):
    """Request for making a prediction"""
    patient_id: int = Field(..., description="Patient ID")
    prediction_type: str = Field("detailed", description="Prediction type: basic or detailed")
    save_to_db: bool = Field(True, description="Save prediction to database")

class CreatePatientRequest(BaseModel):
    """Request to create new patient"""
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_record_number: Optional[str] = None
    risk_factors: Optional[Dict[str, Any]] = None

# =============================================================================
# RESPONSE MODELS - DATABASE ENTITIES
# =============================================================================

class OrganizationResponse(BaseModel):
    """Organization details"""
    id: int
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class DoctorResponse(BaseModel):
    """Doctor details"""
    id: int
    name: str
    org_id: int
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    is_active: bool = True
    last_login: Optional[datetime] = None

class PatientResponse(BaseModel):
    """Patient details"""
    id: int
    name: str
    age: int
    gender: str
    date_registered: date
    medical_record_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    risk_factors: Optional[Dict[str, Any]] = None
    last_test_date: Optional[datetime] = None
    created_by: Optional[int] = None

class BloodSampleResponse(BaseModel):
    """Blood sample record"""
    id: int
    patient_id: int
    sample_date: date
    image_path: str
    image_metadata: Optional[str] = None
    processing_status: str  # "pending", "processed", "failed"
    error_message: Optional[str] = None
    storage_url: Optional[str] = None

class PredictionResponse(BaseModel):
    """Basic prediction response"""
    id: int
    sample_id: int
    predicted_class: str  # "Parasitized" or "Uninfected"
    confidence_score: float
    probabilities: Dict[str, float]
    prediction_date: date
    model_version: int
    doctor_id: int

class PredictionDetailsResponse(BaseModel):
    """Detailed prediction analysis"""
    id: int
    prediction_id: int
    species_detected: Optional[str] = None
    parasite_count: Optional[int] = None
    grad_cam_path: Optional[str] = None
    parasite_stage: Optional[str] = None
    attention_regions: Optional[Dict[str, Any]] = None
    image_quality_score: Optional[int] = None
    analysis_duration_sec: Optional[int] = None
    created_at: datetime

class PredictionHistoryResponse(BaseModel):
    """Audit log entry"""
    id: int
    sample_id: Optional[int] = None
    doctor_id: int
    endpoint_used: str
    request_payload: Dict[str, Any]
    status: str  # "success", "failed"
    response_payload: Dict[str, Any]
    error_message: Optional[str] = None
    processing_time_ms: int
    model_version: int
    created_at: datetime

# =============================================================================
# COMBINED RESPONSE MODELS
# =============================================================================

class CompletePredictionResponse(BaseModel):
    """Complete prediction workflow response"""
    success: bool
    blood_sample_id: int
    prediction_id: int
    result: Dict[str, Any]
    processing_time_ms: int
    timestamp: str

class PredictionWithDetailsResponse(BaseModel):
    """Prediction with all details"""
    prediction: PredictionResponse
    details: Optional[PredictionDetailsResponse] = None
    blood_sample: BloodSampleResponse
    patient: PatientResponse
    doctor: DoctorResponse

class PatientHistoryResponse(BaseModel):
    """Complete patient test history"""
    patient: PatientResponse
    total_tests: int
    test_history: List[Dict[str, Any]]
    latest_result: Optional[PredictionResponse] = None

class DoctorStatsResponse(BaseModel):
    """Doctor statistics"""
    doctor: DoctorResponse
    total_predictions: int
    parasitized_count: int
    uninfected_count: int
    average_confidence: float
    last_prediction_date: Optional[date] = None

class OrganizationStatsResponse(BaseModel):
    """Organization statistics"""
    organization: OrganizationResponse
    total_doctors: int
    active_doctors: int
    total_predictions: int
    total_patients: int

# =============================================================================
# SYSTEM RESPONSE MODELS
# =============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    timestamp: str

class ModelInfo(BaseModel):
    """Model metadata"""
    model_name: str
    version: str
    parameters: int
    input_shape: List[int]
    classes: List[str]
    accuracy: Optional[float]

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: str
    timestamp: str
    request_id: Optional[str] = None

# =============================================================================
# API RESPONSE WRAPPER
# =============================================================================

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: str
    
class PaginatedResponse(BaseModel):
    """Paginated response"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
