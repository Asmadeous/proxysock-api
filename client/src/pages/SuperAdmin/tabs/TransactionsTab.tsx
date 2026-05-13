import { useState, useMemo } from "react";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useAdminTransactions } from "../queries/transactions.queries";

interface TxRow {
    id: string;
    reference_id: string;
    reference_type: string;
    user_id: string;
    amount: number;
    currency: string;
    status: string | null;
    payment_gateway: string;
    created_at: string;
}

const STATUS_TABS = [
    { key: "", label: "All" },
    { key: "success", label: "Success" },
    { key: "pending", label: "Pending" },
    { key: "failed", label: "Failed" },
];

export default function TransactionsTab() {
    const [statusFilter, setStatusFilter] = useState("");
    const [entityTypeFilter, setEntityTypeFilter] = useState("");

    const { data, isLoading } = useAdminTransactions({ entityType: entityTypeFilter });

    const transactions: TxRow[] = useMemo(() => {
        const raw: TxRow[] = data?.transactions ?? [];
        return [...raw].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [data]);

    const filtered = statusFilter
        ? transactions.filter((t) => t.status === statusFilter)
        : transactions;

    const counts = useMemo(() => ({
        all: transactions.length,
        success: transactions.filter((t) => t.status === "success").length,
        pending: transactions.filter((t) => t.status === "pending").length,
        failed: transactions.filter((t) => t.status === "failed").length,
    }), [transactions]);

    const columns = [
        { key: "id", label: "Transaction ID", render: (row: TxRow) => <span className="font-mono text-xs">{String(row.id).slice(0, 12)}</span> },
        {
            key: "reference_id",
            label: "Reference",
            render: (row: TxRow) => (
                <div className="flex flex-col">
                    <span className="font-mono text-[10px]">{String(row.reference_id || "N/A").slice(0, 8)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{row.reference_type}</span>
                </div>
            )
        },
        { key: "amount", label: "Amount", sortable: true, render: (row: TxRow) => <span className="font-medium">{(row.currency ?? "USD").toUpperCase()} {Number(row.amount).toFixed(2)}</span> },
        { key: "payment_gateway", label: "Gateway", render: (row: TxRow) => <span className="text-sm capitalize text-muted-foreground">{row.payment_gateway ?? "—"}</span> },
        { key: "status", label: "Status", sortable: true, render: (row: TxRow) => <StatusBadge status={row.status ?? "unknown"} /> },
        { key: "created_at", label: "Date", sortable: true, render: (row: TxRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Transactions</h2>
                    <p className="text-sm text-muted-foreground mt-1">{filtered.length} transactions</p>
                </div>
                <select
                    value={entityTypeFilter}
                    onChange={(e) => setEntityTypeFilter(e.target.value)}
                    className="bg-card text-foreground border border-border rounded-xl text-sm px-4 py-2 outline-none hover:border-muted-foreground/30 transition-colors"
                >
                    <option value="">All Entities</option>
                    <option value="User">Users Only</option>
                    <option value="Reseller">Resellers Only</option>
                </select>
            </div>

            {/* Status tabs */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${statusFilter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                        {label}
                        <span className="text-xs opacity-70">
                            {counts[key as keyof typeof counts] ?? counts.all}
                        </span>
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filtered}
                loading={isLoading}
                emptyMessage={<EmptyState icon={CurrencyDollarIcon} title="No transactions" description="Transactions will appear here once customers make purchases." />}
            />
        </div>
    );
}
