import { useState, useEffect, useCallback } from "react";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { fetchAdminTransactions } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface TxRow {
    id: string;
    order_id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: string | null;
    payment_gateway: string;
    created_at: string;
}

export default function TransactionsTab() {
    const [transactions, setTransactions] = useState<TxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [entityTypeFilter, setEntityTypeFilter] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: "1", per: "50" };
            if (entityTypeFilter) params.entity_type = entityTypeFilter;

            const res = await fetchAdminTransactions(params);
            const data = res.data.transactions || [];
            const sorted = (data || []).sort((a: TxRow, b: TxRow) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setTransactions(sorted as TxRow[]);
        } catch { toast.error("Failed to load transactions"); }
        finally { setLoading(false); }
    }, [entityTypeFilter]);

    useEffect(() => { load(); }, [load]);

    const filtered = statusFilter ? transactions.filter((t) => t.status === statusFilter) : transactions;

    const statusCounts = {
        all: transactions.length,
        success: transactions.filter((t) => t.status === "success").length,
        pending: transactions.filter((t) => t.status === "pending").length,
        failed: transactions.filter((t) => t.status === "failed").length,
    };

    const columns = [
        { key: "id", label: "Transaction ID", render: (row: TxRow) => <span className="font-mono text-xs">{String(row.id).slice(0, 12)}</span> },
        { key: "order_id", label: "Order", render: (row: TxRow) => <span className="font-mono text-xs">{String(row.order_id).slice(0, 8)}</span> },
        { key: "amount", label: "Amount", sortable: true, render: (row: TxRow) => <span className="font-medium">{(row.currency || "USD").toUpperCase()} {Number(row.amount).toFixed(2)}</span> },
        { key: "payment_gateway", label: "Gateway", render: (row: TxRow) => <span className="text-sm capitalize text-muted-foreground">{row.payment_gateway || "—"}</span> },
        { key: "status", label: "Status", sortable: true, render: (row: TxRow) => <StatusBadge status={row.status || "unknown"} /> },
        { key: "created_at", label: "Date", sortable: true, render: (row: TxRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
    ];

    const tabs = [
        { key: "", label: "All", count: statusCounts.all },
        { key: "success", label: "Success", count: statusCounts.success },
        { key: "pending", label: "Pending", count: statusCounts.pending },
        { key: "failed", label: "Failed", count: statusCounts.failed },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Transactions</h2>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {tabs.map(({ key, label, count }) => (
                        <button
                            key={label}
                            onClick={() => setStatusFilter(key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                ${statusFilter === key ? "bg-red-500 text-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
                        >
                            {label}
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === key ? "bg-white/20" : "bg-muted"}`}>{count}</span>
                        </button>
                    ))}
                </div>

                <div className="shrink-0 flex items-center">
                    <select
                        value={entityTypeFilter}
                        onChange={(e) => setEntityTypeFilter(e.target.value)}
                        className="bg-card text-foreground border border-border rounded-lg text-sm px-3 py-2 outline-none hover:border-muted-foreground/30 transition-colors"
                    >
                        <option value="">All Customers</option>
                        <option value="User">Users Only</option>
                        <option value="Reseller">Resellers Only</option>
                    </select>
                </div>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No transactions found" />
        </div>
    );
}
