import { useState, useEffect, useCallback } from "react";
import { PencilIcon, TrashIcon, PlusIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, assignTickets } from "../../../services/adminApi";
import { toast } from "react-hot-toast";
import { getApiError } from "../../../utils/apiError";

interface EmployeeRow {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
    department: string;
    active: boolean;
    last_login: string | null;
    created_at: string;
    profile_picture_url?: string;
}

const EMPTY_FORM = { first_name: "", last_name: "", email: "", password: "", role: "support", department: "General", avatar: null as File | null };

export default function EmployeesTab() {
    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<EmployeeRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
    const [assignTarget, setAssignTarget] = useState<EmployeeRow | null>(null);
    const [assignTicketIds, setAssignTicketIds] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (search) params.q = search;
            const res = await fetchEmployees(params);
            setEmployees(res.data.employees);
            setTotal(res.data.total);
        } catch { toast.error("Failed to load employees"); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await createEmployee(form);
            toast.success("Employee created");
            setShowCreate(false);
            setForm(EMPTY_FORM);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to create employee")); }
        finally { setActionLoading(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            let payload: any;
            if (form.avatar) {
                payload = new FormData();
                payload.append("first_name", form.first_name);
                payload.append("last_name", form.last_name);
                payload.append("email", form.email);
                payload.append("role", form.role);
                payload.append("department", form.department);
                payload.append("avatar", form.avatar);
            } else {
                payload = { first_name: form.first_name, last_name: form.last_name, email: form.email, role: form.role, department: form.department };
            }
            const response = await updateEmployee(editTarget.id, payload);
            toast.success("Employee updated");
            
            // If the updated employee is the one currently logged in, update localStorage
            const currentAdmin = JSON.parse(localStorage.getItem("adminUser") || "{}");
            if (currentAdmin.id === editTarget.id) {
                localStorage.setItem("adminUser", JSON.stringify(response.data));
                window.dispatchEvent(new Event("admin-user-updated"));
            }
            
            setEditTarget(null);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to update employee")); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await deleteEmployee(deleteTarget.id);
            toast.success("Employee deactivated");
            setDeleteTarget(null);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to deactivate employee")); }
        finally { setActionLoading(false); }
    };

    const handleAssign = async () => {
        if (!assignTarget) return;
        setActionLoading(true);
        try {
            const ids = assignTicketIds.split(",").map((s) => Number(s.trim())).filter(Boolean);
            await assignTickets(assignTarget.id, ids);
            toast.success("Tickets assigned");
            setAssignTarget(null);
            setAssignTicketIds("");
        } catch (err) { toast.error(getApiError(err, "Failed to assign tickets")); }
        finally { setActionLoading(false); }
    };

    const openEdit = (e: EmployeeRow) => {
        setEditTarget(e);
        setForm({ first_name: e.first_name, last_name: e.last_name, email: e.email, password: "", role: e.role, department: e.department || "General", avatar: null });
    };

    const columns = [
        {
            key: "full_name", label: "Employee", sortable: true,
            render: (row: EmployeeRow) => (
                <div className="flex items-center gap-3">
                    {row.profile_picture_url ? (
                        <img src={row.profile_picture_url} alt={row.first_name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-400 text-xs font-medium">{row.first_name?.[0]?.toUpperCase()}</span>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-foreground">{row.full_name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "role", label: "Role", sortable: true, render: (row: EmployeeRow) => <span className="text-sm capitalize text-muted-foreground">{row.role}</span> },
        { key: "department", label: "Department", sortable: true },
        { key: "active", label: "Status", render: (row: EmployeeRow) => <StatusBadge status={row.active ? "active" : "inactive"} /> },
        { key: "last_login", label: "Last Login", render: (row: EmployeeRow) => <span className="text-xs text-muted-foreground">{row.last_login ? new Date(row.last_login).toLocaleDateString() : "Never"}</span> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Employees</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} employees</p>
                </div>
                <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-foreground rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                    <PlusIcon className="h-4 w-4" /> Add Employee
                </button>
            </div>

            <DataTable
                columns={columns}
                data={employees}
                loading={loading}
                searchPlaceholder="Search employees..."
                onSearch={(q) => setSearch(q)}
                total={total}
                emptyMessage="No employees found"
                actions={(row: EmployeeRow) => (
                    <>
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setAssignTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" title="Assign">
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Deactivate">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="Add Employee" onSubmit={handleCreate} submitLabel="Create" loading={actionLoading}>
                <Field label="First Name"><input className={inputClasses} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
                <Field label="Last Name"><input className={inputClasses} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Password"><input className={inputClasses} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generated if empty" /></Field>
                <Field label="Role">
                    <select className={selectClasses} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="support">Support</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </Field>
                <Field label="Department"><input className={inputClasses} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
            </FormModal>

            {/* Edit Modal */}
            <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Employee" onSubmit={handleUpdate} submitLabel="Update" loading={actionLoading}>
                <Field label="First Name"><input className={inputClasses} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
                <Field label="Last Name"><input className={inputClasses} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Role">
                    <select className={selectClasses} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="support">Support</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </Field>
                <Field label="Department"><input className={inputClasses} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
                <Field label="Profile Picture (Optional)">
                    <input 
                        className={inputClasses} 
                        type="file" 
                        accept="image/jpeg, image/png, image/gif, image/webp" 
                        onChange={(e) => setForm({ ...form, avatar: e.target.files ? e.target.files[0] : null })} 
                    />
                </Field>
            </FormModal>

            {/* Assign Modal */}
            <FormModal open={!!assignTarget} onClose={() => setAssignTarget(null)} title={`Assign to ${assignTarget?.full_name}`} onSubmit={handleAssign} submitLabel="Assign" loading={actionLoading}>
                <Field label="Ticket IDs (comma separated)">
                    <input className={inputClasses} value={assignTicketIds} onChange={(e) => setAssignTicketIds(e.target.value)} placeholder="e.g. 1, 5, 12" />
                </Field>
            </FormModal>

            {/* Delete Confirmation */}
            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Deactivate Employee" message={`Deactivate ${deleteTarget?.full_name}?`} confirmLabel="Deactivate" loading={actionLoading} />
        </div>
    );
}
