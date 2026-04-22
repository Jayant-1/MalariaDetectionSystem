import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    patientId: "",
    dateOfBirth: "",
    role: "doctor",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      value: "doctor",
      label: "Doctor",
      icon: Stethoscope,
      color: "from-blue-500 to-blue-600",
    },
    {
      value: "patient",
      label: "Patient",
      icon: User,
      color: "from-teal-500 to-teal-600",
    },
    {
      value: "admin",
      label: "Admin",
      icon: ShieldCheck,
      color: "from-purple-500 to-purple-600",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (formData.role === "patient") {
      // Patient validation: medical record number + date of birth
      if (!formData.patientId) {
        newErrors.patientId = "Medical Record Number is required";
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of Birth is required";
      }
    } else {
      // Doctor/Admin validation: email + password
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // Login based on role
    const { data, error } = await login(
      formData.email,
      formData.password,
      formData.role,
      formData.patientId,
      formData.dateOfBirth
    );

    setIsLoading(false);

    if (error) {
      setErrors({ password: error.message || "Invalid email or password" });
      return;
    }

    if (data?.profile) {
      // Navigate based on user role from database
      const role = data.profile.role;
      console.log("Login successful, role:", role);
      navigate(`/dashboard/${role}`);
    } else {
      console.warn("No profile found, redirecting to home");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block p-4 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 mb-4"
          >
            <Users className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-3">
            {roles.map((role) => (
              <motion.button
                key={role.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: role.value }))
                }
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  formData.role === role.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                }`}
              >
                <div
                  className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center`}
                >
                  <role.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {role.label}
                </span>
                {formData.role === role.value && (
                  <motion.div
                    layoutId="role-indicator"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-xl p-8 space-y-6"
        >
          {formData.role === "patient" ? (
            // Patient Login Fields
            <>
              <Input
                label="Medical Record Number"
                type="text"
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                error={errors.patientId}
                icon={<User className="w-5 h-5" />}
                placeholder="MRN-12345"
              />

              <Input
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={errors.dateOfBirth}
                icon={<Lock className="w-5 h-5" />}
              />
            </>
          ) : (
            // Doctor/Admin Login Fields
            <>
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail className="w-5 h-5" />}
                placeholder="doctor@hospital.com"
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
              />
            </>
          )}

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        {formData.role !== "patient" && (
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Sign up now
            </Link>
          </p>
        )}
        {formData.role === "patient" && (
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Patients cannot register themselves. Please contact your healthcare
            provider.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;
