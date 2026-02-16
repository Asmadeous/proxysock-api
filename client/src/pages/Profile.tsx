import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import railsApi from "@/lib/railsApi";
import { toast } from "sonner";
import {
  User,
  Calendar,
  Globe,
  MapPin,
  Pencil,
  Check,
  X,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    country: user?.country || "",
    city: user?.city || "",
  });
  const [errors, setErrors] = useState<{ username?: string; country?: string; city?: string }>({});

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        break;
      case "country":
      case "city":
        if (!value.trim()) return "This field is required";
        break;
      default:
        return "";
    }
    return "";
  };

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = Object.entries(formData).reduce(
      (acc: { [key: string]: string }, [key, value]) => {
        const error = validateField(key, value);
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

    try {
      await railsApi.put("/auth/me", {
        user: {
          username: formData.username,
          country: formData.country,
          city: formData.city,
        },
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Ideally refresh user data here
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h1 className="text-3xl font-bold">{formData.username || "User"}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              {(formData.country || formData.city) && (
                <div className="flex items-center justify-center sm:justify-start gap-3 text-sm">
                  {formData.country && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.country}</span>
                    </div>
                  )}
                  {formData.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.city}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Edit Button */}
            <div className="shrink-0">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                className="gap-2"
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your username"
                    className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.username}</span>
                    </div>
                  )}
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Enter your country"
                        className={`pl-9 ${errors.country ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.country && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.country}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Enter your city"
                        className={`pl-9 ${errors.city ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.city && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
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
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Status</p>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}