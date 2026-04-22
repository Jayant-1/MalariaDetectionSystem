import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
import Card from "../../components/Card";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";

const Analytics = () => {
  const monthlyData = [
    { month: "Jan", tests: 420, positive: 45, users: 180 },
    { month: "Feb", tests: 580, positive: 62, users: 220 },
    { month: "Mar", tests: 690, positive: 58, users: 280 },
    { month: "Apr", tests: 750, positive: 71, users: 320 },
    { month: "May", tests: 820, positive: 66, users: 380 },
    { month: "Jun", tests: 920, positive: 79, users: 420 },
  ];

  const testTypeData = [
    { name: "Rapid Test", value: 450, color: "#1890ff" },
    { name: "Microscopy", value: 320, color: "#13c2c2" },
    { name: "PCR", value: 180, color: "#52c41a" },
    { name: "RDT", value: 110, color: "#faad14" },
  ];

  const hourlyActivity = [
    { hour: "00:00", activity: 12 },
    { hour: "04:00", activity: 8 },
    { hour: "08:00", activity: 45 },
    { hour: "12:00", activity: 78 },
    { hour: "16:00", activity: 65 },
    { hour: "20:00", activity: 38 },
  ];

  const departmentPerformance = [
    { department: "Emergency", tests: 450, accuracy: 98.5 },
    { department: "Outpatient", tests: 380, accuracy: 97.8 },
    { department: "Pediatrics", tests: 290, accuracy: 99.2 },
    { department: "ICU", tests: 210, accuracy: 98.9 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive system analytics and insights
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tests"
              value="4,180"
              trend="up"
              trendValue="12.5%"
              icon={Activity}
            />
            <StatCard
              title="Active Users"
              value="1,682"
              trend="up"
              trendValue="8.2%"
              icon={Users}
            />
            <StatCard
              title="Avg Response Time"
              value="2.4s"
              trend="down"
              trendValue="15%"
              icon={TrendingUp}
            />
            <StatCard
              title="System Uptime"
              value="99.8%"
              trend="up"
              trendValue="0.3%"
              icon={BarChart3}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Trends */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Monthly Test Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorPositive"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#13c2c2" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#13c2c2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tests"
                    stroke="#1890ff"
                    fillOpacity={1}
                    fill="url(#colorTests)"
                  />
                  <Area
                    type="monotone"
                    dataKey="positive"
                    stroke="#13c2c2"
                    fillOpacity={1}
                    fill="url(#colorPositive)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Test Type Distribution */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Test Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={testTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {testTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hourly Activity */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Hourly System Activity
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activity"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Department Performance */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Department Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tests" fill="#1890ff" />
                  <Bar yAxisId="right" dataKey="accuracy" fill="#13c2c2" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Avg Test Duration
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    3.2 min
                  </h3>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <ArrowDown className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  -8%
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    User Satisfaction
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    4.8/5
                  </h3>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ArrowUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  +5%
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    API Success Rate
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    99.7%
                  </h3>
                </div>
                <div className="p-3 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <ArrowUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                  +0.2%
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
