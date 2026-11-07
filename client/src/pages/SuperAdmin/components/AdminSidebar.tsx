import { useState, useEffect, useCallback, type ComponentType, type SVGProps } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Sun, Moon, LogOut, Menu, Search, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import NotificationBell from "../../../components/NotificationBell";
import { useThemeStore } from "@/store/themeStore";
import { useNotificationStore } from "@/store/notificationStore";
import { formatImageUrl } from "../../../services/api";
import logo from "@/assets/images/proxysock-wordmark.svg";
import lightLogo from "@/assets/images/proxysock-wordmark-light.svg";
import nodeLogo from "@/assets/images/favicon.svg";
import "@/components/dashboard/layout/sidebar.css";
import "./workspace-theme.css";
import "@/pages/UserDashboard/dashboard-home.css";
import "@/pages/UserDashboard/proxy-management.css";
import "./workspace-kit.css";

export interface SidebarItem {
    id: string;
    name: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    count?: string | number;
    badge?: string;
}

export interface SidebarGroup {
    label?: string;
    items: SidebarItem[];
}

interface AdminSidebarProps {
    groups?: SidebarGroup[];
    items?: SidebarItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    onOpenCommandPalette?: () => void;
    title: string;
    userName: string;
    userRole: string;
    profilePictureUrl?: string;
    accentColor?: string;
    fetchNotifications?: () => Promise<any>;
    markNotificationsAsRead?: () => Promise<any>;
}

