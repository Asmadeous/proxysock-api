import axios, { type AxiosInstance, type AxiosError } from "axios";
import { toast } from "sonner";

// Rails API base URL (fall back to VITE_API_URL base + /web/api if VITE_RAILS_API_URL absent)
const _base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '') : "http://localhost:3000";
const RAILS_API_URL = import.meta.env.VITE_RAILS_API_URL || `${_base}/web/api`;

// Token storage keys
const TOKEN_KEY = "authToken";
const LAST_ACTIVITY_KEY = "lastActivity";

// Create axios instance for Rails API
const railsApi: AxiosInstance = axios.create({
    baseURL: RAILS_API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    withCredentials: true,
});

// Token management
export const getStoredToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const storeToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

export const clearToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
};

export const updateLastActivity = (): void => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

export const isSessionExpired = (maxInactiveMs: number = 20 * 60 * 1000): boolean => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) return true;
    return Date.now() - parseInt(lastActivity) > maxInactiveMs;
};

// Request interceptor - add auth token
railsApi.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
railsApi.interceptors.response.use(
    (response) => {
        updateLastActivity();
        return response;
    },
    (error: AxiosError<{ error?: string; errors?: string[] }>) => {
        const status = error.response?.status;
        const message =
            error.response?.data?.error ||
            error.response?.data?.errors?.join(", ") ||
            "An error occurred";

        // Handle authentication errors
        if (status === 401) {
            clearToken();
            // Don't show toast for 401 on /auth/me (initial load)
            if (!error.config?.url?.includes("/auth/me")) {
                toast.error("Session expired. Please log in again.");
            }
        } else if (status === 422) {
            toast.error(message);
        } else if (status && status >= 500) {
            toast.error("Server error. Please try again later.");
        } else if (message !== "An error occurred") {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default railsApi;
