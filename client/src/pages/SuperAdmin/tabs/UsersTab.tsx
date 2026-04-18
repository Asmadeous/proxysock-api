import { useState } from "react";
import { PencilIcon, TrashIcon, UserPlusIcon, FingerPrintIcon } from "@heroicons/react/24/outline";
import { validEmail, hasErrors, type ValidationErrors } from "../utils/validation";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import EmptyState from "../components/EmptyState";
import {
    useAdminUsers,
    useDeleteUser,
    useUpdateUser,
    useOnboardUser,
    useImpersonateUser,
} from "../queries/users.queries";

interface UserRow {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    status: string;
    wallet_balance: number;
    total_orders: number;
    created_at: string;
}

const PER = 25;

export default function UsersTab() {
    const { getNum, get, update } = useTabFilters();
    const page = getNum("page", 1);
    const search = get("search");

    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [editTarget, setEditTarget] = useState<UserRow | null>(null);
    const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", status: "" });
    const [editErrors, setEditErrors] = useState<ValidationErrors>({});

    const { data, isLoading } = useAdminUsers({ page, search, per: PER });
    const users: UserRow[] = data?.users ?? [];
    const total: number = data?.total ?? 0;

    const deleteUser = useDeleteUser();
    const updateUser = useUpdateUser();
    const onboardUser = useOnboardUser();
    const impersonateUser = useImpersonateUser();

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteUser.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleEdit = async () => {
        if (!editTarget) return;
        const errors = { email: validEmail(editForm.email) };
        if (hasErrors(errors)) { setEditErrors(errors); return; }
        await updateUser.mutateAsync({ id: editTarget.id, data: editForm });
        setEditTarget(null);
        setEditErrors({});
    };

    const openEdit = (user: UserRow) => {
        setEditTarget(user);
        setEditForm({
            first_name: user.first_name ?? "",
            last_name: user.last_name ?? "",
            email: user.email,
            status: user.status ?? "active",
        });
    };

    const columns = [
        {
            key: "name", label: "User", sortable: true,
            render: (row: UserRow) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-foreground text-xs font-medium">
                            {(row.first_name || row.email)?.[0]?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{row.first_name} {row.last_name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "status", label: "Status", sortable: true, render: (row: UserRow) => <StatusBadge status={row.status ?? "active"} /> },
        {
            key: "wallet_balance", label: "Balance", sortable: true,
            render: (row: UserRow) => <span className="text-sm">${Number(row.wallet_balance ?? 0).toFixed(2)}</span>,
        },
        { key: "total_orders", label: "Orders", sortable: true },
        {
            key: "created_at", label: "Joined", sortable: true,
            render: (row: UserRow) => (
                <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Users</h2>
                    <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={users}
                loading={isLoading}
                searchPlaceholder="Search users by name or email..."
                onSearch={(q) => update({ search: q, page: 1 })}
                page={page}
                totalPages={Math.ceil(total / PER)}
                onPageChange={(p) => update({ page: p })}
                total={total}
                emptyMessage={<EmptyState title="No users found" description="Users will appear here once they sign up." />}
                actions={(row: UserRow) => (
                    <>
                        <button
                            onClick={() => openEdit(row)}
                            aria-label="Edit user"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onboardUser.mutate(row.id)}
                            aria-label="Onboard user"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                        >
                            <UserPlusIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => impersonateUser.mutate(row.id)}
                            aria-label="Impersonate user"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                        >
                            <FingerPrintIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setDeleteTarget(row)}
                            aria-label="Delete user"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete User"
                message={`Are you sure you want to delete ${deleteTarget?.email}? This action cannot be undone.`}
                confirmLabel="Delete"
                loading={deleteUser.isLoading}
            />

            <FormModal
                open={!!editTarget}
                onClose={() => { setEditTarget(null); setEditErrors({}); }}
                title="Edit User"
                onSubmit={handleEdit}
                submitLabel="Update"
                loading={updateUser.isLoading}
            >
                <Field label="First Name">
                    <input className={inputClasses} value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                </Field>
                <Field label="Last Name">
                    <input className={inputClasses} value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                </Field>
                <Field label="Email" error={editErrors.email}>
                    <input className={inputClasses} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </Field>
                <Field label="Status">
                    <select className={inputClasses} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </Field>
            </FormModal>
        </div>
    );
}
