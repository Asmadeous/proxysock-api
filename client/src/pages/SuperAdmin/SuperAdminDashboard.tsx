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
  ServerStackIcon,
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  InboxIcon,
  TicketIcon,
  AdjustmentsHorizontalIcon,
  CircleStackIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarItem } from "./components/AdminSidebar";
import { fetchAdminNotifications, markAdminNotificationsAsRead, fetchAdminSummaryCounts } from "../../services/adminApi";
import { Loader2 } from "lucide-react";
import { formatImageUrl } from "../../services/api";

// Tab pages (Lazy loaded)
const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const UsersTab = lazy(() => import("./tabs/UsersTab"));
const EmployeesTab = lazy(() => import("./tabs/EmployeesTab"));
const ResellersTab = lazy(() => import("./tabs/ResellersTab"));
const AffiliatesTab = lazy(() => import("./tabs/AffiliatesTab"));
const OrdersTab = lazy(() => import("./tabs/OrdersTab"));
const ProductsTab = lazy(() => import("./tabs/ProductsTab"));
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
const UsaCredentialsTab = lazy(() => import("./tabs/UsaCredentialsTab"));
const NotificationsPage = lazy(() => import("../misc/NotificationsPage"));

// Consolidated Management Tab
const ManagementTab = lazy(() => import("./tabs/ManagementTab"));

const sidebarItems: SidebarItem[] = [
  { id: "overview", name: "Overview", icon: HomeIcon },
  { id: "analytics", name: "Analytics", icon: ChartBarSquareIcon },
  { id: "users", name: "Users", icon: UsersIcon },
  { id: "employees", name: "Employees", icon: UserGroupIcon },
  { id: "resellers", name: "Resellers", icon: BuildingStorefrontIcon },
  { id: "affiliates", name: "Affiliates", icon: LinkIcon },
  { id: "orders", name: "Orders", icon: ShoppingCartIcon },
  { id: "management", name: "Management", icon: Squares2X2Icon },
  { id: "products", name: "Products", icon: BuildingStorefrontIcon },
  { id: "transactions", name: "Transactions", icon: CurrencyDollarIcon },
  { id: "blog", name: "Blog CMS", icon: DocumentTextIcon },
  { id: "tickets", name: "Tickets", icon: ChatBubbleLeftRightIcon },
  { id: "support_chats", name: "Support Chats", icon: InboxIcon },
  { id: "guest_chats", name: "Guest Chats", icon: ChatBubbleLeftRightIcon },
  { id: "monitoring", name: "Monitoring", icon: ChartBarSquareIcon },
  { id: "promo_codes", name: "Promo Codes", icon: TicketIcon },
  { id: "settings", name: "Settings", icon: AdjustmentsHorizontalIcon },
  { id: "database", name: "Database", icon: CircleStackIcon },
  { id: "notifications", name: "Notifications", icon: BellIcon },
  { id: "usa_credentials", name: "USA Credentials", icon: DevicePhoneMobileIcon },
  { id: "logs", name: "System Logs", icon: ServerStackIcon },
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
  products: ProductsTab,
  transactions: TransactionsTab,
  blog: BlogTab,
  tickets: TicketsTab,
  guest_chats: GuestChatsTab,
  support_chats: SupportChatsTab,
  monitoring: MonitoringTab,
  promo_codes: PromoCodesTab,
  settings: SettingsTab,
  database: DatabaseTab,
  usa_credentials: UsaCredentialsTab,
  notifications: NotificationsPage,
  logs: SystemLogsTab,
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
// Track which tabs have been "seen" — red dot disappears on visit
const [seenTabs, setSeenTabs] = useState<Record<string, boolean>>({});
const navigate = useNavigate();
const location = useLocation();

// Sync tab with URL
useEffect(() => {
  const pathParts = location.pathname.split("/").filter(Boolean);
  // /admin -> ["admin"]
  // /admin/users -> ["admin", "users"]
  const subPath = pathParts[1] || "overview";
  setActiveTab(subPath);
}, [location.pathname]);

// Determine if a tab has unseen activity
const hasUnseen = useCallback((tabId: string, count: number): boolean => {
  if (count <= 0) return false;
  // If the tab is currently active, it's been seen
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
const interval = setInterval(loadCounts, 30000); // Every 30s
return () => clearInterval(interval);
}, []);

// When activeTab changes, mark it as "seen"
useEffect(() => {
  markTabSeen(activeTab);
  setSeenTabs(prev => ({ ...prev, [activeTab]: true }));
}, [activeTab]);

// When counts change, reset "seen" for tabs that have NEW activity
useEffect(() => {
  const newSeenState: Record<string, boolean> = {};

  // For each badge tab, check if the admin has viewed it since the data existed
  // If the count is > 0 and they haven't visited, it's unseen
  for (const tabId of BADGE_TABS) {
    newSeenState[tabId] = tabId === activeTab; // Currently active = seen
  }

  setSeenTabs(prev => ({ ...prev, ...newSeenState }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [counts]);

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

// Dynamic sidebar items with badges/counts — red dot only for UNSEEN events
const dynamicItems = sidebarItems.map(item => {
const newItem = { ...item };

// Map counts to tabs
const tabCount = (() => {
  switch (item.id) {
    case "orders": return counts.orders || 0;
    case "tickets": return counts.tickets || 0;
    case "affiliates": return counts.payouts || 0;
    case "support_chats": return counts.support_chats || 0;
    case "guest_chats": return counts.guest_chats || 0;
    case "notifications": return counts.notifications || 0;
    default: return 0;
  }
})();

if (tabCount > 0) {
  newItem.count = tabCount;
  // Only show red dot if this tab hasn't been visited yet
  if (hasUnseen(item.id, tabCount)) {
    newItem.badge = "!";
  }
}

// Dead jobs always show red dot — this is a critical system alert
if (item.id === "monitoring" && counts.dead_jobs > 0) {
  newItem.badge = "!";
  newItem.count = counts.dead_jobs;
}

return newItem;
});

// Extend sidebar items with logout
const allItems: SidebarItem[] = [
...dynamicItems,
{ id: "logout", name: "Logout", icon: ArrowRightOnRectangleIcon },
];

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
  <AdminSidebar
    items={allItems}
    activeTab={activeTab}
    onTabChange={handleTabChange}
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
      <Suspense fallback={<TabLoader />}>
        <ActiveComponent />
      </Suspense>
    </div>
  </main>
</div>
);
}
