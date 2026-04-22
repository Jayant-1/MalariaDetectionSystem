import { supabase } from "../lib/supabase";

/**
 * Test Service
 * Handles all malaria test-related operations
 */

export const testService = {
  /**
   * Create a new test result
   */
  async createTest(testData) {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .insert({
          ...testData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Create test error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get all test results with filters
   */
  async getAllTests(filters = {}) {
    try {
      let query = supabase
        .from("test_results")
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
          doctors:users!test_results_doctor_id_fkey (
            full_name
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

      if (filters.result) {
        query = query.eq("result", filters.result);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get tests error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get test by ID
   */
  async getTestById(testId) {
    try {
      const { data, error } = await supabase
        .from("test_results")
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
          doctors:users!test_results_doctor_id_fkey (
            full_name,
            email
          )
        `
        )
        .eq("id", testId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get test error:", error);
      return { data: null, error };
    }
  },

  /**
   * Update test result
   */
  async updateTest(testId, updates) {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", testId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Update test error:", error);
      return { data: null, error };
    }
  },

  /**
   * Delete test result
   */
  async deleteTest(testId) {
    try {
      const { error } = await supabase
        .from("test_results")
        .delete()
        .eq("id", testId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Delete test error:", error);
      return { error };
    }
  },

  /**
   * Get test statistics for dashboard
   */
  async getTestStats(doctorId = null, startDate = null, endDate = null) {
    try {
      let query = supabase.from("test_results").select("*");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalTests: data.length,
        positiveTests: data.filter((t) => t.result === "positive").length,
        negativeTests: data.filter((t) => t.result === "negative").length,
        pendingTests: data.filter((t) => t.status === "pending").length,
        averageConfidence:
          data.reduce((acc, t) => acc + (t.confidence || 0), 0) / data.length ||
          0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Get test stats error:", error);
      return { data: null, error };
    }
  },

  /**
   * Upload test image to storage
   */
  async uploadTestImage(file, testId) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${testId}-${Date.now()}.${fileExt}`;
      const filePath = `test-images/${fileName}`;

      const { error } = await supabase.storage
        .from("malaria-tests")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("malaria-tests").getPublicUrl(filePath);

      return { data: { path: filePath, url: publicUrl }, error: null };
    } catch (error) {
      console.error("Upload image error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get weekly test data for charts
   */
  async getWeeklyTestData(doctorId = null) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      let query = supabase
        .from("test_results")
        .select("created_at, result")
        .gte("created_at", startDate.toISOString());

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by day
      const weeklyData = {};
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      data.forEach((test) => {
        const date = new Date(test.created_at);
        const dayName = days[date.getDay()];

        if (!weeklyData[dayName]) {
          weeklyData[dayName] = { day: dayName, tests: 0, positive: 0 };
        }

        weeklyData[dayName].tests++;
        if (test.result === "positive") {
          weeklyData[dayName].positive++;
        }
      });

      return { data: Object.values(weeklyData), error: null };
    } catch (error) {
      console.error("Get weekly data error:", error);
      return { data: null, error };
    }
  },

  /**
   * Post test result to patient
   * Marks the test as posted so patient can view it
   */
  async postTestToPatient(testId) {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .update({
          posted_to_patient: true,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", testId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Post test to patient error:", error);
      return { data: null, error };
    }
  },
};
