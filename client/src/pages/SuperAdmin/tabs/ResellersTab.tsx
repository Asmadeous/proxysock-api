import { useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon, CogIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon, ChevronUpIcon, UsersIcon, GlobeAltIcon, ServerStackIcon, TagIcon } from "@heroicons/react/24/outline";
import { validEmail, required, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import StatsCard from "../components/StatsCard";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import EmptyState from "../components/EmptyState";
import { StatsCardSkeleton } from "../components/TableSkeleton";
import {
    useAdminResellers,
    useResellerDetail,
    useCreateReseller,
    useUpdateReseller,
    useDeleteReseller,
    useOnboardReseller,
    useConfigureReseller,
} from "../queries/resellers.queries";

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
    users?: { id: string; email: string; name: string; status: string; created_at: string }[];
    orders?: { id: string; product: string; status: string; total: number; created_at: string }[];
    webhooks?: { id: string; url: string; events: string[]; created_at: string }[];
}

interface Stats {
    total: number;
    api_only: number;
    enterprise: number;
    single_product: number;
    total_balance: number;
}

const EMPTY_FORM = { email: "", username: "", company_name: "", password: "", reseller_type: "api_only" };

const TYPE_FILTERS = [
    { label: "All", value: "" },
    { label: "API Only", value: "api_only" },
    { label: "Single Product", value: "single_product" },
    { label: "Enterprise", value: "infrastructure" },
];

