import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Eye, Package, RefreshCw, X } from "lucide-react";
import { fetchResellerOrderStats, fetchResellerOrders, cancelResellerOrder, fetchOrderCredentials } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import { toast } from "sonner";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";
import WorkspaceDialog from "../../SuperAdmin/components/WorkspaceDialog";

interface OrderStats {
    total_orders: number;
    active_services: number;
    pending_orders: number;
    total_spent: number;
}

interface Order {
    id: string;
    product_name: string;
    product_type: string;
    quantity: number;
    total_amount: number;
    status: string;
    resource_status: string;
    ip_address?: string;
    created_at: string;
}

export default function ResOrders() {
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState("all");
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [credentialsModal, setCredentialsModal] = useState<{ open: boolean; data: any; loading: boolean }>({
        open: false, data: null, loading: false
    });

    const fetchStats = useCallback(async () => {
        try {
            const r = await fetchResellerOrderStats();
            setStats(r.data);
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    }, []);

    const fetchOrders = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(p) };
            if (filter !== "all") params.product_type = filter;
            const r = await fetchResellerOrders(params);
            const data = r.data.orders || r.data || [];
            setOrders(Array.isArray(data) ? data : []);
            setTotalPages(r.data.meta?.total_pages || 1);
        } catch {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchOrders(page); }, [page, fetchOrders]);

    const canCancel = (order: Order) => {
        const created = new Date(order.created_at).getTime();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        return now - created < oneHour && !["cancelled", "failed", "expired"].includes(order.status);
    };

    const handleCancelClick = (order: Order) => {
        setOrderToCancel(order);
        setShowCancelDialog(true);
    };

    const confirmCancel = async () => {
        if (!orderToCancel) return;
        setCancellingId(orderToCancel.id);
        try {
            const r = await cancelResellerOrder(orderToCancel.id);
            toast.success(r.data.message || "Order cancelled successfully");
            fetchOrders(page);
            fetchStats();
        } catch (e) {
            toast.error(getApiError(e, "Failed to cancel order"));
        } finally {
            setCancellingId(null);
            setShowCancelDialog(false);
            setOrderToCancel(null);
        }
    };

    const viewCredentials = async (orderId: string) => {
        setCredentialsModal({ open: true, data: null, loading: true });
        try {
            const r = await fetchOrderCredentials(orderId);
            setCredentialsModal({ open: true, data: r.data, loading: false });
        } catch (e) {
            toast.error(getApiError(e, "Credentials not available"));
            setCredentialsModal({ open: false, data: null, loading: false });
        }
    };

    const deliveredStatuses = ["active", "completed", "delivered", "allocated"];
    const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const metrics = [
        { title: "Total orders", value: stats?.total_orders, note: "Every order on your account" },
        { title: "Active services", value: stats?.active_services, note: "Delivered and running" },
        { title: "Pending", value: stats?.pending_orders, note: "Awaiting provisioning" },
        { title: "Total spent", value: stats ? money(Number(stats.total_spent || 0)) : undefined, note: "Credits used on orders" },
    ];

    const filters = [
        { id: "all", label: "All" },
        { id: "proxy", label: "Proxies" },
        { id: "vps", label: "VPS" },
        { id: "rdp", label: "RDP" },
        { id: "esim", label: "eSIM" },
        { id: "vpn", label: "VPN" },
    ];

    const refresh = () => { fetchOrders(page); fetchStats(); };

    return (
        <div className="ws-stack">
            <PageHeader
                title="Orders"
                description="Track and manage all reseller orders. Orders can be cancelled within 1 hour of purchase."
                actions={<button type="button" onClick={refresh} disabled={loading} aria-label="Refresh orders" title="Refresh orders" className="ws-icon-button"><RefreshCw className={loading ? "animate-spin" : ""} /></button>}
            />

            <section className="overview-metrics" aria-label="Order summary" aria-busy={!stats}>
                {metrics.map(metric => (
                    <div className="overview-metric" key={metric.title}>
                        <span>{metric.title}</span>
                        <strong>{metric.value === undefined ? <span className="overview-skeleton" /> : metric.value}</strong>
                        <small>{metric.note}</small>
                    </div>
                ))}
            </section>

            <div className="ws-tabs" role="group" aria-label="Filter by service type">
                {filters.map(f => (
                    <button type="button" key={f.id} aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setPage(1); }}>{f.label}</button>
                ))}
            </div>

            <div className="ws-table-panel" aria-busy={loading}>
                {loading ? (
                    <div className="space-y-3 py-6" role="status" aria-label="Loading orders">
                        {[0, 1, 2, 3].map(i => <span key={i} className="ws-skeleton block" style={{ height: 14, maxWidth: i % 2 ? "70%" : "100%" }} />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="overview-empty">
                        <span className="overview-empty-mark" aria-hidden="true"><Package size={26} strokeWidth={1.3} /></span>
                        <h3>No orders found</h3>
                        <p>{filter === "all" ? "Orders you place through the dashboard or API will appear here." : "There are no orders of this type yet."}</p>
                    </div>
                ) : (
                    <div className="ws-table-scroll">
                        <table className="ws-table">
                            <caption className="sr-only">Reseller orders</caption>
                            <thead>
                                <tr><th>Order</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th><th className="ws-actions"><span className="sr-only">Actions</span></th></tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>
                                            <strong>{order.product_name || "Service order"}</strong>
                                            <div className="ws-mono">#{String(order.id).slice(0, 8)}</div>
                                        </td>
                                        <td className="uppercase">{order.product_type}</td>
                                        <td>{money(Number(order.total_amount || 0))}</td>
                                        <td><span className="overview-status" data-status={order.status}>{order.status.replace(/_/g, " ")}</span></td>
                                        <td className="ws-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="ws-actions">
                                            <div>
                                                {deliveredStatuses.includes(order.status) && (
                                                    <Button size="sm" variant="secondary" onClick={() => viewCredentials(order.id)} aria-label={`View credentials for order ${String(order.id).slice(0, 8)}`}><Eye aria-hidden="true" /> View</Button>
                                                )}
                                                {canCancel(order) && (
                                                    <Button size="sm" variant="danger" loading={cancellingId === order.id} onClick={() => handleCancelClick(order)} aria-label={`Cancel order ${String(order.id).slice(0, 8)}`}><X aria-hidden="true" /> Cancel</Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="ws-pagination">
                        <span>Page {page} of {totalPages}</span>
                        <div>
                            <button type="button" onClick={() => setPage(p => p - 1)} disabled={page <= 1 || loading} aria-label="Previous page"><ChevronLeft /></button>
                            <button type="button" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || loading} aria-label="Next page"><ChevronRight /></button>
                        </div>
                    </div>
                )}
            </div>

            <WorkspaceDialog
                open={showCancelDialog}
                onClose={() => { if (!cancellingId) { setShowCancelDialog(false); setOrderToCancel(null); } }}
                title="Cancel order"
                description={orderToCancel ? `Order #${String(orderToCancel.id).slice(0, 8)} · ${orderToCancel.product_name}` : undefined}
                footer={<>
                    <Button variant="secondary" onClick={() => { setShowCancelDialog(false); setOrderToCancel(null); }} disabled={!!cancellingId}>Keep order</Button>
                    <Button variant="danger" onClick={confirmCancel} loading={!!cancellingId}>Confirm cancel</Button>
                </>}
            >
                <div className="space-y-4">
                    <dl className="ws-rows">
                        <div><dt>Refund to your balance</dt><dd>{money(Number(orderToCancel?.total_amount || 0))}</dd></div>
                    </dl>
                    <p className="ws-callout">For external API products (proxies), the admin is notified and manual cancellation may be required on the provider side.</p>
                </div>
            </WorkspaceDialog>

            <WorkspaceDialog
                open={credentialsModal.open}
                onClose={() => setCredentialsModal({ open: false, data: null, loading: false })}
                title="Order credentials"
            >
                {credentialsModal.loading ? (
                    <div className="space-y-3 py-2" role="status" aria-label="Loading credentials">
                        {[0, 1, 2].map(i => <span key={i} className="ws-skeleton block" style={{ height: 36 }} />)}
                    </div>
                ) : credentialsModal.data && Object.keys(credentialsModal.data).length > 0 ? (
                    <div className="grid gap-4">
                        {Object.entries(credentialsModal.data).map(([key, value]) => (
                            <div className="proxy-secret" key={key}>
                                <span className="capitalize">{key.replace(/_/g, " ")}</span>
                                <div>
                                    <code>{typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}</code>
                                    <button type="button" aria-label={`Copy ${key.replace(/_/g, " ")}`} onClick={() => { navigator.clipboard.writeText(typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)); toast.success("Copied to clipboard"); }}>Copy</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="ws-table-empty">No credentials available for this order.</p>
                )}
            </WorkspaceDialog>
        </div>
    );
}
