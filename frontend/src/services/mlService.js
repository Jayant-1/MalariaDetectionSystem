/**
 * Machine Learning API Service
 * Handles all interactions with the FastAPI ML model endpoints
 * Works without Supabase auth (optional bearer token support)
 */

// Ensure ML_API_URL has proper protocol
const ensureProtocol = (url) => {
  if (!url) return "http://localhost:8000";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // If no protocol, add https (works for production)
  return `https://${url}`;
};

const ML_API_URL = ensureProtocol(import.meta.env.VITE_ML_API_URL);
const STATIC_BEARER_TOKEN = import.meta.env.VITE_API_BEARER_TOKEN || "";

/**
 * Get optional bearer token from env/localStorage.
 */
const getAuthToken = () => {
  if (STATIC_BEARER_TOKEN) return STATIC_BEARER_TOKEN;
  try {
    return localStorage.getItem("api_bearer_token") || "";
  } catch {
    return "";
  }
};

/**
 * Common fetch options with JWT and bypass headers
 */
const getFetchOptions = async (
  method,
  body = null,
  isFormData = false,
  skipAuth = false,
) => {
  const options = {
    method,
    headers: {
      "Bypass-Tunnel-Reminder": "true",
      "User-Agent": "MalariaDetectionApp/1.0",
    },
  };

  // Add JWT token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Add Content-Type for JSON, but not for FormData
  if (!isFormData) {
    options.headers["Content-Type"] = "application/json";
  }

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  return options;
};
export const mlService = {
  /**
   * Health check endpoint
   * GET /health
   */
  async checkHealth() {
    try {
      console.log("Checking health at:", `${ML_API_URL}/health`);
      const options = await getFetchOptions("GET");
      const response = await fetch(`${ML_API_URL}/health`, options);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        throw new Error(
          `Health check failed (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("ML API health check error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get model information
   * GET /model/info
   */
  async getModelInfo() {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(`${ML_API_URL}/model/info`, options);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        throw new Error(
          `Model info fetch failed (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("ML API model info error:", error);
      return { data: null, error };
    }
  },

  /**
   * Basic prediction
   * POST /predict
   */
  async predict(imageFile, patientId = null) {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      if (patientId) {
        formData.append("patient_id", patientId);
      }

      const options = await getFetchOptions("POST", formData, true, false);
      const response = await fetch(`${ML_API_URL}/predict`, options);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        throw new Error(`Prediction failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("ML API prediction error:", error);
      return { data: null, error };
    }
  },

  /**
   * Complete Prediction Workflow (NEW)
   * POST /predict/complete?patient_id={patient_id}
   * This is the main endpoint that combines prediction + database storage
   */
  async predictComplete({
    imageFile,
    patientId,
    doctorId = null,
    imagePath = null,
    storageUrl = null,
    imageMetadata = null,
    useTTA = false,
    useGradCAM = true,
  }) {
    try {
      console.log("=== Starting complete prediction workflow ===");
      console.log("ML API URL:", ML_API_URL);
      console.log("Patient ID:", patientId);
      console.log("Doctor ID:", doctorId);
      console.log(
        "Image file:",
        imageFile?.name,
        imageFile?.type,
        imageFile?.size,
      );

      const formData = new FormData();
      formData.append("file", imageFile);

      // Add optional metadata fields
      if (imagePath) formData.append("image_path", imagePath);
      if (storageUrl) formData.append("storage_url", storageUrl);
      if (imageMetadata)
        formData.append("image_metadata", JSON.stringify(imageMetadata));
      if (doctorId) formData.append("doctor_id", doctorId);

      // Add prediction options
      formData.append("use_tta", useTTA.toString());
      formData.append("use_gradcam", useGradCAM.toString());

      // Build URL with patient_id and prediction_type as query parameters
      const url = `${ML_API_URL}/predict/complete?patient_id=${patientId}&prediction_type=${useGradCAM ? "detailed" : "basic"}`;
      console.log("Calling API:", url);

      // Re-enable JWT authentication (required by FastAPI)
      const options = await getFetchOptions("POST", formData, true, false);
      console.log("Request headers:", JSON.stringify(options.headers, null, 2));

      console.log("Making fetch request...");
      const response = await fetch(url, options);

      console.log("Response received:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);

        console.error("Error response body:", errorText);

        if (response.status === 401) {
          throw new Error("Authentication required. Please login again.");
        }

        throw new Error(
          `Complete prediction failed (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Prediction successful:", data);
      return { data, error: null };
    } catch (error) {
      console.error("=== ML API complete prediction error ===");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return { data: null, error };
    }
  },

  /**
   * Prediction with Test-Time Augmentation
   * POST /predict/tta
   */
  async predictWithTTA(imageFile, patientId = null) {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("use_tta", "true");
      if (patientId) {
        formData.append("patient_id", patientId);
      }

      const response = await fetch(`${ML_API_URL}/predict/tta`, {
        method: "POST",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "User-Agent": "MalariaDetectionApp/1.0",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        throw new Error(
          `TTA prediction failed (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("ML API TTA prediction error:", error);
      return { data: null, error };
    }
  },

  /**
   * Batch prediction
   * POST /batch/predict
   */
  async predictBatch(imageFiles, patientId = null) {
    try {
      const formData = new FormData();

      // Append multiple files
      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (patientId) {
        formData.append("patient_id", patientId);
      }

      const response = await fetch(`${ML_API_URL}/batch/predict`, {
        method: "POST",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "User-Agent": "MalariaDetectionApp/1.0",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        throw new Error(
          `Batch prediction failed (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("ML API batch prediction error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get Prediction By ID (NEW)
   * GET /predictions/{prediction_id}
   */
  async getPredictionById(predictionId) {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(
        `${ML_API_URL}/predictions/${predictionId}`,
        options,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prediction: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get prediction error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get Patient Test History (NEW)
   * GET /patients/{patient_id}/history
   */
  async getPatientHistory(patientId) {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(
        `${ML_API_URL}/patients/${patientId}/history`,
        options,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch patient history: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get patient history error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get Predictions For Patient (NEW)
   * GET /predictions/patient/{patient_id}
   */
  async getPatientPredictions(patientId) {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(
        `${ML_API_URL}/predictions/patient/${patientId}`,
        options,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch patient predictions: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get patient predictions error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get My Predictions (Doctor) (NEW)
   * GET /doctor/predictions
   */
  async getMyPredictions() {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(`${ML_API_URL}/doctor/predictions`, options);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch my predictions: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get my predictions error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get My Statistics (Doctor) (NEW)
   * GET /doctor/stats
   */
  async getDoctorStats() {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(`${ML_API_URL}/doctor/stats`, options);

      if (!response.ok) {
        throw new Error(`Failed to fetch doctor stats: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get doctor stats error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get My Profile (Doctor) (NEW)
   * GET /doctor/profile
   */
  async getDoctorProfile() {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(`${ML_API_URL}/doctor/profile`, options);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch doctor profile: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get doctor profile error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get Organization Statistics (NEW)
   * GET /organization/{org_id}/stats
   */
  async getOrganizationStats(orgId) {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(
        `${ML_API_URL}/organization/${orgId}/stats`,
        options,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization stats: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get organization stats error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get Public Reports (NEW)
   * GET /public/reports
   */
  async getPublicReports() {
    try {
      const options = await getFetchOptions("GET");
      const response = await fetch(`${ML_API_URL}/public/reports`, options);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch public reports: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Get public reports error:", error);
      return { data: null, error };
    }
  },

  /**
   * Helper: Transform prediction response to application format
   */
  transformPredictionToResult(prediction, imageUrl) {
    const isInfected =
      prediction.predicted_class?.toLowerCase() === "parasitized";

    // Format probabilities for display
    const probabilities = prediction.probabilities || {};
    const parasitizedProb = probabilities.Parasitized
      ? `${(probabilities.Parasitized * 100).toFixed(2)}%`
      : "N/A";
    const uninfectedProb = probabilities.Uninfected
      ? `${(probabilities.Uninfected * 100).toFixed(2)}%`
      : "N/A";

    return {
      status: isInfected ? "infected" : "healthy",
      confidence: Math.round((prediction.confidence || 0) * 100),
      details: {
        parasites_detected: isInfected ? "Yes" : "No",
        predicted_class: prediction.predicted_class || "Unknown",
        parasitized_probability: parasitizedProb,
        uninfected_probability: uninfectedProb,
        blood_cells_analyzed: "Analyzed",
        image_quality: "Good",
      },
      timestamp:
        prediction.timestamp ||
        prediction.created_at ||
        new Date().toISOString(),
      imageUrl: imageUrl,
    };
  },

  /**
   * Helper: Transform detailed prediction response
   */
  transformDetailedPrediction(prediction, imageUrl) {
    const baseResult = this.transformPredictionToResult(prediction, imageUrl);

    return {
      ...baseResult,
      uncertainty: prediction.uncertainty,
      confidence_level: prediction.confidence_level,
      recommendation: prediction.recommendation,
      gradcam_image: prediction.gradcam_image,
    };
  },
};
