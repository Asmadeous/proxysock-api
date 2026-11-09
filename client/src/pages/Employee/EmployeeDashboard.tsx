import { useState, useEffect, lazy, Suspense } from "react";
import { useThemeStore } from "@/store/themeStore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ClipboardList, LifeBuoy, ShoppingCart, Users } from "lucide-react";
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
import PageHeader from "../SuperAdmin/components/PageHeader";
import Button from "../SuperAdmin/components/Button";
import FormModal, { Field, inputClasses } from "../SuperAdmin/components/FormModal";
import adminApi, { fetchAdminNotifications, markAdminNotificationsAsRead } from "../../services/adminApi";
import { toast } from "sonner";
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

    const dark = useThemeStore(state => state.dark);

    return (
        <div className={`workspace-theme landing-theme min-h-screen flex ${dark ? "dark" : ""}`}>
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
                <div data-page-scroll className="h-screen overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 max-lg:pt-20 custom-scrollbar">
                  <div className={`dashboard-overview ws-page ${dark ? "overview-dark" : ""}`}>
                    {activeTab === "overview" && <EmpOverview />}
                    {activeTab === "tickets" && <EmpTickets />}
                    {activeTab === "support_chats" && <SupportChatsTab />}
                    { activeTab === "orders" && <EmpOrders />}
                    { activeTab === "management" && (
                        <Suspense fallback={<TabLoading />}>
                            <ManagementTab />
                        </Suspense>
                    )}
                    { activeTab === "users" && <EmpUsers />}
                    {activeTab === "notifications" && (
                        <Suspense fallback={<TabLoading />}>
                            <NotificationsPage />
                        </Suspense>
                    )}
                    {activeTab === "logs" && <EmpLogs />}
                  </div>
                </div>
            </main>
        </div>
    );
}

// ── Sub-components ── Each small and focused ──

function TabLoading() {
    return (
        <div className="space-y-3" role="status" aria-label="Loading">
            <span className="overview-skeleton" style={{ height: 28, maxWidth: 240 }} />
            <span className="overview-skeleton" style={{ height: 14, maxWidth: 380 }} />
        </div>
    );
}

function EmpOverview() {
    const [stats, setStats] = useState<{ tickets: number; orders: number; failed: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

    useEffect(() => {
        Promise.allSettled([empApi.tickets(), empApi.orders()]).then(([t, o]) => {
            const tickets = t.status === "fulfilled" ? (t.value.data.tickets || t.value.data || []).length : 0;
            const ordersData = o.status === "fulfilled" ? o.value.data : { stats: {} };
            if (t.status === "fulfilled" || o.status === "fulfilled") {
                setStats({ tickets, orders: ordersData.total || 0, failed: ordersData.stats?.failed || 0 });
            }
            setLoading(false);
        });
    }, []);

    const metrics = [
        { title: "Assigned tickets", value: stats?.tickets, note: "Tickets waiting on you", href: "/employee/tickets" },
        { title: "Total orders", value: stats?.orders, note: "Orders across the platform", href: "/employee/orders" },
        { title: "Failed orders", value: stats?.failed, note: stats?.failed ? "Need a rescue" : "Nothing to rescue", href: "/employee/orders" },
    ];
    const shortcuts = [
        { icon: ClipboardList, name: "Tickets", description: "Reply to the support tickets assigned to you.", href: "/employee/tickets" },
        { icon: LifeBuoy, name: "Support chats", description: "Answer live conversations with customers and resellers.", href: "/employee/support_chats" },
        { icon: ShoppingCart, name: "Orders", description: "Review orders and rescue the ones that failed.", href: "/employee/orders" },
        { icon: Users, name: "Users", description: "Look up customer accounts (read only).", href: "/employee/users" },
    ];

    return (
        <div>
            <header className="overview-heading">
                <div><h1>Overview</h1><p>Welcome back{user.full_name ? `, ${user.full_name}` : ""}. Here’s what needs your attention.</p></div>
            </header>

            <section className="overview-metrics" aria-label="Workload summary" aria-busy={loading}>
                {metrics.map(metric => (
                    <Link to={metric.href} className="overview-metric" key={metric.title}>
                        <span>{metric.title}<ArrowUpRight size={14} /></span>
                        <strong>{loading ? <span className="overview-skeleton" /> : metric.value ?? "—"}</strong>
                        <small>{stats ? metric.note : loading ? "Loading…" : "Currently unavailable"}</small>
                    </Link>
                ))}
            </section>

            <section className="overview-services" aria-labelledby="emp-shortcuts">
                <div className="overview-section-heading"><div><h2 id="emp-shortcuts">Your workspace</h2><p>Everything you need for support and order operations.</p></div></div>
                <div className="overview-service-grid">
                    {shortcuts.map(item => (
                        <article className="overview-service" key={item.name}>
                            <div className="overview-service-top"><item.icon size={21} strokeWidth={1.5} aria-hidden="true" /></div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <Link to={item.href} aria-label={`Open ${item.name}`}>Open <ArrowRight size={15} /></Link>
                        </article>
                    ))}
                </div>
            </section>
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
        empApi.tickets().then((r) => { setTickets(r.data.tickets || r.data || []); setLoading(false); }).catch(() => { toast.error("Failed to load tickets"); setLoading(false); });
    }, []);

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        setReplyLoading(true);
        try {
            await empApi.replyTicket(Number(replyTarget.id), replyMsg);
            toast.success("Reply sent");
            setReplyTarget(null);
            setReplyMsg("");
        } catch { toast.error("Failed to send reply"); }
        finally { setReplyLoading(false); }
    };

    return (
        <div className="ws-stack">
            <PageHeader title="Tickets" description="Support tickets assigned to you." />
            <DataTable
                columns={[
                    { key: "subject", label: "Subject", sortable: true, render: (r: Record<string, unknown>) => <strong>{String(r.subject || "—")}</strong> },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "open")} /> },
                    { key: "created_at", label: "Date", render: (r: Record<string, unknown>) => <span className="ws-muted">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={tickets}
                loading={loading}
                emptyMessage="No tickets assigned to you."
                actions={(row: Record<string, unknown>) => (
                    <Button size="sm" variant="secondary" onClick={() => { setReplyTarget(row); setReplyMsg(""); }}>Reply</Button>
                )}
            />
            <FormModal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply: ${String(replyTarget?.subject || "")}`} onSubmit={handleReply} submitLabel="Send reply" loading={replyLoading}>
                <Field label="Message"><textarea className={`${inputClasses} h-28 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} /></Field>
            </FormModal>
        </div>
    );
}

