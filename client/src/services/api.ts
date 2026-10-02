import axios from "axios";
import { toast } from "sonner";

// Use just the host as baseURL — different route prefixes (/api/v1, /web/api) are specified per-call
const API_HOST = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, '');

const api = axios.create({
  baseURL: API_HOST,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

export const formatImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${API_HOST}${url}`;
  // If it's a raw filename that doesn't start with / or http, it's likely broken historical data
  return undefined;
};

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
  (response) => {
    // Dynamically use 'reseller_selling_price' instead of retail 'price' if rendering inside the reseller dashboard
    if (
      window.location.pathname.startsWith('/reseller') &&
      response.config.url?.includes('/web/api/products') &&
      response.data &&
      Array.isArray(response.data.products)
    ) {
      const resellerUser = JSON.parse(localStorage.getItem("resellerUser") || "{}");
      const multiplier = Number(resellerUser.price_multiplier) || 1.0;

      response.data.products = response.data.products.map((p: any) => {
        // Use the first active pricing that has a reseller price, or fall back to selling price
        const pricing = p.pricings?.find((pr: any) => pr.reseller_selling_price > 0) || p.pricings?.[0];
        
        if (pricing) {
          const basePrice = Number(pricing.reseller_selling_price || pricing.selling_price || 0);
          p.price = (basePrice * multiplier).toFixed(2);
        }
        return p;
      });
    }
    return response;
  },
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
export const registerUser = (data: any) => {
  if (data instanceof FormData) {
    return api.post("/web/api/auth/register", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/web/api/auth/register", { user: data });
};
export const checkUsername = (username: string) => api.get("/web/api/auth/check_username", { params: { username } });
export const getMe = () => api.get("/api/v1/auth/me");

// Other Services
export const fetchBalance = () => api.get("/web/api/billing/balance");
export const fetchTransactions = () => api.get("/web/api/billing/transactions");
export const verifyAndSyncDeposit = (depositId: string) => api.post("/web/api/billing/verify_and_sync", { deposit_id: depositId });
export const fetchNotifications = () => api.get("/web/api/notifications");
export const markNotificationsAsRead = () => api.post("/web/api/notifications/mark_as_read");
export const fetchUserSummaryCounts = () => api.get("/web/api/monitoring/summary_counts").then(res => res.data);

export const fetchTickets = (params?: Record<string, string>) => api.get("/web/api/tickets", { params });
export const createTicket = (data: Record<string, unknown>) => api.post("/web/api/tickets", { ticket: data });
export const replyTicket = (id: number, body: string) => api.post(`/web/api/tickets/${id}/reply`, { body });



export const fetchUserSupportChat = () => api.get("/web/api/support_chats");
export const sendUserSupportMessage = (message: string) => api.post("/web/api/support_chats/messages", { message });



// VM Management Services
export const fetchVms = (params?: Record<string, string>) => api.get("/web/api/vms", { params });
export const fetchVmStatus = (id: string | number) => api.get(`/web/api/vms/${id}/status`);
export const startVm = (id: string | number) => api.post(`/web/api/vms/${id}/start`);
export const stopVm = (id: string | number) => api.post(`/web/api/vms/${id}/stop`);
export const rebootVm = (id: string | number) => api.post(`/web/api/vms/${id}/reboot`);
export const deleteVm = (id: string | number) => api.delete(`/web/api/vms/${id}`);

// Credential Management Services
export const changeVmPassword = (id: string | number, password: string) =>
  api.post(`/web/api/credential_changes/vm/${id}/password`, { password });

export const updateProxyCredentials = (id: string | number, data: { username?: string, password?: string }) =>
  api.post(`/web/api/orders/${id}/update_credentials`, data);

export const refundOrder = (id: string | number) =>
  api.post(`/web/api/orders/${id}/refund`);

export const rotateProxyIp = (id: string | number) =>
  api.post(`/web/api/orders/${id}/rotate_ip`);

export const changeProxyProtocol = (id: string | number, protocol: string) =>
  api.post(`/web/api/orders/${id}/change_protocol`, { protocol });

export const restartVpn = (id: string | number) =>
  api.post(`/web/api/orders/${id}/restart_vpn`);

export const updateMobileRotation = (id: string | number, status: "on" | "off") =>
  api.post(`/web/api/orders/${id}/rotation`, { status });

export const whitelistAdd = (id: string | number, ip: string, description?: string) =>
  api.post(`/web/api/orders/${id}/whitelist`, { ip, description });

export const whitelistDelete = (id: string | number, ip: string) =>
  api.delete(`/web/api/orders/${id}/whitelist`, { data: { ip } });

export default api;