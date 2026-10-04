import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, PanelLeftClose, PanelLeftOpen, X, type LucideIcon } from "lucide-react";
import logo from "@/assets/images/proxysock-wordmark.svg";
import "./sidebar.css";
import {
  LayoutDashboard,
  Network,
  Shield,
  Smartphone,
  HardDrive,
  Monitor,
  Package,
  ClipboardList,
  CreditCard,
  UserCircle,
  KeyRound,
  LogOut,
  ShoppingCart,
  Sun,
  Moon,
  Headphones,
  Bell,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import UserBalance from "@/components/UserBalance";
import { useNotificationStore } from "@/store/notificationStore";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  isCart?: boolean;
}

interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    id: "main",
    title: "Workspace",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Overview of your account",
      },
    ],
  },
  {
    id: "products",
    title: "Explore services",
    items: [
      {
        name: "Proxies",
        href: "/dashboard/proxies",
        icon: Network,
        description: "Purchase residential & datacenter proxies",
      },
      {
        name: "VPN",
        href: "/dashboard/vpn",
        icon: Shield,
        description: "Purchase residential vpn",
      },
      {
        name: "eSIM",
        href: "/dashboard/esim",
        icon: Smartphone,
        description: "Phone-number and data-only eSIM plans",
      },
      {
        name: "VPS Hosting",
        href: "/dashboard/vps",
        icon: HardDrive,
        description: "Virtual private servers",
      },
      {
        name: "RDP Access",
        href: "/dashboard/rdp",
        icon: Monitor,
        description: "Remote desktop solutions",
      },
      {
        name: "My Cart",
        href: "/dashboard/cart",
        icon: ShoppingCart,
        description: "View your cart",
        isCart: true,
      },
    ],
  },
  {
    id: "management",
    title: "Manage",
    items: [
      {
        name: "My services",
        href: "/dashboard/products",
        icon: Package,
        description: "Manage active services",
      },
      {
        name: "Orders",
        href: "/dashboard/orders",
        icon: ClipboardList,
        description: "Complete order history",
      },
      {
        name: "Transactions",
        href: "/dashboard/transactions",
        icon: CreditCard,
        description: "Payment history & invoices",
      },

      {
        name: "Support",
        href: "/dashboard/support",
        icon: Headphones,
        description: "Get help & support",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        name: "Profile Settings",
        href: "/dashboard/profile",
        icon: UserCircle,
        description: "Manage your profile",
      },
      {
        name: "Change Password",
        href: "/dashboard/change-password",
        icon: KeyRound,
        description: "Update your password",
      },
    ],
  },
];

interface SidebarProps {
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  cartCount: number;
  userName: string;
  profilePictureUrl?: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLinkClick?: () => void;
}

