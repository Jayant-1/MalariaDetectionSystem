import { supabase } from "../lib/supabase";

/**
 * Analytics Service
 * Handles all analytics and reporting operations
 */

export const analyticsService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId, role) {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(
        today.getTime() - 30 * 24 * 60 * 60 * 1000
      );

      let testsQuery = supabase
        .from("test_results")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (role === "doctor") {
        testsQuery = testsQuery.eq("doctor_id", userId);
      } else if (role === "patient") {
        testsQuery = testsQuery.eq("patient_id", userId);
      }

      const { data: tests, error: testsError } = await testsQuery;
      if (testsError) throw testsError;

      let patientsQuery = supabase.from("patients").select("*");
      if (role === "doctor") {
        patientsQuery = patientsQuery.eq("doctor_id", userId);
      }

      const { data: patients, error: patientsError } = await patientsQuery;
      if (patientsError) throw patientsError;

      const stats = {
        totalTests: tests.length,
        positiveTests: tests.filter((t) => t.result === "positive").length,
        negativeTests: tests.filter((t) => t.result === "negative").length,
        totalPatients: patients.length,
        averageConfidence:
          tests.reduce((acc, t) => acc + (t.confidence || 0), 0) /
            tests.length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get test trends over time
   */
  async getTestTrends(userId, role, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from("test_results")
        .select("created_at, result")
        .gte("created_at", startDate.toISOString());

      if (role === "doctor") {
        query = query.eq("doctor_id", userId);
      } else if (role === "patient") {
        query = query.eq("patient_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const trendsData = {};

      data.forEach((test) => {
        const date = new Date(test.created_at).toLocaleDateString();

        if (!trendsData[date]) {
          trendsData[date] = { date, total: 0, positive: 0, negative: 0 };
        }

        trendsData[date].total++;
        if (test.result === "positive") {
          trendsData[date].positive++;
        } else if (test.result === "negative") {
          trendsData[date].negative++;
        }
      });

      return { data: Object.values(trendsData), error: null };
    } catch (error) {
      console.error("Get test trends error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get system-wide statistics (Admin only)
   */
  async getSystemStats() {
    try {
      const [testsResult, usersResult, patientsResult] = await Promise.all([
        supabase.from("test_results").select("*"),
        supabase.from("users").select("*"),
        supabase.from("patients").select("*"),
      ]);

      if (testsResult.error) throw testsResult.error;
      if (usersResult.error) throw usersResult.error;
      if (patientsResult.error) throw patientsResult.error;

      const stats = {
        totalTests: testsResult.data.length,
        totalUsers: usersResult.data.length,
        totalPatients: patientsResult.data.length,
        totalDoctors: usersResult.data.filter((u) => u.role === "doctor")
          .length,
        positiveRate:
          (testsResult.data.filter((t) => t.result === "positive").length /
            testsResult.data.length) *
            100 || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Get system stats error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get user activity logs (Admin only)
   */
  async getUserActivityLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          `
          *,
          users (
            full_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get activity logs error:", error);
      return { data: null, error };
    }
  },

  /**
   * Log user activity
   */
  async logActivity(userId, action, details = null) {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          action,
          details,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Log activity error:", error);
      return { data: null, error };
    }
  },
};
