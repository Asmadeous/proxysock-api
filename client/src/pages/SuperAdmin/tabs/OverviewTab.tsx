import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    WalletIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import StatusBadge from "../components/StatusBadge";
import { StatsCardSkeleton } from "../components/TableSkeleton";
import { useOverviewStats } from "../queries/overview.queries";
import { fetchProviderBalances } from "../../../services/adminApi";
import { adminQueryKeys } from "../queries/queryKeys";
import MeisimWalletActions from "../components/MeisimWalletActions";

// Lucide icons for provider cards
import { Globe, Wifi, Smartphone } from "lucide-react";

export default function OverviewTab() {
    const { isLoading, stats, recentOrders } = useOverviewStats();

    // Fetch provider balances (auto-refresh every 5 minutes)
    const { data: balances, isLoading: balancesLoading } = useQuery({
        queryKey: adminQueryKeys.providerBalances.all(),
        queryFn: fetchProviderBalances,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 5,
    });

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

    // Format balance for display
    const formatBalance = (val: number | string | undefined | null) => {
        if (val === undefined || val === null) return "—";
        return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

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

            {/* Provider Balances */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <WalletIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    Provider Balances
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* MyProxyApi Balance */}
                    <div className="relative overflow-hidden bg-card rounded-xl border border-border p-5 group hover:border-primary/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
                            <Globe className="w-full h-full" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/10 ring-1 ring-blue-500/20">
                                <Globe className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">MyProxyApi</p>
                                <p className="text-xs text-muted-foreground">Proxy provider balance</p>
                            </div>
                        </div>
                        {balancesLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-20 bg-muted/70 animate-pulse rounded" />
                            </div>
                        ) : balances?.myproxy?.error ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                <p className="text-sm text-destructive">Connection failed</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-foreground tracking-tight">
                                    {formatBalance(balances?.myproxy?.available_balance)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {balances?.myproxy?.currency || "USD"} • Available balance
                                </p>
                                {balances?.myproxy?.deposited_amount != null && (
                                    <div className="flex gap-4 mt-3 pt-3 border-t border-border/50">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Deposited</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatBalance(balances.myproxy.deposited_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Spent on orders</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatBalance(balances.myproxy.order_amount)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* eSIM Access Balance */}
                    <div className="relative overflow-hidden bg-card rounded-xl border border-border p-5 group hover:border-primary/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
                            <Wifi className="w-full h-full" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-500/20">
                                <Wifi className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">eSIM Access</p>
                                <p className="text-xs text-muted-foreground">eSIM provider balance</p>
                            </div>
                        </div>
                        {balancesLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-20 bg-muted/70 animate-pulse rounded" />
                            </div>
                        ) : balances?.esim_access?.error ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                <p className="text-sm text-destructive">Connection failed</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-foreground tracking-tight">
                                    {formatBalance(balances?.esim_access?.balance)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {balances?.esim_access?.currency || "USD"} • Available balance
                                </p>
                            </>
                        )}
                    </div>

                    {/* MeiSIM dealer wallet */}
                    <div className="relative overflow-hidden bg-card rounded-xl border border-border p-5 group hover:border-primary/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
                            <Smartphone className="w-full h-full" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 ring-1 ring-violet-500/20">
                                <Smartphone className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">MeiSIM</p>
                                <p className="text-xs text-muted-foreground">Phone line &amp; travel eSIM dealer wallet</p>
                            </div>
                        </div>
                        {balancesLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-20 bg-muted/70 animate-pulse rounded" />
                            </div>
                        ) : balances?.meisim?.error ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                <p className="text-sm text-destructive">Connection failed</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-foreground tracking-tight">
                                    {formatBalance(balances?.meisim?.balance)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {balances?.meisim?.currency || "USD"} • Available balance
                                </p>
                                {balances?.meisim?.markup_pct != null && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground">Dealer markup</p>
                                        <p className="text-sm font-medium text-foreground">{balances.meisim.markup_pct}%</p>
                                    </div>
                                )}
                                <MeisimWalletActions />
                            </>
                        )}
                    </div>
                </div>
                {balances?.fetched_at && (
                    <p className="text-[11px] text-muted-foreground/60 mt-2 text-right">
                        Last updated: {new Date(balances.fetched_at).toLocaleTimeString()}
                    </p>
                )}
            </div>

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
