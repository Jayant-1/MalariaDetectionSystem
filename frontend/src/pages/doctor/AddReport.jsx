import { ArrowLeft, FileText, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { patientService, reportService } from "../../services";

const AddReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    patientId: "",
    title: "",
    description: "",
    reportType: "general",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadPatients();

    // Pre-select patient if passed from navigation
    if (location.state?.selectedPatient) {
      setFormData((prev) => ({
        ...prev,
        patientId: location.state.selectedPatient.id.toString(),
      }));
    }
  }, [location.state]);

  const loadPatients = async () => {
    try {
      const { data } = await patientService.getAllPatients();
      if (data) {
        setPatients(data);
      }
    } catch (error) {
      console.error("Error loading patients:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setFormErrors({ file: "Only PDF files are allowed" });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ file: "File size must be less than 10MB" });
        return;
      }

      setSelectedFile(file);
      setFormErrors({ ...formErrors, file: "" });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!formData.patientId) errors.patientId = "Please select a patient";
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!selectedFile) errors.file = "Please upload a PDF file";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      // Upload file to storage
      const uploadResult = await reportService.uploadReportFile(
        selectedFile,
        formData.patientId,
        user.id
      );

      setUploadProgress(50);

      if (uploadResult.error) throw uploadResult.error;

      setUploadProgress(70);

      // Create report record
      const reportData = {
        patient_id: parseInt(formData.patientId),
        doctor_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        report_type: formData.reportType,
        file_url: uploadResult.data.url,
        file_name: uploadResult.data.fileName,
        file_size: uploadResult.data.fileSize,
        posted_to_patient: false,
        status: "pending",
      };

      const { error: createError } = await reportService.createReport(
        reportData
      );

      if (createError) throw createError;

      setUploadProgress(100);

      // Success - redirect to reports management page
      alert("Report uploaded successfully!");
      navigate("/doctor/reports");
    } catch (error) {
      console.error("Error uploading report:", error);
      alert("Failed to upload report: " + error.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(
    (p) => p.id.toString() === formData.patientId
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/doctor/reports")}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Button>
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Upload Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload a PDF report for your patient
            </p>
          </div>

          {/* Form */}
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    formErrors.patientId
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500`}
                  disabled={loading}
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} -{" "}
                      {patient.medical_record_number || "No MRN"}
                    </option>
                  ))}
                </select>
                {formErrors.patientId && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.patientId}
                  </p>
                )}
                {selectedPatient && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Patient:</strong> {selectedPatient.name} •{" "}
                      <strong>Age:</strong> {selectedPatient.age} •{" "}
                      <strong>Gender:</strong> {selectedPatient.gender}
                    </p>
                  </div>
                )}
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                >
                  <option value="general">General Report</option>
                  <option value="lab">Lab Test</option>
                  <option value="prescription">Prescription</option>
                  <option value="diagnostic">Diagnostic Report</option>
                  <option value="consultation">Consultation Notes</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <Input
                  label="Report Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={formErrors.title}
                  placeholder="e.g., Blood Test Results - January 2025"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any additional notes about this report..."
                  disabled={loading}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload PDF Report <span className="text-red-500">*</span>
                </label>

                {!selectedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      formErrors.file
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } hover:border-primary-500 transition-colors cursor-pointer`}
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={loading}
                    />
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF files only, max 10MB
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {!loading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {loading && uploadProgress > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formErrors.file && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.file}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/doctor/reports")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddReport;
