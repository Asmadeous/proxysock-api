import { useState, useEffect } from "react";
import { BellIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
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
    fetchNotifications: () => Promise<any>;
    markAsRead: () => Promise<any>;
}

export default function NotificationBell({ fetchNotifications, markAsRead }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [markingRead, setMarkingRead] = useState(false);

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
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleMarkAllRead = async () => {
        setMarkingRead(true);
        try {
            await markAsRead();
            setUnreadCount(0);
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
        } catch (e) {
            // silent
        } finally {
            setMarkingRead(false);
        }
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
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
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
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            disabled={markingRead}
                                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50"
                                            title="Mark all as read"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            {markingRead ? "Marking..." : "Mark all read"}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">
                                        You have no notifications.
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} className={`p-4 border-b border-border hover:bg-muted/50 transition-colors ${!n.read_at ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {!n.read_at && (
                                                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                                    )}
                                                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                                                </div>
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
    );
}
