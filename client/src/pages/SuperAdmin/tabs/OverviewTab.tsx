import { useState, useEffect } from "react";
import {
    UsersIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    ClipboardDocumentListIcon,
    BanknotesIcon,
    UserGroupIcon,
    LinkIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import StatusBadge from "../components/StatusBadge";
import { fetchAdminUsers, fetchAdminOrders, fetchAffiliates } from "../../../services/adminApi";
import { fetchTransactions } from "../../../services/transaction";

export default function OverviewTab() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0, orders: 0, revenue: 0, transactions: 0,
        affiliates: 0, failedOrders: 0, pendingOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Array<Record<string, unknown>>>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [usersRes, ordersRes, txRes, affRes] = await Promise.allSettled([
                    fetchAdminUsers({ per: "1" }),
                    fetchAdminOrders({ per: "5" }),
                    fetchTransactions(),
                    fetchAffiliates({ per: "1" }),
                ]);

                const usersTotal = usersRes.status === "fulfilled" ? usersRes.value.data.total : 0;
                const ordersData = ordersRes.status === "fulfilled" ? ordersRes.value.data : { orders: [], stats: {}, total: 0 };
                const txData = txRes.status === "fulfilled" ? txRes.value : [];
                const affTotal = affRes.status === "fulfilled" ? affRes.value.data.total : 0;

                const totalRevenue = Array.isArray(txData)
                    ? txData.filter((t) => t.payment_status === "succeeded")
                        .reduce((sum: number, t) => sum + Number(t.amount || 0), 0)
                    : 0;

                setStats({
                    users: usersTotal,
                    orders: ordersData.total || 0,
                    revenue: totalRevenue,
                    transactions: Array.isArray(txData) ? txData.length : 0,
                    affiliates: affTotal,
                    failedOrders: ordersData.stats?.failed || 0,
                    pendingOrders: ordersData.stats?.pending || 0,
                });
                setRecentOrders(ordersData.orders || []);
            } catch (err) {
                console.error("Overview load error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
                <p className="text-muted-foreground text-sm mt-1">System-wide metrics and recent activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Users" value={stats.users} icon={UsersIcon} loading={loading} change="+8.7%" />
                <StatsCard title="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} icon={BanknotesIcon} loading={loading} change="+23.1%" />
                <StatsCard title="Transactions" value={stats.transactions} icon={CurrencyDollarIcon} loading={loading} change="+15.2%" />
                <StatsCard title="Total Orders" value={stats.orders} icon={ClipboardDocumentListIcon} loading={loading} change="+12.4%" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard title="Affiliates" value={stats.affiliates} icon={LinkIcon} loading={loading} />
                <StatsCard title="Failed Orders" value={stats.failedOrders} icon={ShoppingCartIcon} loading={loading} positive={false} change={stats.failedOrders > 0 ? "Needs attention" : "0"} />
                <StatsCard title="Pending Orders" value={stats.pendingOrders} icon={UserGroupIcon} loading={loading} change="In queue" />
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
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
                                        <p className="text-sm text-foreground font-medium">#{String(order.id).slice(0, 8)}</p>
                                        <p className="text-xs text-muted-foreground">{String(order.entity_email || "")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-foreground font-medium">${Number(order.total_amount || 0).toFixed(2)}</span>
                                    <StatusBadge status={String(order.status || "unknown")} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
