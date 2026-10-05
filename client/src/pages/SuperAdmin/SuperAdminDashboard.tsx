import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  LinkIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleOvalLeftIcon,
  ServerStackIcon,
  ChartBarSquareIcon,
  CpuChipIcon,
  InboxIcon,
  TicketIcon,
  AdjustmentsHorizontalIcon,
  CircleStackIcon,
  BellIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarGroup } from "./components/AdminSidebar";
import CommandPalette from "./components/CommandPalette";
import AdminErrorBoundary from "./components/AdminErrorBoundary";
import { fetchAdminNotifications, markAdminNotificationsAsRead, fetchAdminSummaryCounts } from "../../services/adminApi";
import { useNotificationStore } from "@/store/notificationStore";
import { Loader2 } from "lucide-react";
import { formatImageUrl } from "../../services/api";

// Tab pages (Lazy loaded)
const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const UsersTab = lazy(() => import("./tabs/UsersTab"));
const EmployeesTab = lazy(() => import("./tabs/EmployeesTab"));
const ResellersTab = lazy(() => import("./tabs/ResellersTab"));
const AffiliatesTab = lazy(() => import("./tabs/AffiliatesTab"));
const OrdersTab = lazy(() => import("./tabs/OrdersTab"));
const TransactionsTab = lazy(() => import("./tabs/TransactionsTab"));
const BlogTab = lazy(() => import("./tabs/BlogTab"));
const TicketsTab = lazy(() => import("./tabs/TicketsTab"));
const SystemLogsTab = lazy(() => import("./tabs/SystemLogsTab"));
const AnalyticsTab = lazy(() => import("./tabs/AnalyticsTab"));
const GuestChatsTab = lazy(() => import("./tabs/GuestChatsTab"));
const SupportChatsTab = lazy(() => import("./tabs/SupportChatsTab"));
const MonitoringTab = lazy(() => import("./tabs/MonitoringTab"));
const PromoCodesTab = lazy(() => import("./tabs/PromoCodesTab"));
const SettingsTab = lazy(() => import("./tabs/SettingsTab"));
const DatabaseTab = lazy(() => import("./tabs/DatabaseTab"));
const NotificationsPage = lazy(() => import("../misc/NotificationsPage"));

// Consolidated Management Tab
const ManagementTab = lazy(() => import("./tabs/ManagementTab"));
const ProfileTab = lazy(() => import("./tabs/ProfileTab"));
// MeiSIM page: opened from the MeiSIM card on Overview, not listed in the sidebar.
const MeisimTab = lazy(() => import("./tabs/MeisimTab"));

const sidebarGroups: SidebarGroup[] = [
  {
    items: [
      { id: "overview", name: "Overview", icon: HomeIcon },
      { id: "analytics", name: "Analytics", icon: ChartBarSquareIcon },
    ],
  },
  {
    label: "People",
    items: [
      { id: "users", name: "Users", icon: UsersIcon },
      { id: "employees", name: "Employees", icon: UserGroupIcon },
      { id: "resellers", name: "Resellers", icon: BuildingStorefrontIcon },
      { id: "affiliates", name: "Affiliates", icon: LinkIcon },
    ],
  },
  {
    label: "Commerce",
    items: [
      { id: "orders", name: "Orders", icon: ShoppingCartIcon },
      { id: "management", name: "Management", icon: Squares2X2Icon },
      { id: "transactions", name: "Transactions", icon: CurrencyDollarIcon },
      { id: "promo_codes", name: "Promo Codes", icon: TicketIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "blog", name: "Blog CMS", icon: DocumentTextIcon },
      { id: "tickets", name: "Tickets", icon: ChatBubbleLeftRightIcon },
      { id: "support_chats", name: "Support Chats", icon: InboxIcon },
      { id: "guest_chats", name: "Guest Chats", icon: ChatBubbleOvalLeftIcon },
      { id: "notifications", name: "Notifications", icon: BellIcon },
    ],
  },
  {
    label: "System",
    items: [
      { id: "monitoring", name: "Monitoring", icon: CpuChipIcon },
      { id: "database", name: "Database", icon: CircleStackIcon },
      { id: "logs", name: "System Logs", icon: ServerStackIcon },
      { id: "settings", name: "Settings", icon: AdjustmentsHorizontalIcon },
      { id: "profile", name: "My Profile", icon: UserCircleIcon },
    ],
  },
];

const TAB_COMPONENTS: Record<string, any> = {
  overview: OverviewTab,
  analytics: AnalyticsTab,
  users: UsersTab,
  employees: EmployeesTab,
  resellers: ResellersTab,
  affiliates: AffiliatesTab,
  orders: OrdersTab,
  management: ManagementTab,
  // Products and provisioning now live inside Management (per category).
  products: ManagementTab,
  transactions: TransactionsTab,
  blog: BlogTab,
  tickets: TicketsTab,
  guest_chats: GuestChatsTab,
  support_chats: SupportChatsTab,
  monitoring: MonitoringTab,
  promo_codes: PromoCodesTab,
  settings: SettingsTab,
  database: DatabaseTab,
  notifications: NotificationsPage,
  logs: SystemLogsTab,
  profile: ProfileTab,
  meisim: MeisimTab,
};

