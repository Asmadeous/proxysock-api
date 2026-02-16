import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    Notification,
    getNotifications,
    getUnreadCount,
    markAsRead as apiMarkAsRead,
    markAllAsRead as apiMarkAllAsRead,
} from "../services/notificationService";
import {
    subscribeToNotifications,
    unsubscribe,
    disconnectConsumer,
} from "../lib/actionCable";
import type { Subscription } from "@rails/actioncable";

interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    soundEnabled: boolean;
    subscription: Subscription | null;

    // Actions
    fetchNotifications: (page?: number) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    toggleSound: () => void;
    playNotificationSound: () => void;
    subscribeToRealtime: () => void;
    unsubscribeFromRealtime: () => void;
}

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND_URL = "/sounds/notification.mp3";

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            soundEnabled: true,
            subscription: null,

            fetchNotifications: async (page = 1) => {
                set({ isLoading: true });
                try {
                    const response = await getNotifications(page);
                    set({ notifications: response.notifications, isLoading: false });
                } catch (error) {
                    console.error("Failed to fetch notifications:", error);
                    set({ isLoading: false });
                }
            },

            fetchUnreadCount: async () => {
                try {
                    const count = await getUnreadCount();
                    set({ unreadCount: count });
                } catch (error) {
                    console.error("Failed to fetch unread count:", error);
                }
            },

            addNotification: (notification: Notification) => {
                const { notifications, soundEnabled, playNotificationSound } = get();

                // Add to beginning of list
                set({
                    notifications: [notification, ...notifications].slice(0, 50), // Keep max 50
                    unreadCount: get().unreadCount + 1,
                });

                // Play sound if enabled
                if (soundEnabled) {
                    playNotificationSound();
                }
            },

            markAsRead: async (id: number) => {
                try {
                    await apiMarkAsRead(id);
                    set((state) => ({
                        notifications: state.notifications.map((n) =>
                            n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1),
                    }));
                } catch (error) {
                    console.error("Failed to mark as read:", error);
                }
            },

            markAllAsRead: async () => {
                try {
                    await apiMarkAllAsRead();
                    set((state) => ({
                        notifications: state.notifications.map((n) => ({
                            ...n,
                            read: true,
                            read_at: new Date().toISOString(),
                        })),
                        unreadCount: 0,
                    }));
                } catch (error) {
                    console.error("Failed to mark all as read:", error);
                }
            },

            toggleSound: () => {
                set((state) => ({ soundEnabled: !state.soundEnabled }));
            },

            playNotificationSound: () => {
                try {
                    const audio = new Audio(NOTIFICATION_SOUND_URL);
                    audio.volume = 0.5;
                    audio.play().catch((e) => {
                        // Ignore autoplay errors
                        console.log("Could not play notification sound:", e.message);
                    });
                } catch (error) {
                    console.error("Error playing sound:", error);
                }
            },

            subscribeToRealtime: () => {
                const { subscription, addNotification } = get();

                // Already subscribed
                if (subscription) return;

                const newSubscription = subscribeToNotifications((data) => {
                    // Transform ActionCable data to Notification format
                    const notification: Notification = {
                        id: (data as Record<string, unknown>).id as number,
                        category: (data as Record<string, unknown>).category as Notification["category"],
                        title: (data as Record<string, unknown>).title as string,
                        message: (data as Record<string, unknown>).message as string,
                        metadata: ((data as Record<string, unknown>).metadata as Record<string, unknown>) || {},
                        read: false,
                        read_at: null,
                        created_at: (data as Record<string, unknown>).created_at as string,
                    };
                    addNotification(notification);
                });

                set({ subscription: newSubscription });
            },

            unsubscribeFromRealtime: () => {
                const { subscription } = get();
                if (subscription) {
                    unsubscribe(subscription);
                    set({ subscription: null });
                }
                disconnectConsumer();
            },
        }),
        {
            name: "notification-settings",
            partialize: (state) => ({ soundEnabled: state.soundEnabled }),
        }
    )
);
