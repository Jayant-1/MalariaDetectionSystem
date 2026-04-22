import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { reportService } from "../../services";

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    posted: 0,
    pending: 0,
  });

  useEffect(() => {
    if (user) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [reportsResult, statsResult] = await Promise.all([
        reportService.getAllReports({ doctorId: user.id }),
        reportService.getReportStats(user.id),
      ]);

      if (reportsResult.data) {
        const formattedReports = reportsResult.data.map((report) => ({
          id: report.id,
          patientName: report.patients?.name || "Unknown",
          patientMRN: report.patients?.medical_record_number || "N/A",
          title: report.title,
          reportType:
            report.report_type.charAt(0).toUpperCase() +
            report.report_type.slice(1),
          uploadDate: new Date(report.created_at).toLocaleDateString(),
          fileSize: report.file_size
            ? (report.file_size / 1024 / 1024).toFixed(2) + " MB"
            : "N/A",
          fileName: report.file_name,
          fileUrl: report.file_url,
          postedToPatient: report.posted_to_patient,
          status: report.status,
          description: report.description || "",
        }));
        setReports(formattedReports);
      }

      if (statsResult.data) {
        setStats({
          total: statsResult.data.totalReports,
          posted: statsResult.data.postedReports,
          pending: statsResult.data.pendingReports,
        });
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostToPatient = async (reportId) => {
    try {
      const result = await reportService.postReportToPatient(reportId);
      if (result.error) {
        alert("Failed to post report to patient");
        return;
      }

      // Update local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? { ...report, postedToPatient: true, status: "posted" }
            : report
        )
      );

      setStats((prev) => ({
        ...prev,
        posted: prev.posted + 1,
        pending: prev.pending - 1,
      }));

      alert("Report posted to patient successfully!");
    } catch (error) {
      console.error("Error posting report:", error);
      alert("An error occurred while posting the report");
    }
  };

  const handleDownloadReport = (report) => {
    window.open(report.fileUrl, "_blank");
  };

  const filteredReports = reports.filter(
    (report) =>
      report.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportType.toLowerCase().includes(searchQuery.toLowerCase())
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
              Reports Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and share patient reports
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Reports
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Posted to Patients
              </p>
              <h3 className="text-3xl font-bold text-green-600 mt-2">
                {stats.posted}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pending
              </p>
              <h3 className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.pending}
              </h3>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search by patient name, title, or type..."
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
                  onClick={() => navigate("/doctor/add-report")}
                >
                  <Plus className="w-4 h-4" />
                  Upload Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Reports Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Patient
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Report Title
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Type
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Upload Date
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Size
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
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No reports found. Upload your first report!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {report.patientName}
                            </p>
                            <p className="text-sm text-gray-500">
                              MRN: {report.patientMRN}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.title}
                          </p>
                          {report.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {report.description}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant="default">{report.reportType}</Badge>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {report.uploadDate}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">
                          {report.fileSize}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              report.postedToPatient ? "success" : "warning"
                            }
                          >
                            {report.postedToPatient ? "Posted" : "Not Posted"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {!report.postedToPatient && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => handlePostToPatient(report.id)}
                              >
                                <TrendingUp className="w-4 h-4" />
                                Post
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
