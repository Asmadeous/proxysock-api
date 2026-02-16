import { createConsumer, Consumer, Subscription } from "@rails/actioncable";
import { getStoredToken } from "./railsApi";

const CABLE_URL =
    import.meta.env.VITE_RAILS_CABLE_URL ||
    "ws://localhost:3000/cable";

let consumer: Consumer | null = null;

// Get or create ActionCable consumer
export const getConsumer = (): Consumer => {
    if (!consumer) {
        const token = getStoredToken();
        const url = token ? `${CABLE_URL}?token=${token}` : CABLE_URL;
        consumer = createConsumer(url);
    }
    return consumer;
};

// Disconnect consumer
export const disconnectConsumer = (): void => {
    if (consumer) {
        consumer.disconnect();
        consumer = null;
    }
};

// Subscribe to notifications channel
export const subscribeToNotifications = (
    onReceived: (data: unknown) => void
): Subscription => {
    const cable = getConsumer();

    return cable.subscriptions.create("NotificationsChannel", {
        received: onReceived,
        connected() {
            console.log("[ActionCable] Connected to NotificationsChannel");
        },
        disconnected() {
            console.log("[ActionCable] Disconnected from NotificationsChannel");
        },
    });
};

// Unsubscribe from a subscription
export const unsubscribe = (subscription: Subscription): void => {
    subscription.unsubscribe();
};
