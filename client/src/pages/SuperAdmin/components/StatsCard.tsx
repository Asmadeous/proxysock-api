import { motion } from "framer-motion";
import type { ComponentType, SVGProps, ReactNode } from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    loading?: boolean;
    positive?: boolean;
    subtitle?: ReactNode;
}

export default function StatsCard({
    title,
    value,
    change,
    icon: Icon,
    loading = false,
    positive = true,
    subtitle,
}: StatsCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card rounded-xl p-5 border border-border h-full"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
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
