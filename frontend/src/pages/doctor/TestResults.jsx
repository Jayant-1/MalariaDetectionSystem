import {
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { testService } from "../../services";
import { generateDoctorReport } from "../../utils/pdfGenerator";
import { formatTestForDoctorReport } from "../../utils/reportHelpers";

const TestResults = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [stats, setStats] = useState({
    totalWeekly: 0,
    positiveWeekly: 0,
    avgConfidence: 0,
    pending: 0,
  });

  useEffect(() => {
    if (user) {
      loadTestData();
    }
  }, [user]);

  const loadTestData = async () => {
    setLoading(true);
    try {
      console.log("Loading test data for doctor:", {
        userId: user.id,
        profileId: profile?.id,
      });

      const [weeklyResult, testsResult, statsResult] = await Promise.all([
        testService.getWeeklyTestData(user.id),
        testService.getAllTests({ doctorId: user.id }),
        testService.getTestStats(user.id),
      ]);

      console.log("Tests result:", testsResult);

      if (weeklyResult.data) {
        setWeeklyData(weeklyResult.data);
      }

      if (testsResult.data) {
        console.log(`Found ${testsResult.data.length} tests`);
        const formattedTests = tests.data.map((test) => ({
          id: test.id,
          patientId: test.patient_id,
          patientName: test.patients?.users?.full_name || "Unknown",
          testDate: new Date(test.created_at).toLocaleDateString(),
          testType: test.parasite_species || "General Test",
          result:
            test.result.charAt(0).toUpperCase() + test.result.slice(1) ||
            "Pending",
          confidence: test.confidence || null,
          status: test.status === "completed" ? "Completed" : "In Progress",
          postedToPatient: test.posted_to_patient || false,
          predictedClass: test.parasite_species || test.result,
          parasitizedProb: test.parasitized_probability || "N/A",
          uninfectedProb: test.uninfected_probability || "N/A",
          imageQuality: test.image_quality || "Good",
          notes: test.additional_notes || "",
        }));
        setTestResults(formattedTests);
      }

      if (statsResult.data) {
        setStats({
          totalWeekly: statsResult.data.totalTests,
          positiveWeekly: statsResult.data.positiveTests,
          avgConfidence: statsResult.data.averageConfidence.toFixed(1),
          pending: statsResult.data.pendingTests,
        });
      }
    } catch (error) {
      console.error("Error loading test data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = testResults.filter((test) =>
    test.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateReport = (test) => {
    // Format test data for PDF report
    const formattedData = formatTestForDoctorReport(test, profile);

    // Generate PDF report using the PDF generator utility
    generateDoctorReport(formattedData);
  };

  const handlePostToPatient = async (testId) => {
    try {
      const result = await testService.postTestToPatient(testId);
      if (result.error) {
        console.error("Error posting test to patient:", result.error);
        alert("Failed to post test result to patient");
        return;
      }

      // Update local state
      setTestResults((prevTests) =>
        prevTests.map((test) =>
          test.id === testId
            ? { ...test, postedToPatient: true, status: "Completed" }
            : test
        )
      );

      alert("Test result posted to patient successfully!");
    } catch (error) {
      console.error("Error posting test:", error);
      alert("An error occurred while posting the test result");
    }
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Test Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage patient test results
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Tests
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalWeekly}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Positive Cases
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.positiveWeekly}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Avg Confidence
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.avgConfidence}%
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pending Review
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.pending}
              </h3>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Weekly Test Volume
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tests" fill="#1890ff" />
                  <Bar dataKey="positive" fill="#ff4d4f" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Test Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tests"
                    stroke="#1890ff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search by patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          {/* Results Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Patient
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Test Date
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Test Type
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Result
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Confidence
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Status
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Posted
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        {test.patientName}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {test.testDate}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {test.testType}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            test.result === "Negative"
                              ? "success"
                              : test.result === "Positive"
                              ? "error"
                              : "warning"
                          }
                        >
                          {test.result}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-semibold">
                        {test.confidence ? `${test.confidence}%` : "-"}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            test.status === "Completed" ? "success" : "warning"
                          }
                        >
                          {test.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={test.postedToPatient ? "success" : "warning"}
                        >
                          {test.postedToPatient ? "Posted" : "Not Posted"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {!test.postedToPatient && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => handlePostToPatient(test.id)}
                            >
                              <TrendingUp className="w-4 h-4" />
                              Post
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleGenerateReport(test)}
                          >
                            <Download className="w-4 h-4" />
                            Report
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
    </div>
  );
};
export default TestResults;
