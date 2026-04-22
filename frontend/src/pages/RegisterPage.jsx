import { motion } from "framer-motion";
import {
  Building,
  Key,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../contexts/AuthContext";
import { authService, orgService } from "../services";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "doctor", // Changed default to doctor since patient is public access only
    organizationId: "",
    secretCode: "",
    specialty: "",
    licenseNumber: "",
  });
  const [organizations, setOrganizations] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      value: "doctor",
      label: "Doctor",
      icon: Stethoscope,
      color: "from-blue-500 to-blue-600",
      description: "Healthcare professional managing patients",
    },
    {
      value: "admin",
      label: "Admin",
      icon: ShieldCheck,
      color: "from-purple-500 to-purple-600",
      description: "Organization administrator (Contact owner for access)",
    },
  ];

  // Load organizations for doctor registration
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const { data } = await orgService.getAllOrganizations();
        setOrganizations(data || []);
      } catch (error) {
        console.error("Error loading organizations:", error);
        setOrganizations([]);
      }
    };

    if (formData.role === "doctor") {
      loadOrganizations();
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Doctor-specific validation
    if (formData.role === "doctor") {
      if (!formData.organizationId) {
        newErrors.organizationId = "Please select an organization";
      }

      if (!formData.secretCode.trim()) {
        newErrors.secretCode = "Organization secret code is required";
      }

      if (!formData.specialty.trim()) {
        newErrors.specialty = "Medical specialty is required";
      }

      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "Medical license number is required";
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

    try {
      if (formData.role === "doctor") {
        // Verify secret code first
        const isValidCode = await orgService.verifySecretCode(
          formData.organizationId,
          formData.secretCode
        );

        if (!isValidCode) {
          setErrors({
            secretCode: "Invalid secret code for this organization",
          });
          setIsLoading(false);
          return;
        }

        // Create Supabase auth user with metadata
        // Trigger will automatically create doctor profile with status='pending'
        const { data: authData, error: authError } = await authService.signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          role: formData.role,
          phone: formData.phone,
          org_id: parseInt(formData.organizationId),
          specialty: formData.specialty,
          license_number: formData.licenseNumber,
        });

        if (authError) {
          setErrors({ email: authError.message || "Registration failed" });
          setIsLoading(false);
          return;
        }

        if (authData?.user) {
          // Trigger has automatically created doctor profile with status='pending'
          // Show pending approval message
          setIsPendingApproval(true);
        }
      } else if (formData.role === "admin") {
        // Admin registration requires owner to create the account
        setErrors({
          email:
            "Admin accounts must be created by the system owner. Please contact support.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ email: error.message || "Registration failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block p-4 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 mb-4"
          >
            <User className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join our AI-powered malaria detection platform
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            {roles.map((role) => (
              <motion.button
                key={role.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: role.value }))
                }
                type="button"
                className={`relative p-5 rounded-xl border-2 transition-all ${
                  formData.role === role.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center`}
                >
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {role.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {role.description}
                </div>
                {formData.role === role.value && (
                  <motion.div
                    layoutId="role-indicator-register"
                    className="absolute -top-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Pending Approval Message */}
        {isPendingApproval && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Pending Approval
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your doctor account has been created successfully. Please wait for
              the organization administrator to approve your account before you
              can log in.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              You will receive an email notification once your account is
              approved.
            </p>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Go to Login Page
            </Button>
          </motion.div>
        )}

        {/* Registration Form */}
        {!isPendingApproval && (
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                icon={<User className="w-5 h-5" />}
                placeholder="Dr. John Doe"
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail className="w-5 h-5" />}
                placeholder="john@hospital.com"
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                icon={<Phone className="w-5 h-5" />}
                placeholder="+1 (234) 567-8900"
              />

              {/* Doctor-specific fields */}
              {formData.role === "doctor" && (
                <>
                  {/* Organization Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building className="w-4 h-4 inline mr-1" />
                      Select Organization
                    </label>
                    <select
                      name="organizationId"
                      value={formData.organizationId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.organizationId
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition`}
                    >
                      <option value="">-- Select Organization --</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    {errors.organizationId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.organizationId}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Organization Secret Code"
                    type="text"
                    name="secretCode"
                    value={formData.secretCode}
                    onChange={handleChange}
                    error={errors.secretCode}
                    icon={<Key className="w-5 h-5" />}
                    placeholder="Enter 8-character code"
                    maxLength={8}
                  />

                  <Input
                    label="Medical Specialty"
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    error={errors.specialty}
                    icon={<Stethoscope className="w-5 h-5" />}
                    placeholder="e.g., Hematology, Pathology"
                  />

                  <Input
                    label="Medical License Number"
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    error={errors.licenseNumber}
                    icon={<ShieldCheck className="w-5 h-5" />}
                    placeholder="e.g., MD123456"
                  />
                </>
              )}
            </div>

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

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Info Message for Doctors */}
            {formData.role === "doctor" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> After registration, your account will
                  be pending approval by the organization administrator. You'll
                  receive an email notification once approved.
                </p>
              </div>
            )}

            {/* Info Message for Admin */}
            {formData.role === "admin" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Admin Access:</strong> Admin accounts must be created
                  by the system owner. Please contact support if you need admin
                  access.
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              disabled={formData.role === "admin"}
            >
              {formData.role === "admin" ? "Contact Support" : "Create Account"}
            </Button>
          </form>
        )}

        {/* Footer */}
        {!isPendingApproval && (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Patient?{" "}
              <Link
                to="/public-reports"
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                View your test reports
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;
