import { useState, useEffect } from "react";
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
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarItem } from "./components/AdminSidebar";
import { fetchAdminNotifications, markAdminNotificationsAsRead } from "../../services/adminApi";

// Tab pages
import OverviewTab from "./tabs/OverviewTab";
import UsersTab from "./tabs/UsersTab";
import EmployeesTab from "./tabs/EmployeesTab";
import ResellersTab from "./tabs/ResellersTab";
import AffiliatesTab from "./tabs/AffiliatesTab";
import OrdersTab from "./tabs/OrdersTab";
import ProductsTab from "./tabs/ProductsTab";
import TransactionsTab from "./tabs/TransactionsTab";
import BlogTab from "./tabs/BlogTab";
import TicketsTab from "./tabs/TicketsTab";
import SystemLogsTab from "./tabs/SystemLogsTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import GuestChatsTab from "./tabs/GuestChatsTab";
import SupportChatsTab from "./tabs/SupportChatsTab";
import MonitoringTab from "./tabs/MonitoringTab";

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
  { id: "logs", name: "System Logs", icon: ServerStackIcon },
];

const TAB_COMPONENTS: Record<string, React.FC> = {
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
  logs: SystemLogsTab,
};

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");
  }, [navigate]);

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
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
        fetchNotifications={fetchAdminNotifications}
        markNotificationsAsRead={markAdminNotificationsAsRead}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-screen overflow-y-auto p-4 sm:p-6 lg:pt-6 pt-16 bg-background custom-scrollbar">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}
