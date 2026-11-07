import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, ArrowUpRight, Globe, Wifi, Smartphone, Users, Banknote, ReceiptText, ClipboardList, Link2, ShoppingCart, Clock, Ticket, MessagesSquare } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import PageHeader from "../components/PageHeader";
import { useOverviewStats } from "../queries/overview.queries";
import { fetchProviderBalances } from "../../../services/adminApi";
import { adminQueryKeys } from "../queries/queryKeys";

const money = (val: number | string | undefined | null) =>
    val === undefined || val === null ? "—" : `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const plural = (count: number, word: string) => `${count} ${word}${count !== 1 ? "s" : ""}`;

export default function OverviewTab() {
    const { isLoading, stats, recentOrders } = useOverviewStats();

    // Provider balances refresh every 5 minutes.
    const { data: balances, isLoading: balancesLoading } = useQuery({
        queryKey: adminQueryKeys.providerBalances.all(),
        queryFn: fetchProviderBalances,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 5,
    });

    const alerts = isLoading ? [] : [
        stats.failedOrders > 0 && { label: plural(stats.failedOrders, "failed order"), href: "?tab=orders&status=failed" },
        stats.pendingOrders > 0 && { label: plural(stats.pendingOrders, "pending order"), href: "?tab=orders&status=pending" },
        stats.openTickets > 0 && { label: plural(stats.openTickets, "open ticket"), href: "?tab=tickets&status=open" },
        stats.openSupportChats > 0 && { label: plural(stats.openSupportChats, "open support chat"), href: "?tab=support_chats&status=open" },
    ].filter(Boolean) as { label: string; href: string }[];

    const metrics = [
        { label: "Total users", value: stats.users, icon: Users },
        { label: "Total revenue", value: `$${stats.revenue.toFixed(2)}`, icon: Banknote },
        { label: "Transactions", value: stats.transactions, icon: ReceiptText },
        { label: "Total orders", value: stats.orders, icon: ClipboardList },
    ];
    const secondary = [
        { label: "Affiliates", value: stats.affiliates, icon: Link2, note: "Enrolled partners" },
        { label: "Failed orders", value: stats.failedOrders, icon: ShoppingCart, note: stats.failedOrders > 0 ? "Needs attention" : "All clear" },
        { label: "Pending orders", value: stats.pendingOrders, icon: Clock, note: stats.pendingOrders > 0 ? "In queue" : "None" },
    ];

    const providers = [
        { name: "MyProxyApi", description: "Proxy provider balance", icon: Globe, data: balances?.myproxy, value: balances?.myproxy?.available_balance,
          extra: balances?.myproxy?.deposited_amount != null ? [["Deposited", money(balances.myproxy.deposited_amount)], ["Spent on orders", money(balances.myproxy.order_amount)]] : [] },
        { name: "eSIM Access", description: "eSIM provider balance", icon: Wifi, data: balances?.esim_access, value: balances?.esim_access?.balance, extra: [] },
        { name: "MeiSIM", description: "Phone line & travel eSIM dealer wallet", icon: Smartphone, data: balances?.meisim, value: balances?.meisim?.balance, href: "/admin/meisim",
          extra: balances?.meisim?.markup_pct != null ? [["Dealer markup", `${balances.meisim.markup_pct}%`]] : [] },
    ];

    return (
        <div className="ws-stack">
            <PageHeader title="Dashboard overview" description="System-wide metrics and recent activity." />

            {!isLoading && alerts.length > 0 && (
                <section className="ws-panel" aria-labelledby="attention-title">
                    <div className="ws-panel-heading" style={{ marginBottom: 8 }}>
                        <h2 id="attention-title" className="flex items-center gap-2"><AlertTriangle size={16} className="text-[var(--ov-accent)]" aria-hidden="true" />Needs attention</h2>
                    </div>
                    <ul>
                        {alerts.map(alert => (
                            <li key={alert.href} className="flex items-center justify-between gap-4 border-t border-[var(--ov-line)] py-3 text-xs first:border-t-0">
                                <span>{alert.label}</span>
                                <Link to={alert.href} className="inline-flex items-center gap-2 text-[11px] text-[var(--ov-muted)] hover:text-[var(--ov-accent)]">View <ArrowRight size={13} aria-hidden="true" /></Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="overview-metrics" style={{ marginBottom: 0 }}>
                {metrics.map(({ label, value, icon: Icon }) => (
                    <div className="overview-metric" key={label}>
                        <span>{label}<Icon size={16} aria-hidden="true" /></span>
                        {isLoading ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong>{value}</strong>}
                    </div>
                ))}
            </div>

            <div className="ws-grid">
                {secondary.map(({ label, value, icon: Icon, note }) => (
                    <div className="ws-metric" key={label}>
                        <span className="ws-metric-top"><span>{label}</span><Icon aria-hidden="true" /></span>
                        {isLoading ? <span className="ws-skeleton" style={{ height: 30, maxWidth: 90, margin: "14px 0 6px" }} /> : <strong>{value}</strong>}
                        <small>{note}</small>
                    </div>
                ))}
            </div>

            <section className="overview-services" style={{ marginBottom: 0 }} aria-labelledby="providers-title">
                <div className="overview-section-heading">
                    <div><h2 id="providers-title">Provider balances</h2><p>{balances?.fetched_at ? `Last updated ${new Date(balances.fetched_at).toLocaleTimeString()}` : "Refreshes every 5 minutes."}</p></div>
                </div>
                <div className="ws-grid">
                    {providers.map(provider => {
                        const Icon = provider.icon;
                        const body = (
                            <>
                                <div className="overview-service-top"><Icon size={18} aria-hidden="true" /><span>{provider.data?.currency || "USD"}</span></div>
                                <h3>{provider.name}</h3>
                                <p>{provider.description}</p>
                                {balancesLoading ? <span className="overview-skeleton" style={{ marginTop: 14 }} /> : provider.data?.error ? (
                                    <p style={{ minHeight: 0, marginTop: 14, color: "var(--ov-accent)" }}>Connection failed</p>
                                ) : (
                                    <strong className="mt-3 block text-[28px] font-medium tracking-[-.045em] tabular-nums">{money(provider.value)}</strong>
                                )}
                                {!balancesLoading && !provider.data?.error && provider.extra.length > 0 && (
                                    <dl className="mt-4 flex gap-6 border-t border-[var(--ov-line)] pt-3 text-[11px]">
                                        {provider.extra.map(([term, detail]) => <div key={term}><dt className="text-[var(--ov-muted)]">{term}</dt><dd className="mt-1">{detail}</dd></div>)}
                                    </dl>
                                )}
                            </>
                        );
                        return provider.href ? (
                            <div className="overview-service" key={provider.name}>
                                {body}
                                <Link to={provider.href}>Wallet, eSIM Verify &amp; line recharges <ArrowUpRight size={14} aria-hidden="true" /></Link>
                            </div>
                        ) : <div className="overview-service" key={provider.name}>{body}</div>;
                    })}
                </div>
            </section>

            <div className="overview-bottom-grid">
                <section className="overview-orders" aria-labelledby="recent-orders-title">
                    <div className="overview-section-heading">
                        <div><h2 id="recent-orders-title">Recent orders</h2><p>The latest orders across all accounts.</p></div>
                        <Link to="?tab=orders">View all <ArrowRight size={14} aria-hidden="true" /></Link>
                    </div>
                    {isLoading ? (
                        <div className="overview-orders-loading" role="status">Loading orders…<span className="overview-skeleton" /><span className="overview-skeleton" /></div>
                    ) : recentOrders.length === 0 ? (
                        <div className="overview-empty"><span className="overview-empty-mark"><ShoppingCart size={20} aria-hidden="true" /></span><h3>No recent orders</h3><p>New orders appear here as customers and resellers buy.</p></div>
                    ) : (
                        <div className="overview-table-scroll">
                            <table>
                                <thead><tr><th>Order</th><th>Status</th><th>Amount</th></tr></thead>
                                <tbody>
                                    {recentOrders.map((order: Record<string, unknown>) => (
                                        <tr key={String(order.id)}>
                                            <td><strong>#{String(order.id ?? "").slice(0, 8)}</strong><span>{String(order.entity_email ?? "")}</span></td>
                                            <td><StatusBadge status={String(order.status ?? "unknown")} /></td>
                                            <td>${Number(order.total_amount ?? 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <aside className="overview-help" aria-labelledby="queue-title">
                    <span className="ws-eyebrow">Support queue</span>
                    <h2 id="queue-title">{isLoading ? "Loading…" : stats.openTickets + stats.openSupportChats > 0 ? "Customers are waiting" : "Queue is clear"}</h2>
                    <p>Open tickets and live support chats that still need a reply.</p>
                    <Link to="?tab=tickets&status=open"><span><strong>{plural(isLoading ? 0 : stats.openTickets, "open ticket")}</strong><small>Awaiting response</small></span><Ticket size={16} aria-hidden="true" /></Link>
                    <Link to="?tab=support_chats&status=open"><span><strong>{plural(isLoading ? 0 : stats.openSupportChats, "open support chat")}</strong><small>Active conversations</small></span><MessagesSquare size={16} aria-hidden="true" /></Link>
                    {!isLoading && stats.failedOrders > 0 && <Link to="?tab=orders&status=failed"><span><strong>{plural(stats.failedOrders, "failed order")}</strong><small>Review and retry or refund</small></span><ArrowRight size={16} aria-hidden="true" /></Link>}
                </aside>
            </div>
        </div>
    );
}
