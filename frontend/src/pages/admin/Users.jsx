import {
  Download,
  Edit,
  Filter,
  MoreVertical,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Sidebar from "../../components/Sidebar";

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const users = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      role: "doctor",
      status: "active",
      lastActive: "2 hours ago",
      testsCount: 245,
      joinedDate: "Jan 15, 2024",
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      email: "michael.chen@hospital.com",
      role: "doctor",
      status: "active",
      lastActive: "5 hours ago",
      testsCount: 189,
      joinedDate: "Feb 20, 2024",
    },
    {
      id: 3,
      name: "John Smith",
      email: "john.smith@email.com",
      role: "patient",
      status: "active",
      lastActive: "1 day ago",
      testsCount: 8,
      joinedDate: "Mar 10, 2024",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@email.com",
      role: "patient",
      status: "inactive",
      lastActive: "1 week ago",
      testsCount: 3,
      joinedDate: "Apr 5, 2024",
    },
    {
      id: 5,
      name: "Admin User",
      email: "admin@hospital.com",
      role: "admin",
      status: "active",
      lastActive: "Just now",
      testsCount: 0,
      joinedDate: "Jan 1, 2024",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = [
    { label: "Total Users", value: users.length, change: "+12%" },
    {
      label: "Active Doctors",
      value: users.filter((u) => u.role === "doctor" && u.status === "active")
        .length,
      change: "+5%",
    },
    {
      label: "Active Patients",
      value: users.filter((u) => u.role === "patient" && u.status === "active")
        .length,
      change: "+18%",
    },
    { label: "New This Month", value: 24, change: "+32%" },
  ];

  const getRoleBadgeVariant = (role) => {
    const variants = {
      doctor: "primary",
      patient: "success",
      admin: "error",
    };
    return variants[role] || "default";
  };

  const getStatusBadgeVariant = (status) => {
    return status === "active" ? "success" : "default";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all users, roles, and permissions
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={stat.label}>
                <Card>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {stat.label}
                      </p>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stat.value}
                      </h3>
                    </div>
                    <Badge variant="success">{stat.change}</Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
                <div className="flex-1">
                  <Input
                    icon={Search}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none transition-all duration-300"
                  >
                    <option value="all">All Roles</option>
                    <option value="doctor">Doctors</option>
                    <option value="patient">Patients</option>
                    <option value="admin">Admins</option>
                  </select>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="primary" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add User
                </Button>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      User
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Role
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Status
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Last Active
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Tests
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Joined
                    </th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {user.lastActive}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-semibold">
                        {user.testsCount}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {user.joinedDate}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover:scale-110 active:scale-90">
                            <Edit className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover:scale-110 active:scale-90">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover:scale-110 active:scale-90">
                            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
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
export default Users;
