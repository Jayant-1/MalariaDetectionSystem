import {
  Award,
  Briefcase,
  Camera,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Sidebar from "../../components/Sidebar";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    phone: "+1 234-567-8900",
    specialty: "Infectious Diseases",
    license: "MD-123456",
    hospital: "City General Hospital",
    address: "123 Medical Center Dr, City, State 12345",
    bio: "Experienced physician specializing in infectious diseases with focus on malaria diagnosis and treatment.",
    yearsOfExperience: "15",
  });

  const handleSave = () => {
    alert("Profile updated successfully!");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your personal information
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture Card */}
            <Card className="lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-500 to-teal-500 flex items-center justify-center text-white text-5xl font-bold mb-4">
                  {profile.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {profile.specialty}
                </p>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                >
                  <Camera className="w-4 h-4" />
                  Change Photo
                </Button>

                <div className="w-full mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-primary-600" />
                    <div className="text-left">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        License
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {profile.license}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-primary-600" />
                    <div className="text-left">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Experience
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {profile.yearsOfExperience} years
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Information */}
            <Card className="lg:col-span-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Personal Information
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <Input
                      icon={Mail}
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <Input
                      icon={Phone}
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Specialty
                    </label>
                    <Input
                      value={profile.specialty}
                      onChange={(e) =>
                        setProfile({ ...profile, specialty: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Hospital/Clinic
                    </label>
                    <Input
                      value={profile.hospital}
                      onChange={(e) =>
                        setProfile({ ...profile, hospital: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      value={profile.yearsOfExperience}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          yearsOfExperience: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <Input
                    icon={MapPin}
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows="4"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none transition-all duration-300 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
