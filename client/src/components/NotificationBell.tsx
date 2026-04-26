import { useState } from "react";
import { BellIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/store/notificationStore";

interface Notification {
    id: number;
    title: string;
    message: string;
    category: string;
    read_at: string | null;
    created_at: string;
}

interface NotificationBellProps {
    notifications?: Notification[];
    unreadCount?: number;
    markAsRead?: () => Promise<any>;
}

export default function NotificationBell({ notifications: propNotifications, unreadCount: propCount, markAsRead: propMarkAsRead }: NotificationBellProps) {
    const storeNotifications = useNotificationStore(state => state.notifications);
    const storeUnreadCount = useNotificationStore(state => state.unreadCount);
    const storeMarkAllAsRead = useNotificationStore(state => state.markAllAsRead);

    const notifications = propNotifications ?? storeNotifications;
    const unreadCount = propCount ?? storeUnreadCount;
    const markAsRead = propMarkAsRead ?? storeMarkAllAsRead;

    const [open, setOpen] = useState(false);
    const [markingRead, setMarkingRead] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleMarkAllRead = async () => {
        setMarkingRead(true);
        try {
            await markAsRead();
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
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-60" />
                        <span className="relative flex h-4 w-4 rounded-full bg-red-500 items-center justify-center text-[9px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div
                            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
                            onClick={handleClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed top-24 left-1/2 w-[90vw] max-w-sm bg-background border border-border rounded-xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[70vh]"
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
                                    notifications
                                        .filter(n => n && n.id && n.created_at) // Extra safety check
                                        .map((n) => (
                                            <div key={n.id} className={`p-4 border-b border-border hover:bg-muted/50 transition-colors ${!n.read_at ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {!n.read_at && (
                                                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                                        )}
                                                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                                                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
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
