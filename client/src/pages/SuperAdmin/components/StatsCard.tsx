import { motion } from "framer-motion";
import type { ComponentType, SVGProps, ReactNode } from "react";

const ACCENT: Record<string, { bg: string; icon: string }> = {
    blue:   { bg: "bg-blue-500/10",   icon: "text-blue-500" },
    green:  { bg: "bg-green-500/10",  icon: "text-green-500" },
    purple: { bg: "bg-purple-500/10", icon: "text-purple-500" },
    orange: { bg: "bg-orange-500/10", icon: "text-orange-500" },
    red:    { bg: "bg-red-500/10",    icon: "text-red-500" },
    yellow: { bg: "bg-yellow-500/10", icon: "text-yellow-500" },
};

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    loading?: boolean;
    positive?: boolean;
    subtitle?: ReactNode;
    className?: string;
    accent?: string;
}

export default function StatsCard({
    title,
    value,
    change,
    icon: Icon,
    loading = false,
    positive = true,
    subtitle,
    className,
    accent,
}: StatsCardProps) {
    const accentStyle = accent ? ACCENT[accent] : null;
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`bg-card rounded-xl p-5 border border-border h-full ${className || ""}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${accentStyle ? accentStyle.bg : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${accentStyle ? accentStyle.icon : "text-muted-foreground"}`} />
                </div>
                {change && (
                    <span className={`text-xs font-medium ${positive ? "text-green-500" : "text-destructive"}`}>
                        {change}
                    </span>
                )}
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-14">
                    <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary" />
                </div>
            ) : (
                <>
                    <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    {subtitle && <div className="mt-1">{subtitle}</div>}
                </>
            )}
        </motion.div>
    );
}
