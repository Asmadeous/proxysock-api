import { useState, useEffect, useCallback } from "react";
import { TrashIcon, PencilIcon, PlusIcon, TicketIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { toast } from "react-hot-toast";
import adminApi from "../../../services/adminApi";

interface PromoCodeRow {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    max_uses: number | null;
    current_uses: number;
    expires_at: string | null;
    active: boolean;
    usable: boolean;
    min_order_amount: number | null;
    max_discount_amount: number | null;
    description: string | null;
    created_at: string;
}

const EMPTY_FORM = {
    code: "",
    discount_type: "percentage",
    discount_value: "10",
    max_uses: "",
    expires_at: "",
    active: "true",
    min_order_amount: "",
    max_discount_amount: "",
    description: "",
};

export default function PromoCodesTab() {
    const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");

    const [deleteTarget, setDeleteTarget] = useState<PromoCodeRow | null>(null);
    const [editTarget, setEditTarget] = useState<PromoCodeRow | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [actionLoading, setActionLoading] = useState(false);

    const loadPromoCodes = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (search) params.q = search;
            const res = await adminApi.get("/admin/api/promo_codes", { params });
            setPromoCodes(res.data.promo_codes || []);
            setTotal(res.data.total || 0);
        } catch { toast.error("Failed to load promo codes"); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { loadPromoCodes(); }, [loadPromoCodes]);

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await adminApi.post("/admin/api/promo_codes", {
                code: form.code,
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                expires_at: form.expires_at || null,
                active: form.active === "true",
                min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
                max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
                description: form.description || null,
            });
            toast.success("Promo code created");
            setShowCreate(false);
            setForm(EMPTY_FORM);
            loadPromoCodes();
        } catch (e: any) {
            toast.error(e.response?.data?.errors?.join(", ") || "Failed to create");
        } finally { setActionLoading(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            await adminApi.patch(`/admin/api/promo_codes/${editTarget.id}`, {
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                expires_at: form.expires_at || null,
                active: form.active === "true",
                min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
                max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
                description: form.description || null,
            });
            toast.success("Promo code updated");
            setEditTarget(null);
            loadPromoCodes();
        } catch (e: any) {
            toast.error(e.response?.data?.errors?.join(", ") || "Failed to update");
        } finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await adminApi.delete(`/admin/api/promo_codes/${deleteTarget.id}`);
            toast.success("Promo code deleted");
            setDeleteTarget(null);
            loadPromoCodes();
        } catch { toast.error("Failed to delete"); }
        finally { setActionLoading(false); }
    };

    const openEdit = (row: PromoCodeRow) => {
        setEditTarget(row);
        setForm({
            code: row.code,
            discount_type: row.discount_type,
            discount_value: String(row.discount_value),
            max_uses: row.max_uses ? String(row.max_uses) : "",
            expires_at: row.expires_at ? row.expires_at.slice(0, 16) : "",
            active: row.active ? "true" : "false",
            min_order_amount: row.min_order_amount ? String(row.min_order_amount) : "",
            max_discount_amount: row.max_discount_amount ? String(row.max_discount_amount) : "",
            description: row.description || "",
        });
    };

    const columns = [
        {
            key: "code", label: "Code", sortable: true,
            render: (row: PromoCodeRow) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <TicketIcon className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground font-mono">{row.code}</p>
                        <p className="text-xs text-muted-foreground">{row.description || "No description"}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "discount", label: "Discount",
            render: (row: PromoCodeRow) => (
                <span className="text-sm font-semibold text-emerald-500">
                    {row.discount_type === "percentage" ? `${row.discount_value}%` : `$${row.discount_value}`}
                </span>
            ),
        },
        {
            key: "usage", label: "Usage",
            render: (row: PromoCodeRow) => (
                <span className="text-sm">
                    {row.current_uses}/{row.max_uses ?? "∞"}
                </span>
            ),
        },
        {
            key: "expires_at", label: "Expires",
            render: (row: PromoCodeRow) => (
                <span className="text-xs text-muted-foreground">
                    {row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "Never"}
                </span>
            ),
        },
        {
            key: "active", label: "Status",
            render: (row: PromoCodeRow) => <StatusBadge status={row.usable ? "active" : row.active ? "expired" : "inactive"} />,
        },
        {
            key: "created_at", label: "Created",
            render: (row: PromoCodeRow) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            ),
        },
    ];

    const formFields = (
        <>
            {!editTarget && (
                <Field label="Code">
                    <input className={inputClasses} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME20" />
                </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
                <Field label="Discount Type">
                    <select className={inputClasses} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed ($)</option>
                    </select>
                </Field>
                <Field label="Discount Value">
                    <input className={inputClasses} type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Max Uses (empty = unlimited)">
                    <input className={inputClasses} type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="∞" />
                </Field>
                <Field label="Expires At (optional)">
                    <input className={inputClasses} type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Min Order Amount ($)">
                    <input className={inputClasses} type="number" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="No minimum" />
                </Field>
                <Field label="Max Discount ($)">
                    <input className={inputClasses} type="number" step="0.01" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="No cap" />
                </Field>
            </div>
            <Field label="Active">
                <select className={inputClasses} value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </Field>
            <Field label="Description (optional)">
                <input className={inputClasses} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Internal note / description" />
            </Field>
        </>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Promo Codes</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} promo code{total !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Promo Code
                </button>
            </div>

            <DataTable
                columns={columns}
                data={promoCodes}
                loading={loading}
                searchPlaceholder="Search promo codes..."
                onSearch={(q) => setSearch(q)}
                total={total}
                emptyMessage="No promo codes yet. Create one to get started!"
                actions={(row: PromoCodeRow) => (
                    <>
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            {/* Create Modal */}
            <FormModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                title="Create Promo Code"
                onSubmit={handleCreate}
                submitLabel="Create"
                loading={actionLoading}
            >
                {formFields}
            </FormModal>

            {/* Edit Modal */}
            <FormModal
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                title={`Edit ${editTarget?.code}`}
                onSubmit={handleUpdate}
                submitLabel="Save Changes"
                loading={actionLoading}
            >
                {formFields}
            </FormModal>

            {/* Delete Confirm */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Promo Code"
                message={`Delete promo code "${deleteTarget?.code}"? This cannot be undone.`}
                confirmLabel="Delete"
                loading={actionLoading}
            />
        </div>
    );
}
