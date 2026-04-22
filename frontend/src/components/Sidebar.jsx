import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  TestTube,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile, userRole } = useAuth();

  const isActive = (path) => location.pathname === path;

  // Role-specific navigation
  const getNavItems = () => {
    if (userRole === "doctor") {
      return [
        {
          name: "Dashboard",
          path: `/dashboard/${userRole}`,
          icon: LayoutDashboard,
        },
        { name: "Detection", path: "/detection", icon: TestTube },
        { name: "Patients", path: "/dashboard/doctor/patients", icon: Users },
        {
          name: "Test Results",
          path: "/dashboard/doctor/test-results",
          icon: Activity,
        },
        {
          name: "Reports",
          path: "/dashboard/doctor/reports",
          icon: FileText,
        },
      ];
    }

    if (userRole === "patient") {
      return [
        {
          name: "Dashboard",
          path: `/dashboard/${userRole}`,
          icon: LayoutDashboard,
        },
        {
          name: "My Results",
          path: "/dashboard/patient/results",
          icon: Activity,
        },
        {
          name: "My Reports",
          path: "/dashboard/patient/reports",
          icon: FileText,
        },
        {
          name: "Appointments",
          path: "/dashboard/patient/appointments",
          icon: Calendar,
        },
      ];
    }

    if (userRole === "admin") {
      return [
        {
          name: "Dashboard",
          path: `/dashboard/${userRole}`,
          icon: LayoutDashboard,
        },
        { name: "Detection", path: "/detection", icon: TestTube },
        { name: "Users", path: "/dashboard/admin/users", icon: Users },
        {
          name: "Analytics",
          path: "/dashboard/admin/analytics",
          icon: BarChart3,
        },
        { name: "System Logs", path: "/dashboard/admin/logs", icon: Activity },
      ];
    }

    return [
      {
        name: "Dashboard",
        path: `/dashboard/${userRole}`,
        icon: LayoutDashboard,
      },
    ];
  };

  const navItems = getNavItems();
  const settingsPath = `/dashboard/${userRole}/settings`;
  const profilePath = `/dashboard/${userRole}/profile`;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-panel text-gray-700 dark:text-gray-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 glass-panel border-r border-gray-200 dark:border-gray-800 flex flex-col sticky top-0 h-[90vh] lg:translate-x-0 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative fixed left-0 top-0 z-40 h-screen lg:h-[90vh]`}
      >
        <div className="p-6 flex flex-col flex-1 overflow-y-auto">
          {/* User Info - Clickable Profile */}
          <Link to={profilePath} onClick={() => setIsOpen(false)}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userRole === "doctor"
                      ? `Dr. ${profile?.name || "Doctor"}`
                      : profile?.name || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {userRole || "Guest"}
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Settings at Bottom - Sticky */}
          <div className="sticky bottom-0 pt-6 border-t border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#1b2433] backdrop-blur-xl">
            <Link to={settingsPath} onClick={() => setIsOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(settingsPath)
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </motion.div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
