import { createConsumer, Consumer } from "@rails/actioncable";

const WS_URL = (import.meta.env.VITE_WS_URL || "ws://localhost:3000/cable");

let consumer: Consumer | null = null;
let currentToken: string | null = null;
let currentGuestToken: string | null = null;

export const getCableConsumer = (): Consumer => {
    // Determine the active token (try user, then reseller, then employee, then fallback to guest)
    const activeToken = localStorage.getItem("token")
        || localStorage.getItem("resellerToken")
        || localStorage.getItem("employeeToken");

    const activeGuestToken = localStorage.getItem("guest_session_token");

    // Rebuild consumer if tokens changed
    if (!consumer || activeToken !== currentToken || activeGuestToken !== currentGuestToken) {
        if (consumer) {
            consumer.disconnect();
        }

        currentToken = activeToken;
        currentGuestToken = activeGuestToken;

        // Construct WebSocket connection URL with tokens
        const url = new URL(WS_URL);
        if (activeToken) {
            url.searchParams.append("token", activeToken);
        }
        if (activeGuestToken) {
            url.searchParams.append("guest_token", activeGuestToken);
        }

        consumer = createConsumer(url.toString());
    }

    return consumer;
};
