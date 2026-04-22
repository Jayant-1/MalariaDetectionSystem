"""
Configuration file for MalariNet API
"""

import os

# Model configuration
MODEL_PATH = "malarinet_lite_best_96.669.keras"
MODEL_NAME = "MalariNet-Lite"
MODEL_VERSION = "1.0.0"
MODEL_PARAMETERS = 489014
MODEL_ACCURACY = 0.98

# Class names
CLASS_NAMES = ['Parasitized', 'Uninfected']

# Image preprocessing
IMAGE_SIZE = 224
INPUT_CHANNELS = 7

# CLAHE parameters
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (8, 8)

# Canny edge detection
CANNY_THRESHOLD1 = 100
CANNY_THRESHOLD2 = 200

# API configuration
API_TITLE = "MalariNet API"
API_DESCRIPTION = "AI-powered malaria detection from blood smear images"
API_VERSION = "1.0.0"
API_HOST = "0.0.0.0"
API_PORT = int(os.getenv("PORT", 8000))

# Request limits
MAX_BATCH_SIZE = 50
MAX_TTA_AUGMENTATIONS = 20

# Low-memory mode for constrained hosts (Railway free/shared instances)
LOW_MEMORY_MODE = os.getenv("LOW_MEMORY_MODE", "true").strip().lower() == "true"
DEFAULT_TTA_AUGMENTATIONS = int(
	os.getenv("DEFAULT_TTA_AUGMENTATIONS", "3" if LOW_MEMORY_MODE else "10")
)

# Uncertainty thresholds
HIGH_CONFIDENCE_THRESHOLD = 0.05
MODERATE_CONFIDENCE_THRESHOLD = 0.15

# Monte Carlo Dropout
MC_DROPOUT_RUNS = int(os.getenv("MC_DROPOUT_RUNS", "4" if LOW_MEMORY_MODE else "30"))
MC_DROPOUT_RUNS_FULL = int(os.getenv("MC_DROPOUT_RUNS_FULL", "8" if LOW_MEMORY_MODE else "50"))

# Grad-CAM configuration
GRADCAM_LAYER_NAME = 'b4_attention'
GRADCAM_ALPHA = 0.4

# CORS configuration
CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]

# Logging
LOG_LEVEL = "INFO"
