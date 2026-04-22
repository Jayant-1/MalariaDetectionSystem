import { supabase } from "../lib/supabase";

/**
 * Report Service
 * Handles all report upload and management operations
 */

export const reportService = {
  /**
   * Upload report file to storage
   */
  async uploadReportFile(file, patientId, doctorId) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${patientId}-${doctorId}-${Date.now()}.${fileExt}`;
      // Simplified path without nested folders
      const filePath = fileName;

      const { error } = await supabase.storage
        .from("reports")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("reports").getPublicUrl(filePath);

      return {
        data: {
          path: filePath,
          url: publicUrl,
          fileName: file.name,
          fileSize: file.size,
        },
        error: null,
      };
    } catch (error) {
      console.error("Upload report file error:", error);
      return { data: null, error };
    }
  },

  /**
   * Create a new report record
   */
  async createReport(reportData) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          ...reportData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Create report error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get all reports with filters
   */
  async getAllReports(filters = {}) {
    try {
      let query = supabase
        .from("reports")
        .select(
          `
          *,
          patients (
            id,
            name,
            medical_record_number
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      if (filters.doctorId) {
        query = query.eq("doctor_id", filters.doctorId);
      }

      if (filters.reportType) {
        query = query.eq("report_type", filters.reportType);
      }

      if (filters.postedOnly) {
        query = query.eq("posted_to_patient", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get reports error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get report by ID
   */
  async getReportById(reportId) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `
          *,
          patients (
            id,
            name,
            age,
            gender,
            medical_record_number
          )
        `
        )
        .eq("id", reportId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get report error:", error);
      return { data: null, error };
    }
  },

  /**
   * Update report
   */
  async updateReport(reportId, updates) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Update report error:", error);
      return { data: null, error };
    }
  },

  /**
   * Post report to patient
   */
  async postReportToPatient(reportId) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .update({
          posted_to_patient: true,
          status: "posted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Post report to patient error:", error);
      return { data: null, error };
    }
  },

  /**
   * Delete report
   */
  async deleteReport(reportId, filePath) {
    try {
      // Delete file from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("reports")
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      // Delete record from database
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Delete report error:", error);
      return { error };
    }
  },

  /**
   * Download report file
   */
  async downloadReport(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from("reports")
        .download(filePath);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Download report error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get report statistics
   */
  async getReportStats(doctorId = null) {
    try {
      let query = supabase.from("reports").select("*");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalReports: data.length,
        postedReports: data.filter((r) => r.posted_to_patient).length,
        pendingReports: data.filter((r) => !r.posted_to_patient).length,
        reportsByType: {
          general: data.filter((r) => r.report_type === "general").length,
          lab: data.filter((r) => r.report_type === "lab").length,
          prescription: data.filter((r) => r.report_type === "prescription")
            .length,
          diagnostic: data.filter((r) => r.report_type === "diagnostic").length,
          consultation: data.filter((r) => r.report_type === "consultation")
            .length,
        },
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Get report stats error:", error);
      return { data: null, error };
    }
  },
};
