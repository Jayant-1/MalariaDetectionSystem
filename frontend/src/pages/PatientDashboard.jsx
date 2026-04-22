import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import { appointmentService, patientService, testService } from "../services";

const PatientDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientRecord, setPatientRecord] = useState(null);
  const [stats, setStats] = useState({
    totalTests: 0,
    latestResult: "N/A",
    pendingTests: 0,
    nextAppointment: "N/A",
  });
  const [testHistory, setTestHistory] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    if (user && profile) {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Find patient record for this user
      const { data: patients } = await patientService.getAllPatients();
      const patient = patients?.find((p) => p.user_id === user.id);

      if (!patient) {
        console.log("No patient record found for user");
        setLoading(false);
        return;
      }

      setPatientRecord(patient);

      // Load test results
      const { data: tests } = await testService.getAllTests({
        patientId: patient.id,
      });

      if (tests) {
        // Calculate stats
        const pending = tests.filter((t) => t.status === "pending").length;
        const latest = tests[0];

        setStats({
          totalTests: tests.length,
          latestResult: latest?.result
            ? latest.result.charAt(0).toUpperCase() + latest.result.slice(1)
            : "N/A",
          pendingTests: pending,
          nextAppointment: "Loading...",
        });

        // Group tests by month for history chart
        const monthlyTests = {};
        tests.forEach((test) => {
          const date = new Date(test.created_at);
          const monthKey = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          monthlyTests[monthKey] = (monthlyTests[monthKey] || 0) + 1;
        });

        // Get last 6 months
        const last6Months = Object.entries(monthlyTests)
          .slice(-6)
          .map(([date, tests]) => ({ date, tests }));
        setTestHistory(last6Months);

        // Recent results
        const recent = tests.slice(0, 3).map((test) => ({
          id: test.id,
          date: new Date(test.created_at).toLocaleDateString(),
          time: new Date(test.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: test.result,
          confidence: test.confidence || 0,
          doctor: test.doctors?.full_name || "Unknown Doctor",
          notes: test.notes || "No notes available.",
        }));
        setRecentResults(recent);
      }

      // Load appointments
      const { data: appointments } =
        await appointmentService.getAllAppointments({ patientId: patient.id });

      if (appointments) {
        const upcoming = appointments
          .filter((apt) => new Date(apt.appointment_date) >= new Date())
          .slice(0, 2)
          .map((apt) => ({
            date: new Date(apt.appointment_date).toLocaleDateString(),
            time: new Date(apt.appointment_date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            doctor: apt.doctors?.full_name || "Unknown Doctor",
            type: apt.appointment_type || "Consultation",
            location: apt.notes || "TBD",
          }));
        setUpcomingAppointments(upcoming);

        if (upcoming.length > 0) {
          const nextDate = new Date(appointments[0].appointment_date);
          setStats((prev) => ({
            ...prev,
            nextAppointment: nextDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          }));
        } else {
          setStats((prev) => ({ ...prev, nextAppointment: "None" }));
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 w-full lg:w-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            My Health Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your test results and manage your health records
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tests"
            value={stats.totalTests.toString()}
            icon={FileText}
            color="primary"
            delay={0}
          />
          <StatCard
            title="Latest Result"
            value={stats.latestResult}
            icon={CheckCircle}
            color="green"
            delay={0.1}
          />
          <StatCard
            title="Pending Results"
            value={stats.pendingTests.toString()}
            icon={Clock}
            color="yellow"
            delay={0.2}
          />
          <StatCard
            title="Next Appointment"
            value={stats.nextAppointment}
            icon={Calendar}
            color="teal"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Test History Chart */}
          <Card hover={false} className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test History (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={testHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "#F3F4F6",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tests"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Quick Actions */}
          <Card hover={false}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                icon={<FileText className="w-4 h-4" />}
              >
                New Test Request
              </Button>
              <Button
                variant="outline"
                className="w-full"
                icon={<Calendar className="w-4 h-4" />}
              >
                Book Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full"
                icon={<Download className="w-4 h-4" />}
              >
                Download Records
              </Button>
            </div>

            {/* Health Tips */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Health Tip
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Use mosquito nets and repellents to prevent malaria
                    infection
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Test Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card hover={false}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Recent Test Results
              </h3>
              <div className="space-y-4">
                {recentResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            result.status === "negative"
                              ? "bg-green-100 dark:bg-green-900/20"
                              : "bg-red-100 dark:bg-red-900/20"
                          }`}
                        >
                          {result.status === "negative" ? (
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {result.date}
                            </h4>
                            <Badge
                              variant={
                                result.status === "negative"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {result.time} • {result.doctor}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Confidence
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.confidence}%
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded-lg">
                      <span className="font-medium">Notes:</span> {result.notes}
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Download className="w-4 h-4" />}
                      >
                        Download Report
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <Card hover={false}>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Upcoming Appointments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((appointment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {appointment.date}
                    </p>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {appointment.time}
                    </h4>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {appointment.type}
                    </p>
                  </div>
                  <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Doctor:</span>{" "}
                    {appointment.doctor}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Location:</span>{" "}
                    {appointment.location}
                  </p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button size="sm" variant="primary" className="flex-1">
                    Join Virtual
                  </Button>
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PatientDashboard;
