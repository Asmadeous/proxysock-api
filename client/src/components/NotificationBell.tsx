<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    success: "bg-emerald-500",
    system_alert: "bg-purple-500",
};

const categoryIcons: Record<string, string> = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    success: "✅",
    system_alert: "🔔",
};

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        isLoading,
        soundEnabled,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        toggleSound,
        subscribeToRealtime,
        unsubscribeFromRealtime,
    } = useNotificationStore();

    // Initial fetch and WebSocket subscription
    useEffect(() => {
        fetchUnreadCount();
        subscribeToRealtime();

        return () => {
            unsubscribeFromRealtime();
        };
    }, [fetchUnreadCount, subscribeToRealtime, unsubscribeFromRealtime]);

    // Fetch notifications when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleNotificationClick = (notification: typeof notifications[0]) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    const hasUnread = unreadCount > 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div
                    className="relative flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex-shrink-0"
                    role="button"
                    tabIndex={0}
                    aria-label="Notifications"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            setIsOpen(true);
                        }
                    }}
                >
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {/* Red dot indicator for unread */}
                    {hasUnread && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border-2 border-background" />
                    )}
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        {hasUnread && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleSound}
                            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                        >
                            {soundEnabled ? (
                                <Volume2 className="h-4 w-4" />
                            ) : (
                                <VolumeX className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                </DialogHeader>

                {/* Mark all as read button */}
                {hasUnread && (
                    <div className="flex justify-end py-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="gap-2"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    </div>
                )}

                {/* Notification List */}
                <ScrollArea className="h-80 -mx-6 px-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Bell className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    className={cn(
                                        "flex gap-3 w-full text-left px-2 py-3 hover:bg-muted/50 rounded-lg transition-colors",
                                        !notification.read && "bg-primary/5"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            handleNotificationClick(notification);
                                        }
                                    }}
                                >
                                    {/* Category indicator */}
                                    <div
                                        className={cn(
                                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm",
                                            categoryColors[notification.category] || "bg-gray-500"
                                        )}
                                    >
                                        {categoryIcons[notification.category] || "📢"}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm truncate">
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatTime(notification.created_at)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="border-t pt-4 -mx-6 px-6">
                    <Link to="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                            View all notifications
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
=======
import { useState, useEffect } from "react";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
    id: number;
    title: string;
    message: string;
    category: string;
    read_at: string | null;
    created_at: string;
}

interface NotificationBellProps {
    fetchNotifications: () => Promise<{ data: { notifications: Notification[], unread_count: number } }>;
    markAsRead: () => Promise<any>;
}

export default function NotificationBell({ fetchNotifications, markAsRead }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchNotifications();
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unread_count || 0);
            } catch (e) {
                // silent
            }
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleOpen = () => {
        setOpen(true);
        if (unreadCount > 0) {
            markAsRead().then(() => setUnreadCount(0)).catch();
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none outline-none ring-0"
                title="Notifications"
            >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            onClick={handleClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-background border border-border rounded-xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 flex-shrink-0">
                                <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                                <button
                                    onClick={handleClose}
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">
                                        You have no notifications.
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} className={`p-4 border-b border-border hover:bg-muted/50 transition-colors ${!n.read_at ? 'bg-primary/5' : ''}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    );
}
