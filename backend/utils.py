"""
Utility functions for MalariNet API
"""

import numpy as np
import cv2
import base64
import uuid
from datetime import datetime

def generate_prediction_id() -> str:
    """Generate unique prediction ID"""
    return str(uuid.uuid4())

def get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def image_to_base64(image: np.ndarray) -> str:
    """
    Convert numpy image to base64 string
    
    Args:
        image: Image as numpy array (RGB)
    
    Returns:
        Base64 encoded string
    """
    # Convert RGB to BGR for OpenCV
    image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    # Encode to PNG
    _, buffer = cv2.imencode('.png', image_bgr)
    
    # Convert to base64
    return base64.b64encode(buffer).decode('utf-8')

def base64_to_image(base64_string: str) -> np.ndarray:
    """
    Convert base64 string to numpy image
    
    Args:
        base64_string: Base64 encoded image
    
    Returns:
        Image as numpy array (RGB)
    """
    # Decode base64
    img_data = base64.b64decode(base64_string)
    
    # Convert to numpy array
    nparr = np.frombuffer(img_data, np.uint8)
    
    # Decode image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert BGR to RGB
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

def format_probabilities(prediction: np.ndarray, class_names: list) -> dict:
    """
    Format prediction probabilities as dictionary
    
    Args:
        prediction: Prediction array
        class_names: List of class names
    
    Returns:
        Dictionary mapping class names to probabilities
    """
    return {
        class_name: float(prob)
        for class_name, prob in zip(class_names, prediction)
    }
