import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { patientService, reportService } from "../../services";

const MyReports = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    lastUploadDate: "N/A",
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
      // Get patient record
      const { data: patients } = await patientService.getAllPatients();
      const patient = patients?.find((p) => p.user_id === user.id);

      if (!patient) {
        setLoading(false);
        return;
      }

      // Get reports - only posted ones
      const { data: reportsData } = await reportService.getAllReports({
        patientId: patient.id,
        postedOnly: true,
      });

      if (reportsData) {
        const formattedReports = reportsData.map((report) => ({
          id: report.id,
          title: report.title,
          description: report.description || "",
          reportType:
            report.report_type.charAt(0).toUpperCase() +
            report.report_type.slice(1),
          uploadDate: new Date(report.created_at).toLocaleDateString(),
          uploadTime: new Date(report.created_at).toLocaleTimeString(),
          fileSize: report.file_size
            ? (report.file_size / 1024 / 1024).toFixed(2) + " MB"
            : "N/A",
          fileName: report.file_name,
          fileUrl: report.file_url,
        }));

        setReports(formattedReports);

        // Calculate stats
        const lastReport = reportsData[0];
        setStats({
          totalReports: reportsData.length,
          lastUploadDate: lastReport
            ? new Date(lastReport.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A",
        });
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleDownloadReport = (report) => {
    window.open(report.fileUrl, "_blank");
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
              My Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and download your medical reports
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Reports
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalReports}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Last Upload
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.lastUploadDate}
              </h3>
            </Card>
          </div>

          <Card>
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search by title or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Report Title
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Upload Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      File Size
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No reports available yet
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {report.title}
                            </p>
                            {report.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="default">{report.reportType}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {report.uploadDate}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600 dark:text-gray-400">
                            {report.fileSize}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewDetails(report)}
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

      {/* Report Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedReport(null);
        }}
        title="Report Details"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Report Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Report Title
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedReport.title}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <Badge variant="default" className="mt-1">
                  {selectedReport.reportType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload Date
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedReport.uploadDate}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  File Name
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {selectedReport.fileName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  File Size
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedReport.fileSize}
                </p>
              </div>
              {selectedReport.description && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Description
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedReport.description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedReport(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownloadReport(selectedReport)}
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

export default MyReports;
