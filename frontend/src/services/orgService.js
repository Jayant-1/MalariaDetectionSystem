import { supabase } from "../lib/supabase";

/**
 * Organization Service
 * Handles organization, admin, and doctor approval operations
 */

export const orgService = {
  /**
   * Create a new organization (Owner only)
   */
  async createOrganization({ name, address, phone, email }) {
    try {
      // Generate unique secret code for the organization
      const secretCode = this.generateSecretCode();

      const { data, error } = await supabase
        .from("org")
        .insert({
          name,
          address,
          phone,
          email,
          secret_code: secretCode,
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Create organization error:", error);
      return { data: null, error };
    }
  },

  /**
   * Generate a random 8-character secret code
   */
  generateSecretCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Verify organization secret code
   * Returns boolean directly for easier use
   */
  async verifySecretCode(orgId, secretCode) {
    try {
      const { data, error } = await supabase
        .from("org")
        .select("secret_code")
        .eq("id", orgId)
        .single();

      if (error) throw error;

      return data.secret_code === secretCode.toUpperCase();
    } catch (error) {
      console.error("Verify secret code error:", error);
      return false;
    }
  },

  /**
   * Get all organizations
   */
  async getAllOrganizations() {
    try {
      const { data, error } = await supabase
        .from("org")
        .select("id, name, address, phone, email")
        .order("name");

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get organizations error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get organization by ID
   */
  async getOrganizationById(orgId) {
    try {
      const { data, error } = await supabase
        .from("org")
        .select("*")
        .eq("id", orgId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get organization error:", error);
      return { data: null, error };
    }
  },

  /**
   * Create admin for organization
   */
  async createAdmin({ name, orgId, authUserId }) {
    try {
      const { data, error } = await supabase
        .from("admin")
        .insert({
          name,
          org_id: orgId,
          auth_user_id: authUserId,
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Create admin error:", error);
      return { data: null, error };
    }
  },

  /**
   * NOTE: Doctor registration is now handled automatically by database trigger
   * When a user signs up with role='doctor', the handle_new_user() trigger
   * automatically creates the doctor profile with status='pending'
   *
   * This function is kept for reference but should NOT be used
   */
  // async registerDoctor({ name, orgId, authUserId, specialty, licenseNumber }) {
  //   // This is now handled by the database trigger
  // },

  /**
   * Get pending doctors for admin approval
   */
  async getPendingDoctors(orgId) {
    try {
      const { data, error } = await supabase
        .from("doctor")
        .select(
          `
          *,
          org (
            name
          )
        `
        )
        .eq("org_id", orgId)
        .eq("is_active", false)
        .order("id", { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get pending doctors error:", error);
      return { data: null, error };
    }
  },

  /**
   * Approve doctor
   */
  async approveDoctor(doctorId) {
    try {
      const { data, error } = await supabase
        .from("doctor")
        .update({ is_active: true })
        .eq("id", doctorId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Approve doctor error:", error);
      return { data: null, error };
    }
  },

  /**
   * Reject/Remove doctor
   */
  async rejectDoctor(doctorId) {
    try {
      const { error } = await supabase
        .from("doctor")
        .delete()
        .eq("id", doctorId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Reject doctor error:", error);
      return { error };
    }
  },

  /**
   * Get all approved doctors for an organization
   */
  async getOrganizationDoctors(orgId) {
    try {
      const { data, error } = await supabase
        .from("doctor")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get organization doctors error:", error);
      return { data: null, error };
    }
  },

  /**
   * Admin: Get approved doctors for an organization
   */
  async getApprovedDoctors(orgId) {
    try {
      const { data, error } = await supabase
        .from("doctor")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching approved doctors:", error);
      return [];
    }
  },

  /**
   * Get doctor by auth user ID
   */
  async getDoctorByAuthId(authUserId) {
    try {
      const { data, error } = await supabase
        .from("doctor")
        .select(
          `
          *,
          org (
            id,
            name,
            address,
            phone,
            email
          )
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get doctor by auth ID error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get admin by auth user ID
   */
  async getAdminByAuthId(authUserId) {
    try {
      const { data, error } = await supabase
        .from("admin")
        .select(
          `
          *,
          org (
            id,
            name,
            address,
            phone,
            email
          )
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Get admin by auth ID error:", error);
      return { data: null, error };
    }
  },

  /**
   * Update doctor last login
   */
  async updateDoctorLastLogin(doctorId) {
    try {
      const { error } = await supabase
        .from("doctor")
        .update({ last_login: new Date().toISOString() })
        .eq("id", doctorId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Update doctor last login error:", error);
      return { error };
    }
  },
};
