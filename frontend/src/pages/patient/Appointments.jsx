import { Calendar, Clock, MapPin, Plus, User, Video } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { appointmentService, patientService } from "../../services";

const Appointments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    nextDate: "N/A",
  });

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Get patient record
      const { data: patients } = await patientService.getAllPatients();
      const patient = patients?.find((p) => p.user_id === user.id);

      if (!patient) {
        setLoading(false);
        return;
      }

      // Get all appointments
      const { data: appointments } =
        await appointmentService.getAllAppointments({ patientId: patient.id });

      if (appointments) {
        const now = new Date();

        // Split into upcoming and past
        const upcoming = appointments
          .filter((apt) => new Date(apt.appointment_date) >= now)
          .map((apt) => ({
            id: apt.id,
            doctor: apt.doctors?.full_name || "Unknown Doctor",
            specialty: "Infectious Diseases", // Add specialty to DB if needed
            date: new Date(apt.appointment_date).toLocaleDateString(),
            time: new Date(apt.appointment_date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: apt.appointment_type?.includes("video")
              ? "Video Call"
              : "In-Person",
            hospital: apt.notes || "Hospital",
            status:
              apt.status.charAt(0).toUpperCase() + apt.status.slice(1) ||
              "Scheduled",
          }));

        const past = appointments
          .filter((apt) => new Date(apt.appointment_date) < now)
          .map((apt) => ({
            id: apt.id,
            doctor: apt.doctors?.full_name || "Unknown Doctor",
            specialty: "Infectious Diseases",
            date: new Date(apt.appointment_date).toLocaleDateString(),
            time: new Date(apt.appointment_date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: apt.appointment_type?.includes("video")
              ? "Video Call"
              : "In-Person",
            hospital: apt.notes || "Hospital",
            status: "Completed",
          }));

        setUpcomingAppointments(upcoming);
        setPastAppointments(past);

        // Calculate stats
        const nextApt = upcoming[0];
        setStats({
          upcoming: upcoming.length,
          completed: past.length,
          nextDate: nextApt
            ? new Date(nextApt.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "None",
        });
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const appointments =
    activeTab === "upcoming" ? upcomingAppointments : pastAppointments;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Appointments
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your medical appointments
              </p>
            </div>
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Upcoming
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.upcoming}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Completed
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.completed}
              </h3>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Next Appointment
              </p>
              <h3 className="text-xl font-bold text-primary-600 mt-2">
                {stats.nextDate}
              </h3>
            </Card>
          </div>

          <Card>
            <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`pb-4 px-4 font-semibold transition-colors relative ${
                  activeTab === "upcoming"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Upcoming
                {activeTab === "upcoming" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`pb-4 px-4 font-semibold transition-colors relative ${
                  activeTab === "past"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Past
                {activeTab === "past" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                        {appointment.doctor.split(" ")[1].charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {appointment.doctor}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {appointment.specialty}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{appointment.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            {appointment.type === "Video Call" ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            <span className="text-sm">
                              {appointment.hospital}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <Badge
                        variant={
                          appointment.status === "Confirmed"
                            ? "success"
                            : "default"
                        }
                      >
                        {appointment.status}
                      </Badge>
                      {activeTab === "upcoming" && (
                        <div className="flex gap-2">
                          {appointment.type === "Video Call" && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              Join Call
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      )}
                      {activeTab === "past" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
