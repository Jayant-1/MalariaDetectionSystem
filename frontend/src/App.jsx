import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import AdminDashboard from "./pages/AdminDashboard";
import DetectionPage from "./pages/DetectionPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PatientDashboard from "./pages/PatientDashboard";
import PublicReportPage from "./pages/PublicReportPage";
import RegisterPage from "./pages/RegisterPage";

// Admin Pages
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminSystemLogs from "./pages/admin/SystemLogs";
import AdminUsers from "./pages/admin/Users";

// Doctor Pages
import DoctorAddReport from "./pages/doctor/AddReport";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorReports from "./pages/doctor/Reports";
import DoctorSettings from "./pages/doctor/Settings";
import DoctorTestResults from "./pages/doctor/TestResults";

// Patient Pages
import PatientAppointments from "./pages/patient/Appointments";
import PatientMyReports from "./pages/patient/MyReports";
import PatientMyResults from "./pages/patient/MyResults";
import PatientProfile from "./pages/patient/Profile";
import PatientSettings from "./pages/patient/Settings";

// Layout
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/public-reports" element={<PublicReportPage />} />
                <Route path="/view-reports" element={<PublicReportPage />} />

                {/* Main Dashboards */}
                <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
                <Route
                  path="/dashboard/patient"
                  element={<PatientDashboard />}
                />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />

                {/* Admin Routes */}
                <Route path="/dashboard/admin/users" element={<AdminUsers />} />
                <Route
                  path="/dashboard/admin/analytics"
                  element={<AdminAnalytics />}
                />
                <Route
                  path="/dashboard/admin/logs"
                  element={<AdminSystemLogs />}
                />
                <Route
                  path="/dashboard/admin/settings"
                  element={<AdminSettings />}
                />

                {/* Doctor Routes */}
                <Route
                  path="/dashboard/doctor/patients"
                  element={<DoctorPatients />}
                />
                <Route
                  path="/dashboard/doctor/test-results"
                  element={<DoctorTestResults />}
                />
                <Route
                  path="/dashboard/doctor/reports"
                  element={<DoctorReports />}
                />
                <Route
                  path="/dashboard/doctor/add-report"
                  element={<DoctorAddReport />}
                />
                <Route path="/doctor/reports" element={<DoctorReports />} />
                <Route
                  path="/doctor/add-report"
                  element={<DoctorAddReport />}
                />
                <Route path="/doctor/detection" element={<DetectionPage />} />
                <Route
                  path="/dashboard/doctor/profile"
                  element={<DoctorProfile />}
                />
                <Route
                  path="/dashboard/doctor/settings"
                  element={<DoctorSettings />}
                />

                {/* Patient Routes */}
                <Route
                  path="/dashboard/patient/results"
                  element={<PatientMyResults />}
                />
                <Route
                  path="/dashboard/patient/reports"
                  element={<PatientMyReports />}
                />
                <Route
                  path="/dashboard/patient/appointments"
                  element={<PatientAppointments />}
                />
                <Route
                  path="/dashboard/patient/profile"
                  element={<PatientProfile />}
                />
                <Route
                  path="/dashboard/patient/settings"
                  element={<PatientSettings />}
                />

                <Route path="/detection" element={<DetectionPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
