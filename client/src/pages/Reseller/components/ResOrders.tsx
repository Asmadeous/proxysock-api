import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    ShoppingCartIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    XMarkIcon,
    ArrowPathIcon,
    CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { fetchResellerOrderStats, fetchResellerOrders, cancelResellerOrder, fetchOrderCredentials, refundResellerOrder } from "../../../services/resellerApi";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [orderToRefund, setOrderToRefund] = useState<Order | null>(null);
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
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to cancel order");
        } finally {
            setCancellingId(null);
            setShowCancelDialog(false);
            setOrderToCancel(null);
        }
    };

    const handleRefundClick = (order: Order) => {
        setOrderToRefund(order);
        setShowRefundDialog(true);
    };

    const confirmRefund = async () => {
        if (!orderToRefund) return;
        setRefundingId(orderToRefund.id);
        try {
            const r = await refundResellerOrder(orderToRefund.id);
            toast.success(r.data.message || "Order refunded successfully");
            fetchOrders(page);
            fetchStats();
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Refund failed. A support ticket may have been created.", { duration: 5000 });
            // Fetch orders in case state changed
            fetchOrders(page);
        } finally {
            setRefundingId(null);
            setShowRefundDialog(false);
            setOrderToRefund(null);
        }
    };

    const viewCredentials = async (orderId: string) => {
        setCredentialsModal({ open: true, data: null, loading: true });
        try {
            const r = await fetchOrderCredentials(orderId);
            setCredentialsModal({ open: true, data: r.data, loading: false });
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Credentials not available");
            setCredentialsModal({ open: false, data: null, loading: false });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": case "completed": case "delivered": case "allocated": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "pending": case "processing": case "provisioning": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
            case "cancelled": case "expired": case "suspended": return "bg-red-500/10 text-red-600 border-red-500/20";
            case "failed": case "error": return "bg-red-500/10 text-red-700 border-red-500/30";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    const statCards = [
        { label: "Total Orders", value: stats?.total_orders ?? 0, icon: ShoppingCartIcon, color: "primary" },
        { label: "Active Services", value: stats?.active_services ?? 0, icon: CheckCircleIcon, color: "emerald-500" },
        { label: "Pending", value: stats?.pending_orders ?? 0, icon: ClockIcon, color: "amber-500" },
        { label: "Total Spent", value: `$${(stats?.total_spent ?? 0).toFixed(2)}`, icon: ShoppingCartIcon, color: "blue-500" },
    ];

    const filters = [
        { id: "all", label: "All" },
        { id: "proxy", label: "Proxies" },
        { id: "vps", label: "VPS" },
        { id: "rdp", label: "RDP" },
        { id: "esim", label: "eSIM" },
        { id: "vpn", label: "VPN" },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground mt-1">Track and manage all reseller orders. Cancel within 1 hour of purchase.</p>
                </div>
                <Button onClick={() => { fetchOrders(page); fetchStats(); }} variant="outline" size="sm" className="gap-2">
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s) => (
                    <Card key={s.label} className="border-none shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-${s.color}/10`}>
                                    <s.icon className={`w-5 h-5 text-${s.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => { setFilter(f.id); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <Card className="border-none shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID</th>
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product</th>
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No orders found</td></tr>
                            ) : orders.map(order => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                >
                                    <td className="p-4 font-mono text-xs">#{String(order.id).slice(0, 8)}</td>
                                    <td className="p-4 font-medium text-sm">{order.product_name}</td>
                                    <td className="p-4">
                                        <Badge variant="secondary" className="text-[10px] uppercase">{order.product_type}</Badge>
                                    </td>
                                    <td className="p-4 font-bold text-sm">${Number(order.total_amount || 0).toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {["active", "completed", "delivered", "allocated"].includes(order.status) && (
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => viewCredentials(order.id)}>
                                                    <EyeIcon className="w-3 h-3" /> View
                                                </Button>
                                            )}
                                            {canCancel(order) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-7 text-xs gap-1"
                                                    disabled={cancellingId === order.id}
                                                    onClick={() => handleCancelClick(order)}
                                                >
                                                    {cancellingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XMarkIcon className="w-3 h-3" />}
                                                    Cancel
                                                </Button>
                                            )}
                                            {order.status === "failed" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                                                    disabled={refundingId === order.id}
                                                    onClick={() => handleRefundClick(order)}
                                                >
                                                    {refundingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CurrencyDollarIcon className="w-3 h-3" />}
                                                    Refund
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        <span className="text-xs text-muted-foreground font-medium">Page {page} of {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                )}
            </Card>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            Cancel Order
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to cancel order <span className="font-mono font-bold">#{orderToCancel?.id?.slice(0, 8)}</span>?
                        </p>
                        <p className="text-sm font-medium">
                            <strong>${Number(orderToCancel?.total_amount || 0).toFixed(2)}</strong> will be refunded to your balance.
                        </p>
                        <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            For external API products (proxies), the admin will be notified and manual cancellation may be required on the provider side.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Order</Button>
                        <Button variant="destructive" onClick={confirmCancel} disabled={!!cancellingId}>
                            {cancellingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirm Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refund Confirmation Dialog */}
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-500">
                            <CurrencyDollarIcon className="w-5 h-5" />
                            Refund Failed Order
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to request a refund for failed order <span className="font-mono font-bold">#{orderToRefund?.id?.slice(0, 8)}</span>?
                        </p>
                        <p className="text-sm font-medium">
                            <strong>${Number(orderToRefund?.total_amount || 0).toFixed(2)}</strong> will be credited to your wallet if successful.
                        </p>
                        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <p className="font-bold mb-1">Important for Proxies & VPNs:</p>
                            <p>If the external provider successfully processed this order before the local failure, an automated refund will be halted and a high-priority support ticket will be opened for manual review to ensure funds aren't leaked.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
                        <Button variant="default" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={confirmRefund} disabled={!!refundingId}>
                            {refundingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Request Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Credentials Modal */}
            <Dialog open={credentialsModal.open} onOpenChange={(open) => setCredentialsModal(prev => ({ ...prev, open }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Order Credentials</DialogTitle>
                    </DialogHeader>
                    {credentialsModal.loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : credentialsModal.data ? (
                        <div className="space-y-3">
                            {Object.entries(credentialsModal.data).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-mono text-sm font-medium">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">No credentials available</p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
