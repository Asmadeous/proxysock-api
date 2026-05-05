import { useState, useEffect, useCallback } from "react";
import { PencilIcon, TrashIcon, UserPlusIcon, FingerPrintIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { fetchAdminUsers, deleteAdminUser, createAdminUser, impersonateUser, updateAdminUser, revokeUserTokens } from "../../../services/adminApi";
import { toast } from "react-hot-toast";
import { getApiError } from "../../../utils/apiError";

interface UserRow {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    status: string;
    wallet_balance: number;
    total_orders: number;
    created_at: string;
    country_code?: string;
    city?: string;
}

export default function UsersTab() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const PER = 25;

    // Modals
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [editTarget, setEditTarget] = useState<UserRow | null>(null);
    const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", status: "", country_code: "", city: "" });
    const [actionLoading, setActionLoading] = useState(false);
    const [createModal, setCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ first_name: "", last_name: "", email: "", password: "", country_code: "", city: "" });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), per: String(PER) };
            if (search) params.q = search;
            const res = await fetchAdminUsers(params);
            setUsers(res.data.users);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await deleteAdminUser(deleteTarget.id);
            toast.success("User deleted");
            setDeleteTarget(null);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to delete user")); }
        finally { setActionLoading(false); }
    };

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await createAdminUser(createForm);
            toast.success("User created successfully");
            setCreateModal(false);
            setCreateForm({ first_name: "", last_name: "", email: "", password: "", country_code: "", city: "" });
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to create user")); }
        finally { setActionLoading(false); }
    };

    const handleRevokeTokens = async (id: number) => {
        if (!confirm("Are you sure you want to revoke all active sessions for this user? They will be logged out everywhere.")) return;
        try {
            await revokeUserTokens(id);
            toast.success("Tokens revoked successfully");
        } catch (err) { toast.error(getApiError(err, "Failed to revoke tokens")); }
    };

    const handleImpersonate = async (id: number) => {
        try {
            const res = await impersonateUser(id);
            localStorage.setItem("impersonateToken", res.data.token);
            toast.success("Impersonating user — open a new tab");
        } catch (err) { toast.error(getApiError(err, "Failed to impersonate user")); }
    };

    const handleEdit = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            await updateAdminUser(editTarget.id, editForm);
            toast.success("User updated");
            setEditTarget(null);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to update user")); }
        finally { setActionLoading(false); }
    };

    const openEdit = (user: UserRow) => {
        setEditTarget(user);
        setEditForm({ 
            first_name: user.first_name || "", 
            last_name: user.last_name || "", 
            email: user.email, 
            status: user.status || "active",
            country_code: user.country_code || "US",
            city: user.city || ""
        });
    };

    const columns = [
        {
            key: "name", label: "User", sortable: true,
            render: (row: UserRow) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-foreground text-xs font-medium">{(row.first_name || row.email)?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{row.first_name} {row.last_name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "status", label: "Status", sortable: true, render: (row: UserRow) => <StatusBadge status={row.status || "active"} /> },
        { key: "wallet_balance", label: "Balance", sortable: true, render: (row: UserRow) => <span className="text-sm">${Number(row.wallet_balance || 0).toFixed(2)}</span> },
        { key: "total_orders", label: "Orders", sortable: true },
        { key: "created_at", label: "Joined", sortable: true, render: (row: UserRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Users</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
                </div>
                <button
                    onClick={() => setCreateModal(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <UserPlusIcon className="h-4 w-4" />
                    Onboard User
                </button>
            </div>

            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                searchPlaceholder="Search users by name or email..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                page={page}
                totalPages={Math.ceil(total / PER)}
                onPageChange={setPage}
                total={total}
                emptyMessage="No users found"
                actions={(row: UserRow) => (
                    <>
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleRevokeTokens(row.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10" title="Revoke Access">
                            <span className="text-xs font-medium">Access</span>
                        </button>
                        <button onClick={() => handleImpersonate(row.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" title="Impersonate">
                            <FingerPrintIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            {/* Delete Confirmation */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete User"
                message={`Are you sure you want to delete ${deleteTarget?.email}? This action cannot be undone.`}
                confirmLabel="Delete"
                loading={actionLoading}
            />

            {/* Edit Modal */}
            <FormModal
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                title="Edit User"
                onSubmit={handleEdit}
                submitLabel="Update"
                loading={actionLoading}
            >
                <Field label="First Name">
                    <input className={inputClasses} value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                </Field>
                <Field label="Last Name">
                    <input className={inputClasses} value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                </Field>
                <Field label="Email">
                    <input className={inputClasses} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Country Code">
                        <input className={inputClasses} value={editForm.country_code} onChange={(e) => setEditForm({ ...editForm, country_code: e.target.value })} placeholder="US" />
                    </Field>
                    <Field label="City">
                        <input className={inputClasses} value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="New York" />
                    </Field>
                </div>
                <Field label="Status">
                    <select className={inputClasses} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </Field>
            </FormModal>

            {/* Create Modal */}
            <FormModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                title="Onboard New User"
                onSubmit={handleCreate}
                submitLabel="Create"
                loading={actionLoading}
            >
                <Field label="First Name">
                    <input className={inputClasses} required value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} />
                </Field>
                <Field label="Last Name">
                    <input className={inputClasses} required value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} />
                </Field>
                <Field label="Email">
                    <input className={inputClasses} required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                </Field>
                <Field label="Password">
                    <input className={inputClasses} type="password" placeholder="Leave blank to auto-generate" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Country Code">
                        <input className={inputClasses} value={createForm.country_code} onChange={(e) => setCreateForm({ ...createForm, country_code: e.target.value })} placeholder="US" />
                    </Field>
                    <Field label="City">
                        <input className={inputClasses} value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} placeholder="New York" />
                    </Field>
                </div>
            </FormModal>
        </div>
    );
}
