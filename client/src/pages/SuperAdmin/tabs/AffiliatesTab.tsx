import { useState, useEffect, useCallback } from "react";
import { TrashIcon, CogIcon, LinkIcon, PlusIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { fetchAffiliates, deleteAffiliate, configureAffiliate, processAffiliatePayout, fetchAffiliatePayouts, createAffiliate } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface AffiliateRow {
    id: number;
    referral_code: string;
    affiliatable_type: string;
    affiliatable_name: string;
    affiliatable_email: string;
    commission_rate: number;
    discount_rate: number;
    total_referrals: number;
    converted: number;
    total_earned: number;
    pending_balance: number;
    total_paid_out: number;
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
    const [configForm, setConfigForm] = useState({ commission_rate: "10", discount_rate: "5", status: "active" });
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ affiliatable_type: "User", email: "", commission_rate: "10", discount_rate: "5" });
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

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await createAffiliate({
                affiliatable_type: createForm.affiliatable_type,
                email: createForm.email,
                commission_rate: parseFloat(createForm.commission_rate),
                discount_rate: parseFloat(createForm.discount_rate),
            });
            toast.success("Affiliate created");
            setShowCreate(false);
            setCreateForm({ affiliatable_type: "User", email: "", commission_rate: "10", discount_rate: "5" });
            loadAffiliates();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create affiliate");
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessPayout = async (id: number) => {
        try { await processAffiliatePayout(id); toast.success("Payout processed"); loadPayouts(); }
        catch { toast.error("Failed"); }
    };

    const openConfig = (a: AffiliateRow) => {
        setConfigTarget(a);
        setConfigForm({
            commission_rate: String(a.commission_rate || 10),
            discount_rate: String(a.discount_rate || 5),
            status: a.status || "active"
        });
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Copied: ${code}`);
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
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground font-mono">{row.referral_code}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); copyCode(row.referral_code); }}
                                className="p-0.5 rounded text-muted-foreground hover:text-blue-400 transition-colors"
                                title="Copy promo code"
                            >
                                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">{row.affiliatable_type}: {row.affiliatable_email || row.affiliatable_name}</p>
                    </div>
                </div>
            ),
        },
        { key: "status", label: "Status", render: (row: AffiliateRow) => <StatusBadge status={row.status || "active"} /> },
        { key: "commission_rate", label: "Commission", render: (row: AffiliateRow) => <span className="text-sm font-medium text-emerald-400">{row.commission_rate}%</span> },
        { key: "discount_rate", label: "Discount", render: (row: AffiliateRow) => <span className="text-sm text-blue-400">{row.discount_rate}%</span> },
        { key: "total_referrals", label: "Referrals", sortable: true },
        { key: "converted", label: "Converted", sortable: true },
        {
            key: "total_earned", label: "Earnings", sortable: true,
            render: (row: AffiliateRow) => (
                <div>
                    <span className="text-sm font-medium text-foreground">${Number(row.total_earned || 0).toFixed(2)}</span>
                    {(row.pending_balance || 0) > 0 && (
                        <p className="text-[10px] text-yellow-400">${Number(row.pending_balance).toFixed(2)} pending</p>
                    )}
                </div>
            )
        },
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
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-foreground rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                        <PlusIcon className="h-4 w-4" /> Onboard Affiliate
                    </button>
                    <div className="flex bg-card rounded-xl border border-border p-0.5">
                        {(["affiliates", "payouts"] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveSubTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeSubTab === tab ? "bg-red-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
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

            {/* Create Affiliate Modal */}
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="Onboard New Affiliate" onSubmit={handleCreate} submitLabel="Create Affiliate" loading={actionLoading}>
                <Field label="Entity Type">
                    <select className={selectClasses} value={createForm.affiliatable_type} onChange={(e) => setCreateForm({ ...createForm, affiliatable_type: e.target.value })}>
                        <option value="User">User</option>
                        <option value="Reseller">Reseller</option>
                    </select>
                </Field>
                <Field label="Email *">
                    <input className={inputClasses} type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="user@example.com" required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Commission Rate (%)">
                        <input className={inputClasses} type="number" value={createForm.commission_rate} onChange={(e) => setCreateForm({ ...createForm, commission_rate: e.target.value })} />
                    </Field>
                    <Field label="Discount Rate (%)">
                        <input className={inputClasses} type="number" value={createForm.discount_rate} onChange={(e) => setCreateForm({ ...createForm, discount_rate: e.target.value })} />
                    </Field>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mt-2">
                    <p className="text-xs text-blue-300">A unique promo code will be auto-generated. The affiliate can use this code for referrals and checkout discounts.</p>
                </div>
            </FormModal>

            {/* Configure Modal */}
            <FormModal open={!!configTarget} onClose={() => setConfigTarget(null)} title={`Configure ${configTarget?.referral_code}`} onSubmit={handleConfigure} submitLabel="Apply" loading={actionLoading}>
                <Field label="Commission Rate (%)"><input className={inputClasses} type="number" value={configForm.commission_rate} onChange={(e) => setConfigForm({ ...configForm, commission_rate: e.target.value })} /></Field>
                <Field label="Discount Rate (%)"><input className={inputClasses} type="number" value={configForm.discount_rate} onChange={(e) => setConfigForm({ ...configForm, discount_rate: e.target.value })} /></Field>
                <Field label="Status">
                    <select className={selectClasses} value={configForm.status} onChange={(e) => setConfigForm({ ...configForm, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending_payout">Pending Payout</option>
                    </select>
                </Field>
            </FormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Affiliate" message={`Delete affiliate ${deleteTarget?.referral_code}?`} confirmLabel="Delete" loading={actionLoading} />
        </div>
    );
}
