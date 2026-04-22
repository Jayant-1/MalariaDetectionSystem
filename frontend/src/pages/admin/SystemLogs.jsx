import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Filter,
  Info,
  Search,
} from "lucide-react";
import { useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Sidebar from "../../components/Sidebar";

const SystemLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const logs = [
    {
      id: 1,
      timestamp: "2024-11-14 05:15:23",
      type: "error",
      message: "Database connection timeout",
      source: "API Server",
      user: "System",
      details: "Connection pool exhausted after 30s",
    },
    {
      id: 2,
      timestamp: "2024-11-14 05:12:45",
      type: "warning",
      message: "High memory usage detected",
      source: "Monitoring Service",
      user: "System",
      details: "Memory usage at 85%",
    },
    {
      id: 3,
      timestamp: "2024-11-14 05:10:12",
      type: "info",
      message: "User login successful",
      source: "Auth Service",
      user: "dr.johnson@hospital.com",
      details: "Login from IP: 192.168.1.100",
    },
    {
      id: 4,
      timestamp: "2024-11-14 05:08:56",
      type: "success",
      message: "Backup completed successfully",
      source: "Backup Service",
      user: "System",
      details: "Database backup to S3: 2.5GB",
    },
    {
      id: 5,
      timestamp: "2024-11-14 05:05:34",
      type: "error",
      message: "Failed to send email notification",
      source: "Email Service",
      user: "System",
      details: "SMTP connection refused",
    },
    {
      id: 6,
      timestamp: "2024-11-14 05:02:18",
      type: "info",
      message: "AI model prediction completed",
      source: "ML Service",
      user: "patient@email.com",
      details: "Processing time: 2.3s, Confidence: 96.5%",
    },
    {
      id: 7,
      timestamp: "2024-11-14 04:58:42",
      type: "warning",
      message: "API rate limit approaching",
      source: "API Gateway",
      user: "external_app",
      details: "950/1000 requests in current window",
    },
    {
      id: 8,
      timestamp: "2024-11-14 04:55:19",
      type: "success",
      message: "System health check passed",
      source: "Health Monitor",
      user: "System",
      details: "All services operational",
    },
  ];

  const getLogIcon = (type) => {
    const icons = {
      error: AlertTriangle,
      warning: AlertTriangle,
      info: Info,
      success: CheckCircle,
    };
    return icons[type] || Info;
  };

  const getLogBadgeVariant = (type) => {
    const variants = {
      error: "error",
      warning: "warning",
      info: "info",
      success: "success",
    };
    return variants[type] || "default";
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = [
    { label: "Total Logs", value: "12,456", type: "info" },
    { label: "Errors", value: "23", type: "error" },
    { label: "Warnings", value: "156", type: "warning" },
    { label: "Success", value: "12,277", type: "success" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              System Logs
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor all system activities and events
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {stat.label}
                      </p>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stat.value}
                      </h3>
                    </div>
                    <Badge variant={stat.type}>{stat.type}</Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
                <div className="flex-1">
                  <Input
                    icon={Search}
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none transition-all duration-300"
                >
                  <option value="all">All Types</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          {/* Logs List */}
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const LogIcon = getLogIcon(log.type);
              return (
                <div key={log.id}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          log.type === "error"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : log.type === "warning"
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : log.type === "success"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        <LogIcon
                          className={`w-6 h-6 ${
                            log.type === "error"
                              ? "text-red-600 dark:text-red-400"
                              : log.type === "warning"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : log.type === "success"
                              ? "text-green-600 dark:text-green-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {log.message}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {log.details}
                            </p>
                          </div>
                          <Badge variant={getLogBadgeVariant(log.type)}>
                            {log.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {log.source}
                          </span>
                          <span>User: {log.user}</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
