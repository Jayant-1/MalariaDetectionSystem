import { Bell, Eye, Lock, Save } from "lucide-react";
import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Sidebar from "../../components/Sidebar";

const Settings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    testResultAlerts: true,
    appointmentReminders: true,
    weeklyReports: false,
    twoFactorAuth: false,
  });

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Configure your notification preferences
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "emailNotifications",
                    title: "Email Notifications",
                    description: "Receive notifications via email",
                  },
                  {
                    key: "smsNotifications",
                    title: "SMS Notifications",
                    description: "Receive notifications via SMS",
                  },
                  {
                    key: "testResultAlerts",
                    title: "Test Result Alerts",
                    description: "Get notified when test results are ready",
                  },
                  {
                    key: "appointmentReminders",
                    title: "Appointment Reminders",
                    description: "Receive reminders for upcoming appointments",
                  },
                  {
                    key: "weeklyReports",
                    title: "Weekly Reports",
                    description: "Receive weekly performance reports",
                  },
                ].map((item, index) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between py-4 ${
                      index !== 0
                        ? "border-t border-gray-200 dark:border-gray-700"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Security */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Security
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage your security settings
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add an extra layer of security
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          twoFactorAuth: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <Input
                      icon={Lock}
                      type="password"
                      placeholder="Current Password"
                    />
                    <Input
                      icon={Lock}
                      type="password"
                      placeholder="New Password"
                    />
                    <Input
                      icon={Lock}
                      type="password"
                      placeholder="Confirm New Password"
                    />
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline">Cancel</Button>
              <Button
                variant="primary"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
