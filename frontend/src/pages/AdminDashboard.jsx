import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  TestTube,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import { supabase } from "../lib/supabase";
import { analyticsService, orgService, testService } from "../services";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    uptime: "99.9%",
    activeAlerts: 0,
  });
  const [userStats, setUserStats] = useState([
    { name: "Doctors", value: 0, color: "#3B82F6" },
    { name: "Patients", value: 0, color: "#14B8A6" },
    { name: "Admins", value: 0, color: "#8B5CF6" },
  ]);
  const [systemActivity, setSystemActivity] = useState([]);
  const [monthlyTests, setMonthlyTests] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([
    {
      type: "info",
      message: "System running smoothly",
      time: "Just now",
    },
  ]);
  // Doctor approval state
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        console.log("Loading admin profile for user:", user.id);
        const { data, error } = await orgService.getAdminByAuthId(user.id);
        if (error) {
          console.error("Error loading admin profile:", error);
        }
        if (data) {
          console.log("Admin profile loaded:", data);
          setProfile(data);
        } else {
          console.warn("No admin profile found for user");
        }
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      loadAdminData();
      loadDoctorApprovals();
    }
  }, [user, profile]);

  const loadDoctorApprovals = async () => {
    if (!profile?.org_id) return;

    try {
      const { data: pending } = await orgService.getPendingDoctors(
        profile.org_id
      );
      const approved = await orgService.getApprovedDoctors(profile.org_id);
      setPendingDoctors(pending || []);
      setApprovedDoctors(approved || []);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const handleApprove = async (doctorId) => {
    setProcessingId(doctorId);
    try {
      await orgService.approveDoctor(doctorId);
      await loadDoctorApprovals();
    } catch (error) {
      alert("Error approving doctor: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (doctorId) => {
    if (!confirm("Are you sure you want to reject this doctor?")) return;

    setProcessingId(doctorId);
    try {
      await orgService.rejectDoctor(doctorId);
      await loadDoctorApprovals();
    } catch (error) {
      alert("Error rejecting doctor: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load system-wide statistics
      const [systemResult, testsResult, usersResult, activityResult] =
        await Promise.all([
          analyticsService.getSystemStats(),
          testService.getAllTests({}),
          supabase.from("users").select("*"),
          analyticsService.getUserActivityLogs(10),
        ]);

      if (systemResult.data) {
        setSystemStats({
          totalUsers: systemResult.data.totalUsers,
          totalTests: systemResult.data.totalTests,
          uptime: "99.9%",
          activeAlerts: 0,
        });

        // Update user distribution
        setUserStats([
          {
            name: "Doctors",
            value: systemResult.data.totalDoctors,
            color: "#3B82F6",
          },
          {
            name: "Patients",
            value: systemResult.data.totalPatients,
            color: "#14B8A6",
          },
          {
            name: "Admins",
            value:
              systemResult.data.totalUsers -
              systemResult.data.totalDoctors -
              systemResult.data.totalPatients,
            color: "#8B5CF6",
          },
        ]);
      }

      // Process monthly test data
      if (testsResult.data) {
        const monthlyData = {};
        testsResult.data.forEach((test) => {
          const month = new Date(test.created_at).toLocaleDateString("en-US", {
            month: "short",
          });
          if (!monthlyData[month]) {
            monthlyData[month] = { month, tests: 0, positive: 0 };
          }
          monthlyData[month].tests++;
          if (test.result === "positive") {
            monthlyData[month].positive++;
          }
        });

        const last6Months = Object.values(monthlyData).slice(-6);
        setMonthlyTests(last6Months);
      }

      // Recent users
      if (usersResult.data) {
        const recent = usersResult.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4)
          .map((user) => ({
            id: user.id,
            name: user.full_name || "Unknown",
            role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            status: "active",
            joined: new Date(user.created_at).toLocaleDateString(),
          }));
        setRecentUsers(recent);
      }

      // System activity (last 24 hours - mock data for now)
      const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
      const activity = hours.map((hour) => ({
        hour,
        requests: Math.floor(Math.random() * 200) + 50,
      }));
      setSystemActivity(activity);
    } catch (error) {
      console.error("Error loading admin data:", error);
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
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            System overview and management console
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={systemStats.totalUsers.toString()}
            icon={Users}
            color="primary"
            delay={0}
          />
          <StatCard
            title="Total Tests"
            value={systemStats.totalTests.toString()}
            icon={TestTube}
            color="teal"
            delay={0.1}
          />
          <StatCard
            title="System Uptime"
            value={systemStats.uptime}
            icon={Activity}
            color="green"
            delay={0.2}
          />
          <StatCard
            title="Active Alerts"
            value={systemStats.activeAlerts.toString()}
            icon={AlertTriangle}
            color="yellow"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Distribution */}
          <Card hover={false}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "#F3F4F6",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {userStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {stat.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* System Activity */}
          <Card hover={false} className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              System Activity (24h)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={systemActivity}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
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
                  dataKey="requests"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: "#8B5CF6", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Monthly Tests Chart */}
        <Card hover={false} className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Test Analytics
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTests}>
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
                name="Positive Cases"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Users
              </h3>
              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Manage Users
              </button>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {user.role} • Joined {user.joined}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={user.status === "active" ? "success" : "warning"}
                  >
                    {user.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* System Alerts */}
          <Card hover={false}>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                System Alerts
              </h3>
            </div>
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                      : alert.type === "success"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className={`font-medium ${
                          alert.type === "warning"
                            ? "text-yellow-800 dark:text-yellow-300"
                            : alert.type === "success"
                            ? "text-green-800 dark:text-green-300"
                            : "text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.time}
                      </p>
                    </div>
                    <Badge
                      variant={
                        alert.type === "warning"
                          ? "warning"
                          : alert.type === "success"
                          ? "success"
                          : "info"
                      }
                    >
                      {alert.type}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Doctor Approval Section */}
        {profile?.org_id && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Doctor Management
            </h2>

            {/* Pending Doctors */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Pending Approvals ({pendingDoctors.length})
                </h3>
              </div>

              {pendingDoctors.length === 0 ? (
                <Card hover={false}>
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No pending approvals
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingDoctors.map((doctor) => (
                    <Card key={doctor.id} hover={false}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {doctor.name}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                              <span className="font-medium">Email:</span>{" "}
                              {doctor.email}
                            </p>
                            <p>
                              <span className="font-medium">Phone:</span>{" "}
                              {doctor.phone || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Specialty:</span>{" "}
                              {doctor.specialty || "General"}
                            </p>
                            <p>
                              <span className="font-medium">License:</span>{" "}
                              {doctor.license_number || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Registered:</span>{" "}
                              {new Date(
                                doctor.created_at || Date.now()
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(doctor.id)}
                            disabled={processingId === doctor.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReject(doctor.id)}
                            disabled={processingId === doctor.id}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Doctors */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Approved Doctors ({approvedDoctors.length})
                </h3>
              </div>

              {approvedDoctors.length === 0 ? (
                <Card hover={false}>
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No approved doctors yet
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {approvedDoctors.map((doctor) => (
                    <Card
                      key={doctor.id}
                      hover={false}
                      className="border-l-4 border-green-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {doctor.name}
                          </h4>
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{doctor.specialty || "General"}</span>
                            <span>•</span>
                            <span>{doctor.email}</span>
                            <span>•</span>
                            <span className="text-green-600 font-medium">
                              Active
                            </span>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
