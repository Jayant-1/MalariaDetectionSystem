"""
Image preprocessing functions for MalariNet
"""

import numpy as np
import cv2
from PIL import Image
import io

from config import (
    IMAGE_SIZE, CLAHE_CLIP_LIMIT, CLAHE_TILE_GRID_SIZE,
    CANNY_THRESHOLD1, CANNY_THRESHOLD2
)

def decode_image(image_data: bytes) -> np.ndarray:
    """
    Decode image from bytes to numpy array
    
    Args:
        image_data: Raw image bytes
    
    Returns:
        RGB image as numpy array
    
    Raises:
        ValueError: If image format is invalid
    """
    try:
        image = Image.open(io.BytesIO(image_data))
        image = image.convert('RGB')
        return np.array(image)
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")

def apply_clahe(image: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    
    Args:
        image: Normalized RGB image (0-1)
    
    Returns:
        CLAHE-enhanced RGB image (0-1)
    """
    img_uint8 = (image * 255.0).astype(np.uint8)
    img_bgr = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2BGR)
    
    # Create CLAHE object
    clahe = cv2.createCLAHE(
        clipLimit=CLAHE_CLIP_LIMIT,
        tileGridSize=CLAHE_TILE_GRID_SIZE
    )
    
    # Apply CLAHE to each channel
    channels = cv2.split(img_bgr)
    enhanced_channels = [clahe.apply(ch) for ch in channels]
    enhanced_bgr = cv2.merge(enhanced_channels)
    enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
    
    return enhanced_rgb.astype(np.float32) / 255.0

def apply_canny(image: np.ndarray) -> np.ndarray:
    """
    Apply Canny edge detection
    
    Args:
        image: Normalized RGB image (0-1)
    
    Returns:
        Binary edge map (0-1) with shape (H, W, 1)
    """
    img_uint8 = (image * 255.0).astype(np.uint8)
    gray = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2GRAY)
    
    edges = cv2.Canny(gray, CANNY_THRESHOLD1, CANNY_THRESHOLD2)
    edges = edges.astype(np.float32) / 255.0
    edges = np.expand_dims(edges, axis=-1)
    
    return edges

def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    Complete preprocessing pipeline for MalariNet
    
    Creates 7-channel input:
    - Channels 0-2: Original RGB
    - Channels 3-5: CLAHE-enhanced RGB
    - Channel 6: Canny edges
    
    Args:
        image: Raw RGB image
    
    Returns:
        7-channel preprocessed image (224x224x7)
    """
    # Resize to model input size
    image = cv2.resize(image, (IMAGE_SIZE, IMAGE_SIZE))
    image = image.astype(np.float32) / 255.0
    
    # Apply CLAHE enhancement
    enhanced = apply_clahe(image)
    
    # Apply Canny edge detection
    edges = apply_canny(image)
    
    # Concatenate: RGB (3) + CLAHE (3) + Edges (1) = 7 channels
    combined = np.concatenate([image, enhanced, edges], axis=-1)
    
    return combined.astype(np.float32)