export const Sidebar = ({
  isMobile,
  setSidebarOpen,
  handleLogout,
  cartCount,
  userName,
  profilePictureUrl,
  isCollapsed: desktopCollapsed,
  setIsCollapsed,
  onLinkClick,
}: SidebarProps) => {
  const isCollapsed = !isMobile && desktopCollapsed;
  const [failedAvatar, setFailedAvatar] = useState<string>();
  const avatarUrl = profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;
  const location = useLocation();
  const { dark, toggleDark } = useThemeStore();

  // Dynamic badge counts
  const [counts, setCounts] = useState<{ orders?: number; tickets?: number; notifications?: number; support_chats?: number }>({});
  const unreadNotifications = useNotificationStore(state => state.unreadCount);
  const storeNotifications = useNotificationStore(state => state.notifications);
  const fetchStoreNotifications = useNotificationStore(state => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);
  const subscribeToRealtime = useNotificationStore(state => state.subscribeToRealtime);
  const unsubscribeFromRealtime = useNotificationStore(state => state.unsubscribeFromRealtime);

  const loadBadgeCounts = useCallback(async () => {
    try {
      const { fetchUserSummaryCounts } = await import("@/services/api");
      const summary = await fetchUserSummaryCounts();
      setCounts(summary);

      // Initial fetch for notifications through store
      await Promise.all([
        fetchStoreNotifications(),
        fetchUnreadCount()
      ]);
    } catch {
      // silent
    }
  }, [fetchStoreNotifications, fetchUnreadCount]);

  useEffect(() => {
    loadBadgeCounts();
    subscribeToRealtime();
    const interval = setInterval(loadBadgeCounts, 30000); // 30s poll
    return () => {
      unsubscribeFromRealtime();
      clearInterval(interval);
    };
  }, [loadBadgeCounts, subscribeToRealtime, unsubscribeFromRealtime]);

  // Map href -> badge count (only meaningful counts, not "active orders")
  const getBadgeCount = (href: string): number => {
    let baseCount = 0;
    if (href === "/dashboard/tickets") baseCount = counts.tickets || 0;
    if (href === "/dashboard/support") baseCount = counts.support_chats || 0;
    if (href === "/dashboard/notifications") return unreadNotifications || counts.notifications || 0;

    // Check realtime notifications from store for accurate red dot
    if (href === "/dashboard/tickets") {
      const rtUnread = storeNotifications.filter(n => !n.read_at && n.metadata?.ticket_id).length;
      return Math.max(baseCount, rtUnread);
    }
    if (href === "/dashboard/support") {
      const rtUnread = storeNotifications.filter(n => !n.read_at && n.metadata?.support_chat_id).length;
      return Math.max(baseCount, rtUnread);
    }

    return baseCount;
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== "/dashboard" && location.pathname.startsWith(path + "/"))
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMobileClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <aside className={`workspace-sidebar ${dark ? "workspace-sidebar-dark" : ""} ${isCollapsed ? "is-collapsed" : ""}`} aria-label="Workspace sidebar">
      <div className="workspace-brand">
        <Link to="/" onClick={handleMobileClick} aria-label="ProxySock home" title={isCollapsed ? "ProxySock home" : undefined}>
          {isCollapsed ? <Network aria-hidden="true" className="workspace-brand-symbol" /> : <img src={logo} alt="ProxySock" />}
        </Link>
        <button type="button" className="workspace-icon-button" aria-label={isMobile ? "Close navigation" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={isMobile ? "Close navigation" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => isMobile ? setSidebarOpen(false) : setIsCollapsed(!isCollapsed)}>
          {isMobile ? <X /> : isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </div>

      <div className="workspace-wallet">
        {!isCollapsed && <span className="workspace-caption">Your wallet</span>}
        <UserBalance variant={isCollapsed ? "sidebar-collapsed" : "sidebar"} />
      </div>

      <nav className="workspace-navigation" aria-label="Dashboard navigation">
        {navigationSections.map(section => (
          <div className="workspace-nav-group" key={section.id}>
            <h2 className={isCollapsed ? "sr-only" : "workspace-caption"}>{section.title}</h2>
            {section.items.map(item => {
              const active = isActive(item.href);
              const count = item.isCart ? cartCount : getBadgeCount(item.href);
              return (
                <Link key={item.href} to={item.href} onClick={handleMobileClick} className="workspace-nav-link" aria-label={item.name} aria-current={active ? "page" : undefined} title={isCollapsed ? item.name : undefined}>
                  <item.icon aria-hidden="true" />
                  {!isCollapsed && <span className="workspace-link-label">{item.name}</span>}
                  {count > 0 && <span className="workspace-count" aria-label={`${count} ${item.isCart ? "items in cart" : "updates"}`}>{count > 99 ? "99+" : count}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="workspace-account">
        <div className="workspace-utilities">
          <Link to="/dashboard/notifications" className="workspace-icon-button" onClick={handleMobileClick} aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`} title="Notifications" aria-current={isActive("/dashboard/notifications") ? "page" : undefined}>
            <Bell />{unreadNotifications > 0 && <span className="workspace-activity" />}
          </Link>
          <button type="button" className="workspace-icon-button" onClick={toggleDark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun /> : <Moon />}</button>
          <Link to="/" className="workspace-icon-button" onClick={handleMobileClick} aria-label="Back to website" title="Back to website"><Home /></Link>
        </div>
        <div className="workspace-profile-row">
          <Link className="workspace-profile" to="/dashboard/profile" onClick={handleMobileClick} aria-label={`Profile settings for ${userName}`} title={isCollapsed ? userName : undefined}>
            <span className="workspace-avatar">{failedAvatar !== avatarUrl ? <img src={avatarUrl} alt="" onError={() => setFailedAvatar(avatarUrl)} /> : getInitials(userName)}</span>
            {!isCollapsed && <span className="workspace-profile-copy"><strong>{userName}</strong><span>Personal account</span></span>}
          </Link>
          <button type="button" className="workspace-icon-button workspace-logout" onClick={() => { handleLogout(); handleMobileClick(); }} aria-label="Log out" title="Log out"><LogOut /></button>
        </div>
      </div>
    </aside>
  );
};
