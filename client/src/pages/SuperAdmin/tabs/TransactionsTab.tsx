import { useState, useEffect, useCallback } from "react";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { fetchTransactions } from "../../../services/transaction";
import { toast } from "react-hot-toast";

interface TxRow {
    id: string;
    order_id: string;
    user_id: string;
    amount: number;
    currency: string;
    payment_status: string | null;
    payment_method: string;
    created_at: string;
}

export default function TransactionsTab() {
    const [transactions, setTransactions] = useState<TxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTransactions();
            const sorted = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setTransactions(sorted as TxRow[]);
        } catch { toast.error("Failed to load transactions"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = statusFilter ? transactions.filter((t) => t.payment_status === statusFilter) : transactions;

    const statusCounts = {
        all: transactions.length,
        succeeded: transactions.filter((t) => t.payment_status === "succeeded").length,
        pending: transactions.filter((t) => t.payment_status === "pending").length,
        failed: transactions.filter((t) => t.payment_status === "failed").length,
    };

    const columns = [
        { key: "id", label: "Transaction ID", render: (row: TxRow) => <span className="font-mono text-xs">{String(row.id).slice(0, 12)}</span> },
        { key: "order_id", label: "Order", render: (row: TxRow) => <span className="font-mono text-xs">{String(row.order_id).slice(0, 8)}</span> },
        { key: "amount", label: "Amount", sortable: true, render: (row: TxRow) => <span className="font-medium">{(row.currency || "USD").toUpperCase()} {Number(row.amount).toFixed(2)}</span> },
        { key: "payment_method", label: "Method", render: (row: TxRow) => <span className="text-sm capitalize text-muted-foreground">{row.payment_method || "—"}</span> },
        { key: "payment_status", label: "Status", sortable: true, render: (row: TxRow) => <StatusBadge status={row.payment_status || "unknown"} /> },
        { key: "created_at", label: "Date", sortable: true, render: (row: TxRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
    ];

    const tabs = [
        { key: "", label: "All", count: statusCounts.all },
        { key: "succeeded", label: "Succeeded", count: statusCounts.succeeded },
        { key: "pending", label: "Pending", count: statusCounts.pending },
        { key: "failed", label: "Failed", count: statusCounts.failed },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Transactions</h2>

            {/* Filter tabs */}
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

            <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No transactions found" />
        </div>
    );
}
