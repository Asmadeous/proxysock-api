import { createConsumer, Consumer } from "@rails/actioncable";

const WS_URL = (import.meta.env.VITE_WS_URL || "ws://localhost:3000/cable");

let consumer: Consumer | null = null;
let currentToken: string | null = null;
let currentGuestToken: string | null = null;

export const getCableConsumer = (): Consumer => {
    // Determine the active token based on current app section
    let activeToken = null;
    const path = window.location.pathname;

    if (path.startsWith("/admin") || path.startsWith("/employee")) {
        activeToken = localStorage.getItem("adminToken") || localStorage.getItem("employeeToken");
    } else if (path.startsWith("/reseller")) {
        activeToken = localStorage.getItem("resellerToken");
    } else {
        activeToken = localStorage.getItem("authToken");
    }

    const activeGuestToken = localStorage.getItem("guestChat") ? JSON.parse(localStorage.getItem("guestChat")!).sessionToken : null;

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
