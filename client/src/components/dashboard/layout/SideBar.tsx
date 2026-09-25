import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
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
  Wallet,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Bell,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import UserBalance from "@/components/UserBalance";
import { useNotificationStore } from "@/store/notificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  badge?: string;
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
    title: "MAIN",
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
    title: "PURCHASE PRODUCTS",
    items: [
      {
        name: "Premium Proxies",
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
        name: "eSIM Packages",
        href: "/dashboard/esim",
        icon: Smartphone,
        description: "Phone-number and data-only eSIM plans",
      },
      {
        name: "VPS Hosting",
        href: "/dashboard/vps",
        icon: HardDrive,
        description: "Virtual private servers",
        badge: "Popular",
      },
      {
        name: "RDP Access",
        href: "/dashboard/rdp",
        icon: Monitor,
        description: "Remote desktop solutions",
        badge: "New",
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
    title: "MANAGEMENT",
    items: [
      {
        name: "View Products",
        href: "/dashboard/products",
        icon: Package,
        description: "Manage active services",
      },
      {
        name: "View Orders",
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
    title: "ACCOUNT",
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

// Simple Tooltip Component
const SidebarTooltip = ({ children, content, show }: { children: React.ReactNode; content: string; show: boolean }) => {
  if (!show) return <>{children}</>;

  return (
    <div className="group relative z-50">
      {children}
      <div className="invisible group-hover:visible absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md whitespace-nowrap border z-50">
        {content}
      </div>
    </div>
  );
};

export const Sidebar = ({
  isMobile,
  // setSidebarOpen,
  handleLogout,
  cartCount,
  userName,
  profilePictureUrl,
  isCollapsed,
  setIsCollapsed,
  onLinkClick,
}: SidebarProps) => {
  const location = useLocation();
  const { dark, toggleDark } = useThemeStore();

  // Dynamic badge counts
  const [counts, setCounts] = useState<any>({ orders: 0, tickets: 0, notifications: 0 });
  // Track which hrefs have been "seen" since their counts appeared
  const [seenPaths, setSeenPaths] = useState<Record<string, boolean>>({});

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

  // Mark current page as "seen" when navigating
  useEffect(() => {
    setSeenPaths(prev => ({ ...prev, [location.pathname]: true }));
  }, [location.pathname]);

  // When counts or realtime notifications change, reset seen state for tabs with activity (except currently active)
  useEffect(() => {
    setSeenPaths(prev => {
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(prev)) {
        next[key] = location.pathname === key || location.pathname.startsWith(key + "/");
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, storeNotifications, unreadNotifications]);

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

  // Whether the red dot should show (unseen activity)
  const isUnseen = (href: string): boolean => {
    const count = getBadgeCount(href);
    if (count <= 0) return false;
    // If we're currently on this page, it's seen
    if (location.pathname === href || location.pathname.startsWith(href + "/")) return false;
    return !seenPaths[href];
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== "/dashboard" && location.pathname.startsWith(path))
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
    <div className="h-full bg-background border-r border-border flex flex-col overflow-hidden relative">
      {/* Collapse Toggle (Desktop Only) */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute -right-3 top-6 rounded-full border bg-background shadow-md z-20 hover:bg-muted transition-all duration-300 ${isCollapsed ? "h-6 w-6 scale-90" : "h-8 w-8 scale-110"
            }`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* 1. Header Section: Avatar & Name */}
      <div className={`flex items-center gap-3 px-4 py-6 transition-all duration-300 ${isCollapsed ? "justify-center flex-col" : ""}`}>
        <Link
          to="/dashboard/profile"
          onClickCapture={handleMobileClick}
          className="flex-shrink-0 group"
        >
          <div className={`relative rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-primary/10 transition-all duration-300 ${isCollapsed ? "h-10 w-10" : "h-12 w-12"}`}>
            <img
              src={profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
              alt={userName}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold -z-10">
              {getInitials(userName)}
            </div>
          </div>
        </Link>

        {!isCollapsed && (
          <div className="flex flex-col min-w-0 transition-opacity duration-300 flex-1">
            <span className="font-semibold truncate text-sm">{userName}</span>
            <span className="text-xs text-muted-foreground truncate">Welcome back</span>
          </div>
        )}
        <div className={`flex-shrink-0 ${isCollapsed ? "" : ""}`}>
          <SidebarTooltip content="Notifications" show={isCollapsed}>
            <Link to="/dashboard/notifications" onClickCapture={handleMobileClick}>
              <div className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </div>
            </Link>
          </SidebarTooltip>
        </div>
      </div>

      <div className="h-px bg-border mx-4 mb-4" />

      {/* 2. User Balance */}
      <div className={`px-4 pb-4 transition-all duration-300 ${isCollapsed ? "flex justify-center" : ""}`}>
        {isCollapsed ? (
          <SidebarTooltip content="Wallet Balance" show={isCollapsed}>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 hover:bg-emerald-500/20 cursor-pointer transition-colors relative">
              <Wallet className="h-5 w-5" />
            </div>
          </SidebarTooltip>
        ) : (
          <UserBalance className="w-full" variant="sidebar" />
        )}
      </div>

      {/* 3. Navigation */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar ${isCollapsed ? "space-y-1" : "space-y-6"}`}>
        {navigationSections.map((section) => (
          <div key={section.id}>
            {!isCollapsed && (
              <div className="px-3 mb-3 mt-2 text-[10px] font-extrabold text-foreground/40 uppercase tracking-widest truncate">
                {section.title}
              </div>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const badgeCount = getBadgeCount(item.href);
                const unseen = isUnseen(item.href);

                return (
                  <SidebarTooltip key={item.name} content={item.name} show={isCollapsed}>
                    <Link
                      to={item.href}
                      onClickCapture={handleMobileClick}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${active
                        ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } ${isCollapsed ? "justify-center px-2" : ""}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${active ? "text-primary-foreground" : "group-hover:text-primary group-hover:scale-110"}`} />
                        {item.isCart && cartCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center border border-background">
                            {cartCount > 9 ? "9+" : cartCount}
                          </span>
                        )}
                        {/* Red dot on icon — only for unseen activity */}
                        {!item.isCart && unseen && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-background"></span>
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}

                      {/* Count badge — always shows when count > 0 */}
                      {!isCollapsed && badgeCount > 0 && !active && (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                          {unseen && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                      )}

                      {!isCollapsed && item.badge && getBadgeCount(item.href) === 0 && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.badge === "New"
                            ? "bg-primary text-white border border-white/20"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarTooltip>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* 4. Bottom Actions: Theme & Logout */}
      <div className="p-3 border-t border-border bg-muted/30 space-y-2">
        {/* Theme Toggle */}
        <SidebarTooltip content="Toggle Theme" show={isCollapsed}>
          <button
            onClick={toggleDark}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-foreground hover:bg-background border border-transparent hover:border-border transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className={`relative h-4.5 w-4.5 ${isCollapsed ? "" : "shrink-0"}`}>
              <AnimatePresence mode="wait">
                {dark ? (
                  <motion.div
                    key="sun"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4.5 w-4.5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4.5 w-4.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">Dark Mode</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${dark ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${dark ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            )}
          </button>
        </SidebarTooltip>

        {/* Home Button */}
        <SidebarTooltip content="Home" show={isCollapsed}>
          <Link
            to="/"
            onClickCapture={handleMobileClick}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-foreground hover:bg-background border border-transparent hover:border-border transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <Home className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Home</span>}
          </Link>
        </SidebarTooltip>

        {/* Logout */}
        <SidebarTooltip content="Logout" show={isCollapsed}>
          <button
            onClick={() => {
              handleLogout();
              handleMobileClick();
            }}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </SidebarTooltip>
      </div>
    </div>
  );
};
