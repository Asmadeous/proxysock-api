import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, Code, ListTodo, Network, RefreshCw, ShoppingBag, Wallet } from "lucide-react";
import { fetchResellerOrderStats, fetchResellerOrders } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";

interface Stats {
    balance: number;
    earnings: number;
    orders: number;
    active: number;
    pending: number;
    totalSpent: number;
}

interface RecentOrder {
    id: string;
    product_name: string;
    status: string;
    total_amount: number;
    created_at: string;
}

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusLabel = (status: string) => status.replace(/_/g, " ");

export default function ResOverview() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";

    const [stats, setStats] = useState<Stats | null>(null);
    const [orders, setOrders] = useState<RecentOrder[] | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [statsResult, ordersResult] = await Promise.allSettled([fetchResellerOrderStats(), fetchResellerOrders({ page: "1" })]);
        if (statsResult.status === "fulfilled") {
            const d = statsResult.value.data;
            setStats({
                balance: Number(d.balance || 0),
                earnings: Number(d.earnings_balance || 0),
                orders: Number(d.total_orders || 0),
                active: Number(d.active_services || 0),
                pending: Number(d.pending_orders || 0),
                totalSpent: Number(d.total_spent || 0),
            });
        } else {
            toast.error(getApiError(statsResult.reason, "Failed to load overview stats"));
        }
        if (ordersResult.status === "fulfilled") {
            const data = ordersResult.value.data.orders || ordersResult.value.data || [];
            setOrders(Array.isArray(data) ? data.slice(0, 5) : []);
        } else {
            setOrders(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const name = user?.company_name || user?.username || "there";
    const metrics = [
        isEnterprise
            ? { title: "Earnings balance", value: stats ? money(stats.earnings) : undefined, note: "Available to transfer or withdraw", href: "/reseller/earnings" }
            : { title: "Available credits", value: stats ? money(stats.balance) : undefined, note: "Wallet balance in USD", href: "/reseller/wallet" },
        isEnterprise
            ? { title: "Infrastructure fee", value: `$${user?.subscription_fee || "0.00"}`, note: user?.subscription_expires_at ? `Renews ${new Date(user.subscription_expires_at).toLocaleDateString()}` : "Monthly subscription", href: "/reseller/earnings" }
            : { title: "Lifetime spend", value: stats ? money(stats.totalSpent) : undefined, note: "Credits used on orders", href: "/reseller/wallet" },
        { title: "Total orders", value: stats?.orders, note: "Your complete order history", href: "/reseller/orders" },
        { title: "Active services", value: stats?.active, note: stats?.pending ? `${stats.pending} pending` : "Nothing awaiting completion", href: isEnterprise ? "/reseller/management" : "/reseller/orders" },
    ];

    const shortcuts = [
        { icon: ShoppingBag, name: isEnterprise ? "Store" : "Products", description: "Browse proxies, servers, VPNs and eSIMs to resell.", href: "/reseller/store", label: "Browse" },
        { icon: ListTodo, name: "Orders", description: "Follow order status, credentials and cancellations.", href: "/reseller/orders", label: "View orders" },
        { icon: Wallet, name: isEnterprise ? "Earnings" : "Wallet", description: isEnterprise ? "Track revenue share, transfers and payouts." : "Add credits and review your transactions.", href: isEnterprise ? "/reseller/earnings" : "/reseller/wallet", label: "Open" },
        { icon: Code, name: "Developer", description: "API keys, documentation and webhooks for your integration.", href: "/reseller/developer", label: "Open" },
    ];

    return (
        <div>
            <header className="overview-heading">
                <div><h1>Overview</h1><p>Welcome back, {name}. Here’s your reseller account at a glance.</p></div>
                <div className="overview-heading-actions">
                    <span className="ws-status" data-tone={isEnterprise ? "info" : "good"}>{isEnterprise ? "Enterprise tier" : user?.reseller_type === "single_product" ? "Single product tier" : "API tier"}</span>
                    <button type="button" className="overview-icon-button" onClick={load} disabled={loading} aria-label="Refresh overview" title="Refresh overview"><RefreshCw size={16} /></button>
                    <Link className="overview-button" to="/reseller/support">Get support <ArrowUpRight size={14} /></Link>
                </div>
            </header>

            <section className="overview-welcome" aria-labelledby="welcome-title">
                <div className="overview-welcome-copy">
                    <h2 id="welcome-title">{isEnterprise ? "Your infrastructure, your customers." : "Everything you resell. Connected."}</h2>
                    <p>{isEnterprise ? "Provision services for your users, track earnings and manage your infrastructure in one place." : "Top up credits, place orders through the dashboard or API, and keep track of every service you deliver."}</p>
                    <Link className="overview-welcome-link" to="/reseller/store">Browse the store <ArrowRight size={15} /></Link>
                </div>
                <svg className="overview-network" viewBox="0 0 350 210" fill="none" aria-hidden="true"><g stroke="currentColor" strokeOpacity=".2"><circle cx="180" cy="105" r="42" /><circle cx="180" cy="105" r="83" /><path d="M0 165 180 105 330 20M50 5 180 105 340 178M180 105 350 100" /></g><g fill="currentColor"><circle cx="180" cy="105" r="7" /><circle cx="68" cy="142" r="4" /><circle cx="114" cy="54" r="4" /><circle cx="250" cy="65" r="4" /><circle cx="260" cy="142" r="4" /><circle cx="305" cy="101" r="3" /></g><circle cx="180" cy="105" r="15" stroke="currentColor" strokeOpacity=".4" /></svg>
            </section>

            <section className="overview-metrics" aria-label="Account summary" aria-busy={loading}>
                {metrics.map(metric => (
                    <Link to={metric.href} className="overview-metric" key={metric.title}>
                        <span>{metric.title}<ArrowUpRight size={14} /></span>
                        <strong>{loading ? <span className="overview-skeleton" /> : metric.value ?? "—"}</strong>
                        <small>{stats ? metric.note : loading ? "Loading account data…" : "Currently unavailable"}</small>
                    </Link>
                ))}
            </section>

            <section className="overview-services" aria-labelledby="shortcuts-title">
                <div className="overview-section-heading"><div><h2 id="shortcuts-title">Your workspace</h2><p>Everything you need to run your reseller business.</p></div></div>
                <div className="overview-service-grid">
                    {shortcuts.map(item => (
                        <article className="overview-service" key={item.name}>
                            <div className="overview-service-top"><item.icon size={21} strokeWidth={1.5} aria-hidden="true" /></div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <Link to={item.href} aria-label={`${item.label} ${item.name}`}>{item.label} <ArrowRight size={15} /></Link>
                        </article>
                    ))}
                </div>
            </section>

            <div className="overview-bottom-grid">
                <section className="overview-orders" aria-labelledby="recent-orders-title" aria-busy={loading}>
                    <div className="overview-section-heading"><h2 id="recent-orders-title">Recent orders</h2><Link to="/reseller/orders">View all <ArrowUpRight size={14} /></Link></div>
                    {loading ? (
                        <div className="overview-orders-loading" role="status">Loading recent orders…{[0, 1, 2].map(i => <span key={i} className="overview-skeleton" />)}</div>
                    ) : !orders ? (
                        <div className="overview-empty"><h3>Orders are unavailable</h3><p>Try refreshing your overview to load your order history.</p></div>
                    ) : orders.length === 0 ? (
                        <div className="overview-empty">
                            <span className="overview-empty-mark" aria-hidden="true"><Network size={26} strokeWidth={1.3} /></span>
                            <h3>Your first order belongs here.</h3>
                            <p>Once you place an order, you can follow its status and find it again here.</p>
                            <Link className="overview-button" to="/reseller/store">Browse the store <ArrowRight size={14} /></Link>
                        </div>
                    ) : (
                        <div className="overview-table-scroll">
                            <table>
                                <caption className="sr-only">Your five most recent orders</caption>
                                <thead><tr><th>Order</th><th>Status</th><th>Amount</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td><strong>{order.product_name || "Service order"}</strong><span>#{String(order.id).slice(0, 8)} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(order.created_at))}</span></td>
                                            <td><span className="overview-status" data-status={order.status}>{statusLabel(order.status)}</span></td>
                                            <td>{money(Number(order.total_amount || 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                <aside className="overview-help" aria-labelledby="help-title">
                    <h2 id="help-title">A little guidance.<br />A lot of possibilities.</h2>
                    <p>Find your way around, or talk to us when you need a hand.</p>
                    <Link to="/reseller/developer"><span><strong>Integrate with the API</strong><small>Keys, documentation and webhooks</small></span><ArrowUpRight size={16} /></Link>
                    <Link to="/reseller/settings"><span><strong>Make it yours</strong><small>Keep your account details up to date</small></span><ArrowUpRight size={16} /></Link>
                    <Link to="/reseller/support"><span><strong>Let’s work it out</strong><small>Get help from our support team</small></span><ArrowUpRight size={16} /></Link>
                </aside>
            </div>
        </div>
    );
}
