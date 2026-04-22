import { supabase } from "../lib/supabase";

/**
 * Patient Service
 * Handles all patient-related operations
 */

export const patientService = {
  /**
   * Get all patients (for doctors/admins)
   */
  async getAllPatients(doctorId = null) {
    try {
      let query = supabase
        .from("patients")
        .select("*")
        .order("date_registered", { ascending: false });

      if (doctorId) {
        query = query.eq("created_by", doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get patients error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get patient by ID
   */
  async getPatientById(patientId) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get patient error:", error);
      return { data: null, error };
    }
  },

  /**
   * Create new patient record
   */
  async createPatient(patientData) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Create patient error:", error);
      return { data: null, error };
    }
  },

  /**
   * Update patient information
   */
  async updatePatient(patientId, updates) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", patientId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Update patient error:", error);
      return { data: null, error };
    }
  },

  /**
   * Delete patient record
   */
  async deletePatient(patientId) {
    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Delete patient error:", error);
      return { error };
    }
  },

  /**
   * Get patient statistics
   */
  async getPatientStats(patientId) {
    try {
      // Get blood samples for the patient
      const { data: samples, error: samplesError } = await supabase
        .from("blood_samples")
        .select(
          `
          *,
          predictions (
            predicted_class,
            confidence_score
          )
        `
        )
        .eq("patient_id", patientId);

      if (samplesError) throw samplesError;

      const stats = {
        totalTests: samples.length,
        infectedTests: samples.filter((s) =>
          s.predictions?.some(
            (p) => p.predicted_class?.toLowerCase() === "infected"
          )
        ).length,
        healthyTests: samples.filter((s) =>
          s.predictions?.some(
            (p) => p.predicted_class?.toLowerCase() === "healthy"
          )
        ).length,
        lastTest: samples[0] || null,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Get patient stats error:", error);
      return { data: null, error };
    }
  },
};
