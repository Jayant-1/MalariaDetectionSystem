"""
Model inference and prediction logic
"""

import numpy as np
from typing import Tuple, Dict, Any
from tensorflow import keras

from config import CLASS_NAMES, MC_DROPOUT_RUNS, GRADCAM_LAYER_NAME
from preprocess import preprocess_image
from explainability import (
    compute_gradcam, overlay_heatmap, compute_uncertainty, get_confidence_level
)
from utils import format_probabilities, image_to_base64

def basic_prediction(model: keras.Model, image: np.ndarray) -> Dict[str, Any]:
    """
    Perform basic prediction
    
    Args:
        model: Trained Keras model
        image: Raw RGB image
    
    Returns:
        Dictionary with prediction results
    """
    # Preprocess
    processed_image = preprocess_image(image)
    
    # Predict
    img_array = np.expand_dims(processed_image, axis=0)
    prediction = model.predict(img_array, verbose=0)[0]
    
    predicted_class = int(np.argmax(prediction))
    confidence = float(prediction[predicted_class])
    
    return {
        'predicted_class': CLASS_NAMES[predicted_class],
        'predicted_class_idx': predicted_class,
        'confidence': confidence,
        'probabilities': format_probabilities(prediction, CLASS_NAMES)
    }

def detailed_prediction(
    model: keras.Model,
    image: np.ndarray,
    include_gradcam: bool = True
) -> Dict[str, Any]:
    """
    Perform detailed prediction with explainability
    
    Args:
        model: Trained Keras model
        image: Raw RGB image
        include_gradcam: Whether to include Grad-CAM
    
    Returns:
        Dictionary with detailed prediction results
    """
    # Preprocess
    processed_image = preprocess_image(image)
    
    # Basic prediction
    img_array = np.expand_dims(processed_image, axis=0)
    prediction = model.predict(img_array, verbose=0)[0]
    
    predicted_class = int(np.argmax(prediction))
    confidence = float(prediction[predicted_class])
    
    # Uncertainty estimation
    mean_pred, std_pred = compute_uncertainty(model, processed_image, MC_DROPOUT_RUNS)
    uncertainty = float(std_pred[predicted_class])
    
    # Confidence level
    confidence_level, recommendation = get_confidence_level(uncertainty)
    
    # Grad-CAM
    gradcam_base64 = None
    if include_gradcam:
        heatmap = compute_gradcam(model, processed_image, GRADCAM_LAYER_NAME)
        rgb_image = processed_image[:, :, :3]
        overlay = overlay_heatmap(rgb_image, heatmap)
        gradcam_base64 = image_to_base64(overlay)
    
    return {
        'predicted_class': CLASS_NAMES[predicted_class],
        'predicted_class_idx': predicted_class,
        'confidence': confidence,
        'probabilities': format_probabilities(prediction, CLASS_NAMES),
        'uncertainty': uncertainty,
        'confidence_level': confidence_level,
        'recommendation': recommendation,
        'gradcam_image': gradcam_base64
    }

def tta_prediction(
    model: keras.Model,
    image: np.ndarray,
    num_augmentations: int = 10
) -> Dict[str, Any]:
    """
    Perform prediction with Test-Time Augmentation
    
    Args:
        model: Trained Keras model
        image: Raw RGB image
        num_augmentations: Number of augmentations
    
    Returns:
        Dictionary with averaged prediction results
    """
    processed_image = preprocess_image(image)
    predictions_tta = []
    
    # Original
    img_array = np.expand_dims(processed_image, axis=0)
    pred = model.predict(img_array, verbose=0)[0]
    predictions_tta.append(pred)
    
    # Augmented
    rgb_image = processed_image[:, :, :3]
    for _ in range(num_augmentations - 1):
        aug_rgb = rgb_image.copy()
        
        # Random flips
        if np.random.rand() > 0.5:
            aug_rgb = np.flip(aug_rgb, axis=0)
        if np.random.rand() > 0.5:
            aug_rgb = np.flip(aug_rgb, axis=1)
        
        # Preprocess and predict
        aug_processed = preprocess_image((aug_rgb * 255).astype(np.uint8))
        aug_array = np.expand_dims(aug_processed, axis=0)
        pred = model.predict(aug_array, verbose=0)[0]
        predictions_tta.append(pred)
    
    # Average predictions
    avg_prediction = np.mean(predictions_tta, axis=0)
    predicted_class = int(np.argmax(avg_prediction))
    confidence = float(avg_prediction[predicted_class])
    
    return {
        'predicted_class': CLASS_NAMES[predicted_class],
        'predicted_class_idx': predicted_class,
        'confidence': confidence,
        'probabilities': format_probabilities(avg_prediction, CLASS_NAMES)
    }