// Tabs that can have "unseen" events
const BADGE_TABS = ["orders", "tickets", "affiliates", "support_chats", "guest_chats", "monitoring", "notifications"] as const;

// localStorage key for tracking when admin last viewed each tab
const SEEN_KEY = "admin_tab_seen";

function getSeenTimestamps(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch { return {}; }
}

function markTabSeen(tabId: string) {
  const seen = getSeenTimestamps();
  seen[tabId] = Date.now();
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

const TabLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
  </div>
);


export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [adminUser, setAdminUser] = useState(() => JSON.parse(localStorage.getItem("adminUser") || "{}"));
  const [counts, setCounts] = useState<any>({});
  const [seenTabs, setSeenTabs] = useState<Record<string, boolean>>({});
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const notifications = useNotificationStore(state => state.notifications);
  const unreadNotifications = useNotificationStore(state => state.unreadCount);

  // Sync tab with URL (path-based routing)
  useEffect(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const subPath = pathParts[1] || "overview";
    setActiveTab(subPath);
  }, [location.pathname]);

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Determine if a tab has unseen activity
  const hasUnseen = useCallback((tabId: string, count: number): boolean => {
    if (count <= 0) return false;
    if (seenTabs[tabId]) return false;
    return true;
  }, [seenTabs]);

  // Fetch summary counts periodically
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const data = await fetchAdminSummaryCounts();
        setCounts(data);
      } catch (e) {
        console.error("Failed to load summary counts", e);
      }
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    window.addEventListener('refreshAdminCounts', loadCounts);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAdminCounts', loadCounts);
    };
  }, []);

  // When activeTab changes, mark it as "seen"
  useEffect(() => {
    markTabSeen(activeTab);
    setSeenTabs(prev => ({ ...prev, [activeTab]: true }));
  }, [activeTab]);

  // When counts or notifications change, reset "seen" for tabs that have NEW activity
  useEffect(() => {
    const newSeenState: Record<string, boolean> = {};
    for (const tabId of BADGE_TABS) {
      newSeenState[tabId] = tabId === activeTab;
    }
    setSeenTabs(prev => ({ ...prev, ...newSeenState }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, unreadNotifications, notifications]);

  // Auth check & Storage sync
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
    }
    const handleUpdate = () => {
      setAdminUser(JSON.parse(localStorage.getItem("adminUser") || "{}"));
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("admin-user-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("admin-user-updated", handleUpdate);
    };
  }, [navigate]);

  const userName = adminUser.full_name || adminUser.email || "Admin";
  const userRole = adminUser.role || "admin";

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab] || OverviewTab;

  // Apply badge counts to grouped sidebar structure
  const dynamicGroups: SidebarGroup[] = sidebarGroups.map(group => ({
    ...group,
    items: group.items.map(item => {
      const newItem = { ...item };
      const tabCount = (() => {
        let base = 0;
        switch (item.id) {
          case "orders": base = counts.orders || 0; break;
          case "tickets": base = counts.tickets || 0; break;
          case "affiliates": base = counts.payouts || 0; break;
          case "support_chats": base = counts.support_chats || 0; break;
          case "guest_chats": base = counts.guest_chats || 0; break;
          case "notifications": return unreadNotifications || counts.notifications || 0;
        }
        
        // Add real-time unread count from websocket notifications
        if (item.id === "tickets") {
            const rtUnread = notifications.filter(n => !n.read_at && n.metadata?.ticket_id).length;
            base = Math.max(base, rtUnread);
        }
        if (item.id === "support_chats") {
            const rtUnread = notifications.filter(n => !n.read_at && n.metadata?.support_chat_id).length;
            base = Math.max(base, rtUnread);
        }
        if (item.id === "guest_chats") {
            const rtUnread = notifications.filter(n => !n.read_at && n.metadata?.guest_chat_id).length;
            base = Math.max(base, rtUnread);
        }

        return base;
      })();

      if (tabCount > 0) {
        newItem.count = tabCount;
        if (hasUnseen(item.id, tabCount)) {
          newItem.badge = "!";
        }
      }
      if (item.id === "monitoring" && counts.dead_jobs > 0) {
        newItem.badge = "!";
        newItem.count = counts.dead_jobs;
      }
      return newItem;
    }),
  }));

  const handleTabChange = (id: string) => {
    if (id === "logout") {
      handleLogout();
      return;
    }
    const prefix = location.pathname.startsWith('/sadmin') ? '/sadmin' : '/admin';
    navigate(`${prefix}/${id}`);
  };

  return (
    <div className="min-h-screen flex">
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        groups={dynamicGroups}
        onNavigate={handleTabChange}
        activeTab={activeTab}
      />
      <AdminSidebar
        groups={dynamicGroups}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenCommandPalette={() => setCmdOpen(true)}
        title="SuperAdmin"
        userName={userName}
        userRole={userRole}
        profilePictureUrl={formatImageUrl(adminUser.profile_picture_url)}
        fetchNotifications={fetchAdminNotifications}
        markNotificationsAsRead={markAdminNotificationsAsRead}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-screen overflow-y-auto p-4 sm:p-6 lg:pt-6 pt-16 bg-background custom-scrollbar">
          <AdminErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <ActiveComponent />
            </Suspense>
          </AdminErrorBoundary>
        </div>
      </main>
    </div>
  );
}
