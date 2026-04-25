import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  CpuChipIcon,
  CubeIcon,
  InboxIcon,
  TicketIcon,
  AdjustmentsHorizontalIcon,
  CircleStackIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarGroup } from "./components/AdminSidebar";
import CommandPalette from "./components/CommandPalette";
import AdminErrorBoundary from "./components/AdminErrorBoundary";
import { saveTabFilters, restoreTabFilters } from "./utils/adminFilterCache";
import { fetchAdminNotifications, markAdminNotificationsAsRead } from "../../services/adminApi";
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
      { id: "products", name: "Products", icon: CubeIcon },
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
    ],
  },
  {
    label: "System",
    items: [
      { id: "monitoring", name: "Monitoring", icon: CpuChipIcon },
      { id: "database", name: "Database", icon: CircleStackIcon },
      { id: "usa_credentials", name: "USA Credentials", icon: DevicePhoneMobileIcon },
      { id: "logs", name: "System Logs", icon: ServerStackIcon },
      { id: "settings", name: "Settings", icon: AdjustmentsHorizontalIcon },
    ],
  },
  {
    items: [
      { id: "logout", name: "Logout", icon: ArrowRightOnRectangleIcon },
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
  logs: SystemLogsTab,
};


const TabLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
  </div>
);

export default function SuperAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";
  const [adminUser, setAdminUser] = useState(() => JSON.parse(localStorage.getItem("adminUser") || "{}"));
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleTabChange = (id: string) => {
    if (id === "logout") {
      handleLogout();
      return;
    }
    // Save the current tab's filter state before leaving
    saveTabFilters(activeTab, searchParams);
    // Restore saved filters for the destination tab (if any)
    const saved = restoreTabFilters(id);
    if (saved) {
      saved.set("tab", id);
      setSearchParams(saved, { replace: false });
    } else {
      setSearchParams({ tab: id }, { replace: false });
    }
  };

  return (
    <div className="min-h-screen flex">
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        groups={sidebarGroups}
        onNavigate={handleTabChange}
        activeTab={activeTab}
      />
      <AdminSidebar
        groups={sidebarGroups}
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
