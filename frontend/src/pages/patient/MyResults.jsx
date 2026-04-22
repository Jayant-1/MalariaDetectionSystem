import { Calendar, Download, Eye, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { patientService, testService } from "../../services";
import { generatePatientReport } from "../../utils/pdfGenerator";
import { formatTestForPatientReport } from "../../utils/reportHelpers";

const MyResults = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    lastTestDate: "N/A",
    allNegative: true,
  });

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user]);

  const loadResults = async () => {
    setLoading(true);
    try {
      // Get patient record
      const { data: patients } = await patientService.getAllPatients();
      const patient = patients?.find((p) => p.user_id === user.id);

      if (!patient) {
        setLoading(false);
        return;
      }

      // Get test results - only show posted tests
      const { data: tests } = await testService.getAllTests({
        patientId: patient.id,
      });

      // Filter to only show tests posted to patient
      const postedTests = tests?.filter((test) => test.posted_to_patient) || [];

      if (postedTests.length > 0) {
        const formattedResults = postedTests.map((test) => ({
          id: test.id,
          testType: test.parasite_species || "General Malaria Test",
          date: new Date(test.created_at).toLocaleDateString(),
          result:
            test.result.charAt(0).toUpperCase() + test.result.slice(1) ||
            "Pending",
          confidence: test.confidence || 0,
          doctor: test.doctors?.full_name || "Unknown Doctor",
          hospital: test.doctors?.hospital || "Unknown Hospital",
          status: test.status === "completed" ? "Final" : "Pending",
          predictedClass: test.parasite_species || test.result,
          parasitizedProb: test.parasitized_probability || "N/A",
          uninfectedProb: test.uninfected_probability || "N/A",
          imageQuality: test.image_quality || "Good",
        }));

        setResults(formattedResults);

        // Calculate stats
        const allNegative = postedTests.every((t) => t.result === "negative");
        const lastTest = postedTests[0];

        setStats({
          totalTests: postedTests.length,
          lastTestDate: lastTest
            ? new Date(lastTest.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A",
          allNegative,
        });
      }
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(
    (result) =>
      result.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadReport = (result) => {
    // Format test data for PDF report
    const formattedData = formatTestForPatientReport(result);

    // Generate PDF report for patient
    generatePatientReport(formattedData);
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

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

  const getResultBadgeVariant = (result) => {
    switch (result) {
      case "Negative":
        return "success";
      case "Positive":
        return "error";
      case "Pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Test Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View your malaria test history
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                Last Test Date
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.lastTestDate}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Status</p>
              <h3
                className={`text-2xl font-bold mt-2 ${
                  stats.allNegative ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {stats.allNegative ? "All Clear" : "Check Results"}
              </h3>
            </Card>
          </div>

          <Card>
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search by test type or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Test Type
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Doctor
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Hospital
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Result
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confidence
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {result.testType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {result.date}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {result.doctor}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {result.hospital}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getResultBadgeVariant(result.result)}>
                          {result.result}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {result.confidence}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewDetails(result)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleDownloadReport(result)}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Test Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedResult(null);
        }}
        title="Test Result Details"
      >
        {selectedResult && (
          <div className="space-y-6">
            {/* Test Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Test Type
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedResult.testType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedResult.date}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Doctor
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedResult.doctor}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hospital
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedResult.hospital}
                </p>
              </div>
            </div>

            {/* Test Results */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Results
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Result:
                  </span>
                  <Badge variant={getResultBadgeVariant(selectedResult.result)}>
                    {selectedResult.result}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Confidence:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.confidence}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <Badge variant="default">{selectedResult.status}</Badge>
                </div>
              </div>
            </div>

            {/* AI Analysis Details */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Analysis Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Predicted Class:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.predictedClass}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Parasitized Probability:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.parasitizedProb}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Uninfected Probability:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.uninfectedProb}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Image Quality:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.imageQuality}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedResult(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownloadReport(selectedResult)}
                icon={<Download className="w-4 h-4" />}
              >
                Download Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default MyResults;
