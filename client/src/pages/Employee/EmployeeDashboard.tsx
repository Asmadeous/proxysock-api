import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    HomeIcon,
    ChatBubbleLeftRightIcon,
    ShoppingCartIcon,
    UsersIcon,
    ServerStackIcon,
    ArrowRightOnRectangleIcon,
    BellIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarItem } from "../SuperAdmin/components/AdminSidebar";
import DataTable from "../SuperAdmin/components/DataTable";
import StatusBadge from "../SuperAdmin/components/StatusBadge";
import StatsCard from "../SuperAdmin/components/StatsCard";
import FormModal, { Field, inputClasses } from "../SuperAdmin/components/FormModal";
import adminApi, { fetchAdminNotifications, markAdminNotificationsAsRead } from "../../services/adminApi";
import { toast } from "react-hot-toast";
import { formatImageUrl } from "../../services/api";
import SupportChatsTab from "../SuperAdmin/tabs/SupportChatsTab";
const NotificationsPage = lazy(() => import("../misc/NotificationsPage"));

// Consolidated Management Tab
const ManagementTab = lazy(() => import("../SuperAdmin/tabs/ManagementTab"));

// ── Employee-scoped API calls ──
const empApi = {
    tickets: (params?: Record<string, string>) => adminApi.get("/tickets", { params }),
    replyTicket: (id: number, msg: string) => adminApi.post(`/tickets/${id}/reply`, { message: msg }),
    orders: (params?: Record<string, string>) => adminApi.get("/orders", { params }),
    rescueOrder: (id: number) => adminApi.post(`/orders/${id}/rescue`),
    users: (params?: Record<string, string>) => adminApi.get("/users", { params }),
};

const TABS: SidebarItem[] = [
    { id: "overview", name: "Overview", icon: HomeIcon },
    { id: "tickets", name: "My Tickets", icon: ChatBubbleLeftRightIcon },
    { id: "support_chats", name: "Support Chats", icon: ChatBubbleLeftRightIcon },
    { id: "orders", name: "Orders", icon: ShoppingCartIcon },
    { id: "management", name: "Management", icon: Squares2X2Icon },
    { id: "users", name: "Users", icon: UsersIcon },
    { id: "logs", name: "Activity", icon: ServerStackIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "logout", name: "Logout", icon: ArrowRightOnRectangleIcon },
];

export default function EmployeeDashboard() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("adminUser") || "{}"));
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();
    const location = useLocation();

    // Sync tab with URL
    useEffect(() => {
        const pathParts = location.pathname.split("/").filter(Boolean);
        // /employee -> ["employee"]
        // /employee/tickets -> ["employee", "tickets"]
        const subPath = pathParts[1] || "overview";
        setActiveTab(subPath);
    }, [location.pathname]);

    useEffect(() => {
        if (!localStorage.getItem("adminToken")) {
            navigate("/admin/login");
        }

        const handleUpdate = () => {
            setUser(JSON.parse(localStorage.getItem("adminUser") || "{}"));
        };

        window.addEventListener("storage", handleUpdate);
        window.addEventListener("admin-user-updated", handleUpdate);
        return () => {
            window.removeEventListener("storage", handleUpdate);
            window.removeEventListener("admin-user-updated", handleUpdate);
        };
    }, [navigate]);

    const handleTab = (id: string) => {
        if (id === "logout") {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            navigate("/admin/login");
            return;
        }
        navigate(`/employee/${id}`);
    };

    return (
        <div className="min-h-screen flex">
            <AdminSidebar
                items={TABS}
                activeTab={activeTab}
                onTabChange={handleTab}
                title="Employee"
                userName={user.full_name || user.email || "Employee"}
                userRole={user.role || "support"}
                profilePictureUrl={formatImageUrl(user.profile_picture_url)}
                accentColor="blue"
                fetchNotifications={fetchAdminNotifications}
                markNotificationsAsRead={markAdminNotificationsAsRead}
            />
            <main className="flex-1 overflow-hidden">
                <div className="h-screen overflow-y-auto p-4 sm:p-6 lg:pt-6 pt-16 bg-background custom-scrollbar">
                    {activeTab === "overview" && <EmpOverview />}
                    {activeTab === "tickets" && <EmpTickets />}
                    {activeTab === "support_chats" && <SupportChatsTab />}
                    { activeTab === "orders" && <EmpOrders />}
                    { activeTab === "management" && (
                        <Suspense fallback={<div>Loading...</div>}>
                            <ManagementTab />
                        </Suspense>
                    )}
                    { activeTab === "users" && <EmpUsers />}
                    {activeTab === "notifications" && (
                        <Suspense fallback={<div>Loading...</div>}>
                            <NotificationsPage />
                        </Suspense>
                    )}
                    {activeTab === "logs" && <EmpLogs />}
                </div>
            </main>
        </div>
    );
}

