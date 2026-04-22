import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  TestTube,
  TrendingUp,
  Users,
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
import Badge from "../components/Badge";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import {
  analyticsService,
  appointmentService,
  patientService,
  testService,
} from "../services";

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTests: 0,
    positiveTests: 0,
    pendingTests: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    if (user && profile) {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        statsResult,
        weeklyResult,
        monthlyResult,
        testsResult,
        patientsResult,
        appointmentsResult,
      ] = await Promise.all([
        analyticsService.getDashboardStats(user.id, "doctor"),
        testService.getWeeklyTestData(user.id),
        analyticsService.getTestTrends(user.id, "doctor", 180),
        testService.getAllTests({ doctorId: user.id }),
        patientService.getAllPatients(user.id),
        appointmentService.getUpcomingAppointments(user.id, "doctor"),
      ]);

      if (statsResult.data) {
        setStats({
          totalPatients: patientsResult.data?.length || 0,
          totalTests: statsResult.data.totalTests || 0,
          positiveTests: statsResult.data.positiveTests || 0,
          pendingTests:
            testsResult.data?.filter((t) => t.status === "pending").length || 0,
        });
      }

      if (weeklyResult.data) {
        setWeeklyData(weeklyResult.data);
      }

      if (monthlyResult.data) {
        // Transform monthly data for the chart
        const last6Months = monthlyResult.data.slice(-6);
        setMonthlyTrend(
          last6Months.map((item) => ({
            month: new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
            }),
            cases: item.positive,
          }))
        );
      }

      if (testsResult.data) {
        // Get recent 5 tests
        const recent = testsResult.data.slice(0, 5).map((test) => ({
          id: test.id,
          patient: test.patients?.users?.full_name || "Unknown",
          date: new Date(test.created_at).toLocaleDateString(),
          time: new Date(test.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: test.result,
          confidence: test.confidence || 0,
        }));
        setRecentTests(recent);
      }

      if (appointmentsResult.data) {
        // Get today's appointments
        const today = new Date().toDateString();
        const todayAppointments = appointmentsResult.data
          .filter(
            (apt) => new Date(apt.appointment_date).toDateString() === today
          )
          .slice(0, 3)
          .map((apt) => ({
            patient: apt.patients?.users?.full_name || "Unknown",
            time: new Date(apt.appointment_date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            reason: apt.appointment_type || "Consultation",
          }));
        setUpcomingAppointments(todayAppointments);
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
            Doctor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your patients today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients.toString()}
            icon={Users}
            color="primary"
            delay={0}
          />
          <StatCard
            title="Total Tests"
            value={stats.totalTests.toString()}
            icon={TestTube}
            color="teal"
            delay={0.1}
          />
          <StatCard
            title="Positive Cases"
            value={stats.positiveTests.toString()}
            icon={CheckCircle}
            color="green"
            delay={0.2}
          />
          <StatCard
            title="Pending Results"
            value={stats.pendingTests.toString()}
            icon={Clock}
            color="yellow"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Tests Chart */}
          <Card hover={false}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Weekly Test Activity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "#F3F4F6",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="tests"
                  fill="#3B82F6"
                  name="Total Tests"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="positive"
                  fill="#EF4444"
                  name="Positive"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Trend Chart */}
          <Card hover={false}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Positive Cases Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis dataKey="month" stroke="#9CA3AF" />
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
                  dataKey="cases"
                  stroke="#14B8A6"
                  strokeWidth={3}
                  dot={{ fill: "#14B8A6", r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tests */}
          <Card hover={false} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Test Results
              </h3>
              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Patient
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTests.map((test) => (
                    <tr
                      key={test.id}
                      className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                        {test.patient}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {test.date} <span className="text-xs">{test.time}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            test.status === "negative" ? "success" : "danger"
                          }
                        >
                          {test.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {test.confidence}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Today's Appointments */}
          <Card hover={false}>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Today's Schedule
              </h3>
            </div>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {appointment.patient}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {appointment.reason}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                      {appointment.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
