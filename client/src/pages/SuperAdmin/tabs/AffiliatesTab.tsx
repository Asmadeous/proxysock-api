import { useState, useEffect, useCallback } from "react";
import { TrashIcon, CogIcon, LinkIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { fetchAffiliates, deleteAffiliate, configureAffiliate, processAffiliatePayout, fetchAffiliatePayouts } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface AffiliateRow {
    id: number;
    referral_code: string;
    owner_type: string;
    owner_email: string;
    commission_rate: number;
    discount_rate: number;
    total_referrals: number;
    converted_referrals: number;
    total_earnings: number;
    status: string;
    created_at: string;
}

interface PayoutRow {
    id: number;
    affiliate_id: number;
    amount: number;
    status: string;
    created_at: string;
}

export default function AffiliatesTab() {
    const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
    const [payouts, setPayouts] = useState<PayoutRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [activeSubTab, setActiveSubTab] = useState<"affiliates" | "payouts">("affiliates");

    const [deleteTarget, setDeleteTarget] = useState<AffiliateRow | null>(null);
    const [configTarget, setConfigTarget] = useState<AffiliateRow | null>(null);
    const [configForm, setConfigForm] = useState({ commission_rate: "10", discount_rate: "5" });
    const [actionLoading, setActionLoading] = useState(false);

    const loadAffiliates = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (search) params.q = search;
            const res = await fetchAffiliates(params);
            setAffiliates(res.data.affiliates || []);
            setTotal(res.data.total || 0);
        } catch { toast.error("Failed to load affiliates"); }
        finally { setLoading(false); }
    }, [search]);

    const loadPayouts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAffiliatePayouts();
            setPayouts(res.data.payouts || []);
        } catch { toast.error("Failed to load payouts"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { activeSubTab === "affiliates" ? loadAffiliates() : loadPayouts(); }, [activeSubTab, loadAffiliates, loadPayouts]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try { await deleteAffiliate(deleteTarget.id); toast.success("Affiliate deleted"); setDeleteTarget(null); loadAffiliates(); }
        catch { toast.error("Failed"); }
        finally { setActionLoading(false); }
    };

    const handleConfigure = async () => {
        if (!configTarget) return;
        setActionLoading(true);
        try { await configureAffiliate(configTarget.id, configForm); toast.success("Configured"); setConfigTarget(null); loadAffiliates(); }
        catch { toast.error("Failed"); }
        finally { setActionLoading(false); }
    };

    const handleProcessPayout = async (id: number) => {
        try { await processAffiliatePayout(id); toast.success("Payout processed"); loadPayouts(); }
        catch { toast.error("Failed"); }
    };

    const openConfig = (a: AffiliateRow) => {
        setConfigTarget(a);
        setConfigForm({ commission_rate: String(a.commission_rate || 10), discount_rate: String(a.discount_rate || 5) });
    };

    const affiliateColumns = [
        {
            key: "referral_code", label: "Affiliate", sortable: true,
            render: (row: AffiliateRow) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <LinkIcon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground font-mono">{row.referral_code}</p>
                        <p className="text-xs text-muted-foreground">{row.owner_type}: {row.owner_email}</p>
                    </div>
                </div>
            ),
        },
        { key: "status", label: "Status", render: (row: AffiliateRow) => <StatusBadge status={row.status || "active"} /> },
        { key: "commission_rate", label: "Commission", render: (row: AffiliateRow) => <span className="text-sm">{row.commission_rate}%</span> },
        { key: "discount_rate", label: "Discount", render: (row: AffiliateRow) => <span className="text-sm">{row.discount_rate}%</span> },
        { key: "total_referrals", label: "Referrals", sortable: true },
        { key: "converted_referrals", label: "Converted", sortable: true },
        { key: "total_earnings", label: "Earnings", sortable: true, render: (row: AffiliateRow) => <span className="text-sm font-medium">${Number(row.total_earnings || 0).toFixed(2)}</span> },
    ];

    const payoutColumns = [
        { key: "id", label: "ID", sortable: true },
        { key: "affiliate_id", label: "Affiliate ID" },
        { key: "amount", label: "Amount", render: (row: PayoutRow) => <span className="font-medium">${Number(row.amount).toFixed(2)}</span> },
        { key: "status", label: "Status", render: (row: PayoutRow) => <StatusBadge status={row.status} /> },
        { key: "created_at", label: "Requested", render: (row: PayoutRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Affiliates</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} affiliates</p>
                </div>
                <div className="flex bg-card rounded-xl border border-border p-0.5">
                    {(["affiliates", "payouts"] as const).map((tab) => (
                        <button key={tab} onClick={() => setActiveSubTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeSubTab === tab ? "bg-red-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeSubTab === "affiliates" ? (
                <DataTable
                    columns={affiliateColumns} data={affiliates} loading={loading}
                    searchPlaceholder="Search affiliates..." onSearch={(q) => setSearch(q)}
                    total={total} emptyMessage="No affiliates"
                    actions={(row: AffiliateRow) => (
                        <>
                            <button onClick={() => openConfig(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10" title="Configure"><CogIcon className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                        </>
                    )}
                />
            ) : (
                <DataTable
                    columns={payoutColumns} data={payouts} loading={loading}
                    emptyMessage="No payouts"
                    actions={(row: PayoutRow) => row.status === "pending" ? (
                        <button onClick={() => handleProcessPayout(row.id)} className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">Process</button>
                    ) : null}
                />
            )}

            <FormModal open={!!configTarget} onClose={() => setConfigTarget(null)} title={`Configure ${configTarget?.referral_code}`} onSubmit={handleConfigure} submitLabel="Apply" loading={actionLoading}>
                <Field label="Commission Rate (%)"><input className={inputClasses} type="number" value={configForm.commission_rate} onChange={(e) => setConfigForm({ ...configForm, commission_rate: e.target.value })} /></Field>
                <Field label="Discount Rate (%)"><input className={inputClasses} type="number" value={configForm.discount_rate} onChange={(e) => setConfigForm({ ...configForm, discount_rate: e.target.value })} /></Field>
            </FormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Affiliate" message={`Delete affiliate ${deleteTarget?.referral_code}?`} confirmLabel="Delete" loading={actionLoading} />
        </div>
    );
}
