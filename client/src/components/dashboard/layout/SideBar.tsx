import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import {
  LayoutDashboard,
  Globe,
  ShieldCheck,
  Smartphone,
  Server,
  Monitor,
  Box,
  ShoppingBag,
  Receipt,
  User,
  KeyRound,
  LogOut,
  ShoppingCart,
  Sun,
  Moon,
  Wallet,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import UserBalance from "@/components/UserBalance";
import NotificationBell from "@/components/NotificationBell";
import { fetchTickets, fetchUserSupportChat } from "@/services/api";
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
        icon: Globe,
        description: "Purchase residential & datacenter proxies",
      },
      {
        name: "VPN",
        href: "/dashboard/vpn",
        icon: ShieldCheck,
        description: "Purchase residential vpn",
      },
      {
        name: "eSIM Packages",
        href: "/dashboard/esim",
        icon: Smartphone,
        description: "Global eSIM data packages",
      },
      {
        name: "VPS Hosting",
        href: "/dashboard/vps",
        icon: Server,
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
        icon: Box,
        description: "Manage active services",
      },
      {
        name: "View Orders",
        href: "/dashboard/orders",
        icon: ShoppingBag,
        description: "Complete order history",
      },
      {
        name: "Transactions",
        href: "/dashboard/transactions",
        icon: Receipt,
        description: "Payment history & invoices",
      },
      {
        name: "Support Tickets",
        href: "/dashboard/tickets",
        icon: MessageSquare,
        description: "Get help & support",
      },
      {
        name: "Support Chat",
        href: "/dashboard/support",
        icon: MessageSquare,
        description: "Live chat with support",
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
        icon: User,
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
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  const notifications = useNotificationStore(state => state.notifications);
  const unreadNotifications = useNotificationStore(state => state.unreadCount);
  const fetchStoreNotifications = useNotificationStore(state => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);
  const subscribeToRealtime = useNotificationStore(state => state.subscribeToRealtime);
  const unsubscribeFromRealtime = useNotificationStore(state => state.unsubscribeFromRealtime);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

  const loadBadgeCounts = useCallback(async () => {
    try {
      const [ticketRes, chatRes] = await Promise.allSettled([
        fetchTickets(),
        fetchUserSupportChat(),
      ]);

      if (ticketRes.status === "fulfilled") {
        const tickets = ticketRes.value.data.tickets || ticketRes.value.data || [];
        const openCount = Array.isArray(tickets)
          ? tickets.filter((t: any) => t.status === "open" || t.status === "pending").length
          : 0;
        setUnreadTickets(openCount);
      }

      if (chatRes.status === "fulfilled") {
        const chats = chatRes.value.data;
        const unread = Array.isArray(chats)
          ? chats.filter((c: any) => c.unread_count > 0).length
          : chats?.unread_count || 0;
        setUnreadChats(unread);
      }

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
    return () => unsubscribeFromRealtime();
  }, [loadBadgeCounts, subscribeToRealtime, unsubscribeFromRealtime]);

  // Clear badge when navigating to the page
  useEffect(() => {
    if (location.pathname.includes("/dashboard/tickets")) setUnreadTickets(0);
    if (location.pathname.includes("/dashboard/support")) setUnreadChats(0);
  }, [location.pathname]);

  // Map href -> badge count
  const getBadgeCount = (href: string): number => {
    if (href === "/dashboard/tickets") return unreadTickets;
    if (href === "/dashboard/support") return unreadChats;
    if (href === "/dashboard/notifications") return unreadNotifications;
    return 0;
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
      <div className={`flex items-center gap-3 px-4 py-6 transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}>
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
        {!isCollapsed && (
          <div className="flex-shrink-0">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadNotifications}
              markAsRead={markAllAsRead}
            />
          </div>
        )}
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
              <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                {section.title}
              </div>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <SidebarTooltip key={item.name} content={item.name} show={isCollapsed}>
                    <Link
                      to={item.href}
                      onClickCapture={handleMobileClick}
                      className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${active
                        ? "bg-primary text-white font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        } ${isCollapsed ? "justify-center px-2" : ""}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${active ? "text-white" : ""}`} />
                        {item.isCart && cartCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center border border-background">
                            {cartCount > 9 ? "9+" : cartCount}
                          </span>
                        )}
                        {!item.isCart && getBadgeCount(item.href) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center border border-background animate-pulse">
                            {getBadgeCount(item.href) > 9 ? "9+" : getBadgeCount(item.href)}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}

                      {!isCollapsed && getBadgeCount(item.href) > 0 && !active && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {getBadgeCount(item.href) > 99 ? "99+" : getBadgeCount(item.href)}
                        </span>
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
