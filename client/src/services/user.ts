import api from "./api";

// Fetch the current user's role via Rails API
export const fetchUserRole = async (): Promise<string | null> => {
  try {
    const { data } = await api.get("/web/api/auth/me");
    return data?.user?.role ?? null;
  } catch (error) {
    console.error("Error fetching user role:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
};

// Fetch all users (admin-only) via Rails API
export const fetchUsers = async () => {
  try {
    const role = await fetchUserRole();
    if (role !== "admin") {
      throw new Error("Insufficient permissions: Admin role required");
    }
    const { data } = await api.get("/api/v1/users");
    return data.users || data || [];
  } catch (error) {
    console.error("Error fetching users:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// Check if user is authenticated via stored token
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("authToken");
};