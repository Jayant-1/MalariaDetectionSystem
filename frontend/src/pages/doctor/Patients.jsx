import {
  Calendar,
  Eye,
  FileText,
  Filter,
  Mail,
  Phone,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { patientService, testService } from "../../services";

const Patients = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalTests: 0,
    monthTests: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTests, setPatientTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    dateOfBirth: "",
    phone: "",
    address: "",
    medicalRecordNumber: "",
    emergencyContact: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Get all patients (filtering by doctor removed due to type mismatch)
      const { data: patientData } = await patientService.getAllPatients();

      if (patientData) {
        // Load test data for each patient
        const patientsWithTests = await Promise.all(
          patientData.map(async (patient) => {
            const { data: tests } = await testService.getAllTests({
              patientId: patient.id,
            });

            const lastTest = tests?.[0];

            return {
              id: patient.id,
              name: patient.name || "Unknown",
              age: patient.age || "N/A",
              gender: patient.gender || "N/A",
              email: patient.email || "N/A",
              phone: patient.phone || "N/A",
              medicalRecordNumber: patient.medical_record_number || "N/A",
              dateOfBirth: patient.date_of_birth || "N/A",
              address: patient.address || "N/A",
              emergencyContact: patient.emergency_contact || "N/A",
              lastVisit: lastTest
                ? new Date(lastTest.created_at).toLocaleDateString()
                : "Never",
              status: "Active", // Default to active since we don't have status field
              testsCount: tests?.length || 0,
              lastTestResult: lastTest
                ? lastTest.result.charAt(0).toUpperCase() +
                  lastTest.result.slice(1)
                : "N/A",
            };
          })
        );

        setPatients(patientsWithTests);

        // Calculate stats
        const totalTests = patientsWithTests.reduce(
          (acc, p) => acc + p.testsCount,
          0
        );
        setStats({
          total: patientsWithTests.length,
          active: patientsWithTests.filter((p) => p.status === "Active").length,
          totalTests,
          monthTests: totalTests, // You can calculate this month's tests separately
        });
      }
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.age || formData.age <= 0 || isNaN(formData.age)) {
      errors.age = "Valid age is required";
    }
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (
      formData.medicalRecordNumber &&
      formData.medicalRecordNumber.trim() === ""
    ) {
      errors.medicalRecordNumber =
        "Medical record number cannot be empty if provided";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const patientData = {
        name: formData.name.trim(),
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        medical_record_number: formData.medicalRecordNumber.trim() || null,
        emergency_contact: formData.emergencyContact.trim() || null,
        // created_by removed - field expects bigint but we have UUID
      };

      const { data, error } = await patientService.createPatient(patientData);

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        name: "",
        age: "",
        gender: "Male",
        dateOfBirth: "",
        phone: "",
        address: "",
        medicalRecordNumber: "",
        emergencyContact: "",
      });
      setFormErrors({});
      setShowAddModal(false);

      // Reload patients list
      await loadPatients();
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Failed to add patient: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddReport = (patient) => {
    // Navigate to add report page with patient info
    navigate("/doctor/add-report", {
      state: {
        selectedPatient: {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          medicalRecordNumber: patient.medicalRecordNumber,
        },
      },
    });
  };

  const handleViewPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    setLoadingTests(true);

    try {
      // Fetch all tests for this patient
      const { data: tests } = await testService.getAllTests({
        patientId: patient.id,
      });

      if (tests) {
        const formattedTests = tests.map((test) => ({
          id: test.id,
          date: new Date(test.created_at).toLocaleDateString(),
          time: new Date(test.created_at).toLocaleTimeString(),
          result: test.result.charAt(0).toUpperCase() + test.result.slice(1),
          confidence: test.confidence || 0,
          status: test.status === "completed" ? "Completed" : "In Progress",
          testType: test.parasite_species || "General Test",
          parasitizedProb: test.parasitized_probability || "N/A",
          uninfectedProb: test.uninfected_probability || "N/A",
          imageQuality: test.image_quality || "Good",
          notes: test.additional_notes || "",
        }));
        setPatientTests(formattedTests);
      }
    } catch (error) {
      console.error("Error loading patient tests:", error);
    } finally {
      setLoadingTests(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Patients
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and monitor your patients
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Patients
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Active Patients
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.active}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Tests
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalTests}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                All Time
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.monthTests}
              </h3>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button
                  variant="primary"
                  className="flex items-center gap-2"
                  onClick={() => setShowAddModal(true)}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Patient
                </Button>
              </div>
            </div>
          </Card>

          {/* Patients List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPatients.map((patient, index) => (
              <div key={patient.id}>
                <Card className="hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {patient.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {patient.age} years • {patient.gender}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        patient.status === "Active" ? "success" : "default"
                      }
                    >
                      {patient.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Last Visit: {patient.lastVisit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tests: {patient.testsCount}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Last Result:{" "}
                        <Badge
                          variant={
                            patient.lastTestResult === "Negative"
                              ? "success"
                              : "error"
                          }
                          size="sm"
                        >
                          {patient.lastTestResult}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddReport(patient)}
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Add Report
                      </Button>
                      <Button
                        onClick={() => handleViewPatientDetails(patient)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Patient"
      >
        <form onSubmit={handleAddPatient} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={formErrors.name}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Input
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                error={formErrors.age}
                placeholder="30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                error={formErrors.dateOfBirth}
                required
              />
            </div>

            <div>
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                error={formErrors.phone}
                placeholder="1234567890"
                required
              />
            </div>

            <div>
              <Input
                label="Medical Record Number"
                name="medicalRecordNumber"
                value={formData.medicalRecordNumber}
                onChange={handleInputChange}
                placeholder="MRN123456"
              />
            </div>

            <div>
              <Input
                label="Emergency Contact"
                name="emergencyContact"
                type="tel"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder="9876543210"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="123 Main St, City, Country"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Patient"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPatient(null);
          setPatientTests([]);
        }}
        title={`Patient Details: ${selectedPatient?.name || ""}`}
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.age} years
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gender
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.gender}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Phone
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Medical Record #
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.medicalRecordNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Date of Birth
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.dateOfBirth !== "N/A"
                    ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tests
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.testsCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Visit
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.lastVisit}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Address
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.address}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Emergency Contact
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.emergencyContact}
                </p>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Results History
              </h3>

              {loadingTests ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : patientTests.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  No test results found for this patient
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {patientTests.map((test) => (
                    <Card key={test.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {test.testType}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {test.date} at {test.time}
                          </p>
                        </div>
                        <Badge
                          variant={
                            test.result === "Positive"
                              ? "error"
                              : test.result === "Negative"
                              ? "success"
                              : "warning"
                          }
                        >
                          {test.result}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Confidence
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {test.confidence}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Status
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {test.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Parasitized
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {test.parasitizedProb}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Uninfected
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {test.uninfectedProb}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Image Quality
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {test.imageQuality}
                          </p>
                        </div>
                      </div>

                      {test.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Notes: {test.notes}
                          </p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAddReport(selectedPatient);
                }}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Add New Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPatient(null);
                  setPatientTests([]);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Patients;
