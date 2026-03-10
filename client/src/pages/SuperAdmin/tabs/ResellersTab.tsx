import { useState, useEffect, useCallback } from "react";
import { PencilIcon, TrashIcon, PlusIcon, CogIcon, ArrowPathIcon, EyeIcon, ChevronUpIcon, UsersIcon, GlobeAltIcon, ServerStackIcon, WalletIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import StatsCard from "../components/StatsCard";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { fetchResellers, createReseller, updateReseller, deleteReseller, onboardReseller, configureReseller, fetchResellerDetail } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface ResellerRow {
    id: string;
    email: string;
    username: string;
    company_name: string;
    reseller_type: string;
    balance: number;
    earnings_balance: number;
    surcharge: number;
    subscription_fee: number | null;
    subscription_expires_at: string | null;
    dedicated_api_key: string | null;
    customer_email: string | null;
    total_orders: number;
    has_affiliate: boolean;
    created_at: string;
    // Full detail fields
    orders?: { id: string; product: string; status: string; total: number; created_at: string }[];
    webhooks?: { id: string; url: string; events: string[]; created_at: string }[];
}

interface Stats {
    total: number;
    api_only: number;
    enterprise: number;
    total_balance: number;
}

const EMPTY_FORM = { email: "", username: "", company_name: "", password: "", reseller_type: "api_only" };

const TYPE_FILTERS = [
    { label: "All", value: "" },
    { label: "API Only", value: "api_only" },
    { label: "Enterprise", value: "infrastructure" },
];

export default function ResellersTab() {
    const [resellers, setResellers] = useState<ResellerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState<Stats>({ total: 0, api_only: 0, enterprise: 0, total_balance: 0 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const PER = 25;

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<ResellerRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ResellerRow | null>(null);
    const [configTarget, setConfigTarget] = useState<ResellerRow | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedDetail, setExpandedDetail] = useState<ResellerRow | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [configForm, setConfigForm] = useState({
        reseller_type: "api_only",
        surcharge: "0",
        subscription_fee: "",
        subscription_expires_at: "",
        dedicated_api_key: "",
        customer_email: "",
    });
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), per: String(PER) };
            if (search) params.q = search;
            if (typeFilter) params.type = typeFilter;
            const res = await fetchResellers(params);
            setResellers(res.data.resellers);
            setTotal(res.data.total);
            if (res.data.stats) setStats(res.data.stats);
        } catch { toast.error("Failed to load resellers"); }
        finally { setLoading(false); }
    }, [page, search, typeFilter]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await createReseller(form);
            toast.success("Reseller created");
            setShowCreate(false);
            setForm(EMPTY_FORM);
            load();
        } catch { toast.error("Failed to create"); }
        finally { setActionLoading(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const { password, ...data } = form;
            await updateReseller(editTarget.id, data);
            toast.success("Reseller updated");
            setEditTarget(null);
            load();
        } catch { toast.error("Failed to update"); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await deleteReseller(deleteTarget.id);
            toast.success("Reseller deleted");
            setDeleteTarget(null);
            load();
        } catch { toast.error("Failed to delete"); }
        finally { setActionLoading(false); }
    };

    const handleOnboard = async (id: string) => {
        try {
            const res = await onboardReseller(id);
            toast.success(res.data.message);
            load();
        } catch { toast.error("Failed to onboard"); }
    };

    const handleConfigure = async () => {
        if (!configTarget) return;
        setActionLoading(true);
        try {
            await configureReseller(configTarget.id, configForm);
            toast.success("Reseller configured");
            setConfigTarget(null);
            load();
        } catch { toast.error("Failed to configure"); }
        finally { setActionLoading(false); }
    };

    const openEdit = (r: ResellerRow) => {
        setEditTarget(r);
        setForm({ email: r.email, username: r.username, company_name: r.company_name || "", password: "", reseller_type: r.reseller_type || "api_only" });
    };

    const openConfig = (r: ResellerRow) => {
        setConfigTarget(r);
        setConfigForm({
            reseller_type: r.reseller_type || "api_only",
            surcharge: String(r.surcharge || 0),
            subscription_fee: r.subscription_fee ? String(r.subscription_fee) : "",
            subscription_expires_at: r.subscription_expires_at ? r.subscription_expires_at.slice(0, 10) : "",
            dedicated_api_key: r.dedicated_api_key || "",
            customer_email: r.customer_email || "",
        });
    };

    const toggleExpand = async (r: ResellerRow) => {
        if (expandedId === r.id) {
            setExpandedId(null);
            setExpandedDetail(null);
            return;
        }
        setExpandedId(r.id);
        try {
            const res = await fetchResellerDetail(r.id);
            setExpandedDetail(res.data);
        } catch {
            setExpandedDetail(r);
        }
    };

    const tierLabel = (type: string) => {
        if (type === "infrastructure") return "Enterprise";
        if (type === "api_only") return "API Only";
        return type;
    };

    const tierColor = (type: string) => {
        if (type === "infrastructure") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    };

    const columns = [
        {
            key: "company_name", label: "Reseller", sortable: true,
            render: (row: ResellerRow) => (
                <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${row.reseller_type === "infrastructure" ? "bg-emerald-500/20" : "bg-blue-500/20"}`}>
                        <span className={`text-xs font-bold ${row.reseller_type === "infrastructure" ? "text-emerald-400" : "text-blue-400"}`}>
                            {(row.company_name || row.username)?.[0]?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{row.company_name || row.username}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "reseller_type", label: "Tier", sortable: true,
            render: (row: ResellerRow) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${tierColor(row.reseller_type)}`}>
                    {tierLabel(row.reseller_type)}
                </span>
            ),
        },
        {
            key: "balance", label: "Balance", sortable: true,
            render: (row: ResellerRow) => (
                <div className="text-right">
                    <p className="text-sm font-medium">${Number(row.balance || 0).toFixed(2)}</p>
                    {row.reseller_type === "infrastructure" && (
                        <p className="text-xs text-emerald-400">${Number(row.earnings_balance || 0).toFixed(2)} earned</p>
                    )}
                </div>
            ),
        },
        {
            key: "subscription_fee", label: "Subscription", sortable: false,
            render: (row: ResellerRow) => {
                if (row.reseller_type !== "infrastructure") return <span className="text-xs text-muted-foreground">—</span>;
                const isActive = row.subscription_expires_at && new Date(row.subscription_expires_at) > new Date();
                return (
                    <div>
                        <p className="text-sm font-medium">${row.subscription_fee || 0}/mo</p>
                        <span className={`text-xs ${isActive ? "text-emerald-400" : "text-red-400"}`}>
                            {isActive ? "Active" : "Expired"}
                        </span>
                    </div>
                );
            },
        },
        { key: "total_orders", label: "Orders", sortable: true },
        { key: "created_at", label: "Joined", render: (row: ResellerRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Resellers" value={stats.total} icon={UsersIcon} />
                <StatsCard title="API Only" value={stats.api_only} icon={GlobeAltIcon} change={`${stats.api_only} API resellers`} />
                <StatsCard title="Enterprise" value={stats.enterprise} icon={ServerStackIcon} change={`${stats.enterprise} infrastructure`} />
                <StatsCard title="Total Balance" value={`$${stats.total_balance.toFixed(2)}`} icon={WalletIcon} />
            </div>

            {/* Header + Filter Chips */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">Resellers</h2>
                    <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
                        {TYPE_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => { setTypeFilter(f.value); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === f.value
                                    ? "bg-red-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-foreground rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                    <PlusIcon className="h-4 w-4" /> Add Reseller
                </button>
            </div>

            <DataTable
                columns={columns} data={resellers} loading={loading}
                searchPlaceholder="Search resellers..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                page={page} totalPages={Math.ceil(total / PER)} onPageChange={setPage} total={total}
                emptyMessage="No resellers found"
                actions={(row: ResellerRow) => (
                    <>
                        <button onClick={() => toggleExpand(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Details">
                            {expandedId === row.id ? <ChevronUpIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => openConfig(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10" title="Configure"><CogIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleOnboard(row.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-green-500/10" title="Onboard"><ArrowPathIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                    </>
                )}
            />

            {/* Detail Panel */}
            {expandedId && expandedDetail && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">
                            {expandedDetail.company_name || expandedDetail.username} — Details
                        </h3>
                        <button onClick={() => { setExpandedId(null); setExpandedDetail(null); }} className="text-muted-foreground hover:text-foreground">
                            <ChevronUpIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Orders */}
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Recent Orders</h4>
                            {expandedDetail.orders && expandedDetail.orders.length > 0 ? (
                                <div className="space-y-1.5">
                                    {expandedDetail.orders.slice(0, 8).map((o) => (
                                        <div key={o.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                                            <span className="text-foreground font-medium truncate max-w-[150px]">{o.product || "—"}</span>
                                            <StatusBadge status={o.status} />
                                            <span className="text-muted-foreground">${Number(o.total || 0).toFixed(2)}</span>
                                            <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-muted-foreground">No orders</p>}
                        </div>

                        {/* Account Details + Webhooks */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">Account Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                                        <p className="text-muted-foreground">Type</p>
                                        <p className="font-medium text-foreground">{tierLabel(expandedDetail.reseller_type)}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                                        <p className="text-muted-foreground">Surcharge</p>
                                        <p className="font-medium text-foreground">{expandedDetail.surcharge || 0}%</p>
                                    </div>
                                    {expandedDetail.reseller_type === "infrastructure" && (
                                        <>
                                            <div className="bg-muted/50 rounded-lg px-3 py-2">
                                                <p className="text-muted-foreground">Subscription</p>
                                                <p className="font-medium text-foreground">${expandedDetail.subscription_fee || 0}/mo</p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg px-3 py-2">
                                                <p className="text-muted-foreground">Expires</p>
                                                <p className="font-medium text-foreground">{expandedDetail.subscription_expires_at ? new Date(expandedDetail.subscription_expires_at).toLocaleDateString() : "—"}</p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg px-3 py-2 col-span-2">
                                                <p className="text-muted-foreground">API Key</p>
                                                <p className="font-mono text-foreground text-[10px] truncate">{expandedDetail.dedicated_api_key || "Not set"}</p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg px-3 py-2 col-span-2">
                                                <p className="text-muted-foreground">Customer Email</p>
                                                <p className="font-medium text-foreground">{expandedDetail.customer_email || "Not set"}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {expandedDetail.webhooks && expandedDetail.webhooks.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Webhooks</h4>
                                    <div className="space-y-1.5">
                                        {expandedDetail.webhooks.map((w) => (
                                            <div key={w.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                                                <span className="text-foreground font-mono truncate max-w-[200px]">{w.url}</span>
                                                <span className="text-muted-foreground">{w.events?.length || 0} events</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="Add Reseller" onSubmit={handleCreate} submitLabel="Create" loading={actionLoading}>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username"><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name"><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Password"><input className={inputClasses} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                <Field label="Tier">
                    <select className={selectClasses} value={form.reseller_type} onChange={(e) => setForm({ ...form, reseller_type: e.target.value })}>
                        <option value="api_only">API Only</option>
                        <option value="infrastructure">Enterprise</option>
                    </select>
                </Field>
            </FormModal>

            {/* Edit Modal */}
            <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Reseller" onSubmit={handleUpdate} submitLabel="Update" loading={actionLoading}>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username"><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name"><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Tier">
                    <select className={selectClasses} value={form.reseller_type} onChange={(e) => setForm({ ...form, reseller_type: e.target.value })}>
                        <option value="api_only">API Only</option>
                        <option value="infrastructure">Enterprise</option>
                    </select>
                </Field>
            </FormModal>

            {/* Configure Modal */}
            <FormModal
                open={!!configTarget}
                onClose={() => setConfigTarget(null)}
                title={`Configure ${configTarget?.company_name || configTarget?.username}`}
                onSubmit={handleConfigure}
                submitLabel="Apply"
                loading={actionLoading}
            >
                <Field label="Reseller Tier">
                    <select className={selectClasses} value={configForm.reseller_type} onChange={(e) => setConfigForm({ ...configForm, reseller_type: e.target.value })}>
                        <option value="api_only">API Only</option>
                        <option value="infrastructure">Enterprise</option>
                    </select>
                </Field>
                <Field label="Infrastructure Surcharge (%)">
                    <input className={inputClasses} type="number" value={configForm.surcharge} onChange={(e) => setConfigForm({ ...configForm, surcharge: e.target.value })} />
                </Field>

                <Field label="Dedicated API Key">
                    <input className={inputClasses} value={configForm.dedicated_api_key} onChange={(e) => setConfigForm({ ...configForm, dedicated_api_key: e.target.value })} placeholder="ps_live_..." />
                </Field>

                {/* Enterprise-only fields */}
                {configForm.reseller_type === "infrastructure" && (
                    <>
                        <div className="border-t border-border pt-3 mt-2">
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Enterprise Configuration</p>
                        </div>
                        <Field label="Monthly Subscription Fee ($)">
                            <input className={inputClasses} type="number" step="0.01" value={configForm.subscription_fee} onChange={(e) => setConfigForm({ ...configForm, subscription_fee: e.target.value })} placeholder="e.g. 299.00" />
                        </Field>
                        <Field label="Subscription Expires">
                            <input className={inputClasses} type="date" value={configForm.subscription_expires_at} onChange={(e) => setConfigForm({ ...configForm, subscription_expires_at: e.target.value })} />
                        </Field>
                        <Field label="Customer Email (for invoices)">
                            <input className={inputClasses} type="email" value={configForm.customer_email} onChange={(e) => setConfigForm({ ...configForm, customer_email: e.target.value })} placeholder="customer@example.com" />
                        </Field>
                    </>
                )}
            </FormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Reseller" message={`Delete ${deleteTarget?.company_name || deleteTarget?.email}? This removes all data.`} confirmLabel="Delete" loading={actionLoading} />
        </div>
    );
}
