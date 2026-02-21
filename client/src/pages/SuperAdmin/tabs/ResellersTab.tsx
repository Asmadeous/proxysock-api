import { useState, useEffect, useCallback } from "react";
import { PencilIcon, TrashIcon, PlusIcon, CogIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { fetchResellers, createReseller, updateReseller, deleteReseller, onboardReseller, configureReseller } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface ResellerRow {
    id: number;
    email: string;
    username: string;
    company_name: string;
    reseller_type: string;
    balance: number;
    surcharge: number;
    total_orders: number;
    has_affiliate: boolean;
    created_at: string;
}

const EMPTY_FORM = { email: "", username: "", company_name: "", password: "", reseller_type: "standard" };

export default function ResellersTab() {
    const [resellers, setResellers] = useState<ResellerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const PER = 25;

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<ResellerRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ResellerRow | null>(null);
    const [configTarget, setConfigTarget] = useState<ResellerRow | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [configForm, setConfigForm] = useState({ reseller_type: "standard", surcharge: "0" });
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), per: String(PER) };
            if (search) params.q = search;
            const res = await fetchResellers(params);
            setResellers(res.data.resellers);
            setTotal(res.data.total);
        } catch { toast.error("Failed to load resellers"); }
        finally { setLoading(false); }
    }, [page, search]);

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

    const handleOnboard = async (id: number) => {
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
        setForm({ email: r.email, username: r.username, company_name: r.company_name || "", password: "", reseller_type: r.reseller_type || "standard" });
    };

    const openConfig = (r: ResellerRow) => {
        setConfigTarget(r);
        setConfigForm({ reseller_type: r.reseller_type || "standard", surcharge: String(r.surcharge || 0) });
    };

    const columns = [
        {
            key: "company_name", label: "Reseller", sortable: true,
            render: (row: ResellerRow) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xs font-bold">{(row.company_name || row.username)?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{row.company_name || row.username}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "reseller_type", label: "Type", sortable: true, render: (row: ResellerRow) => <StatusBadge status={row.reseller_type || "standard"} /> },
        { key: "balance", label: "Balance", sortable: true, render: (row: ResellerRow) => <span className="text-sm font-medium">${Number(row.balance || 0).toFixed(2)}</span> },
        { key: "total_orders", label: "Orders", sortable: true },
        { key: "surcharge", label: "Surcharge", render: (row: ResellerRow) => <span className="text-xs text-muted-foreground">{row.surcharge || 0}%</span> },
        { key: "created_at", label: "Joined", render: (row: ResellerRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Resellers</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} resellers</p>
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
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => openConfig(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10" title="Configure"><CogIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleOnboard(row.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-green-500/10" title="Onboard"><ArrowPathIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                    </>
                )}
            />

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="Add Reseller" onSubmit={handleCreate} submitLabel="Create" loading={actionLoading}>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username"><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name"><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
                <Field label="Password"><input className={inputClasses} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                <Field label="Type">
                    <select className={selectClasses} value={form.reseller_type} onChange={(e) => setForm({ ...form, reseller_type: e.target.value })}>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </Field>
            </FormModal>

            {/* Edit Modal */}
            <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Reseller" onSubmit={handleUpdate} submitLabel="Update" loading={actionLoading}>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username"><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Company Name"><input className={inputClasses} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
            </FormModal>

            {/* Configure Modal */}
            <FormModal open={!!configTarget} onClose={() => setConfigTarget(null)} title={`Configure ${configTarget?.company_name || configTarget?.username}`} onSubmit={handleConfigure} submitLabel="Apply" loading={actionLoading}>
                <Field label="Reseller Type">
                    <select className={selectClasses} value={configForm.reseller_type} onChange={(e) => setConfigForm({ ...configForm, reseller_type: e.target.value })}>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </Field>
                <Field label="Infrastructure Surcharge (%)">
                    <input className={inputClasses} type="number" value={configForm.surcharge} onChange={(e) => setConfigForm({ ...configForm, surcharge: e.target.value })} />
                </Field>
            </FormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Reseller" message={`Delete ${deleteTarget?.company_name || deleteTarget?.email}? This removes all data.`} confirmLabel="Delete" loading={actionLoading} />
        </div>
    );
}
