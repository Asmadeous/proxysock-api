
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
// import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import {
  Lock,
  Key,
  Check,
  AlertCircle,
  Calendar,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePassword() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name: string, value: string, data: typeof formData = formData) => {
    switch (name) {
      case "currentPassword":
        if (!value.trim()) return "Current password is required";
        break;
      case "newPassword":
        if (!value.trim()) return "New password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        break;
      case "confirmPassword":
        if (value !== data.newPassword) return "Passwords do not match";
        break;
      default:
        return "";
    }
    return "";
  };

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      setErrors({
        ...errors,
        [name]: validateField(name, value, newData),
        ...(name === "newPassword" ? { confirmPassword: validateField("confirmPassword", prev.confirmPassword, newData) } : {}),
      });
      return newData;
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = Object.entries(formData).reduce(
      (acc: { [key: string]: string }, [key, value]) => {
        const error = validateField(key, value, formData);
        if (error) acc[key] = error;
        return acc;
      },
      {}
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsLoading(true);

    try {
      // Stubbed - Supabase removed
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.error("Password change is currently disabled. Please contact support.");

      /*
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      */
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Icon */}
            <div className="shrink-0">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h1 className="text-3xl font-bold">Change Password</h1>
              <p className="text-muted-foreground">
                Secure your account with a strong new password
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Password Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Password Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                      className={`pl-9 ${errors.currentPassword ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.currentPassword && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.currentPassword}</span>
                    </div>
                  )}
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className={`pl-9 ${errors.newPassword ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.newPassword && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.newPassword}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className={`pl-9 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {isLoading ? "Updating..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Information Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Account Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(user?.created_at || "").toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