// ── Sub-components ── Each small and focused ──

function EmpOverview() {
    const [stats, setStats] = useState({ tickets: 0, orders: 0, failed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([empApi.tickets(), empApi.orders()]).then(([t, o]) => {
            const tickets = t.status === "fulfilled" ? (t.value.data.tickets || t.value.data || []).length : 0;
            const ordersData = o.status === "fulfilled" ? o.value.data : { stats: {} };
            setStats({ tickets, orders: ordersData.total || 0, failed: ordersData.stats?.failed || 0 });
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard title="Assigned Tickets" value={stats.tickets} icon={ChatBubbleLeftRightIcon} loading={loading} />
                <StatsCard title="Total Orders" value={stats.orders} icon={ShoppingCartIcon} loading={loading} />
                <StatsCard title="Failed Orders" value={stats.failed} icon={ShoppingCartIcon} loading={loading} positive={false} change={stats.failed > 0 ? "Needs rescue" : "0"} />
            </div>
        </div>
    );
}

function EmpTickets() {
    const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyTarget, setReplyTarget] = useState<Record<string, unknown> | null>(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    useEffect(() => {
        empApi.tickets().then((r) => { setTickets(r.data.tickets || r.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        setReplyLoading(true);
        try {
            await empApi.replyTicket(Number(replyTarget.id), replyMsg);
            toast.success("Reply sent");
            setReplyTarget(null);
            setReplyMsg("");
        } catch { toast.error("Failed"); }
        finally { setReplyLoading(false); }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Tickets</h2>
            <DataTable
                columns={[
                    { key: "subject", label: "Subject", sortable: true },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "open")} /> },
                    { key: "created_at", label: "Date", render: (r: Record<string, unknown>) => <span className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={tickets}
                loading={loading}
                emptyMessage="No tickets assigned"
                actions={(row: Record<string, unknown>) => (
                    <button onClick={() => { setReplyTarget(row); setReplyMsg(""); }} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">Reply</button>
                )}
            />
            <FormModal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply: ${String(replyTarget?.subject || "")}`} onSubmit={handleReply} submitLabel="Send" loading={replyLoading}>
                <Field label="Message"><textarea className={`${inputClasses} h-24 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} /></Field>
            </FormModal>
        </div>
    );
}

function EmpOrders() {
    const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        empApi.orders().then((r) => { setOrders(r.data.orders || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleRescue = async (id: number) => {
        try { await empApi.rescueOrder(id); toast.success("Rescued"); } catch { toast.error("Failed"); }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Orders</h2>
            <DataTable
                columns={[
                    { key: "id", label: "Order", render: (r: Record<string, unknown>) => <span className="font-mono text-xs">#{String(r.id).slice(0, 8)}</span> },
                    { key: "product_name", label: "Product" },
                    { key: "total_amount", label: "Amount", render: (r: Record<string, unknown>) => `$${Number(r.total_amount || 0).toFixed(2)}` },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} /> },
                ]}
                data={orders}
                loading={loading}
                emptyMessage="No orders"
                actions={(row: Record<string, unknown>) =>
                    (String(row.status) === "failed" || String(row.status) === "error") ? (
                        <button onClick={() => handleRescue(Number(row.id))} className="px-2.5 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30">Rescue</button>
                    ) : null
                }
            />
        </div>
    );
}

function EmpUsers() {
    const [users, setUsers] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        empApi.users().then((r) => { setUsers(r.data.users || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Users (Read Only)</h2>
            <DataTable
                columns={[
                    { key: "email", label: "Email", sortable: true },
                    { key: "first_name", label: "Name", render: (r: Record<string, unknown>) => `${r.first_name || ""} ${r.last_name || ""}` },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "active")} /> },
                    { key: "created_at", label: "Joined", render: (r: Record<string, unknown>) => <span className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={users}
                loading={loading}
                emptyMessage="No users"
            />
        </div>
    );
}

function EmpLogs() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Activity Logs</h2>
            <div className="bg-muted rounded-xl border border-border p-8 text-center">
                <ServerStackIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Your activity is tracked automatically. Contact an admin to review audit logs.</p>
            </div>
        </div>
    );
}
