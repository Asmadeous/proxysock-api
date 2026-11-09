import { useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon, CogIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon, ChevronUpIcon, UsersIcon, GlobeAltIcon, ServerStackIcon, TagIcon, KeyIcon } from "@heroicons/react/24/outline";
import { validEmail, required, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import CountrySelect from "../../../components/ui/CountrySelect";
import EmptyState from "../components/EmptyState";
import {
    useAdminResellers,
    useResellerDetail,
    useCreateReseller,
    useUpdateReseller,
    useDeleteReseller,
    useOnboardReseller,
    useConfigureReseller,
    useRevokeResellerTokens,
} from "../queries/resellers.queries";
import { useAdminProductCategories } from "../queries/settings.queries";

interface ResellerRow {
    id: string;
    email: string;
    username: string;
    company_name: string;
    reseller_type: string;
    balance: number;
    earnings_balance: number;
    surcharge: number;
    discount_percentage: number | null;
    subscription_fee: number | null;
    subscription_expires_at: string | null;
    dedicated_api_key: string | null;
    customer_email: string | null;
    total_orders: number;
    has_affiliate: boolean;
    created_at: string;
    country_code?: string;
    country?: string;
    city?: string;
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

const EMPTY_FORM = { email: "", username: "", company_name: "", password: "", reseller_type: "api_only", country_code: "US", country: "United States", city: "", allowed_product_category_id: "" };

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
        discount_percentage: "0",
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

    const createResellerMutation = useCreateReseller();
    const updateResellerMutation = useUpdateReseller();
    const deleteResellerMutation = useDeleteReseller();
    const onboardReseller = useOnboardReseller();
    const configureResellerMutation = useConfigureReseller();
    const revokeTokensMutation = useRevokeResellerTokens();

    const { data: categoriesData } = useAdminProductCategories();
    const categories = categoriesData?.categories || categoriesData || [];

    const validateForm = (isCreate: boolean): ValidationErrors => ({
        email: validEmail(form.email),
        username: required(form.username, "Username"),
        company_name: required(form.company_name, "Company name"),
        ...(isCreate ? { password: required(form.password, "Password") } : {}),
    });

    const handleCreate = async () => {
        const errors = validateForm(true);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        const data: any = { ...form };
        if (data.allowed_product_category_id === "none") data.allowed_product_category_id = "";
        
        await createResellerMutation.mutateAsync(data as unknown as Record<string, unknown>);
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        const errors = validateForm(false);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        
        const data: any = { ...form };
        if (!data.password) {
            delete data.password;
        }
        if (data.allowed_product_category_id === "none") data.allowed_product_category_id = "";
        
        await updateResellerMutation.mutateAsync({ id: editTarget.id, data: data as unknown as Record<string, unknown> });
        setEditTarget(null);
        setFormErrors({});
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteResellerMutation.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleRevokeTokens = (id: string) => revokeTokensMutation.mutate(id);

    const handleConfigure = async () => {
        if (!configTarget) return;
        const data = { ...configForm };
        if (data.allowed_product_category_id === "none") data.allowed_product_category_id = "";
        await configureResellerMutation.mutateAsync({ id: configTarget.id, data: data as Record<string, unknown> });
        setConfigTarget(null);
    };

    const openEdit = (r: ResellerRow) => {
        setEditTarget(r);
        setForm({
            email: r.email,
            username: r.username,
            company_name: r.company_name || "",
            password: "",
            reseller_type: r.reseller_type || "api_only",
            country_code: r.country_code || "US",
            country: r.country || "United States",
            city: r.city || "",
            allowed_product_category_id: (r as any).allowed_product_category_id ? String((r as any).allowed_product_category_id) : ""
        });
    };

    const openConfig = (r: ResellerRow) => {
        setConfigTarget(r);
        setConfigForm({
            reseller_type: r.reseller_type || "api_only",
            surcharge: String(r.surcharge || 0),
            discount_percentage: String(r.discount_percentage || 0),
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

    const columns = [
        {
            key: "company_name", label: "Reseller", sortable: true,
            render: (row: ResellerRow) => (
                <div className="flex items-center gap-3">
                    <span className="ws-avatar" aria-hidden="true">{(row.company_name || row.username)?.[0]?.toUpperCase()}</span>
                    <div><strong>{row.company_name || row.username}</strong><span className="block text-[11px] text-[var(--ov-muted)]">{row.email}</span></div>
                </div>
            ),
        },
        {
            key: "reseller_type", label: "Tier", sortable: true,
            render: (row: ResellerRow) => <span className="ws-status" data-tone={row.reseller_type === "infrastructure" ? "good" : row.reseller_type === "single_product" ? "wait" : "info"}>{tierLabel(row.reseller_type)}</span>,
        },
        {
            key: "balance", label: "Balance", sortable: true,
            render: (row: ResellerRow) => (
                <div className="text-right">
                    <p className="text-sm tabular-nums">${Number(row.balance || 0).toFixed(2)}</p>
                    {row.reseller_type === "infrastructure" && (
                        <p className="text-[11px] text-[var(--ov-muted)]">${Number(row.earnings_balance || 0).toFixed(2)} earned</p>
                    )}
                </div>
            ),
        },
        {
            key: "discount_percentage", label: "Discount", sortable: true,
            render: (row: ResellerRow) => (
                <div className="text-right">
                    <p className="text-sm">
                        {row.discount_percentage && row.discount_percentage > 0 ? `${row.discount_percentage}%` : "—"}
                    </p>
                </div>
            ),
        },
        {
            key: "subscription_fee", label: "Subscription", sortable: false,
            render: (row: ResellerRow) => {
                if (row.reseller_type !== "infrastructure") return <span className="text-xs text-[var(--ov-muted)]">—</span>;
                const isActive = row.subscription_expires_at && new Date(row.subscription_expires_at) > new Date();
                return (
                    <div>
                        <p className="text-sm">${row.subscription_fee || 0}/mo</p>
                        <span className="ws-status" data-tone={isActive ? "good" : "bad"}>{isActive ? "Active" : "Expired"}</span>
                    </div>
                );
            },
        },
        { key: "total_orders", label: "Orders", sortable: true },
        { key: "created_at", label: "Joined", render: (row: ResellerRow) => <span className="text-xs text-[var(--ov-muted)]">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    return (
        <div className="ws-stack">
            <PageHeader
                title="Resellers"
                description="Reseller accounts, tiers, users and recent orders."
                actions={<Button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}><PlusIcon className="h-4 w-4" /> Add reseller</Button>}
            />

            <div className="overview-metrics" style={{ marginBottom: 0 }}>
                {[
                    { label: "Total resellers", value: stats.total, icon: UsersIcon },
                    { label: "API only", value: stats.api_only, icon: GlobeAltIcon },
                    { label: "Single product", value: stats.single_product, icon: TagIcon },
                    { label: "Enterprise", value: stats.enterprise, icon: ServerStackIcon },
                ].map(({ label, value, icon: Icon }) => (
                    <div className="overview-metric" key={label}>
                        <span>{label}<Icon width={16} height={16} aria-hidden="true" /></span>
                        {isLoading ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong>{value}</strong>}
                    </div>
                ))}
            </div>

            <div className="ws-tabs" role="group" aria-label="Reseller tier">
                {TYPE_FILTERS.map((f) => (
                    <button type="button" key={f.value} aria-pressed={typeFilter === f.value} onClick={() => update({ type: f.value, page: 1 })}>{f.label}</button>
                ))}
            </div>

            <DataTable
                columns={columns} data={resellers} loading={isLoading}
                searchPlaceholder="Search resellers..."
                onSearch={(q) => update({ search: q, page: 1 })}
                page={page} totalPages={Math.ceil(total / PER)} onPageChange={(p) => update({ page: p })} total={total}
                emptyMessage={<EmptyState icon={UsersIcon} title="No resellers found" description="Add a reseller to get started." action={{ label: "Add Reseller", onClick: () => { setShowCreate(true); setForm(EMPTY_FORM); } }} />}
                actions={(row: ResellerRow) => (
                    <>
                        <button type="button" onClick={() => toggleExpand(row)} aria-label="View details" className="ws-icon-button">
                            {expandedId === row.id ? <ChevronUpIcon /> : <EyeIcon />}
                        </button>
                        <button type="button" onClick={() => openEdit(row)} aria-label="Edit reseller" className="ws-icon-button"><PencilIcon /></button>
                        <button type="button" onClick={() => openConfig(row)} aria-label="Configure reseller" className="ws-icon-button"><CogIcon /></button>
                        <button type="button" onClick={() => onboardReseller.mutate(row.id)} aria-label="Onboard reseller" className="ws-icon-button"><ArrowPathIcon /></button>
                        <button type="button" onClick={() => handleRevokeTokens(row.id)} aria-label="Revoke access" className="ws-icon-button"><KeyIcon /></button>
                        <button type="button" onClick={() => setDeleteTarget(row)} aria-label="Delete reseller" className="ws-icon-button"><TrashIcon /></button>
                    </>
                )}
            />

            {expandedId && (
                <section className="ws-panel" aria-labelledby="reseller-detail-title">
                    <div className="ws-panel-heading">
                        <div>
                            <h2 id="reseller-detail-title">{detailData?.company_name || detailData?.username || "Loading…"}</h2>
                            <p>Users, recent orders and account configuration.</p>
                        </div>
                        <button type="button" onClick={() => setExpandedId(null)} aria-label="Close details" className="ws-icon-button"><ChevronUpIcon /></button>
                    </div>
                    {detailLoading ? (
                        <div className="space-y-3" role="status" aria-label="Loading details">
                            <span className="ws-skeleton block" style={{ height: 14 }} />
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "70%" }} />
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "50%" }} />
                        </div>
                    ) : detailData && (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div>
                                <h3 className="ws-section-title mb-2">Users</h3>
                                {detailData.users && detailData.users.length > 0 ? (
                                    <ul className="ws-list max-h-64 overflow-y-auto">
                                        {detailData.users.map((u: { id: string; email: string; name: string; status: string }) => (
                                            <li key={u.id}>
                                                <div className="min-w-0">
                                                    <p className="truncate">{u.name || u.email}</p>
                                                    {u.name && <p className="truncate text-[11px] text-[var(--ov-muted)]">{u.email}</p>}
                                                </div>
                                                <StatusBadge status={u.status} />
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-[var(--ov-muted)]">No users assigned.</p>}
                            </div>

                            <div>
                                <h3 className="ws-section-title mb-2">Recent orders</h3>
                                {detailData.orders && detailData.orders.length > 0 ? (
                                    <ul className="ws-list">
                                        {detailData.orders.slice(0, 8).map((o: { id: string; product: string; status: string; total: number; created_at: string }) => (
                                            <li key={o.id}>
                                                <div className="min-w-0">
                                                    <p className="truncate">{o.product || "—"}</p>
                                                    <p className="text-[11px] text-[var(--ov-muted)]">{new Date(o.created_at).toLocaleDateString()} · ${Number(o.total || 0).toFixed(2)}</p>
                                                </div>
                                                <StatusBadge status={o.status} />
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-[var(--ov-muted)]">No orders yet.</p>}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="ws-section-title mb-3">Account details</h3>
                                    <dl className="ws-facts">
                                        <div><dt>Type</dt><dd>{tierLabel(detailData.reseller_type)}</dd></div>
                                        <div><dt>Surcharge</dt><dd>{detailData.surcharge || 0}%</dd></div>
                                        {detailData.reseller_type === "infrastructure" && (
                                            <>
                                                <div><dt>Subscription</dt><dd>${detailData.subscription_fee || 0}/mo</dd></div>
                                                <div><dt>Expires</dt><dd>{detailData.subscription_expires_at ? new Date(detailData.subscription_expires_at).toLocaleDateString() : "—"}</dd></div>
                                                <div className="col-span-2"><dt>API key</dt><dd className="ws-mono truncate">{detailData.dedicated_api_key || "Not set"}</dd></div>
                                                <div className="col-span-2"><dt>Customer email</dt><dd>{detailData.customer_email || "Not set"}</dd></div>
                                            </>
                                        )}
                                    </dl>
                                </div>
                                {detailData.webhooks && detailData.webhooks.length > 0 && (
                                    <div>
                                        <h3 className="ws-section-title mb-2">Webhooks</h3>
                                        <ul className="ws-list">
                                            {detailData.webhooks.map((w: { id: string; url: string; events: string[] }) => (
                                                <li key={w.id}>
                                                    <span className="ws-mono truncate">{w.url}</span>
                                                    <span className="shrink-0 text-[var(--ov-muted)]">{w.events?.length || 0} events</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}); setShowPassword(false); }} title="Add Reseller" onSubmit={handleCreate} submitLabel="Create" loading={createResellerMutation.isLoading}>
                <Field label="Email" error={formErrors.email}><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username" error={formErrors.username}><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name" error={formErrors.company_name}><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Country">
                    <CountrySelect
                        value={form.country_code}
                        onSelect={(code, name) => setForm({ ...form, country_code: code, country: name })}
                    />
                </Field>
                <Field label="City"><input className={inputClasses} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New York" /></Field>
                <Field label="Password" error={formErrors.password}>
                    <div className="relative">
                        <input className={inputClasses} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ov-muted)] hover:text-[var(--ov-text)]" aria-label={showPassword ? "Hide password" : "Show password"}>
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
                {form.reseller_type === "single_product" && (
                    <>
                        <h4 className="ws-section-title border-t border-[var(--ov-line)] pt-4">Single product configuration</h4>
                        <Field label="Allowed Product Category">
                            <Select value={(form as any).allowed_product_category_id || ""} onValueChange={(v) => setForm({ ...form, allowed_product_category_id: v })}>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {categories.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </>
                )}
            </FormModal>

            {/* Edit Modal */}
            <FormModal open={!!editTarget} onClose={() => { setEditTarget(null); setFormErrors({}); }} title="Edit Reseller" onSubmit={handleUpdate} submitLabel="Update" loading={updateResellerMutation.isLoading}>
                <Field label="Email" error={formErrors.email}><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username" error={formErrors.username}><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name" error={formErrors.company_name}><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Password (leave blank to keep current)" error={formErrors.password}>
                    <div className="relative">
                        <input className={inputClasses} type={showPassword ? "text" : "password"} value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ov-muted)] hover:text-[var(--ov-text)]" aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>
                <Field label="Country">
                    <CountrySelect
                        value={form.country_code}
                        onSelect={(code, name) => setForm({ ...form, country_code: code, country: name })}
                    />
                </Field>
                <Field label="City"><input className={inputClasses} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New York" /></Field>
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
                {form.reseller_type === "single_product" && (
                    <>
                        <h4 className="ws-section-title border-t border-[var(--ov-line)] pt-4">Single product configuration</h4>
                        <Field label="Allowed Product Category">
                            <Select value={(form as any).allowed_product_category_id || ""} onValueChange={(v) => setForm({ ...form, allowed_product_category_id: v })}>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {categories.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </>
                )}
            </FormModal>

            {/* Configure Modal */}
            <FormModal
                open={!!configTarget}
                onClose={() => setConfigTarget(null)}
                title={`Configure ${configTarget?.company_name || configTarget?.username}`}
                onSubmit={handleConfigure}
                submitLabel="Apply"
                loading={configureResellerMutation.isLoading}
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
                <Field label="Wholesale Discount (%)">
                    <input className={inputClasses} type="number" value={configForm.discount_percentage} onChange={(e) => setConfigForm({ ...configForm, discount_percentage: e.target.value })} />
                </Field>
                <Field label="Dedicated API Key">
                    <input className={inputClasses} value={configForm.dedicated_api_key} onChange={(e) => setConfigForm({ ...configForm, dedicated_api_key: e.target.value })} placeholder="ps_live_..." />
                </Field>
                {configForm.reseller_type === "infrastructure" && (
                    <>
                        <h4 className="ws-section-title border-t border-[var(--ov-line)] pt-4">Enterprise configuration</h4>
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
                        <h4 className="ws-section-title border-t border-[var(--ov-line)] pt-4">Single product configuration</h4>
                        <Field label="Allowed Product Category ID">
                            <Select value={configForm.allowed_product_category_id || ""} onValueChange={(v) => setConfigForm({ ...configForm, allowed_product_category_id: v })}>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {categories.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                loading={deleteResellerMutation.isLoading}
            />
        </div>
    );
}
