import railsApi, { storeToken, clearToken, getStoredToken } from "../lib/railsApi";

export interface User {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url?: string | null;
    status: string;
    country?: string;
    city?: string;
    created_at?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export interface MeResponse {
    user: User;
    wallet_balance: number;
}

// Login with email and password
export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await railsApi.post<AuthResponse>("/auth/login", {
        user: { email, password },
    });

    if (response.data.token) {
        storeToken(response.data.token);
    }

    return response.data;
};

// Register new user
export const register = async (userData: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
    username: string;
    avatar?: File;
}): Promise<AuthResponse> => {

    const formData = new FormData();
    formData.append("user[email]", userData.email);
    formData.append("user[password]", userData.password);
    formData.append("user[password_confirmation]", userData.password_confirmation);
    formData.append("user[username]", userData.username);

    if (userData.first_name) formData.append("user[first_name]", userData.first_name);
    if (userData.last_name) formData.append("user[last_name]", userData.last_name);
    if (userData.avatar) formData.append("user[avatar]", userData.avatar);

    const response = await railsApi.post<AuthResponse>("/auth/register", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    if (response.data.token) {
        storeToken(response.data.token);
    }

    return response.data;
};

// Get current user (validate token)
export const getCurrentUser = async (): Promise<MeResponse | null> => {
    const token = getStoredToken();
    if (!token) return null;

    try {
        const response = await railsApi.get<MeResponse>("/auth/me");
        return response.data;
    } catch {
        return null;
    }
};

// Refresh token
export const refreshToken = async (): Promise<AuthResponse | null> => {
    try {
        const response = await railsApi.post<AuthResponse>("/auth/refresh");

        if (response.data.token) {
            storeToken(response.data.token);
        }

        return response.data;
    } catch {
        clearToken();
        return null;
    }
};

// Logout
export const logout = async (): Promise<void> => {
    try {
        await railsApi.delete("/auth/logout");
    } catch {
        // Ignore errors on logout
    } finally {
        clearToken();
    }
};

// OAuth login - redirect to Rails OAuth endpoint
export const signInWithOAuth = (provider: "google" | "twitter"): void => {
    const baseUrl = import.meta.env.VITE_RAILS_API_URL || "http://localhost:3000/web/api";
    window.location.href = `${baseUrl}/auth/${provider}`;
};

// Verify email
export const verifyEmail = async (token: string): Promise<AuthResponse> => {
    const response = await railsApi.post<AuthResponse>("/auth/verify_email", { token });
    if (response.data.token) {
        storeToken(response.data.token);
    }
    return response.data;
};

// Forgot password
export const forgotPassword = async (email: string): Promise<void> => {
    await railsApi.post("/auth/forgot_password", { email });
};

// Reset password
export const resetPassword = async (password: string, password_confirmation: string, token: string): Promise<void> => {
    await railsApi.post("/auth/reset_password", { password, password_confirmation, token });
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!getStoredToken();
};