function EmpOrders() {
    const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [rescuing, setRescuing] = useState<number | null>(null);

    useEffect(() => {
        empApi.orders().then((r) => { setOrders(r.data.orders || []); setLoading(false); }).catch(() => { toast.error("Failed to load orders"); setLoading(false); });
    }, []);

    const handleRescue = async (id: number) => {
        setRescuing(id);
        try { await empApi.rescueOrder(id); toast.success("Rescue started"); } catch { toast.error("Rescue failed"); }
        finally { setRescuing(null); }
    };

    return (
        <div className="ws-stack">
            <PageHeader title="Orders" description="Review orders and rescue the ones that failed to provision." />
            <DataTable
                columns={[
                    { key: "id", label: "Order", render: (r: Record<string, unknown>) => <span className="ws-mono">#{String(r.id).slice(0, 8)}</span> },
                    { key: "product_name", label: "Product", render: (r: Record<string, unknown>) => <strong>{String(r.product_name || "—")}</strong> },
                    { key: "total_amount", label: "Amount", render: (r: Record<string, unknown>) => `$${Number(r.total_amount || 0).toFixed(2)}` },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} /> },
                ]}
                data={orders}
                loading={loading}
                emptyMessage="No orders yet."
                actions={(row: Record<string, unknown>) =>
                    (String(row.status) === "failed" || String(row.status) === "error") ? (
                        <Button size="sm" variant="secondary" loading={rescuing === Number(row.id)} onClick={() => handleRescue(Number(row.id))}>Rescue</Button>
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
        empApi.users().then((r) => { setUsers(r.data.users || []); setLoading(false); }).catch(() => { toast.error("Failed to load users"); setLoading(false); });
    }, []);

    return (
        <div className="ws-stack">
            <PageHeader title="Users" description="Customer accounts. Read only." />
            <DataTable
                columns={[
                    { key: "email", label: "Email", sortable: true, render: (r: Record<string, unknown>) => <strong>{String(r.email || "—")}</strong> },
                    { key: "first_name", label: "Name", render: (r: Record<string, unknown>) => `${r.first_name || ""} ${r.last_name || ""}`.trim() || "—" },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "active")} /> },
                    { key: "created_at", label: "Joined", render: (r: Record<string, unknown>) => <span className="ws-muted">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={users}
                loading={loading}
                emptyMessage="No users found."
            />
        </div>
    );
}

function EmpLogs() {
    return (
        <div className="ws-stack">
            <PageHeader title="Activity" description="Your actions in the staff workspace." />
            <div className="overview-empty">
                <span className="overview-empty-mark" aria-hidden="true"><ClipboardList size={26} strokeWidth={1.3} /></span>
                <h3>Activity is recorded automatically</h3>
                <p>Every action you take is written to the audit log. Ask an admin if you need a record reviewed.</p>
            </div>
        </div>
    );
}
