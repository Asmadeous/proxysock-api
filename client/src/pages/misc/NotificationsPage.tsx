"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bell, CheckCheck, Filter, Volume2, VolumeX } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    success: "bg-emerald-500",
    system_alert: "bg-purple-500",
};

const categoryLabels: Record<string, string> = {
    info: "Information",
    warning: "Warning",
    error: "Error",
    success: "Success",
    system_alert: "System Alert",
};

export default function NotificationsPage() {
    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        isLoading,
        soundEnabled,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        toggleSound,
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "unread" && n.read) return false;
        if (filter === "read" && !n.read) return false;
        if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
        return true;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Helmet>
                <title>Notifications - ProxySock</title>
            </Helmet>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground mt-1">
                            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSound}
                        className="gap-2"
                    >
                        {soundEnabled ? (
                            <>
                                <Volume2 className="h-4 w-4" />
                                Sound On
                            </>
                        ) : (
                            <>
                                <VolumeX className="h-4 w-4" />
                                Sound Off
                            </>
                        )}
                    </Button>

                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="gap-2"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters:</span>
                        </div>

                        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="unread">Unread</SelectItem>
                                <SelectItem value="read">Read</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="info">Information</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="system_alert">System Alert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {/* Notification List */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Bell className="h-12 w-12 mb-3 opacity-30" />
                            <p>No notifications found</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((notification) => {
                                // Determine navigation target based on category and metadata
                                const getNotificationLink = (): string | null => {
                                    const meta = notification.metadata || {};
                                    const path = window.location.pathname;
                                    const isAdmin = path.startsWith('/admin') || path.startsWith('/sadmin') || path.startsWith('/employee');
                                    const isReseller = path.startsWith('/reseller');
                                    const adminPrefix = path.startsWith('/sadmin') ? '/sadmin' : (path.startsWith('/employee') ? '/employee' : '/admin');

                                    // Use metadata link only if it's a valid absolute path or external URL
                                    if (meta.link && typeof meta.link === 'string' && (meta.link.startsWith('/') || meta.link.startsWith('http'))) return meta.link;
                                    if (meta.url && typeof meta.url === 'string' && (meta.url.startsWith('/') || meta.url.startsWith('http'))) return meta.url;

                                    // Category-based routing
                                    const cat = notification.category;
                                    const title = notification.title?.toLowerCase() || "";
                                    const msg = notification.message?.toLowerCase() || "";

                                    if (cat === "order" || title.includes("order")) {
                                        if (isAdmin) return `${adminPrefix}/orders`;
                                        if (isReseller) return "/reseller/orders";
                                        return "/dashboard/orders";
                                    }
                                    if (title.includes("ticket")) {
                                        if (isAdmin) return `${adminPrefix}/tickets`;
                                        if (isReseller) return "/reseller/tickets";
                                        return "/dashboard/support?tab=tickets";
                                    }
                                    if (title.includes("guest chat")) {
                                        if (isAdmin) return `${adminPrefix}/guest_chats`;
                                        return null;
                                    }
                                    if (title.includes("support")) {
                                        if (isAdmin) return `${adminPrefix}/support_chats`;
                                        if (isReseller) return "/reseller/support";
                                        return "/dashboard/support?tab=chat";
                                    }
                                    if (title.includes("transaction") || title.includes("payment") || title.includes("deposit") || title.includes("refund")) {
                                        if (isAdmin) return `${adminPrefix}/transactions`;
                                        if (isReseller) return "/reseller/wallet";
                                        return "/dashboard/transactions";
                                    }
                                    if (title.includes("rdp") || msg.includes("rdp")) {
                                        const searchParam = meta.hostname || meta.rdp_host || (msg.match(/[\w-]+\.proxysock\.net/) || [])[0];
                                        const query = searchParam ? `&search=${searchParam}` : "";
                                        
                                        if (isAdmin) return `${adminPrefix}/management?type=rdp${query}`;
                                        if (isReseller) return `/reseller/rdp-management${query}`;
                                        return `/dashboard/RDP-management${query}`;
                                    }
                                    if (title.includes("vm") || title.includes("vps") || msg.includes("vm") || msg.includes("vps")) {
                                        const searchParam = meta.hostname || meta.vps_host || (msg.match(/[\w-]+\.proxysock\.net/) || [])[0];
                                        const query = searchParam ? `&search=${searchParam}` : "";
                                        
                                        if (isAdmin) return `${adminPrefix}/management?type=vps${query}`;
                                        if (isReseller) return `/reseller/vps-management${query}`;
                                        return `/dashboard/VPS-management${query}`;
                                    }
                                    if (title.includes("esim") || msg.includes("esim")) {
                                        const searchParam = meta.iccid || meta.order_no || (msg.match(/ICCID:?\s*([\w]+)/i) || [])[1];
                                        const query = searchParam ? `?search=${searchParam}` : "";

                                        if (isAdmin) return `${adminPrefix}/management?type=esim${query.replace('?', '&')}`;
                                        if (isReseller) return `/reseller/esim-management${query}`;
                                        return `/dashboard/Esim-management${query}`;
                                    }
                                    if (title.includes("proxy") || msg.includes("proxy")) {
                                        const searchParam = meta.order_id || meta.order_no || (msg.match(/#(\d+)/) || [])[1];
                                        const query = searchParam ? `?search=${searchParam}` : "";

                                        if (isAdmin) return `${adminPrefix}/management?type=proxy${query.replace('?', '&')}`;
                                        if (isReseller) return `/reseller/proxy-management${query}`;
                                        return `/dashboard/proxy-management${query}`;
                                    }
                                    if (title.includes("vpn") || msg.includes("vpn")) {
                                        const searchParam = meta.order_id || meta.order_no || (msg.match(/#(\d+)/) || [])[1];
                                        const query = searchParam ? `?search=${searchParam}` : "";

                                        if (isAdmin) return `${adminPrefix}/management?type=vpn${query.replace('?', '&')}`;
                                        if (isReseller) return `/reseller/vpn-management${query}`;
                                        return `/dashboard/vpn-management${query}`;
                                    }
                                    return null;
                                };

                                const link = getNotificationLink();

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-4 py-4 px-2 rounded-lg transition-colors -mx-2 group",
                                            !notification.read && "bg-primary/5",
                                            link ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                                        )}
                                        onClick={() => {
                                            if (!notification.read) {
                                                markAsRead(notification.id);
                                            }
                                            if (link) {
                                                // Ensure link is absolute to prevent 404s from relative navigation
                                                const finalLink = link.startsWith("/") || link.startsWith("http") ? link : `/${link}`;
                                                navigate(finalLink);
                                            }
                                        }}
                                    >
                                        {/* Category badge */}
                                        <div
                                            className={cn(
                                                "flex-shrink-0 w-3 h-3 rounded-full mt-2",
                                                categoryColors[notification.category] || "bg-gray-500"
                                            )}
                                        />

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold">{notification.title}</p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {categoryLabels[notification.category] || notification.category}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {!notification.read && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                                                            New
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDate(notification.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {notification.message}
                                            </p>
                                            {link && (
                                                <span className="text-xs text-primary font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    View details →
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
