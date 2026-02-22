import { Subscription } from "@rails/actioncable";
import { getCableConsumer } from "../services/cable";

export const disconnectConsumer = (): void => {
    getCableConsumer().disconnect();
};

export const subscribeToNotifications = (
    onReceived: (data: unknown) => void
): Subscription => {
    const cable = getCableConsumer();

    return cable.subscriptions.create("NotificationChannel", {
        received: onReceived,
        connected() {
            console.log("[ActionCable] Connected to NotificationChannel");
        },
        disconnected() {
            console.log("[ActionCable] Disconnected from NotificationChannel");
        },
    });
};

export const unsubscribe = (subscription: Subscription): void => {
    subscription.unsubscribe();
};
