import type { ComponentType, SVGProps, ReactNode } from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    loading?: boolean;
    positive?: boolean;
    subtitle?: ReactNode;
    className?: string;
    /** Kept for callers; the customer dashboard design uses one accent colour. */
    accent?: string;
}

// A metric panel in the customer dashboard style: label and icon on top, large value below.
export default function StatsCard({ title, value, change, icon: Icon, loading = false, positive = true, subtitle, className }: StatsCardProps) {
    return (
        <div className={`ws-metric ${className || ""}`}>
            <span className="ws-metric-top">
                <span>{title}</span>
                <Icon aria-hidden="true" />
            </span>
            {loading ? <span className="ws-skeleton" style={{ height: 32, maxWidth: 120, margin: "14px 0 6px" }} /> : <strong>{value}</strong>}
            {change && <span className="ws-change" data-positive={positive}>{change}</span>}
            {!loading && subtitle && <div className="ws-metric-sub">{subtitle}</div>}
        </div>
    );
}
