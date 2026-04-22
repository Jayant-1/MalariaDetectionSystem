"""
Explainability functions: Grad-CAM and uncertainty quantification
"""

import numpy as np
import cv2
import tensorflow as tf
from tensorflow import keras
from typing import Tuple

from config import GRADCAM_ALPHA, HIGH_CONFIDENCE_THRESHOLD, MODERATE_CONFIDENCE_THRESHOLD

def compute_gradcam(
    model: keras.Model,
    image: np.ndarray,
    layer_name: str
) -> np.ndarray:
    """
    Compute Grad-CAM heatmap
    
    Args:
        model: Trained Keras model
        image: Preprocessed image (224x224x7)
        layer_name: Target layer name
    
    Returns:
        Normalized heatmap (0-1)
    """
    # Build gradient model
    grad_model = keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(layer_name).output, model.output]
    )
    
    img_array = np.expand_dims(image, axis=0)
    
    # Compute gradients
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        
        # FIX: Handle predictions properly
        # Extract first batch element before argmax
        class_idx = tf.argmax(predictions[0])
        
        # FIX: Index correctly - predictions[0] first, then class
        class_channel = predictions[:, class_idx]
    
    # FIX: Compute gradient with respect to conv_outputs
    grads = tape.gradient(class_channel, conv_outputs)
    
    # Global average pooling of gradients
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    
    # Weight feature maps
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    
    # Normalize
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    
    return heatmap.numpy()


def overlay_heatmap(
    image: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = GRADCAM_ALPHA
) -> np.ndarray:
    """
    Create Grad-CAM overlay visualization
    
    Args:
        image: Original RGB image (0-1)
        heatmap: Grad-CAM heatmap
        alpha: Overlay transparency
    
    Returns:
        Superimposed image (uint8)
    """
    # Resize heatmap
    heatmap = cv2.resize(heatmap, (image.shape[1], image.shape[0]))
    
    # Apply colormap
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    
    # Overlay
    image_uint8 = np.uint8(255 * image)
    superimposed = cv2.addWeighted(image_uint8, 1-alpha, heatmap, alpha, 0)
    
    return superimposed

def compute_uncertainty(
    model: keras.Model,
    image: np.ndarray,
    num_runs: int = 30
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute prediction uncertainty using Monte Carlo Dropout
    
    Args:
        model: Trained Keras model
        image: Preprocessed image (224x224x7)
        num_runs: Number of stochastic passes
    
    Returns:
        Tuple of (mean_prediction, std_prediction)
    """
    predictions = []
    img_array = np.expand_dims(image, axis=0)
    
    # Multiple forward passes with dropout active
    for _ in range(num_runs):
        pred = model(img_array, training=True)
        predictions.append(pred.numpy()[0])
    
    predictions = np.array(predictions)
    mean_pred = np.mean(predictions, axis=0)
    std_pred = np.std(predictions, axis=0)
    
    return mean_pred, std_pred

def get_confidence_level(
    uncertainty: float,
    high_threshold: float = HIGH_CONFIDENCE_THRESHOLD,
    moderate_threshold: float = MODERATE_CONFIDENCE_THRESHOLD
) -> Tuple[str, str]:
    """
    Determine confidence level and clinical recommendation
    
    Args:
        uncertainty: Standard deviation of predictions
        high_threshold: Threshold for high confidence
        moderate_threshold: Threshold for moderate confidence
    
    Returns:
        Tuple of (confidence_level, recommendation)
    """
    if uncertainty < high_threshold:
        return "High", "Reliable for clinical use"
    elif uncertainty < moderate_threshold:
        return "Moderate", "Consider confirmatory testing"
    else:
        return "Low", "Manual microscopy review required"
