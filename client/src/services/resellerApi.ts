import axios from "axios";

const RESELLER_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, '');

const resellerApi = axios.create({
    baseURL: `${RESELLER_API_URL}/api/v1`,
    headers: { "Content-Type": "application/json" },
});

resellerApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("resellerToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

resellerApi.interceptors.response.use(
    (r) => {
        const nextToken = r.headers['x-next-token'];
        if (nextToken) {
            localStorage.setItem("resellerToken", nextToken);
        }
        return r;
    },
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("resellerToken");
            localStorage.removeItem("resellerUser");
            window.location.href = "/reseller/login";
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────
export const resellerLogin = (email: string, password: string) =>
    resellerApi.post("/auth/login", { email, password });

// ── Orders ────────────────────────────────────────
export const fetchResellerOrderStats = () =>
    resellerApi.get("/orders/stats");

export const fetchResellerOrders = (params: Record<string, string> = {}) =>
    resellerApi.get("/orders", { params });
export const fetchResellerVms = (params: Record<string, string> = {}) =>
    resellerApi.get("/vms", { params });
export const reorderResellerOrder = (id: string) =>
    resellerApi.post(`/orders/${id}/reorder`);
export const renewResellerOrder = (id: string) =>
    resellerApi.post(`/orders/${id}/renew`);
export const createResellerOrder = (data: Record<string, unknown>) =>
    resellerApi.post("/orders", data);
export const fetchResellerOrder = (id: number) =>
    resellerApi.get(`/orders/${id}`);

// ── Products ──────────────────────────────────────
export const fetchResellerProducts = (params?: Record<string, string>) =>
    resellerApi.get("/products", { params });
export const fetchResellerProductCategories = () =>
    resellerApi.get("/product_categories");

// ── Tickets ───────────────────────────────────────
export const fetchResellerTickets = () =>
    resellerApi.get("/tickets");
export const createResellerTicket = (data: Record<string, unknown>) =>
    resellerApi.post("/tickets", data);
export const replyResellerTicket = (id: number, message: string) =>
    resellerApi.post(`/tickets/${id}/reply`, { message });

// ── Billing ───────────────────────────────────────
export const fetchResellerBalance = () =>
    resellerApi.get("/billing/balance");
export const fetchResellerTransactions = () =>
    resellerApi.get("/billing/transactions");
export const transferResellerEarnings = (amount: number) =>
    resellerApi.post("/billing/transfer_earnings", { amount });
export const requestResellerPayout = (data: { amount: number, payment_method: string, payment_details: Record<string, unknown> }) =>
    resellerApi.post("/billing/request_payout", data);
export const createResellerDeposit = (data: { amount: number, gateway: string, currency?: string }) => {
    // We assume the user profile id maps to the reseller in normal setup, but the backend uses `current_reseller`.
    // The endpoint acts on `id` in resourceful ways, usually /resellers/:id/deposit.
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    return resellerApi.post(`/resellers/${user.id}/deposit`, data);
};

// ── Reseller Profile ──────────────────────────────
export const fetchResellerProfile = () =>
    resellerApi.get("/resellers");
export const updateResellerProfile = (id: number, data: Record<string, unknown> | FormData) => {
    if (data instanceof FormData) {
        return resellerApi.patch(`/resellers/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
    return resellerApi.patch(`/resellers/${id}`, data);
};
export const rotateResellerApiKey = (id: number) =>
    resellerApi.post(`/resellers/${id}/rotate_dedicated_api_key`);


// ---- Notifications ----
export const fetchResellerNotifications = () => resellerApi.get("/notifications");
export const markResellerNotificationsAsRead = () => resellerApi.post("/notifications/mark_as_read");

// ── Support Chat ──────────────────────────────────
export const fetchSupportChat = () =>
    resellerApi.get("/support_chats");
export const sendSupportMessage = (message: string) =>
    resellerApi.post("/support_chats/messages", { message });

// ── Order Actions ─────────────────────────────────
export const cancelResellerOrder = (id: string) =>
    resellerApi.post(`/orders/${id}/cancel`);
export const fetchOrderCredentials = (id: string) =>
    resellerApi.get(`/orders/${id}/credentials`);

// ── Webhook Endpoints ─────────────────────────────
export const fetchResellerWebhooks = () =>
    resellerApi.get("/webhook_endpoints");
export const createResellerWebhook = (data: { url: string; description?: string; events?: string[] }) =>
    resellerApi.post("/webhook_endpoints", { webhook_endpoint: data });
export const updateResellerWebhook = (id: string, data: { url?: string; description?: string; events?: string[] }) =>
    resellerApi.patch(`/webhook_endpoints/${id}`, { webhook_endpoint: data });
export const deleteResellerWebhook = (id: string) =>
    resellerApi.delete(`/webhook_endpoints/${id}`);
export const verifyResellerWebhook = (id: string) =>
    resellerApi.post(`/webhook_endpoints/${id}/verify`);

export default resellerApi;
