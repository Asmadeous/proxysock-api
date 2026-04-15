import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarItem } from "./components/AdminSidebar";
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

const sidebarItems: SidebarItem[] = [
  { id: "overview", name: "Overview", icon: HomeIcon },
  { id: "analytics", name: "Analytics", icon: ChartBarSquareIcon },
  { id: "users", name: "Users", icon: UsersIcon },
  { id: "employees", name: "Employees", icon: UserGroupIcon },
  { id: "resellers", name: "Resellers", icon: BuildingStorefrontIcon },
  { id: "affiliates", name: "Affiliates", icon: LinkIcon },
  { id: "orders", name: "Orders", icon: ShoppingCartIcon },
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
  const [activeTab, setActiveTab] = useState("overview");
  const [adminUser, setAdminUser] = useState(() => JSON.parse(localStorage.getItem("adminUser") || "{}"));
  const navigate = useNavigate();

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

  // Extend sidebar items with logout
  const allItems: SidebarItem[] = [
    ...sidebarItems,
    { id: "logout", name: "Logout", icon: ArrowRightOnRectangleIcon },
  ];

  const handleTabChange = (id: string) => {
    if (id === "logout") {
      handleLogout();
      return;
    }
    setActiveTab(id);
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
