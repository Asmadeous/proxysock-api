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
        if (err.response?.status === 401 && !window.location.pathname.includes("/admin/login")) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            if (window.location.pathname !== "/admin/login") {
                window.location.href = "/admin/login";
            }
        }
        // Enrich the error message from the backend JSON body so callers can
        // simply do: catch(err) { toast.error(err.message) }
        const data = err.response?.data;
        if (data) {
            const msg = data.message || data.error ||
                (Array.isArray(data.errors) ? data.errors.join(", ") : null);
            if (msg && err instanceof Error) err.message = msg;
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
    adminApi.post("/auth/login", { email, password });

// ── Admin Profile ─────────────────────────────────
export const fetchAdminProfile = () =>
    adminApi.get("/profile");
export const updateAdminProfile = (data: Record<string, unknown> | FormData) => {
    if (data instanceof FormData) {
        return adminApi.patch("/profile", data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
    return adminApi.patch("/profile", data);
};

// ── Users ─────────────────────────────────────────
export const fetchAdminUsers = (params?: Record<string, string>) =>
    adminApi.get("/users", { params });
export const fetchAdminUser = (id: number) =>
    adminApi.get(`/users/${id}`);
export const updateAdminUser = (id: number, data: Record<string, unknown>) =>
    adminApi.patch(`/users/${id}`, data);
export const createAdminUser = (data: Record<string, unknown>) =>
    adminApi.post("/users", data);
export const deleteAdminUser = (id: number) =>
    adminApi.delete(`/users/${id}`);
export const onboardUser = (id: number) =>
    adminApi.post(`/users/${id}/onboard`);
export const impersonateUser = (id: number) =>
    adminApi.post(`/users/${id}/impersonate`);
export const revokeUserTokens = (id: number) =>
    adminApi.post(`/users/${id}/revoke_tokens`);

// ── Employees ─────────────────────────────────────
export const fetchEmployees = (params?: Record<string, string>) =>
    adminApi.get("/employees", { params });
export const fetchEmployee = (id: number) =>
    adminApi.get(`/employees/${id}`);
export const createEmployee = (data: Record<string, unknown>) =>
    adminApi.post("/employees", data);
export const updateEmployee = (id: number, data: Record<string, unknown> | FormData) => {
    if (data instanceof FormData) {
        return adminApi.patch(`/employees/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
    return adminApi.patch(`/employees/${id}`, data);
};
export const deleteEmployee = (id: number) =>
    adminApi.delete(`/employees/${id}`);
export const assignTickets = (id: number, ticketIds: number[]) =>
    adminApi.post(`/employees/${id}/assign`, { ticket_ids: ticketIds });
export const revokeEmployeeTokens = (id: number) =>
    adminApi.post(`/employees/${id}/revoke_tokens`);

// ── Products ───────────────────────────────────────
export const fetchAdminProducts = () => adminApi.get("/products");
export const fetchAdminProduct = (id: string | number) => adminApi.get(`/products/${id}`);
export const createAdminProduct = (data: Record<string, unknown>) => adminApi.post("/products", { product: data });
export const updateAdminProduct = (id: string | number, data: Record<string, unknown>) => adminApi.patch(`/products/${id}`, { product: data });
export const deleteAdminProduct = (id: string | number) => adminApi.delete(`/products/${id}`);
export const syncAdminProxies = () => adminApi.post("/products/sync_proxies");
export const syncAdminEsims = () => adminApi.post("/products/sync_esims");
export const syncAdminMeisim = () => adminApi.post("/products/sync_meisim");
export const syncAdminVPS = () => adminApi.post("/products/sync_vps");
export const syncAdminVPN = () => adminApi.post("/products/sync_vpn");
export const syncAdminRDP = () => adminApi.post("/products/sync_rdp");

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
export const revokeResellerTokens = (id: string | number) =>
    adminApi.post(`/resellers/${id}/revoke_tokens`);

// ── Orders ────────────────────────────────────────
export const fetchAdminOrders = (params?: Record<string, string>) =>
    adminApi.get("/orders", { params });
export const fetchAdminOrder = (id: number) =>
    adminApi.get(`/orders/${id}`);
export const rescueOrder = (id: number) =>
    adminApi.post(`/orders/${id}/rescue`);
export const refundOrder = (id: number, data: { refund_method: string }) =>
    adminApi.post(`/orders/${id}/refund`, data);
export const renewOrder = (id: number) =>
    adminApi.post(`/orders/${id}/renew`);
export const reorderOrder = (id: number) =>
    adminApi.post(`/orders/${id}/reorder`);
export const fetchOrderCredentials = (id: number) =>
    adminApi.get(`/orders/${id}/credentials`);
export const createAdminOrder = (data: {
    product_id: string;
    customer_email: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
}) => adminApi.post("/orders", data);
export const updateAdminOrder = (
    id: string | number,
    data: {
        status?: string;
        quantity?: number;
        expires_at?: string | null;
        total_amount?: number | string;
        currency?: string;
        provider_order_id?: string;
        metadata?: Record<string, unknown>;
    },
) => adminApi.patch(`/orders/${id}`, data);
export const deleteAdminOrder = (id: string | number, params?: { deprovision?: boolean }) =>
    adminApi.delete(`/orders/${id}`, { params });
export const updateProxyCredentials = (id: number, data: { username?: string; password?: string }) =>
    adminApi.post(`/orders/${id}/update_credentials`, data);
export const rotateProxyIp = (id: number) =>
    adminApi.post(`/orders/${id}/rotate_ip`);
export const adminRenewOrder = (id: number) =>
    adminApi.post(`/orders/${id}/renew`);
export const adminReorderOrder = (id: number) =>
    adminApi.post(`/orders/${id}/reorder`);

// ── VMs (Admin) ───────────────────────────────────
export const fetchAdminVms = (params?: Record<string, string>) =>
    adminApi.get("/vms", { params });
export const fetchAdminVm = (id: number | string) =>
    adminApi.get(`/vms/${id}`);
export const startAdminVm = (id: number | string) =>
    adminApi.post(`/vms/${id}/start`);
export const stopAdminVm = (id: number | string) =>
    adminApi.post(`/vms/${id}/stop`);
export const rebootAdminVm = (id: number | string) =>
    adminApi.post(`/vms/${id}/reboot`);
export const deleteAdminVm = (id: number | string) =>
    adminApi.delete(`/vms/${id}`);

export const changeProxyProtocol = (id: number, protocol: string) =>
    adminApi.post(`/orders/${id}/change_protocol`, { protocol });
export const whitelistAdd = (id: number, ip: string, description?: string) =>
    adminApi.post(`/orders/${id}/whitelist`, { ip, description });
export const whitelistDelete = (id: number, ip: string) =>
    adminApi.delete(`/orders/${id}/whitelist`, { data: { ip } });

// ── Affiliates ────────────────────────────────────
export const fetchAffiliates = (params?: Record<string, string>) =>
    adminApi.get("/affiliates", { params });
export const fetchAffiliate = (id: number) =>
    adminApi.get(`/affiliates/${id}`);
export const deleteAffiliate = (id: number) =>
    adminApi.delete(`/affiliates/${id}`);
export const createAffiliate = (data: Record<string, unknown>) =>
    adminApi.post("/affiliates", data);
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
export const updateTicketStatus = (id: number, status: string) =>
    adminApi.put(`/tickets/${id}`, { ticket: { status } });

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
export const fetchMonitoringQueues = () =>
    adminApi.get("/monitoring/queues");
export const fetchMonitoringJobs = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/jobs", { params });
export const fetchMonitoringRetries = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/retries", { params });
export const fetchMonitoringDeadJobs = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/dead_jobs", { params });
export const fetchMonitoringScheduled = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/scheduled_jobs", { params });
export const retryMonitoringJob = (jid: string) =>
    adminApi.post("/monitoring/retry_job", { jid });
export const deleteMonitoringJob = (jid: string) =>
    adminApi.post("/monitoring/delete_job", { jid });
export const clearMonitoringQueue = (queue: string) =>
    adminApi.post("/monitoring/clear_queue", { queue });
export const clearMonitoringRetries = () =>
    adminApi.post("/monitoring/clear_retries");
export const clearMonitoringDead = () =>
    adminApi.post("/monitoring/clear_dead");
export const retryAllMonitoring = (set: string) =>
    adminApi.post("/monitoring/retry_all", { set });
export const fetchAuditLogs = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/audit_logs", { params });
export const fetchSystemLogs = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/system_logs", { params });
export const fetchErrorLogs = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/error_logs", { params });
export const fetchAdminSummaryCounts = () =>
    adminApi.get("/monitoring/summary_counts").then(res => res.data);
export const fetchResourceAlerts = (params?: Record<string, string>) =>
    adminApi.get("/monitoring/resource_alerts", { params });
export const acknowledgeResourceAlert = (id: string) =>
    adminApi.post(`/monitoring/resource_alerts/${id}/acknowledge`);

// ── Provider Balances (MyProxyApi + eSIM Access + MeiSIM) ──
export const fetchProviderBalances = () =>
    adminApi.get("/provider_balances").then(res => res.data);

// ── Transactions (Admin) ──────────────────────────
export const fetchAdminTransactions = (params?: Record<string, string>) =>
    adminApi.get("/transactions", { params });

// ── Admin Settings ────────────────────────────────
export const adminCreditWallet = (data: { entity_type: string; email?: string; entity_id?: number; amount: number; description?: string }) =>
    adminApi.post("/settings/credit_wallet", data);
export const adminDebitWallet = (data: { entity_type: string; email?: string; entity_id?: number; amount: number; description?: string }) =>
    adminApi.post("/settings/debit_wallet", data);
export const fetchAdminProductCategories = () =>
    adminApi.get("/settings/product_categories");
export const createAdminProductCategory = (data: { name: string; slug?: string }) =>
    adminApi.post("/settings/product_categories", data);
export const fetchSystemInfo = () =>
    adminApi.get("/settings/system_info");

// ── Database Explorer ────────────────────────────
export const fetchDatabaseTables = () =>
    adminApi.get("/database/tables");
export const executeDatabaseQuery = (query: string) =>
    adminApi.post("/database/query", { query });

export default adminApi;

// ── eSIM Top-ups ──────────────────────────────────
export const fetchEsimTopups = (params?: Record<string, string>) =>
    adminApi.get("/esim_topups", { params });
export const completeEsimTopup = (id: string, note?: string) =>
    adminApi.patch(`/esim_topups/${id}/complete`, { note });
export const cancelEsimTopup = (id: string, note?: string) =>
    adminApi.patch(`/esim_topups/${id}/cancel`, { note });
