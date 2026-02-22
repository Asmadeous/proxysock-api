import axios from "axios";
import { toast } from "react-hot-toast";

// Use just the host as baseURL — different route prefixes (/api/v1, /web/api) are specified per-call
const API_HOST = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, '');

const api = axios.create({
  baseURL: API_HOST,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || "An error occurred";
    // We handle toasts manually in login/register components so we don't spam here for auth failures
    if (error.response?.status !== 401 && error.response?.status !== 422) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const loginUser = (data: any) => api.post("/web/api/auth/login", { user: data });
export const registerUser = (data: any) => api.post("/web/api/auth/register", { user: data });
export const checkUsername = (username: string) => api.get("/web/api/auth/check_username", { params: { username } });
export const getMe = () => api.get("/api/v1/auth/me");

// Other Services
export const fetchBalance = () => api.get("/web/api/billing/balance");
export const fetchTransactions = () => api.get("/web/api/billing/transactions");
export const fetchNotifications = () => api.get("/web/api/notifications");
export const markNotificationsAsRead = () => api.post("/web/api/notifications/mark_as_read");

export const fetchTickets = (params?: Record<string, string>) => api.get("/web/api/tickets", { params });
export const createTicket = (data: Record<string, unknown>) => api.post("/web/api/tickets", { ticket: data });
export const replyTicket = (id: number, body: string) => api.post(`/web/api/tickets/${id}/reply`, { body });

export const fetchUserSupportChat = () => api.get("/web/api/support_chats");
export const sendUserSupportMessage = (message: string) => api.post("/web/api/support_chats/messages", { message });
export default api;