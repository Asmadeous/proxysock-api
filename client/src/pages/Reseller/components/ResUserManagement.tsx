import { useState, useEffect, useCallback, Fragment } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import {
    fetchResellerUsers,
    createResellerUser,
    updateResellerUser,
    deleteResellerUser,
    fetchResellerUserOrders,
    fetchResellerUserTransactions
} from "../../../services/resellerApi";
import { toast } from "sonner";
import { getApiError } from "@/utils/apiError";
import StatusBadge from "../../SuperAdmin/components/StatusBadge";
import FormModal, { Field, inputClasses } from "../../SuperAdmin/components/FormModal";
import ConfirmModal from "../../SuperAdmin/components/ConfirmModal";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";
import { ServiceSearch } from "../../SuperAdmin/components/ServiceCard";

const money = (value: number) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ManagedUser {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    status: string;
    balance: number;
    created_at: string;
    country?: string;
    city?: string;
    country_code?: string;
}

const EMPTY_FORM = {
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    country_code: "US",
    city: ""
};

export default function ResUserManagement() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [actionLoading, setActionLoading] = useState(false);

    // Expanded data
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page: String(page), q: search };
            const res = await fetchResellerUsers(params);
            setUsers(res.data.users);
            setTotal(res.data.meta.total_count);
        } catch {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await createResellerUser(form);
            toast.success("User created successfully");
            setShowCreate(false);
            setForm(EMPTY_FORM);
            loadUsers();
        } catch (err: any) {
            toast.error(getApiError(err, "Failed to create user"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            await updateResellerUser(editTarget.id, form);
            toast.success("User updated successfully");
            setEditTarget(null);
            loadUsers();
        } catch {
            toast.error("Failed to update user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await deleteResellerUser(deleteTarget.id);
            toast.success("User deleted");
            setDeleteTarget(null);
            loadUsers();
        } catch {
            toast.error("Failed to delete user");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleExpand = async (userId: number) => {
        if (expandedId === userId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(userId);
        setDetailsLoading(true);
        try {
            const [ordersRes, txnsRes] = await Promise.all([
                fetchResellerUserOrders(userId),
                fetchResellerUserTransactions(userId)
            ]);
            setUserOrders(ordersRes.data.orders);
            setUserTransactions(txnsRes.data.transactions);
        } catch {
            toast.error("Failed to load user details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const openEdit = (user: ManagedUser) => {
        setEditTarget(user);
        setForm({
            email: user.email,
            username: user.username,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            phone: user.phone || "",
            password: "", // Handled separately if needed
            country_code: user.country_code || "US",
            city: user.city || ""
        });
    };

    const totalPages = Math.max(1, Math.ceil(total / 20));

    return (
        <div className="ws-stack">
            <PageHeader
                title="Users"
                description="Create and manage the customer accounts you serve."
                actions={<Button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}><UserPlus aria-hidden="true" /> Create user</Button>}
            />

            <div className="ws-toolbar" style={{ marginBottom: 0 }}>
                <ServiceSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search by name or email" />
                <span className="ws-muted text-xs">{loading ? "Loading…" : `${total} user${total === 1 ? "" : "s"}`}</span>
            </div>

            <div className="ws-table-panel" aria-busy={loading}>
                {loading ? (
                    <div className="space-y-3 py-6" role="status" aria-label="Loading users">
                        {[0, 1, 2].map(i => <span key={i} className="ws-skeleton block" style={{ height: 14, maxWidth: i % 2 ? "70%" : "100%" }} />)}
                    </div>
                ) : users.length === 0 ? (
                    <div className="overview-empty">
                        <span className="overview-empty-mark" aria-hidden="true"><Users size={26} strokeWidth={1.3} /></span>
                        <h3>{search ? "No users match your search" : "No users yet"}</h3>
                        <p>{search ? "Try a different name or email address." : "Create a user to place orders and manage services on their behalf."}</p>
                    </div>
                ) : (
                    <div className="ws-table-scroll">
                        <table className="ws-table">
                            <caption className="sr-only">Managed users</caption>
                            <thead>
                                <tr><th>User</th><th>Status</th><th>Location</th><th>Balance</th><th>Joined</th><th className="ws-actions"><span className="sr-only">Actions</span></th></tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
                                    const expanded = expandedId === user.id;
                                    return (
                                        <Fragment key={user.id}>
                                            <tr>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <span className="ws-avatar" aria-hidden="true">{(name || user.email)?.[0]?.toUpperCase()}</span>
                                                        <div className="min-w-0">
                                                            <strong>{name}</strong>
                                                            <div className="ws-mono truncate">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><StatusBadge status={user.status} /></td>
                                                <td>{[user.city, user.country_code].filter(Boolean).join(", ") || "—"}</td>
                                                <td>{money(user.balance)}</td>
                                                <td className="ws-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td className="ws-actions">
                                                    <div>
                                                        <button type="button" className="ws-icon-button" onClick={() => toggleExpand(user.id)} aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} activity for ${user.email}`} title="Activity">{expanded ? <ChevronUp /> : <ChevronDown />}</button>
                                                        <button type="button" className="ws-icon-button" onClick={() => openEdit(user)} aria-label={`Edit ${user.email}`} title="Edit"><Pencil /></button>
                                                        <button type="button" className="ws-icon-button" onClick={() => setDeleteTarget(user)} aria-label={`Delete ${user.email}`} title="Delete"><Trash2 /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expanded && (
                                                <tr>
                                                    <td colSpan={6} style={{ background: "var(--ov-wash)" }}>
                                                        <div className="grid grid-cols-1 gap-6 py-2 lg:grid-cols-2">
                                                            <section aria-label="Recent orders">
                                                                <p className="ws-label">Recent orders</p>
                                                                {detailsLoading ? <span className="ws-skeleton block" style={{ height: 60 }} /> : userOrders.length === 0 ? (
                                                                    <p className="ws-muted text-xs">No orders placed by this user yet.</p>
                                                                ) : (
                                                                    <div className="ws-list">
                                                                        {userOrders.slice(0, 5).map((order: any) => (
                                                                            <div key={order.id}>
                                                                                <span className="min-w-0"><strong className="block truncate">{order.product_name}</strong><span className="ws-mono">#{order.order_number} · {new Date(order.created_at).toLocaleDateString()}</span></span>
                                                                                <span>{money(order.total_amount)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </section>
                                                            <section aria-label="Wallet ledger">
                                                                <p className="ws-label">Wallet ledger</p>
                                                                {detailsLoading ? <span className="ws-skeleton block" style={{ height: 60 }} /> : userTransactions.length === 0 ? (
                                                                    <p className="ws-muted text-xs">No transactions recorded yet.</p>
                                                                ) : (
                                                                    <div className="ws-list">
                                                                        {userTransactions.slice(0, 5).map((txn: any) => (
                                                                            <div key={txn.id}>
                                                                                <span className="min-w-0"><strong className="block truncate">{txn.description}</strong><span className="ws-mono">{txn.transaction_type} · {new Date(txn.created_at).toLocaleDateString()}</span></span>
                                                                                <span className={txn.transaction_type === "credit" ? "ws-good" : "ws-bad"}>{txn.transaction_type === "credit" ? "+" : "−"}{money(txn.amount)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </section>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > 20 && (
                    <div className="ws-pagination">
                        <span>Page {page} of {totalPages}</span>
                        <div>
                            <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1 || loading} aria-label="Previous page"><ChevronLeft /></button>
                            <button type="button" onClick={() => setPage(page + 1)} disabled={page * 20 >= total || loading} aria-label="Next page"><ChevronRight /></button>
                        </div>
                    </div>
                )}
            </div>

            <FormModal
                open={showCreate || !!editTarget}
                onClose={() => { setShowCreate(false); setEditTarget(null); }}
                title={editTarget ? "Edit user" : "Create user"}
                onSubmit={editTarget ? handleUpdate : handleCreate}
                submitLabel={editTarget ? "Save changes" : "Create user"}
                loading={actionLoading}
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="First name"><input className={inputClasses} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
                    <Field label="Last name"><input className={inputClasses} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
                </div>
                <Field label="Email"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username"><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Country code"><input className={inputClasses} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} placeholder="US" /></Field>
                    <Field label="City"><input className={inputClasses} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New York" /></Field>
                </div>
                <Field label="Phone"><input className={inputClasses} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                {!editTarget && (
                    <Field label="Password" hint="Leave empty to generate a secure random password."><input className={inputClasses} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                )}
            </FormModal>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete user"
                message={`Permanently delete ${deleteTarget?.email ?? "this user"}? Their active subscriptions will be terminated. This cannot be undone.`}
                confirmLabel="Delete user"
                loading={actionLoading}
            />
        </div>
    );
}
