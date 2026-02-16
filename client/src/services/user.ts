import railsApi from "../lib/railsApi";

// Fetch the current user's role
export const fetchUserRole = async (): Promise<string | null> => {
  try {
    const response = await railsApi.get<{ user: { role?: string } }>("/auth/me");
    return response.data.user?.role ?? "user";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

// Fetch all users (admin-only)
export const fetchUsers = async (): Promise<any[]> => {
  try {
    const response = await railsApi.get("/admin/users");
    return response.data.users || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("authToken");
};