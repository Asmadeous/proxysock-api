import { useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { validEmail, required, minLength, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import EmptyState from "../components/EmptyState";
import {
    useAdminEmployees,
    useCreateEmployee,
    useUpdateEmployee,
    useDeleteEmployee,
    useAssignTickets,
} from "../queries/employees.queries";

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

const EMPTY_FORM = {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "support",
    department: "General",
    avatar: null as File | null,
};

export default function EmployeesTab() {
    const { get, update } = useTabFilters();
    const search = get("search");

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<EmployeeRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
    const [assignTarget, setAssignTarget] = useState<EmployeeRow | null>(null);
    const [assignTicketIds, setAssignTicketIds] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<ValidationErrors>({});

    const { data, isLoading } = useAdminEmployees({ search });
    const employees: EmployeeRow[] = data?.employees ?? [];
    const total: number = data?.total ?? 0;

    const createEmployee = useCreateEmployee();
    const updateEmployee = useUpdateEmployee();
    const deleteEmployee = useDeleteEmployee();
    const assignTickets = useAssignTickets();

    const validateForm = (isCreate: boolean): ValidationErrors => ({
        first_name: required(form.first_name, "First name"),
        last_name: required(form.last_name, "Last name"),
        email: validEmail(form.email),
        ...(isCreate ? { password: minLength(form.password, 8, "Password") } : {}),
    });

    const handleCreate = async () => {
        const errors = validateForm(true);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        await createEmployee.mutateAsync(form as unknown as Record<string, unknown>);
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        const errors = validateForm(false);
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        let payload: Record<string, unknown> | FormData;
        if (form.avatar) {
            const fd = new FormData();
            fd.append("first_name", form.first_name);
            fd.append("last_name", form.last_name);
            fd.append("email", form.email);
            fd.append("role", form.role);
            fd.append("department", form.department);
            fd.append("avatar", form.avatar);
            payload = fd;
        } else {
            payload = { first_name: form.first_name, last_name: form.last_name, email: form.email, role: form.role, department: form.department };
        }
        const response = await updateEmployee.mutateAsync({ id: editTarget.id, data: payload });
        // Keep logged-in admin avatar in sync
        const currentAdmin = JSON.parse(localStorage.getItem("adminUser") ?? "{}");
        if (currentAdmin.id === editTarget.id) {
            localStorage.setItem("adminUser", JSON.stringify(response.data));
            window.dispatchEvent(new Event("admin-user-updated"));
        }
        setEditTarget(null);
        setFormErrors({});
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteEmployee.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleAssign = async () => {
        if (!assignTarget) return;
        const ids = assignTicketIds.split(",").map((s) => Number(s.trim())).filter(Boolean);
        await assignTickets.mutateAsync({ id: assignTarget.id, ticketIds: ids });
        setAssignTarget(null);
        setAssignTicketIds("");
    };

    const openEdit = (e: EmployeeRow) => {
        setEditTarget(e);
        setForm({ first_name: e.first_name, last_name: e.last_name, email: e.email, password: "", role: e.role, department: e.department ?? "General", avatar: null });
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
        {
            key: "last_login", label: "Last Login",
            render: (row: EmployeeRow) => (
                <span className="text-xs text-muted-foreground">{row.last_login ? new Date(row.last_login).toLocaleDateString() : "Never"}</span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Employees</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} employees</p>
                </div>
                <Button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}>
                    <PlusIcon className="h-4 w-4" /> Add Employee
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={employees}
                loading={isLoading}
                searchPlaceholder="Search employees..."
                onSearch={(q) => update({ search: q })}
                total={total}
                emptyMessage={<EmptyState title="No employees found" description="Add your first team member to get started." action={{ label: "Add Employee", onClick: () => setShowCreate(true) }} />}
                actions={(row: EmployeeRow) => (
                    <>
                        <button onClick={() => openEdit(row)} aria-label="Edit employee" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setAssignTarget(row)} aria-label="Assign tickets" className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10">
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(row)} aria-label="Deactivate employee" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}); }} title="Add Employee" onSubmit={handleCreate} submitLabel="Create" loading={createEmployee.isLoading}>
                <Field label="First Name" error={formErrors.first_name}><input className={inputClasses} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
                <Field label="Last Name" error={formErrors.last_name}><input className={inputClasses} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
                <Field label="Email" error={formErrors.email}><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Password" error={formErrors.password} hint="Minimum 8 characters"><input className={inputClasses} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
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
            <FormModal open={!!editTarget} onClose={() => { setEditTarget(null); setFormErrors({}); }} title="Edit Employee" onSubmit={handleUpdate} submitLabel="Update" loading={updateEmployee.isLoading}>
                <Field label="First Name" error={formErrors.first_name}><input className={inputClasses} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
                <Field label="Last Name" error={formErrors.last_name}><input className={inputClasses} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
                <Field label="Email" error={formErrors.email}><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Role">
                    <select className={selectClasses} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="support">Support</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </Field>
                <Field label="Department"><input className={inputClasses} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
                <Field label="Profile Picture (Optional)">
                    <input className={inputClasses} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setForm({ ...form, avatar: e.target.files?.[0] ?? null })} />
                </Field>
            </FormModal>

            {/* Assign Modal */}
            <FormModal open={!!assignTarget} onClose={() => setAssignTarget(null)} title={`Assign to ${assignTarget?.full_name}`} onSubmit={handleAssign} submitLabel="Assign" loading={assignTickets.isLoading}>
                <Field label="Ticket IDs (comma separated)">
                    <input className={inputClasses} value={assignTicketIds} onChange={(e) => setAssignTicketIds(e.target.value)} placeholder="e.g. 1, 5, 12" />
                </Field>
            </FormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Deactivate Employee" message={`Deactivate ${deleteTarget?.full_name}?`} confirmLabel="Deactivate" loading={deleteEmployee.isLoading} />
        </div>
    );
}
