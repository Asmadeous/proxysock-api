import { useState, useEffect } from "react";
import { TrashIcon, CogIcon, LinkIcon, PlusIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { validEmail, positiveNumber, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import EmptyState from "../components/EmptyState";
import {
    useAdminAffiliates,
    useAdminAffiliatePayouts,
    useCreateAffiliate,
    useDeleteAffiliate,
    useConfigureAffiliate,
    useProcessAffiliatePayout,
} from "../queries/affiliates.queries";
import { fetchAdminUsers, fetchResellers } from "../../../services/adminApi";
import { toast } from "sonner";
import { getApiError } from "../utils/errors";

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
    reseller_type?: string;
}

interface PayoutRow {
    id: number;
    affiliate_id: number;
    amount: number;
    status: string;
    created_at: string;
}

export default function AffiliatesTab() {
    const { get, update } = useTabFilters();
    const search = get("search");
    const activeSubTab = (get("subtab") || "affiliates") as "affiliates" | "payouts";

    const [deleteTarget, setDeleteTarget] = useState<AffiliateRow | null>(null);
    const [configTarget, setConfigTarget] = useState<AffiliateRow | null>(null);
    const [configForm, setConfigForm] = useState({ commission_rate: "10", discount_rate: "5", status: "active" });
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ affiliatable_type: "User", email: "", name: "", commission_rate: "10", discount_rate: "5", affiliatable_id: "" });
    const [createErrors, setCreateErrors] = useState<ValidationErrors>({});
    const [entities, setEntities] = useState<any[]>([]);
    const [entitySearch, setEntitySearch] = useState("");
    const [searching, setSearching] = useState(false);

    const { data: affiliatesData, isLoading: affiliatesLoading } = useAdminAffiliates({ search });
    const { data: payoutsData, isLoading: payoutsLoading } = useAdminAffiliatePayouts();

    const affiliates: AffiliateRow[] = affiliatesData?.affiliates ?? [];
    const total: number = affiliatesData?.total ?? 0;
    const payouts: PayoutRow[] = payoutsData?.payouts ?? [];

    const createAffiliate = useCreateAffiliate();
    const deleteAffiliate = useDeleteAffiliate();
    const configureAffiliate = useConfigureAffiliate();
    const processPayout = useProcessAffiliatePayout();

    const handleProcessPayout = async (id: number) => {
        try {
            await processPayout.mutateAsync(id);
            toast.success("Payout processed successfully");
        } catch (err) {
            toast.error(getApiError(err, "Failed to process payout"));
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteAffiliate.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleConfigure = async () => {
        if (!configTarget) return;
        await configureAffiliate.mutateAsync({ id: configTarget.id, data: configForm });
        setConfigTarget(null);
    };

    const handleCreate = async () => {
        const errors = {
            email: validEmail(createForm.email),
            commission_rate: positiveNumber(createForm.commission_rate, "Commission rate"),
        };
        if (hasErrors(errors)) { setCreateErrors(errors); return; }
        await createAffiliate.mutateAsync({
            affiliatable_type: createForm.affiliatable_type,
            affiliatable_id: createForm.affiliatable_id || undefined,
            email: createForm.email,
            name: createForm.name || undefined,
            commission_rate: parseFloat(createForm.commission_rate),
            discount_rate: parseFloat(createForm.discount_rate),
        });
        setShowCreate(false);
        setCreateForm({ affiliatable_type: "User", email: "", name: "", commission_rate: "10", discount_rate: "5", affiliatable_id: "" });
        setCreateErrors({});
    };

    useEffect(() => {
        if (!showCreate || createForm.affiliatable_type === "Standalone") {
            setEntities([]);
            return;
        }
        const fetchEntities = async () => {
            setSearching(true);
            try {
                const params = { q: entitySearch, per: "10" };
                if (createForm.affiliatable_type === "User") {
                    const res = await fetchAdminUsers(params);
                    setEntities(res.data.users?.filter((u: any) => !u.has_affiliate) || []);
                } else if (createForm.affiliatable_type === "Reseller") {
                    const res = await fetchResellers(params);
                    setEntities(res.data.resellers?.filter((r: any) => !r.has_affiliate) || []);
                }
            } catch {
                toast.error("Error searching entities");
            } finally {
                setSearching(false);
            }
        };
        const timer = setTimeout(fetchEntities, 300);
        return () => clearTimeout(timer);
    }, [showCreate, createForm.affiliatable_type, entitySearch]);

    const selectEntity = (e: any) => {
        setCreateForm({ ...createForm, affiliatable_id: e.id, email: e.email, name: e.company_name || `${e.first_name} ${e.last_name}` });
        setEntitySearch("");
    };

    const openConfig = (a: AffiliateRow) => {
        setConfigTarget(a);
        setConfigForm({
            commission_rate: String(a.commission_rate ?? 10),
            discount_rate: String(a.discount_rate ?? 5),
            status: a.status ?? "active",
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
                                aria-label="Copy referral code"
                                className="p-0.5 rounded text-muted-foreground hover:text-blue-400 transition-colors"
                            >
                                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">{row.affiliatable_type}: {row.affiliatable_email ?? row.affiliatable_name}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "type", label: "Type",
            render: (row: AffiliateRow) => (
                <div className="flex flex-col">
                    <span className="text-sm text-foreground">{row.affiliatable_type || "Standalone"}</span>
                    {row.reseller_type && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-border/50 px-1.5 py-0.5 rounded-md self-start mt-1 font-mono">
                            {row.reseller_type.replace("_", " ")}
                        </span>
                    )}
                </div>
            ),
        },
        { key: "status", label: "Status", render: (row: AffiliateRow) => <StatusBadge status={row.status ?? "active"} /> },
        { key: "commission_rate", label: "Commission", render: (row: AffiliateRow) => <span className="text-sm font-medium text-emerald-400">{row.commission_rate}%</span> },
        { key: "discount_rate", label: "Discount", render: (row: AffiliateRow) => <span className="text-sm text-blue-400">{row.discount_rate}%</span> },
        { key: "total_referrals", label: "Referrals", sortable: true },
        { key: "converted", label: "Converted", sortable: true },
        {
            key: "total_earned", label: "Earnings", sortable: true,
            render: (row: AffiliateRow) => (
                <div>
                    <span className="text-sm font-medium text-foreground">${Number(row.total_earned ?? 0).toFixed(2)}</span>
                    {(row.pending_balance ?? 0) > 0 && (
                        <p className="text-[10px] text-yellow-400">${Number(row.pending_balance).toFixed(2)} pending</p>
                    )}
                </div>
            ),
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
                    <Button onClick={() => setShowCreate(true)}>
                        <PlusIcon className="h-4 w-4" /> Onboard Affiliate
                    </Button>
                    <div className="flex bg-card rounded-xl border border-border p-0.5">
                        {(["affiliates", "payouts"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => update({ subtab: tab, search: "" })}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeSubTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeSubTab === "affiliates" ? (
                <DataTable
                    columns={affiliateColumns}
                    data={affiliates}
                    loading={affiliatesLoading}
                    searchPlaceholder="Search affiliates..."
                    onSearch={(q) => update({ search: q })}
                    total={total}
                    emptyMessage={<EmptyState icon={LinkIcon} title="No affiliates" description="Onboard affiliates to start tracking referrals." action={{ label: "Onboard Affiliate", onClick: () => setShowCreate(true) }} />}
                    actions={(row: AffiliateRow) => (
                        <>
                            <button onClick={() => openConfig(row)} aria-label="Configure affiliate" className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10">
                                <CogIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(row)} aria-label="Delete affiliate" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}
                />
            ) : (
                <DataTable
                    columns={payoutColumns}
                    data={payouts}
                    loading={payoutsLoading}
                    emptyMessage={<EmptyState title="No payouts" description="Affiliate payout requests will appear here." />}
                    actions={(row: PayoutRow) =>
                        row.status === "pending" ? (
                            <button
                                onClick={() => handleProcessPayout(row.id)}
                                className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                                Process
                            </button>
                        ) : null
                    }
                />
            )}

            {/* Create Affiliate Modal */}
            <FormModal open={showCreate} onClose={() => { setShowCreate(false); setCreateErrors({}); }} title="Onboard New Affiliate" onSubmit={handleCreate} submitLabel="Create Affiliate" loading={createAffiliate.isLoading}>
                <Field label="Entity Type">
                    <select className={selectClasses} value={createForm.affiliatable_type} onChange={(e) => setCreateForm({ ...createForm, affiliatable_type: e.target.value })}>
                        <option value="Standalone">Standalone (External Partner)</option>
                        <option value="User">Existing User</option>
                        <option value="Reseller">Existing Reseller</option>
                    </select>
                </Field>

                {createForm.affiliatable_id ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Selected {createForm.affiliatable_type}</p>
                            <p className="text-sm font-medium text-foreground">{createForm.name}</p>
                            <p className="text-xs text-muted-foreground">{createForm.email}</p>
                        </div>
                        <button onClick={() => setCreateForm({ ...createForm, affiliatable_id: "", email: "", name: "" })} className="text-xs text-red-400 hover:text-red-300">Change</button>
                    </div>
                ) : createForm.affiliatable_type !== "Standalone" ? (
                    <div className="space-y-3 mb-4">
                        <Field label={`Search ${createForm.affiliatable_type} *`}>
                            <div className="relative">
                                <input
                                    className={inputClasses}
                                    type="text"
                                    value={entitySearch}
                                    onChange={(e) => setEntitySearch(e.target.value)}
                                    placeholder="Search by email or name..."
                                />
                                {searching && <div className="absolute right-3 top-2.5"><div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full"></div></div>}
                            </div>
                        </Field>
                        {entities.length > 0 && (
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
                                {entities.map((e) => (
                                    <button key={e.id} onClick={() => selectEntity(e)} className="w-full px-4 py-2.5 text-left hover:bg-emerald-500/5 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-foreground group-hover:text-emerald-400">{e.company_name || `${e.first_name} ${e.last_name}`}</p>
                                            {e.reseller_type && <span className="text-[10px] text-muted-foreground font-mono uppercase">{e.reseller_type}</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{e.email}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {entitySearch && !searching && entities.length === 0 && (
                            <p className="text-center py-2 text-xs text-muted-foreground">No eligible {createForm.affiliatable_type.toLowerCase()}s found</p>
                        )}
                    </div>
                ) : (
                    <>
                        <Field label="Name *">
                            <input className={inputClasses} type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Influencer Name or Brand" />
                        </Field>
                        <Field label="Email *" error={createErrors.email}>
                            <input className={inputClasses} type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="partner@example.com" />
                        </Field>
                    </>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Commission Rate (%)" error={createErrors.commission_rate}>
                        <input className={inputClasses} type="number" value={createForm.commission_rate} onChange={(e) => setCreateForm({ ...createForm, commission_rate: e.target.value })} />
                    </Field>
                    <Field label="Discount Rate (%)">
                        <input className={inputClasses} type="number" value={createForm.discount_rate} onChange={(e) => setCreateForm({ ...createForm, discount_rate: e.target.value })} />
                    </Field>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mt-2">
                    <p className="text-xs text-blue-300">A unique promo code will be auto-generated for referrals and checkout discounts.</p>
                </div>
            </FormModal>

            {/* Configure Modal */}
            <FormModal open={!!configTarget} onClose={() => setConfigTarget(null)} title={`Configure ${configTarget?.referral_code}`} onSubmit={handleConfigure} submitLabel="Apply" loading={configureAffiliate.isLoading}>
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

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Affiliate" message={`Delete affiliate ${deleteTarget?.referral_code}?`} confirmLabel="Delete" loading={deleteAffiliate.isLoading} />
        </div>
    );
}