export default function ResellersTab() {
    const { getNum, get, update } = useTabFilters();
    const page = getNum("page", 1);
    const search = get("search");
    const typeFilter = get("type");
    const PER = 25;

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<ResellerRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ResellerRow | null>(null);
    const [configTarget, setConfigTarget] = useState<ResellerRow | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<ValidationErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [configForm, setConfigForm] = useState({
        reseller_type: "api_only",
        surcharge: "0",
        subscription_fee: "",
        subscription_expires_at: "",
        dedicated_api_key: "",
        customer_email: "",
        allowed_product_category_id: "",
    });

    const { data: resellersData, isLoading } = useAdminResellers({ page, search, typeFilter, per: PER });
    const { data: detailData, isLoading: detailLoading } = useResellerDetail(expandedId);

    const resellers: ResellerRow[] = resellersData?.resellers ?? [];
    const total: number = resellersData?.total ?? 0;
    const stats: Stats = resellersData?.stats ?? { total: 0, api_only: 0, enterprise: 0, single_product: 0, total_balance: 0 };

    const createReseller = useCreateReseller();
    const updateReseller = useUpdateReseller();
    const deleteReseller = useDeleteReseller();
    const onboardReseller = useOnboardReseller();
    const configureReseller = useConfigureReseller();

    const validateForm = (isCreate: boolean): ValidationErrors => ({
        email: validEmail(form.email),
        username: required(form.username, "Username"),
        company_name: required(form.company_name, "Company name"),
        ...(isCreate ? { password: required(form.password, "Password") } : {}),
    });

    const handleCreate = async () => {
        const errors = validateForm(true);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        await createReseller.mutateAsync(form as unknown as Record<string, unknown>);
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        const errors = validateForm(false);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        const { password: _pw, ...data } = form;
        await updateReseller.mutateAsync({ id: editTarget.id, data: data as unknown as Record<string, unknown> });
        setEditTarget(null);
        setFormErrors({});
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteReseller.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleConfigure = async () => {
        if (!configTarget) return;
        await configureReseller.mutateAsync({ id: configTarget.id, data: configForm as Record<string, unknown> });
        setConfigTarget(null);
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
            allowed_product_category_id: (r as unknown as Record<string, unknown>).allowed_product_category_id ? String((r as unknown as Record<string, unknown>).allowed_product_category_id) : "",
        });
    };

    const toggleExpand = (r: ResellerRow) => {
        setExpandedId((prev) => (prev === r.id ? null : r.id));
    };

    const tierLabel = (type: string) => {
        if (type === "infrastructure") return "Enterprise";
        if (type === "api_only") return "API Only";
        if (type === "single_product") return "Single Product";
        return type;
    };

    const tierColor = (type: string) => {
        if (type === "infrastructure") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        if (type === "single_product") return "text-purple-400 bg-purple-500/10 border-purple-500/20";
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
            key: "subscription_fee", label: "Subscription",
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
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
                ) : (
                    <>
                        <StatsCard title="Total Resellers" value={stats.total} icon={UsersIcon} />
                        <StatsCard title="API Only" value={stats.api_only} icon={GlobeAltIcon} />
                        <StatsCard title="Single Product" value={stats.single_product} icon={TagIcon} />
                        <StatsCard title="Enterprise" value={stats.enterprise} icon={ServerStackIcon} />
                    </>
                )}
            </div>

            {/* Header + Filter Chips */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">Resellers</h2>
                    <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
                        {TYPE_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => update({ type: f.value, page: 1 })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === f.value
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}>
                    <PlusIcon className="h-4 w-4" /> Add Reseller
                </Button>
            </div>

            <DataTable
                columns={columns} data={resellers} loading={isLoading}
                searchPlaceholder="Search resellers..."
                onSearch={(q) => update({ search: q, page: 1 })}
                page={page} totalPages={Math.ceil(total / PER)} onPageChange={(p) => update({ page: p })} total={total}
                emptyMessage={<EmptyState icon={UsersIcon} title="No resellers found" description="Add a reseller to get started." action={{ label: "Add Reseller", onClick: () => { setShowCreate(true); setForm(EMPTY_FORM); } }} />}
                actions={(row: ResellerRow) => (
                    <>
                        <button onClick={() => toggleExpand(row)} aria-label="View details" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                            {expandedId === row.id ? <ChevronUpIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(row)} aria-label="Edit reseller" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => openConfig(row)} aria-label="Configure reseller" className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"><CogIcon className="h-4 w-4" /></button>
                        <button onClick={() => onboardReseller.mutate(row.id)} aria-label="Onboard reseller" className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-green-500/10"><ArrowPathIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(row)} aria-label="Delete reseller" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><TrashIcon className="h-4 w-4" /></button>
                    </>
                )}
            />

            {/* Detail Panel */}
            {expandedId && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">
                            {detailData?.company_name || detailData?.username || "Loading..."} — Details
                        </h3>
                        <button onClick={() => setExpandedId(null)} className="text-muted-foreground hover:text-foreground">
                            <ChevronUpIcon className="h-5 w-5" />
                        </button>
                    </div>
                    {detailLoading ? (
                        <div className="h-32 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                        </div>
                    ) : detailData && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Users */}
                            <div className="lg:col-span-1">
                                <h4 className="text-sm font-semibold text-foreground mb-2">Users</h4>
                                {detailData.users && detailData.users.length > 0 ? (
                                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                        {detailData.users.map((u: { id: string; email: string; name: string; status: string }) => (
                                            <div key={u.id} className="flex justify-between items-center text-xs bg-muted/50 rounded-lg px-3 py-2">
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-foreground font-medium truncate">{u.name || u.email}</p>
                                                    <p className="text-muted-foreground truncate opacity-80">{u.name ? u.email : ""}</p>
                                                </div>
                                                <StatusBadge status={u.status} />
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-muted-foreground">No users assigned</p>}
                            </div>

                            {/* Orders */}
                            <div className="lg:col-span-1">
                                <h4 className="text-sm font-semibold text-foreground mb-2">Recent Orders</h4>
                                {detailData.orders && detailData.orders.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {detailData.orders.slice(0, 8).map((o: { id: string; product: string; status: string; total: number; created_at: string }) => (
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
                            <div className="lg:col-span-1 space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Account Details</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-muted/50 rounded-lg px-3 py-2">
                                            <p className="text-muted-foreground">Type</p>
                                            <p className="font-medium text-foreground">{tierLabel(detailData.reseller_type)}</p>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg px-3 py-2">
                                            <p className="text-muted-foreground">Surcharge</p>
                                            <p className="font-medium text-foreground">{detailData.surcharge || 0}%</p>
                                        </div>
                                        {detailData.reseller_type === "infrastructure" && (
                                            <>
                                                <div className="bg-muted/50 rounded-lg px-3 py-2">
                                                    <p className="text-muted-foreground">Subscription</p>
                                                    <p className="font-medium text-foreground">${detailData.subscription_fee || 0}/mo</p>
                                                </div>
                                                <div className="bg-muted/50 rounded-lg px-3 py-2">
                                                    <p className="text-muted-foreground">Expires</p>
                                                    <p className="font-medium text-foreground">{detailData.subscription_expires_at ? new Date(detailData.subscription_expires_at).toLocaleDateString() : "—"}</p>
                                                </div>
                                                <div className="bg-muted/50 rounded-lg px-3 py-2 col-span-2">
                                                    <p className="text-muted-foreground">API Key</p>
                                                    <p className="font-mono text-foreground text-[10px] truncate">{detailData.dedicated_api_key || "Not set"}</p>
                                                </div>
                                                <div className="bg-muted/50 rounded-lg px-3 py-2 col-span-2">
                                                    <p className="text-muted-foreground">Customer Email</p>
                                                    <p className="font-medium text-foreground">{detailData.customer_email || "Not set"}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {detailData.webhooks && detailData.webhooks.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">Webhooks</h4>
                                        <div className="space-y-1.5">
                                            {detailData.webhooks.map((w: { id: string; url: string; events: string[] }) => (
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
                    )}
                </div>
            )}

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}); }} title="Add Reseller" onSubmit={handleCreate} submitLabel="Create" loading={createReseller.isLoading}>
                <Field label="Email" error={formErrors.email}><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username" error={formErrors.username}><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name" error={formErrors.company_name}><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Password" error={formErrors.password}>
                    <div className="relative">
                        <input className={inputClasses} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>
                <Field label="Tier">
                    <Select value={form.reseller_type} onValueChange={(v) => setForm({ ...form, reseller_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="api_only">API Only</SelectItem>
                            <SelectItem value="single_product">Single Product</SelectItem>
                            <SelectItem value="infrastructure">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </FormModal>

            {/* Edit Modal */}
            <FormModal open={!!editTarget} onClose={() => { setEditTarget(null); setFormErrors({}); }} title="Edit Reseller" onSubmit={handleUpdate} submitLabel="Update" loading={updateReseller.isLoading}>
                <Field label="Email" error={formErrors.email}><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username" error={formErrors.username}><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name" error={formErrors.company_name}><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Tier">
                    <Select value={form.reseller_type} onValueChange={(v) => setForm({ ...form, reseller_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="api_only">API Only</SelectItem>
                            <SelectItem value="single_product">Single Product</SelectItem>
                            <SelectItem value="infrastructure">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </FormModal>

            {/* Configure Modal */}
            <FormModal
                open={!!configTarget}
                onClose={() => setConfigTarget(null)}
                title={`Configure ${configTarget?.company_name || configTarget?.username}`}
                onSubmit={handleConfigure}
                submitLabel="Apply"
                loading={configureReseller.isLoading}
            >
                <Field label="Reseller Tier">
                    <Select value={configForm.reseller_type} onValueChange={(v) => setConfigForm({ ...configForm, reseller_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="api_only">API Only</SelectItem>
                            <SelectItem value="single_product">Single Product</SelectItem>
                            <SelectItem value="infrastructure">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Infrastructure Surcharge (%)">
                    <input className={inputClasses} type="number" value={configForm.surcharge} onChange={(e) => setConfigForm({ ...configForm, surcharge: e.target.value })} />
                </Field>
                <Field label="Dedicated API Key">
                    <input className={inputClasses} value={configForm.dedicated_api_key} onChange={(e) => setConfigForm({ ...configForm, dedicated_api_key: e.target.value })} placeholder="ps_live_..." />
                </Field>
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
                {configForm.reseller_type === "single_product" && (
                    <>
                        <div className="border-t border-border pt-3 mt-2">
                            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Single Product Configuration</p>
                        </div>
                        <Field label="Allowed Product Category ID">
                            <input className={inputClasses} type="number" value={configForm.allowed_product_category_id} onChange={(e) => setConfigForm({ ...configForm, allowed_product_category_id: e.target.value })} placeholder="Category ID" />
                        </Field>
                    </>
                )}
            </FormModal>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Reseller"
                message={`Delete ${deleteTarget?.company_name || deleteTarget?.email}? This removes all data.`}
                confirmLabel="Delete"
                loading={deleteReseller.isLoading}
            />
        </div>
    );
}
