import { Calendar, FileSearch, Hash, Search } from "lucide-react";
import { useState } from "react";
import Alert from "../components/Alert";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import { supabase } from "../lib/supabase";
import { predictionService } from "../services";

const PublicReportPage = () => {
  const [searchData, setSearchData] = useState({
    patientId: "",
    registrationDate: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchData.patientId.trim()) {
      setError("Patient ID is required");
      return;
    }

    if (!searchData.registrationDate) {
      setError("Registration Date is required for verification");
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      // First, verify patient with patient_id and date_registered
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select(
          "id, patient_id, name, age, gender, date_registered, medical_record_number"
        )
        .eq("patient_id", searchData.patientId.trim())
        .eq("date_registered", searchData.registrationDate)
        .single();

      if (patientError || !patientData) {
        throw new Error(
          "Patient not found or incorrect registration date. Please check your Patient ID and Registration Date."
        );
      }

      // Get predictions for this patient
      const { data: predictions, error: predictionsError } =
        await predictionService.getPatientPredictions(patientData.id);

      if (predictionsError) throw predictionsError;

      if (!predictions || predictions.length === 0) {
        setError("No test results found for this patient.");
        setIsSearching(false);
        return;
      }

      setResults({
        patient: patientData,
        predictions: predictions,
      });
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Failed to fetch reports. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchData({ patientId: "", registrationDate: "" });
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 mb-6">
            <FileSearch className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            View Your Test Results
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Access your malaria test results securely using your Patient ID
          </p>
        </motion.div>

        {/* Search Form */}
        {!results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="max-w-md mx-auto p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Enter Your Information
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please provide your details to access your reports
                </p>
              </div>

              {error && (
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError(null)}
                  className="mb-6"
                />
              )}

              <form onSubmit={handleSearch} className="space-y-6">
                <Input
                  label="Patient ID"
                  type="text"
                  name="patientId"
                  value={searchData.patientId}
                  onChange={handleChange}
                  placeholder="Enter your Patient ID (e.g., P000123)"
                  icon={<Hash className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Registration Date"
                  type="date"
                  name="registrationDate"
                  value={searchData.registrationDate}
                  onChange={handleChange}
                  icon={<Calendar className="w-5 h-5" />}
                  required
                  helperText="Required for identity verification"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={isSearching}
                  icon={<Search className="w-5 h-5" />}
                >
                  {isSearching ? "Searching..." : "View My Reports"}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Your Medical Record Number can be found
                  on your patient card or previous test results provided by your
                  doctor.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Results Display */}
        {results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Patient Info */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {results.patient.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    MRN: {results.patient.medical_record_number}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  New Search
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Age:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {results.patient.age} years
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Gender:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {results.patient.gender}
                  </span>
                </div>
              </div>
            </Card>

            {/* Test Results */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Test Results ({results.predictions.length})
              </h3>

              {results.predictions.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No test results available yet.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {results.predictions.map((sample) => (
                    <Card key={sample.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Test Date:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(
                                sample.sample_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              sample.processing_status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : sample.processing_status === "processing"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {sample.processing_status}
                          </span>
                        </div>
                      </div>

                      {sample.predictions && sample.predictions.length > 0 ? (
                        sample.predictions.map((prediction) => (
                          <div
                            key={prediction.id}
                            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block mb-1">
                                  Result:
                                </span>
                                <span
                                  className={`font-semibold ${
                                    prediction.predicted_class?.toLowerCase() ===
                                    "infected"
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {prediction.predicted_class}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block mb-1">
                                  Confidence:
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {(prediction.confidence_score * 100).toFixed(
                                    1
                                  )}
                                  %
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block mb-1">
                                  Tested By:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {prediction.doctor?.name || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block mb-1">
                                  Test ID:
                                </span>
                                <span className="font-mono text-xs text-gray-900 dark:text-white">
                                  #{prediction.id}
                                </span>
                              </div>
                            </div>

                            {sample.storage_url && (
                              <div className="mt-4">
                                <img
                                  src={sample.storage_url}
                                  alt="Blood sample"
                                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                          Test results pending...
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Important Information
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                <li>
                  These results are AI-generated and should be confirmed by a
                  medical professional
                </li>
                <li>
                  Please consult your doctor for proper diagnosis and treatment
                </li>
                <li>
                  Do not make medical decisions based solely on these results
                </li>
                <li>
                  Contact your healthcare provider if you have any questions
                </li>
              </ul>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PublicReportPage;
