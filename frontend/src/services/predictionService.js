import { supabase } from "../lib/supabase";
import { mlService } from "./mlService";

/**
 * Prediction Service
 * Handles the complete flow: blood sample → ML API → predictions → prediction details → history
 */

export const predictionService = {
  /**
   * Complete prediction flow using new /predict/complete endpoint
   * The FastAPI backend now handles the entire workflow internally:
   * 1. Creates blood_samples record
   * 2. Performs ML prediction
   * 3. Creates predictions record
   * 4. Creates prediction_details record
   * 5. Creates prediction_history record
   *
   * Frontend just uploads image and calls the endpoint
   */
  async createPrediction({ imageFile, patientId }) {
    try {
      // FastAPI handles upload + prediction + DB save in one request
      const mlResponse = await mlService.predictComplete({
        imageFile,
        patientId,
      });

      if (mlResponse.error) {
        throw mlResponse.error;
      }

      const result = mlResponse.data || {};
      const prediction = result.prediction || {};
      const details = result.details || {};
      const bloodSample = result.blood_sample || {};

      // Return the prediction result
      return {
        data: {
          id: prediction.id,
          predicted_class: prediction.predicted_class,
          confidence: prediction.confidence_score,
          probabilities: prediction.probabilities,
          timestamp: result.metadata?.timestamp || prediction.prediction_date,
          storage_url: bloodSample.storage_url,
          ...details,
        },
        error: null,
      };
    } catch (error) {
      console.error("Prediction creation error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get all predictions with filters
   */
  async getAllPredictions(filters = {}) {
    try {
      let query = supabase
        .from("predictions")
        .select(
          `
          *,
          blood_samples (
            id,
            patient_id,
            sample_date,
            storage_url,
            patients (
              name,
              age,
              gender,
              medical_record_number
            )
          ),
          doctor (
            id,
            name
          ),
          prediction_details (
            species_detected,
            parasite_count,
            grad_cam_path
          )
        `
        )
        .order("prediction_date", { ascending: false });

      if (filters.patientId) {
        query = query.eq("blood_samples.patient_id", filters.patientId);
      }

      if (filters.doctorId) {
        query = query.eq("doctor_id", filters.doctorId);
      }

      if (filters.predictedClass) {
        query = query.eq("predicted_class", filters.predictedClass);
      }

      if (filters.startDate) {
        query = query.gte("prediction_date", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("prediction_date", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get predictions error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get prediction by ID with full details
   */
  async getPredictionById(predictionId) {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select(
          `
          *,
          blood_samples (
            id,
            patient_id,
            sample_date,
            storage_url,
            image_metadata,
            patients (
              name,
              age,
              gender,
              medical_record_number,
              phone,
              address
            )
          ),
          doctor (
            id,
            name,
            specialty
          ),
          prediction_details (
            species_detected,
            parasite_count,
            grad_cam_path,
            parasite_stage,
            attention_regions,
            image_quality_score,
            analysis_duration_sec
          )
        `
        )
        .eq("id", predictionId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get prediction error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get predictions for a specific patient
   */
  async getPatientPredictions(patientId) {
    try {
      const { data, error } = await supabase
        .from("blood_samples")
        .select(
          `
          id,
          sample_date,
          storage_url,
          processing_status,
          predictions (
            id,
            predicted_class,
            confidence_score,
            prediction_date,
            doctor (
              name
            )
          )
        `
        )
        .eq("patient_id", patientId)
        .order("sample_date", { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get patient predictions error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get prediction statistics
   */
  async getPredictionStats(doctorId = null, startDate = null, endDate = null) {
    try {
      let query = supabase.from("predictions").select("*");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      if (startDate) {
        query = query.gte("prediction_date", startDate);
      }

      if (endDate) {
        query = query.lte("prediction_date", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalPredictions: data.length,
        infectedCount: data.filter(
          (p) => p.predicted_class?.toLowerCase() === "infected"
        ).length,
        healthyCount: data.filter(
          (p) => p.predicted_class?.toLowerCase() === "healthy"
        ).length,
        averageConfidence:
          data.reduce((acc, p) => acc + (p.confidence_score || 0), 0) /
            data.length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Get prediction stats error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get prediction history for analytics
   */
  async getPredictionHistory(filters = {}) {
    try {
      let query = supabase
        .from("prediction_history")
        .select(
          `
          *,
          blood_samples (
            patient_id,
            patients (
              name
            )
          ),
          doctor (
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filters.doctorId) {
        query = query.eq("doctor_id", filters.doctorId);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get prediction history error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get weekly prediction data for charts
   */
  async getWeeklyPredictionData(doctorId = null) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      let query = supabase
        .from("predictions")
        .select("prediction_date, predicted_class")
        .gte("prediction_date", startDate.toISOString().split("T")[0]);

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by day
      const weeklyData = {};
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      data.forEach((prediction) => {
        const date = new Date(prediction.prediction_date);
        const dayName = days[date.getDay()];

        if (!weeklyData[dayName]) {
          weeklyData[dayName] = { day: dayName, tests: 0, infected: 0 };
        }

        weeklyData[dayName].tests++;
        if (prediction.predicted_class?.toLowerCase() === "infected") {
          weeklyData[dayName].infected++;
        }
      });

      return { data: Object.values(weeklyData), error: null };
    } catch (error) {
      console.error("Get weekly data error:", error);
      return { data: null, error };
    }
  },
};
