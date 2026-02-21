import { useState, useEffect, useCallback } from "react";
import { ArrowPathIcon, BanknotesIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import StatsCard from "../components/StatsCard";
import ConfirmModal from "../components/ConfirmModal";
import { fetchAdminOrders, rescueOrder, refundOrder } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface OrderRow {
    id: number;
    status: string;
    product_name: string;
    product_type: string;
    total_amount: number;
    quantity: number;
    entity_type: string;
    entity_name: string;
    entity_email: string;
    created_at: string;
}

export default function OrdersTab() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, failed: 0, processing: 0 });
    const [rescueTarget, setRescueTarget] = useState<OrderRow | null>(null);
    const [refundTarget, setRefundTarget] = useState<OrderRow | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const PER = 25;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), per: String(PER) };
            if (search) params.q = search;
            if (statusFilter) params.status = statusFilter;
            const res = await fetchAdminOrders(params);
            setOrders(res.data.orders);
            setTotal(res.data.total);
            setStats(res.data.stats);
        } catch { toast.error("Failed to load orders"); }
        finally { setLoading(false); }
    }, [page, search, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const handleRescue = async () => {
        if (!rescueTarget) return;
        setActionLoading(true);
        try { await rescueOrder(rescueTarget.id); toast.success("Order rescued"); setRescueTarget(null); load(); }
        catch { toast.error("Rescue failed"); }
        finally { setActionLoading(false); }
    };

    const handleRefund = async () => {
        if (!refundTarget) return;
        setActionLoading(true);
        try { await refundOrder(refundTarget.id); toast.success("Order refunded"); setRefundTarget(null); load(); }
        catch { toast.error("Refund failed"); }
        finally { setActionLoading(false); }
    };

    const columns = [
        {
            key: "id", label: "Order", sortable: true,
            render: (row: OrderRow) => <span className="text-sm font-mono text-foreground">#{String(row.id).slice(0, 8)}</span>,
        },
        { key: "product_name", label: "Product", sortable: true },
        {
            key: "entity_name", label: "Customer",
            render: (row: OrderRow) => (
                <div>
                    <p className="text-sm text-foreground">{row.entity_name}</p>
                    <p className="text-xs text-muted-foreground">{row.entity_type}</p>
                </div>
            ),
        },
        { key: "total_amount", label: "Amount", sortable: true, render: (row: OrderRow) => <span className="text-sm font-medium">${Number(row.total_amount).toFixed(2)}</span> },
        { key: "status", label: "Status", sortable: true, render: (row: OrderRow) => <StatusBadge status={row.status} /> },
        { key: "created_at", label: "Date", sortable: true, render: (row: OrderRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
    ];

    const statusTabs = [
        { key: "", label: "All", count: stats.total },
        { key: "active", label: "Active", count: stats.active, icon: CheckCircleIcon, color: "text-green-400" },
        { key: "pending", label: "Pending", count: stats.pending, icon: ClockIcon, color: "text-yellow-400" },
        { key: "failed", label: "Failed", count: stats.failed, icon: ExclamationCircleIcon, color: "text-red-400" },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Orders</h2>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statusTabs.map(({ key, label, count, icon, color }) => (
                    <button
                        key={label}
                        onClick={() => { setStatusFilter(key); setPage(1); }}
                        className={`bg-card rounded-xl p-4 border transition-all text-left
              ${statusFilter === key ? "border-red-500 ring-1 ring-red-500/30" : "border-border hover:border-border"}`}
                    >
                        <div className="flex items-center justify-between">
                            {icon && <StatsCard title="" value="" icon={icon} loading={false} />}
                            <span className="text-2xl font-bold text-foreground">{count}</span>
                        </div>
                        <p className={`text-sm mt-1 ${color || "text-muted-foreground"}`}>{label}</p>
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns} data={orders} loading={loading}
                searchPlaceholder="Search orders..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                page={page} totalPages={Math.ceil(total / PER)} onPageChange={setPage} total={total}
                emptyMessage="No orders found"
                actions={(row: OrderRow) => (
                    <>
                        {(row.status === "failed" || row.status === "error") && (
                            <button onClick={() => setRescueTarget(row)} className="px-2.5 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-1">
                                <ArrowPathIcon className="h-3.5 w-3.5" /> Rescue
                            </button>
                        )}
                        {row.status !== "refunded" && (
                            <button onClick={() => setRefundTarget(row)} className="px-2.5 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center gap-1">
                                <BanknotesIcon className="h-3.5 w-3.5" /> Refund
                            </button>
                        )}
                    </>
                )}
            />

            <ConfirmModal open={!!rescueTarget} onClose={() => setRescueTarget(null)} onConfirm={handleRescue} title="Rescue Order" message={`Re-provision order #${String(rescueTarget?.id).slice(0, 8)}?`} confirmLabel="Rescue" loading={actionLoading} destructive={false} />
            <ConfirmModal open={!!refundTarget} onClose={() => setRefundTarget(null)} onConfirm={handleRefund} title="Refund Order" message={`Refund $${Number(refundTarget?.total_amount || 0).toFixed(2)} to customer wallet?`} confirmLabel="Refund" loading={actionLoading} />
        </div>
    );
}
