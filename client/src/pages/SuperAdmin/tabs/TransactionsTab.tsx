import { useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";
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
                    <span className="ws-mono">{row.reference_type}</span>
                </div>
            )
        },
        { key: "amount", label: "Amount", sortable: true, render: (row: TxRow) => <span className="font-medium">{(row.currency ?? "USD").toUpperCase()} {Number(row.amount).toFixed(2)}</span> },
        { key: "payment_gateway", label: "Gateway", render: (row: TxRow) => <span className="text-sm capitalize text-muted-foreground">{row.payment_gateway ?? "—"}</span> },
        { key: "status", label: "Status", sortable: true, render: (row: TxRow) => <StatusBadge status={row.status ?? "unknown"} /> },
        { key: "created_at", label: "Date", sortable: true, render: (row: TxRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
    ];

    return (
        <div className="ws-stack">
            <PageHeader
                title="Transactions"
                description={`${filtered.length} transactions.`}
                actions={<>
                    <label className="sr-only" htmlFor="tx-entity">Account type</label>
                    <select id="tx-entity" className="ws-input" style={{ width: 170 }} value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)}>
                        <option value="">All accounts</option>
                        <option value="User">Users only</option>
                        <option value="Reseller">Resellers only</option>
                    </select>
                </>}
            />

            <div className="ws-tabs" role="group" aria-label="Transaction status">
                {STATUS_TABS.map(({ key, label }) => (
                    <button type="button" key={key} aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>
                        {label}<span className="ws-count">{counts[key as keyof typeof counts] ?? counts.all}</span>
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
