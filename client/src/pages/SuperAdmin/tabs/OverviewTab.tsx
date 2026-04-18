import { Link } from "react-router-dom";
import {
    UsersIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    ClipboardDocumentListIcon,
    BanknotesIcon,
    UserGroupIcon,
    LinkIcon,
    ExclamationTriangleIcon,
    ChatBubbleLeftRightIcon,
    TicketIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import StatusBadge from "../components/StatusBadge";
import { StatsCardSkeleton } from "../components/TableSkeleton";
import { useOverviewStats } from "../queries/overview.queries";

export default function OverviewTab() {
    const { isLoading, stats, recentOrders } = useOverviewStats();

    const alerts = isLoading ? [] : [
        stats.failedOrders > 0 && {
            label: `${stats.failedOrders} failed order${stats.failedOrders !== 1 ? "s" : ""}`,
            href: "?tab=orders&status=failed",
            color: "text-destructive",
            dot: "bg-destructive",
        },
        stats.pendingOrders > 0 && {
            label: `${stats.pendingOrders} pending order${stats.pendingOrders !== 1 ? "s" : ""}`,
            href: "?tab=orders&status=pending",
            color: "text-yellow-500",
            dot: "bg-yellow-500",
        },
        stats.openTickets > 0 && {
            label: `${stats.openTickets} open ticket${stats.openTickets !== 1 ? "s" : ""}`,
            href: "?tab=tickets&status=open",
            color: "text-blue-500",
            dot: "bg-blue-500",
        },
        stats.openSupportChats > 0 && {
            label: `${stats.openSupportChats} open support chat${stats.openSupportChats !== 1 ? "s" : ""}`,
            href: "?tab=support_chats&status=open",
            color: "text-purple-500",
            dot: "bg-purple-500",
        },
    ].filter(Boolean) as { label: string; href: string; color: string; dot: string }[];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
                <p className="text-muted-foreground text-sm mt-1">System-wide metrics and recent activity</p>
            </div>

            {/* Needs Attention */}
            {!isLoading && alerts.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                        <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
                    </div>
                    <ul className="space-y-2">
                        {alerts.map((alert) => (
                            <li key={alert.href} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${alert.dot}`} aria-hidden="true" />
                                    <span className={`text-sm font-medium ${alert.color}`}>{alert.label}</span>
                                </div>
                                <Link
                                    to={alert.href}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    View <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
                ) : (
                    <>
                        <StatsCard title="Total Users" value={stats.users} icon={UsersIcon} accent="blue" />
                        <StatsCard title="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} icon={BanknotesIcon} accent="green" />
                        <StatsCard title="Transactions" value={stats.transactions} icon={CurrencyDollarIcon} accent="purple" />
                        <StatsCard title="Total Orders" value={stats.orders} icon={ClipboardDocumentListIcon} accent="orange" />
                    </>
                )}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <StatsCardSkeleton key={i} />)
                ) : (
                    <>
                        <StatsCard title="Affiliates" value={stats.affiliates} icon={LinkIcon} accent="blue" />
                        <StatsCard
                            title="Failed Orders"
                            value={stats.failedOrders}
                            icon={ShoppingCartIcon}
                            accent="red"
                            positive={false}
                            change={stats.failedOrders > 0 ? "Needs attention" : "All clear"}
                        />
                        <StatsCard
                            title="Pending Orders"
                            value={stats.pendingOrders}
                            icon={UserGroupIcon}
                            accent="yellow"
                            change={stats.pendingOrders > 0 ? "In queue" : "None"}
                        />
                    </>
                )}
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
                    <Link
                        to="?tab=orders"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                        View all <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                    </Link>
                </div>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                                    <div className="space-y-1.5">
                                        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                        <div className="h-2.5 w-32 bg-muted/70 animate-pulse rounded" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-3 w-14 bg-muted animate-pulse rounded" />
                                    <div className="h-5 w-16 bg-muted/70 animate-pulse rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">No recent orders</p>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.map((order: Record<string, unknown>) => (
                            <div key={String(order.id)} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                        <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-foreground font-medium">#{String(order.id ?? "").slice(0, 8)}</p>
                                        <p className="text-xs text-muted-foreground">{String(order.entity_email ?? "")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-foreground font-medium">${Number(order.total_amount ?? 0).toFixed(2)}</span>
                                    <StatusBadge status={String(order.status ?? "unknown")} />
                                </div>
                            </div>
                        ))}
                        {stats.failedOrders > 0 && (
                            <div className="pt-2">
                                <Link
                                    to="?tab=orders&status=failed"
                                    className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors"
                                >
                                    View {stats.failedOrders} failed order{stats.failedOrders !== 1 ? "s" : ""} <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Links */}
            {!isLoading && (stats.openTickets > 0 || stats.openSupportChats > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.openTickets > 0 && (
                        <Link
                            to="?tab=tickets&status=open"
                            className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <TicketIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{stats.openTickets} Open Ticket{stats.openTickets !== 1 ? "s" : ""}</p>
                                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                                </div>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                        </Link>
                    )}
                    {stats.openSupportChats > 0 && (
                        <Link
                            to="?tab=support_chats&status=open"
                            className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-500" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{stats.openSupportChats} Open Support Chat{stats.openSupportChats !== 1 ? "s" : ""}</p>
                                    <p className="text-xs text-muted-foreground">Active conversations</p>
                                </div>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
