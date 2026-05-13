import { useState } from "react";
import { TrashIcon, PencilIcon, PlusIcon, TicketIcon } from "@heroicons/react/24/outline";
import { required, positiveNumber, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import EmptyState from "../components/EmptyState";
import {
    useAdminPromoCodes,
    useCreatePromoCode,
    useUpdatePromoCode,
    useDeletePromoCode,
} from "../queries/promoCodes.queries";

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

function buildPayload(form: typeof EMPTY_FORM, includeCode = true) {
    return {
        ...(includeCode ? { code: form.code } : {}),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
        active: form.active === "true",
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
        description: form.description || null,
    };
}

export default function PromoCodesTab() {
    const { get, update } = useTabFilters();
    const search = get("search");
    const [deleteTarget, setDeleteTarget] = useState<PromoCodeRow | null>(null);
    const [editTarget, setEditTarget] = useState<PromoCodeRow | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<ValidationErrors>({});

    const { data, isLoading } = useAdminPromoCodes({ search });
    const promoCodes: PromoCodeRow[] = data?.promo_codes ?? [];
    const total: number = data?.total ?? 0;

    const createCode = useCreatePromoCode();
    const updateCode = useUpdatePromoCode();
    const deleteCode = useDeletePromoCode();

    const validateForm = (isCreate: boolean): ValidationErrors => ({
        ...(isCreate ? { code: required(form.code, "Code") } : {}),
        discount_value: positiveNumber(form.discount_value, "Discount value"),
    });

    const handleCreate = async () => {
        const errors = validateForm(true);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        await createCode.mutateAsync(buildPayload(form, true));
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        const errors = validateForm(false);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        await updateCode.mutateAsync({ id: editTarget.id, data: buildPayload(form, false) });
        setEditTarget(null);
        setFormErrors({});
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteCode.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const openEdit = (row: PromoCodeRow) => {
        setEditTarget(row);
        setForm({
            code: row.code,
            discount_type: row.discount_type,
            discount_value: String(row.discount_value),
            max_uses: row.max_uses != null ? String(row.max_uses) : "",
            expires_at: row.expires_at ?? "",
            active: String(row.active),
            min_order_amount: row.min_order_amount != null ? String(row.min_order_amount) : "",
            max_discount_amount: row.max_discount_amount != null ? String(row.max_discount_amount) : "",
            description: row.description ?? "",
        });
    };

    const columns = [
        { key: "code", label: "Code", sortable: true, render: (row: PromoCodeRow) => <span className="font-mono text-sm font-bold text-primary">{row.code}</span> },
        {
            key: "discount_type", label: "Discount",
            render: (row: PromoCodeRow) => (
                <span className="text-sm">
                    {row.discount_type === "percentage" ? `${row.discount_value}%` : `$${row.discount_value}`}
                </span>
            ),
        },
        { key: "current_uses", label: "Uses", render: (row: PromoCodeRow) => <span className="text-sm">{row.current_uses}{row.max_uses ? ` / ${row.max_uses}` : ""}</span> },
        {
            key: "expires_at", label: "Expires",
            render: (row: PromoCodeRow) => (
                <span className="text-xs text-muted-foreground">{row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "Never"}</span>
            ),
        },
        { key: "active", label: "Status", render: (row: PromoCodeRow) => <StatusBadge status={row.usable ? "active" : row.active ? "pending" : "inactive"} /> },
    ];

    const formFields = (showCode: boolean) => (
        <>
            {showCode && <Field label="Code" error={formErrors.code}><input className={inputClasses} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PROMO20" /></Field>}
            <Field label="Discount Type">
                <select className={inputClasses} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                </select>
            </Field>
            <Field label="Discount Value" error={formErrors.discount_value}><input className={inputClasses} type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></Field>
            <Field label="Max Uses (optional)"><input className={inputClasses} type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" /></Field>
            <Field label="Expiry Date (optional)"><input className={inputClasses} type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></Field>
            <Field label="Min Order Amount (optional)"><input className={inputClasses} type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} /></Field>
            <Field label="Max Discount Cap (optional)"><input className={inputClasses} type="number" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} /></Field>
            <Field label="Active">
                <select className={inputClasses} value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </Field>
            <Field label="Description (optional)"><input className={inputClasses} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Promo Codes</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} codes</p>
                </div>
                <Button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}>
                    <PlusIcon className="h-4 w-4" /> New Code
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={promoCodes}
                loading={isLoading}
                searchPlaceholder="Search promo codes..."
                onSearch={(q) => update({ search: q })}
                total={total}
                emptyMessage={<EmptyState icon={TicketIcon} title="No promo codes" description="Create discount codes to share with customers." action={{ label: "New Code", onClick: () => setShowCreate(true) }} />}
                actions={(row: PromoCodeRow) => (
                    <>
                        <button onClick={() => openEdit(row)} aria-label="Edit code" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(row)} aria-label="Delete code" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            <FormModal open={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}); }} title="New Promo Code" onSubmit={handleCreate} submitLabel="Create" loading={createCode.isLoading}>
                {formFields(true)}
            </FormModal>

            <FormModal open={!!editTarget} onClose={() => { setEditTarget(null); setFormErrors({}); }} title="Edit Promo Code" onSubmit={handleUpdate} submitLabel="Update" loading={updateCode.isLoading}>
                {formFields(false)}
            </FormModal>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Promo Code"
                message={`Delete code "${deleteTarget?.code}"? This cannot be undone.`}
                confirmLabel="Delete"
                loading={deleteCode.isLoading}
            />
        </div>
    );
}
