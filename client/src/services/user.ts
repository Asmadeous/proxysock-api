<<<<<<< HEAD
import railsApi from "../lib/railsApi";

// Fetch the current user's role
export const fetchUserRole = async (): Promise<string | null> => {
  try {
    const response = await railsApi.get<{ user: { role?: string } }>("/auth/me");
    return response.data.user?.role ?? "user";
  } catch (error) {
    console.error("Error fetching user role:", error);
=======

// Supabase completely removed. Mock object to prevent compile/runtime crash.
const supabase: any = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    refreshSession: async () => ({ data: { session: null }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: async () => ({ data: [], error: null }),
        not: () => ({ order: async () => ({ data: [], error: null }) })
      }),
      order: async () => ({ data: [], error: null }),
      not: () => ({ order: async () => ({ data: [], error: null }) }),
      neq: () => ({ order: async () => ({ data: [], error: null }) })
    }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) })
  }),
  functions: { invoke: async () => ({ data: null, error: null }) },
  channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  removeChannel: async () => {}
};
// userService.js

const EDGE_FUNCTION_URL = "https://xknakbxmpznclriiauim.supabase.co/functions/v1/fetch-users";

// Fetch the current user's role from profiles table
export const fetchUserRole = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error("User not authenticated");
    }
    const userId = session.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data?.role ?? null;
  } catch (error) {
    console.error("Error fetching user role:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    return null;
  }
};

// Fetch all users (admin-only)
<<<<<<< HEAD
export const fetchUsers = async (): Promise<any[]> => {
  try {
    const response = await railsApi.get("/admin/users");
    return response.data.users || [];
  } catch (error) {
    console.error("Error fetching users:", error);
=======
export const fetchUsers = async () => {
  try {
    // First, check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error("User not authenticated");
    }

    // Then check if user is admin
    const role = await fetchUserRole();
    if (role !== "admin") {
      throw new Error("Insufficient permissions: Admin role required");
    }

    // Ensure we have a valid access token
    if (!session.access_token) {
      throw new Error("No access token available");
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error("Error fetching users:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    throw error;
  }
};

// Check if user is authenticated
<<<<<<< HEAD
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("authToken");
=======
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
};