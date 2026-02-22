import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function MyAccount() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api/users/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Update failed");

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Account Settings</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-500 hover:text-blue-400">
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
              />
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                  Save Changes
                </button>
              </>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Subscription Status</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Next Billing Date</span>
                <span className="text-white">
                  {user?.nextBillingDate
                    ? new Date(user.nextBillingDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
