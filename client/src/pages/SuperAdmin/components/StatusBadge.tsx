interface StatusBadgeProps {
    status: string;
    size?: "sm" | "md";
}

const TONES: Record<string, "good" | "bad" | "wait" | "info"> = {
    active: "good", succeeded: "good", completed: "good", published: "good", approved: "good", paid: "good", delivered: "good", resolved: "good",
    pending: "wait", awaiting_payment: "wait", provisioning: "wait", refunded: "wait", suspended: "wait",
    processing: "info", open: "info", in_progress: "info",
    failed: "bad", error: "bad", rejected: "bad", cancelled: "bad", expired: "bad",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const value = String(status || "unknown");
    return (
        <span className="ws-status" data-tone={TONES[value.toLowerCase()]} style={size === "md" ? { fontSize: 11, padding: "5px 9px" } : undefined}>
            {value.replace(/_/g, " ")}
        </span>
    );
}
