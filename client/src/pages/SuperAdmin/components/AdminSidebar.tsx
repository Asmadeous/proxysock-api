import { useState, useEffect, useCallback, type ComponentType, type SVGProps } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import NotificationBell from "../../../components/NotificationBell";
import { useThemeStore } from "@/store/themeStore";
import { Home, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/store/notificationStore";
import { formatImageUrl } from "../../../services/api";

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


export interface SidebarItem {
    id: string;
    name: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    count?: string | number;
    badge?: string;
}

interface AdminSidebarProps {
    items: SidebarItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    title: string;
    userName: string;
    userRole: string;
    profilePictureUrl?: string;
    accentColor?: string;
    fetchNotifications?: () => Promise<any>;
    markNotificationsAsRead?: () => Promise<any>;
}

export default function AdminSidebar({
    items,
    activeTab,
    onTabChange,
    title,
    userName,
    userRole,
    profilePictureUrl,
    fetchNotifications,
    markNotificationsAsRead,
}: AdminSidebarProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const notifications = useNotificationStore(state => state.notifications);
    const unreadCount = useNotificationStore(state => state.unreadCount);
    const fetchStoreNotifications = useNotificationStore(state => state.fetchNotifications);
    const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);
    const subscribeToRealtime = useNotificationStore(state => state.subscribeToRealtime);
    const unsubscribeFromRealtime = useNotificationStore(state => state.unsubscribeFromRealtime);
    const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

    const { dark, toggleDark } = useThemeStore();

    const loadNotifications = useCallback(async () => {
        try {
            await Promise.all([
                fetchStoreNotifications(),
                fetchUnreadCount()
            ]);
        } catch (e) { /* silent */ }
    }, [fetchStoreNotifications, fetchUnreadCount]);

    useEffect(() => {
        loadNotifications();
        subscribeToRealtime();
        return () => unsubscribeFromRealtime();
    }, [loadNotifications, subscribeToRealtime, unsubscribeFromRealtime]);

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem("adminSidebarCollapsed");
        if (saved) setIsCollapsed(saved === "true");
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("adminSidebarCollapsed", String(next));
            return next;
        });
    };

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(false);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const handleTabClick = (id: string) => {
        onTabChange(id);
        if (isMobile) setSidebarOpen(false);
    };

    const activeBg = `bg-primary`;
    const activeTxt = `text-primary-foreground`;

    const renderNav = () => (
        <div className="h-full flex flex-col bg-background border-r border-border relative">
            {/* Collapse Toggle (Desktop Only) */}
            {!isMobile && (
                <button
                    className={`absolute -right-3 top-6 rounded-full border border-border bg-background shadow-md z-20 hover:bg-muted flex items-center justify-center transition-all duration-300 ${isCollapsed ? "h-6 w-6 scale-90" : "h-8 w-8 scale-110"}`}
                    onClick={toggleCollapse}
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
            )}

            {/* Logo */}
            <div className={`px-4 py-4 border-b border-border flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
                <h1 className={`text-xl font-bold text-foreground transition-all duration-300 ${isCollapsed ? "scale-0 w-0 hidden" : "w-auto"}`}>
                    {title}
                </h1>
                <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : ""}`}>
                    {fetchNotifications && markNotificationsAsRead && (
                        <NotificationBell
                            notifications={notifications}
                            unreadCount={unreadCount}
                            markAsRead={markAllAsRead}
                        />
                    )}
                    {isMobile && (
                        <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground lg:hidden">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Nav */}
            <nav className={`flex-1 px-3 py-3 overflow-y-auto custom-scrollbar ${isCollapsed ? "space-y-1" : "space-y-0.5"}`}>
                {items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <SidebarTooltip key={item.id} content={item.name} show={!isMobile && isCollapsed}>
                            <button
                                onClick={() => handleTabClick(item.id)}
                                className={`w-full flex items-center py-2.5 rounded-xl transition-all text-sm
                                ${isActive ? `${activeBg} ${activeTxt} font-medium shadow-sm` : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
                                ${isCollapsed ? "justify-center px-1" : "px-3"}`}
                            >
                                <div className="relative flex items-center justify-center">
                                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-primary-foreground" : ""}`} />
                                    {item.count != null && isCollapsed && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center border border-background">
                                            {Number(item.count) > 9 ? "9+" : item.count}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <span className="flex-1 text-left truncate ml-3">{item.name}</span>
                                        {item.count != null && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full ml-1 ${isActive ? "bg-background/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{item.count}</span>
                                        )}
                                        {item.badge && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full ml-1 ${isActive ? "bg-background/20 text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        </SidebarTooltip>
                    );
                })}
            </nav>

            {/* Profile & Footer Actions */}
            <div className="p-3 border-t border-border bg-muted/30 space-y-2">
                {/* Theme Toggle */}
                <SidebarTooltip content="Toggle Theme" show={!isMobile && isCollapsed}>
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
                <SidebarTooltip content="Home" show={!isMobile && isCollapsed}>
                    <Link
                        to="/"
                        className={`flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-foreground hover:bg-background border border-transparent hover:border-border transition-all ${isCollapsed ? "justify-center" : ""}`}
                    >
                        <Home className="h-4.5 w-4.5 shrink-0" />
                        {!isCollapsed && <span className="font-medium">Home</span>}
                    </Link>
                </SidebarTooltip>

                {/* User Profile Info */}
                <div className={`flex items-center bg-muted/80 rounded-xl mt-2 ${isCollapsed ? "justify-center p-2" : "space-x-3 p-3 overflow-hidden"}`}>
                    <SidebarTooltip content={`${userName} (${userRole})`} show={!isMobile && isCollapsed}>
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 cursor-default overflow-hidden">
                            {profilePictureUrl ? (
                                <img src={formatImageUrl(profilePictureUrl)} alt={userName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-primary-foreground font-medium text-sm">{userName?.charAt(0)?.toUpperCase() || "?"}</span>
                            )}
                        </div>
                    </SidebarTooltip>
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );

    return (
        <div className={`landing-theme ${dark ? "dark" : ""} bg-background`}>
            {/* Desktop Sidebar */}
            <div className={`hidden lg:block flex-shrink-0 h-screen transition-all duration-300 ease-in-out ${isCollapsed ? "w-[80px]" : "w-64"}`}>
                {renderNav()}
            </div>

            {/* Mobile Header */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 z-30 bg-background border-b border-border p-3 flex items-center justify-between lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                        {isSidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                    </button>
                    <h1 className="text-lg font-bold text-foreground">{title}</h1>
                    <div className="flex items-center gap-2">
                        {fetchNotifications && markNotificationsAsRead && (
                            <NotificationBell
                                notifications={notifications}
                                unreadCount={unreadCount}
                                markAsRead={markAllAsRead}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden h-screen">{renderNav()}</div>
                </>
            )}
        </div>
    );
}

