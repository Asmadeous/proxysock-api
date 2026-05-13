interface StatusBadgeProps {
    status: string;
    size?: "sm" | "md";
}

const STATUS_COLORS: Record<string, string> = {
    active: "text-green-400 bg-green-500/10",
    succeeded: "text-green-400 bg-green-500/10",
    completed: "text-green-400 bg-green-500/10",
    published: "text-green-400 bg-green-500/10",
    approved: "text-green-400 bg-green-500/10",
    paid: "text-green-400 bg-green-500/10",
    pending: "text-yellow-400 bg-yellow-500/10",
    processing: "text-blue-500 bg-blue-500/10",
    open: "text-blue-500 bg-blue-500/10",
    draft: "text-muted-foreground bg-muted",
    failed: "text-destructive bg-destructive/10",
    error: "text-destructive bg-destructive/10",
    rejected: "text-destructive bg-destructive/10",
    refunded: "text-orange-500 bg-orange-500/10",
    suspended: "text-orange-500 bg-orange-500/10",
    inactive: "text-muted-foreground bg-muted",
    closed: "text-muted-foreground bg-muted",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const colors = STATUS_COLORS[status.toLowerCase()] || "text-muted-foreground bg-muted";
    const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors} ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
            <span className="capitalize">{status}</span>
        </span>
    );
}
