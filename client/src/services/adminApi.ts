import axios from "axios";

const ADMIN_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, '');

const adminApi = axios.create({
    baseURL: `${ADMIN_API_URL}/admin/api`,
    headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

adminApi.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/admin/login";
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
    adminApi.post("/auth/login", { email, password });

// ── Users ─────────────────────────────────────────
export const fetchAdminUsers = (params?: Record<string, string>) =>
    adminApi.get("/users", { params });
export const fetchAdminUser = (id: number) =>
    adminApi.get(`/users/${id}`);
export const updateAdminUser = (id: number, data: Record<string, unknown>) =>
    adminApi.patch(`/users/${id}`, data);
export const deleteAdminUser = (id: number) =>
    adminApi.delete(`/users/${id}`);
export const onboardUser = (id: number) =>
    adminApi.post(`/users/${id}/onboard`);
export const impersonateUser = (id: number) =>
    adminApi.post(`/users/${id}/impersonate`);

// ── Employees ─────────────────────────────────────
export const fetchEmployees = (params?: Record<string, string>) =>
    adminApi.get("/employees", { params });
export const fetchEmployee = (id: number) =>
    adminApi.get(`/employees/${id}`);
export const createEmployee = (data: Record<string, unknown>) =>
    adminApi.post("/employees", data);
export const updateEmployee = (id: number, data: Record<string, unknown>) =>
    adminApi.patch(`/employees/${id}`, data);
export const deleteEmployee = (id: number) =>
    adminApi.delete(`/employees/${id}`);
export const assignTickets = (id: number, ticketIds: number[]) =>
    adminApi.post(`/employees/${id}/assign`, { ticket_ids: ticketIds });

// ── Products ───────────────────────────────────────
export const fetchAdminProducts = () => adminApi.get("/products");
export const fetchAdminProduct = (id: string | number) => adminApi.get(`/products/${id}`);
export const createAdminProduct = (data: Record<string, unknown>) => adminApi.post("/products", { product: data });
export const updateAdminProduct = (id: string | number, data: Record<string, unknown>) => adminApi.patch(`/products/${id}`, { product: data });
export const deleteAdminProduct = (id: string | number) => adminApi.delete(`/products/${id}`);
export const syncInhouseProducts = () => adminApi.post("/products/sync_inhouse");
export const syncExternalProducts = () => adminApi.post("/products/sync_external");

// ── Resellers ─────────────────────────────────────
export const fetchResellers = (params?: Record<string, string>) =>
    adminApi.get("/resellers", { params });
export const fetchReseller = (id: string | number) =>
    adminApi.get(`/resellers/${id}`);
export const fetchResellerDetail = (id: string | number) =>
    adminApi.get(`/resellers/${id}`);
export const createReseller = (data: Record<string, unknown>) =>
    adminApi.post("/resellers", data);
export const updateReseller = (id: string | number, data: Record<string, unknown>) =>
    adminApi.patch(`/resellers/${id}`, data);
export const deleteReseller = (id: string | number) =>
    adminApi.delete(`/resellers/${id}`);
export const onboardReseller = (id: string | number) =>
    adminApi.post(`/resellers/${id}/onboard`);
export const configureReseller = (id: string | number, data: Record<string, unknown>) =>
    adminApi.patch(`/resellers/${id}/configure`, data);

// ── Orders ────────────────────────────────────────
export const fetchAdminOrders = (params?: Record<string, string>) =>
    adminApi.get("/orders", { params });
export const fetchAdminOrder = (id: number) =>
    adminApi.get(`/orders/${id}`);
export const refundOrder = (id: number) =>
    adminApi.post(`/orders/${id}/refund`);
export const rescueOrder = (id: number) =>
    adminApi.post(`/orders/${id}/rescue`);

// ── Affiliates ────────────────────────────────────
export const fetchAffiliates = (params?: Record<string, string>) =>
    adminApi.get("/affiliates", { params });
export const fetchAffiliate = (id: number) =>
    adminApi.get(`/affiliates/${id}`);
export const deleteAffiliate = (id: number) =>
    adminApi.delete(`/affiliates/${id}`);
export const configureAffiliate = (id: number, data: Record<string, unknown>) =>
    adminApi.patch(`/affiliates/${id}/configure`, data);

// ── Affiliate Payouts ─────────────────────────────
export const fetchAffiliatePayouts = (params?: Record<string, string>) =>
    adminApi.get("/affiliate_payouts", { params });
export const processAffiliatePayout = (id: number) =>
    adminApi.patch(`/affiliate_payouts/${id}/process_payout`);

// ── Blog Posts ────────────────────────────────────
export const fetchAdminBlogPosts = (params?: Record<string, string>) =>
    adminApi.get("/blog_posts", { params });
export const fetchAdminBlogPost = (slug: string) =>
    adminApi.get(`/blog_posts/${slug}`);
export const createBlogPost = (data: Record<string, unknown>) =>
    adminApi.post("/blog_posts", data);
export const updateBlogPost = (slug: string, data: Record<string, unknown>) =>
    adminApi.patch(`/blog_posts/${slug}`, data);
export const deleteBlogPost = (slug: string) =>
    adminApi.delete(`/blog_posts/${slug}`);
export const publishBlogPost = (slug: string) =>
    adminApi.patch(`/blog_posts/${slug}/publish`);
export const unpublishBlogPost = (slug: string) =>
    adminApi.patch(`/blog_posts/${slug}/unpublish`);

// --- Notifications ---
export const fetchAdminNotifications = () => adminApi.get("/notifications");
export const markAdminNotificationsAsRead = () => adminApi.post("/notifications/mark_as_read");

// ── Tickets ───────────────────────────────────────
export const fetchAdminTickets = (params?: Record<string, string>) =>
    adminApi.get("/tickets", { params });
export const fetchAdminTicket = (id: number) =>
    adminApi.get(`/tickets/${id}`);
export const replyToTicket = (id: number, message: string) =>
    adminApi.post(`/tickets/${id}/reply`, { message });
export const rescueTicketOrder = (id: number) =>
    adminApi.post(`/tickets/${id}/rescue_order`);

// ── Analytics ─────────────────────────────────────
export const fetchDashboardAnalytics = (params?: Record<string, string>) =>
    adminApi.get("/analytics/dashboard", { params });
export const fetchTrafficAnalytics = (params?: Record<string, string>) =>
    adminApi.get("/analytics/traffic", { params });
export const fetchRevenueAnalytics = (params?: Record<string, string>) =>
    adminApi.get("/analytics/revenue", { params });
export const fetchProductAnalytics = (params?: Record<string, string>) =>
    adminApi.get("/analytics/products", { params });
export const fetchConversionAnalytics = (params?: Record<string, string>) =>
    adminApi.get("/analytics/conversions", { params });
export const fetchGeolocationAnalytics = () =>
    adminApi.get("/analytics/geolocation");

// ── Guest Chats (Admin) ──────────────────────────
export const fetchGuestChats = (params?: Record<string, string>) =>
    adminApi.get("/guest_chats", { params });
export const fetchGuestChat = (id: string) =>
    adminApi.get(`/guest_chats/${id}`);
export const replyGuestChat = (id: string, message: string) =>
    adminApi.post(`/guest_chats/${id}/reply`, { message });
export const assignGuestChat = (id: string, employeeId: string) =>
    adminApi.post(`/guest_chats/${id}/assign`, { employee_id: employeeId });
export const closeGuestChat = (id: string) =>
    adminApi.post(`/guest_chats/${id}/close`);

// ── Support Chats (Admin) ─────────────────────────
export const fetchSupportChats = (params?: Record<string, string>) =>
    adminApi.get("/support_chats", { params });
export const fetchSupportChat = (id: string) =>
    adminApi.get(`/support_chats/${id}`);
export const replySupportChat = (id: string, message: string) =>
    adminApi.post(`/support_chats/${id}/reply`, { message });
export const assignSupportChat = (id: string, employeeId: string) =>
    adminApi.post(`/support_chats/${id}/assign`, { employee_id: employeeId });
export const closeSupportChat = (id: string) =>
    adminApi.post(`/support_chats/${id}/close`);

// ── System Monitoring ─────────────────────────────
export const fetchMonitoringData = () =>
    adminApi.get("/monitoring");

// ── Transactions (Admin) ──────────────────────────
export const fetchAdminTransactions = (params?: Record<string, string>) =>
    adminApi.get("/transactions", { params });

export default adminApi;
