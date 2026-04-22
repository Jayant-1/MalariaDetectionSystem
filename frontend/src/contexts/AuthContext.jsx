import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { authService } from "../services";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    const { data } = await authService.getCurrentUserProfile();
    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (
    email,
    password,
    role,
    medicalRecordNumber,
    dateOfBirth
  ) => {
    try {
      let data, error;

      if (role === "patient") {
        // Patient login with medical record number and date of birth
        const result = await authService.patientSignIn({
          medicalRecordNumber,
          dateOfBirth,
        });
        data = result.data;
        error = result.error;

        if (!error && data) {
          setUser(data.user);
          setProfile(data.profile);
        }
      } else {
        // Doctor/Admin login with email and password
        const result = await authService.signIn({ email, password });
        data = result.data;
        error = result.error;

        if (!error && data.profile) {
          setProfile(data.profile);
        }
      }

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signup = async ({
    email,
    password,
    fullName,
    role,
    phone,
    hospital,
  }) => {
    try {
      const { data, error } = await authService.signUp({
        email,
        password,
        fullName,
        role,
        phone,
        hospital,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) return { data: null, error: new Error("No user logged in") };

      const { data, error } = await authService.updateProfile(user.id, updates);

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    updateUserProfile,
    userRole: profile?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