// Staff and reseller workspace navigation, styled like the customer dashboard sidebar.
export default function AdminSidebar({
    groups: groupsProp,
    items: itemsProp,
    activeTab,
    onTabChange,
    onOpenCommandPalette,
    title,
    userName,
    userRole,
    profilePictureUrl,
    fetchNotifications,
    markNotificationsAsRead,
}: AdminSidebarProps) {
    const groups: SidebarGroup[] = groupsProp ?? (itemsProp ? [{ items: itemsProp }] : []);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(() => localStorage.getItem("adminSidebarCollapsed") === "true");
    const [isMobile, setIsMobile] = useState(() => globalThis.innerWidth < 1024);
    const [failedAvatar, setFailedAvatar] = useState<string>();

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
            await Promise.all([fetchStoreNotifications(), fetchUnreadCount()]);
        } catch { /* silent */ }
    }, [fetchStoreNotifications, fetchUnreadCount]);

    useEffect(() => {
        loadNotifications();
        subscribeToRealtime();
        return () => unsubscribeFromRealtime();
    }, [loadNotifications, subscribeToRealtime, unsubscribeFromRealtime]);

    useEffect(() => {
        const check = () => {
            const mobile = globalThis.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(false);
        };
        check();
        globalThis.addEventListener("resize", check);
        return () => globalThis.removeEventListener("resize", check);
    }, []);

    const toggleCollapse = () => {
        setDesktopCollapsed(prev => {
            const next = !prev;
            localStorage.setItem("adminSidebarCollapsed", String(next));
            return next;
        });
    };

    const handleTabClick = (id: string) => {
        onTabChange(id);
        setSidebarOpen(false);
    };

    const showBell = Boolean(fetchNotifications && markNotificationsAsRead);
    const avatarUrl = profilePictureUrl ? formatImageUrl(profilePictureUrl) : undefined;
    const initials = userName?.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2) || "?";

    const renderNav = (mobile: boolean) => {
        const isCollapsed = !mobile && desktopCollapsed;
        return (
            <aside className={`workspace-sidebar ${dark ? "workspace-sidebar-dark" : ""} ${isCollapsed ? "is-collapsed" : ""}`} aria-label={`${title} sidebar`}>
                <div className="workspace-brand">
                    <Link to="/" aria-label="ProxySock home" title={isCollapsed ? "ProxySock home" : undefined}>
                        {isCollapsed ? <img src={nodeLogo} alt="ProxySock" className="workspace-brand-symbol" /> : <img src={dark ? logo : lightLogo} alt="ProxySock" />}
                    </Link>
                    <button type="button" className="workspace-icon-button" aria-label={mobile ? "Close navigation" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={mobile ? "Close navigation" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => mobile ? setSidebarOpen(false) : toggleCollapse()}>
                        {mobile ? <X /> : isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                    </button>
                </div>

                <div className="workspace-wallet workspace-role">
                    {!isCollapsed && <span className="workspace-caption">Workspace</span>}
                    {isCollapsed ? <span className="workspace-role-mark" title={title}>{title.charAt(0)}</span> : <strong>{title}</strong>}
                </div>

                {onOpenCommandPalette && (
                    <div className="workspace-search">
                        <button type="button" onClick={() => { setSidebarOpen(false); onOpenCommandPalette(); }} aria-label="Open command palette" title={isCollapsed ? "Search (⌘K)" : undefined}>
                            <Search aria-hidden="true" />
                            {!isCollapsed && <><span>Search…</span><kbd>⌘K</kbd></>}
                        </button>
                    </div>
                )}

                <nav className="workspace-navigation" aria-label={`${title} navigation`}>
                    {groups.map((group, index) => (
                        <div className="workspace-nav-group" key={group.label || index}>
                            {group.label && <h2 className={isCollapsed ? "sr-only" : "workspace-caption"}>{group.label}</h2>}
                            {group.items.map(item => {
                                const active = activeTab === item.id;
                                const count = Number(item.count) || 0;
                                const Icon = item.icon;
                                return (
                                    <button type="button" key={item.id} onClick={() => handleTabClick(item.id)} className="workspace-nav-link" aria-label={item.name} aria-current={active ? "page" : undefined} title={isCollapsed ? item.name : undefined}>
                                        <Icon aria-hidden="true" />
                                        {!isCollapsed && <span className="workspace-link-label">{item.name}</span>}
                                        {count > 0 && <span className="workspace-count" aria-label={`${count} updates`}>{count > 99 ? "99+" : count}</span>}
                                        {item.badge && item.badge !== "!" && !count && !isCollapsed && <span className="workspace-count">{item.badge}</span>}
                                        {item.badge === "!" && !count && <span className="workspace-activity" aria-label="New activity" />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="workspace-account">
                    <div className="workspace-utilities">
                        {showBell && <span className="workspace-bell"><NotificationBell notifications={notifications} unreadCount={unreadCount} markAsRead={markAllAsRead} /></span>}
                        <button type="button" className="workspace-icon-button" onClick={toggleDark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun /> : <Moon />}</button>
                        <Link to="/" className="workspace-icon-button" aria-label="Back to website" title="Back to website"><Home /></Link>
                    </div>
                    <div className="workspace-profile-row">
                        <div className="workspace-profile" title={isCollapsed ? `${userName} (${userRole})` : undefined}>
                            <span className="workspace-avatar">{avatarUrl && failedAvatar !== avatarUrl ? <img src={avatarUrl} alt="" onError={() => setFailedAvatar(avatarUrl)} /> : initials}</span>
                            {!isCollapsed && <span className="workspace-profile-copy"><strong>{userName}</strong><span className="capitalize">{userRole}</span></span>}
                        </div>
                        <button type="button" className="workspace-icon-button workspace-logout" onClick={() => handleTabClick("logout")} aria-label="Log out" title="Log out"><LogOut /></button>
                    </div>
                </div>
            </aside>
        );
    };

    return (
        <>
            <div className={`hidden lg:block flex-shrink-0 h-screen transition-[width] duration-200 motion-reduce:transition-none ${desktopCollapsed ? "w-[80px]" : "w-[260px]"}`}>
                {!isMobile && renderNav(false)}
            </div>

            {isMobile && (
                <>
                    <div className="workspace-mobile-bar lg:hidden">
                        <button id="workspace-menu-toggle" type="button" aria-label="Open navigation" aria-expanded={isSidebarOpen} onClick={() => setSidebarOpen(true)}>
                            <Menu aria-hidden="true" />
                        </button>
                        <span>{title}</span>
                        {showBell ? <NotificationBell notifications={notifications} unreadCount={unreadCount} markAsRead={markAllAsRead} /> : <span className="w-8" />}
                    </div>
                    <Dialog.Root open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                        <Dialog.Portal>
                            <Dialog.Overlay className="workspace-mobile-overlay" />
                            <Dialog.Content className={`workspace-mobile-drawer workspace-theme landing-theme ${dark ? "dark" : ""}`} aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); document.getElementById("workspace-menu-toggle")?.focus(); }}>
                                <Dialog.Title className="sr-only">{title} navigation</Dialog.Title>
                                {renderNav(true)}
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </>
            )}
        </>
    );
}
