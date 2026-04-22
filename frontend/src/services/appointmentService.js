import { supabase } from "../lib/supabase";

/**
 * Appointment Service
 * Handles all appointment-related operations
 */

export const appointmentService = {
  /**
   * Get all appointments with filters
   */
  async getAllAppointments(filters = {}) {
    try {
      let query = supabase
        .from("appointments")
        .select(
          `
          *,
          patients (
            id,
            users (
              full_name,
              email,
              phone
            )
          ),
          doctors:users!appointments_doctor_id_fkey (
            full_name,
            email
          )
        `
        )
        .order("appointment_date", { ascending: true });

      if (filters.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      if (filters.doctorId) {
        query = query.eq("doctor_id", filters.doctorId);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.startDate) {
        query = query.gte("appointment_date", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("appointment_date", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get appointments error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients (
            id,
            users (
              full_name,
              email,
              phone
            )
          ),
          doctors:users!appointments_doctor_id_fkey (
            full_name,
            email
          )
        `
        )
        .eq("id", appointmentId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get appointment error:", error);
      return { data: null, error };
    }
  },

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...appointmentData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Create appointment error:", error);
      return { data: null, error };
    }
  },

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId, updates) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Update appointment error:", error);
      return { data: null, error };
    }
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId, reason = null) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Cancel appointment error:", error);
      return { data: null, error };
    }
  },

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId) {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Delete appointment error:", error);
      return { error };
    }
  },

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(userId, role) {
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from("appointments")
        .select(
          `
          *,
          patients (
            id,
            users (
              full_name,
              email
            )
          ),
          doctors:users!appointments_doctor_id_fkey (
            full_name,
            email
          )
        `
        )
        .gte("appointment_date", now)
        .in("status", ["scheduled", "confirmed"])
        .order("appointment_date", { ascending: true })
        .limit(5);

      if (role === "patient") {
        query = query.eq("patient_id", userId);
      } else if (role === "doctor") {
        query = query.eq("doctor_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get upcoming appointments error:", error);
      return { data: null, error };
    }
  },
};
