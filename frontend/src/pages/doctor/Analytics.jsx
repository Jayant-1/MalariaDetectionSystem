import { Activity, BarChart3, Calendar, TrendingUp, Users } from "lucide-react";
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
import Card from "../../components/Card";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";

const Analytics = () => {
  const monthlyData = [
    { month: "Jun", tests: 45, positive: 5 },
    { month: "Jul", tests: 52, positive: 6 },
    { month: "Aug", tests: 48, positive: 4 },
    { month: "Sep", tests: 63, positive: 7 },
    { month: "Oct", tests: 58, positive: 5 },
    { month: "Nov", tests: 71, positive: 8 },
  ];

  const testTypeData = [
    { type: "Rapid Test", count: 120 },
    { type: "Microscopy", count: 85 },
    { type: "PCR", count: 45 },
    { type: "RDT", count: 30 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your performance metrics and insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tests"
              value="245"
              trend="up"
              trendValue="18%"
              icon={Activity}
            />
            <StatCard
              title="Active Patients"
              value="156"
              trend="up"
              trendValue="12%"
              icon={Users}
            />
            <StatCard
              title="Avg Response Time"
              value="2.1 min"
              trend="down"
              trendValue="8%"
              icon={TrendingUp}
            />
            <StatCard
              title="This Month"
              value="71"
              trend="up"
              trendValue="22%"
              icon={Calendar}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                Monthly Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tests"
                    stroke="#1890ff"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="positive"
                    stroke="#ff4d4f"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Test Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={testTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Accuracy Rate
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                98.2%
              </h3>
              <p className="text-sm text-green-600 mt-1">
                +0.5% from last month
              </p>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Patient Satisfaction
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                4.9/5
              </h3>
              <p className="text-sm text-green-600 mt-1">Excellent rating</p>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Avg Tests/Day
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                12.5
              </h3>
              <p className="text-sm text-blue-600 mt-1">Above average</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
