"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List

class PredictionRequest(BaseModel):
    """Request schema for prediction"""
    image_base64: str = Field(..., description="Base64 encoded image")
    use_tta: bool = Field(False, description="Use test-time augmentation")
    patient_id: Optional[str] = Field(None, description="Patient identifier")

class PredictionResponse(BaseModel):
    """Response schema for basic prediction"""
    prediction_id: str
    patient_id: Optional[str]
    predicted_class: str
    confidence: float
    probabilities: dict
    timestamp: str

class DetailedPredictionResponse(PredictionResponse):
    """Response schema for detailed prediction with explainability"""
    uncertainty: float
    confidence_level: str
    recommendation: str
    gradcam_image: Optional[str] = None

class ModelInfo(BaseModel):
    """Model metadata"""
    model_name: str
    version: str
    parameters: int
    input_shape: List[int]
    classes: List[str]
    accuracy: Optional[float]

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    timestamp: str

class BatchPredictionResponse(BaseModel):
    """Response for batch predictions"""
    batch_id: str
    total_images: int
    results: List[dict]
    timestamp: str
