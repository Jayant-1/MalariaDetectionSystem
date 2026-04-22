import { supabase } from "../lib/supabase";

/**
 * Authentication Service
 * Handles all authentication-related operations with Supabase
 * Works with database trigger for auto-profile creation
 */

export const authService = {
  /**
   * Sign up a new user
   * Trigger automatically creates doctor/admin/patient profile
   */
  async signUp({
    email,
    password,
    fullName,
    role,
    phone,
    org_id,
    specialty,
    license_number,
  }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            name: fullName,
            phone: phone,
            org_id: org_id || 1, // Organization ID from dropdown
            specialty: specialty || "General",
            license_number: license_number || "",
          },
        },
      });

      if (authError) throw authError;

      // Wait for trigger to create profile
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return { data: authData, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { data: null, error };
    }
  },
  /**
   * Sign in existing user
   * Fetches profile from correct table (doctor/admin/patient)
   */
  async signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile from correct table
      if (data.user) {
        const profile = await this.getUserProfile(data.user);

        return {
          data: { ...data, profile },
          error: null,
        };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { data: null, error };
    }
  },

  /**
   * Patient sign in using Medical Record Number and Date of Birth
   * No Supabase auth - direct database lookup
   */
  async patientSignIn({ medicalRecordNumber, dateOfBirth }) {
    try {
      // Query patient table with medical record number and date of birth
      const { data: patientData, error } = await supabase
        .from("patients")
        .select("*")
        .eq("medical_record_number", medicalRecordNumber)
        .eq("date_of_birth", dateOfBirth)
        .maybeSingle();

      if (error) throw error;

      if (!patientData) {
        throw new Error("Invalid Medical Record Number or Date of Birth");
      }

      // Create a session-like object for consistency with other auth methods
      const sessionData = {
        user: {
          id: patientData.id,
          email: null,
          user_metadata: {
            role: "patient",
            name: patientData.name,
          },
        },
        profile: { ...patientData, role: "patient" },
      };

      // Store patient session in localStorage for persistence
      localStorage.setItem("patient_session", JSON.stringify(sessionData));

      return {
        data: sessionData,
        error: null,
      };
    } catch (error) {
      console.error("Patient sign in error:", error);
      return { data: null, error };
    }
  },

  /**
   * Get user profile from correct table based on role
   */
  async getUserProfile(authUser) {
    try {
      const userRole = authUser.user_metadata?.role;

      // If role is specified, try that table first
      if (userRole === "doctor") {
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctor")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (!doctorError && doctorData) {
          return { ...doctorData, role: "doctor" };
        }
      } else if (userRole === "admin") {
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (!adminError && adminData) {
          return { ...adminData, role: "admin" };
        }
      } else if (userRole === "patient") {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq(
            "name",
            authUser.user_metadata?.name || authUser.email.split("@")[0]
          )
          .maybeSingle();

        if (!patientError && patientData) {
          return { ...patientData, role: "patient" };
        }
      }

      // If role not specified or not found, try all tables
      console.log("Role not found in metadata, checking all tables...");

      // Try admin table
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (!adminError && adminData) {
          console.log("Found admin profile");
          return { ...adminData, role: "admin" };
        }
      } catch (err) {
        console.warn("Admin table query failed:", err);
      }

      // Try doctor table
      try {
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctor")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (!doctorError && doctorData) {
          console.log("Found doctor profile");
          return { ...doctorData, role: "doctor" };
        }
      } catch (err) {
        console.warn("Doctor table query failed:", err);
      }

      // Try patient table (no auth_user_id, match by name)
      try {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq(
            "name",
            authUser.user_metadata?.name || authUser.email.split("@")[0]
          )
          .maybeSingle();

        if (!patientError && patientData) {
          console.log("Found patient profile");
          return { ...patientData, role: "patient" };
        }
      } catch (err) {
        console.warn("Patients table query failed:", err);
      }

      // Return basic profile if no table exists
      console.warn("No profile found in any table");
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email.split("@")[0],
        email: authUser.email,
        role: userRole || "patient",
      };
    } catch (error) {
      console.error("Get profile error:", error);
      // Return basic profile on error
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email.split("@")[0],
        email: authUser.email,
        role: authUser.user_metadata?.role || "patient",
      };
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error };
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUserProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { data: null, error: null };

      const profile = await this.getUserProfile(user);

      return { data: profile, error: null };
    } catch (error) {
      console.error("Get profile error:", error);
      return { data: null, error };
    }
  },

  /**
   * Update user profile in correct table
   */
  async updateProfile(userId, updates) {
    try {
      // Get current user to determine role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const role = user.user_metadata?.role || "patient";

      // Determine table based on role
      let tableName;
      let idField = "auth_user_id";

      if (role === "doctor") {
        tableName = "doctor";
      } else if (role === "admin") {
        tableName = "admin";
      } else {
        tableName = "patients";
        idField = "id"; // Patients use their own ID
      }

      // Update profile
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idField, role === "patient" ? userId : user.id)
        .select()
        .single();

      if (error) throw error;

      return { data: { ...data, role }, error: null };
    } catch (error) {
      console.error("Update profile error:", error);
      return { data: null, error };
    }
  },
};
