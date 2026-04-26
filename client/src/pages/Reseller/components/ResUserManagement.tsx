import { useState, useEffect, useCallback, Fragment } from "react";
import {
    UserPlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ShoppingCartIcon,
    BanknotesIcon
} from "@heroicons/react/24/outline";
import {
    fetchResellerUsers,
    createResellerUser,
    updateResellerUser,
    deleteResellerUser,
    fetchResellerUserOrders,
    fetchResellerUserTransactions
} from "../../../services/resellerApi";
import { toast } from "sonner";
import StatusBadge from "../../SuperAdmin/components/StatusBadge";
import FormModal, { Field, inputClasses } from "../../SuperAdmin/components/FormModal";

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
            toast.error(err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : "Failed to create user");
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tighter uppercase">User Management</h1>
                    <p className="text-muted-foreground mt-1 font-medium italic opacity-80">Track and manage your managed sub-clients.</p>
                </div>
                <button 
                    onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}
                    className="bg-primary text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <UserPlusIcon className="w-4 h-4" />
                    Create User
                </button>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-border/50 flex gap-4">
                    <div className="relative flex-1 group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            className="w-full bg-muted/30 border border-border/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                            placeholder="Filter users by name or email..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/30 text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 h-16 bg-muted/10"></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                                        No managed users found matching your search.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <Fragment key={user.id}>
                                    <tr className={`hover:bg-muted/20 transition-colors group ${expandedId === user.id ? 'bg-muted/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <span className="text-primary font-black text-xs uppercase">{(user.first_name || user.username)?.[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black tracking-tight">{user.first_name} {user.last_name || user.username}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold opacity-60 uppercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold tracking-tight">{user.city || "—"}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{user.country_code || "—"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-emerald-500">${user.balance.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground opacity-60">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => toggleExpand(user.id)}
                                                    className="p-2 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
                                                >
                                                    {expandedId === user.id ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => openEdit(user)}
                                                    className="p-2 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteTarget(user)}
                                                    className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {expandedId === user.id && (
                                        <tr className="bg-muted/10 border-b border-border/50">
                                            <td colSpan={6} className="px-8 py-8">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                            <ShoppingCartIcon className="w-3 h-3" /> Recent Orders
                                                        </h4>
                                                        {detailsLoading ? (
                                                            <div className="h-24 bg-muted/20 rounded-2xl animate-pulse"></div>
                                                        ) : userOrders.length === 0 ? (
                                                            <p className="text-xs italic text-muted-foreground font-medium p-4 bg-muted/20 rounded-2xl">No orders placed by this user yet.</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {userOrders.slice(0, 5).map((order: any) => (
                                                                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-2xl">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Order #{order.order_number}</span>
                                                                            <span className="text-xs font-bold">{order.product_name}</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="text-xs font-black text-emerald-500">${Number(order.total_amount).toFixed(2)}</span>
                                                                            <p className="text-[9px] font-black uppercase opacity-40">{new Date(order.created_at).toLocaleDateString()}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                            <BanknotesIcon className="w-3 h-3" /> Wallet Ledger
                                                        </h4>
                                                        {detailsLoading ? (
                                                            <div className="h-24 bg-muted/20 rounded-2xl animate-pulse"></div>
                                                        ) : userTransactions.length === 0 ? (
                                                            <p className="text-xs italic text-muted-foreground font-medium p-4 bg-muted/20 rounded-2xl">No transaction history records found.</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {userTransactions.slice(0, 5).map((txn: any) => (
                                                                    <div key={txn.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-2xl">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black uppercase text-muted-foreground">{txn.transaction_type}</span>
                                                                            <span className="text-xs font-bold leading-tight">{txn.description}</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className={`text-xs font-black ${txn.transaction_type === 'credit' ? 'text-emerald-500' : 'text-primary'}`}>
                                                                                {txn.transaction_type === 'credit' ? '+' : '-'}${Number(txn.amount).toFixed(2)}
                                                                            </span>
                                                                            <p className="text-[9px] font-black uppercase opacity-40">{new Date(txn.created_at).toLocaleDateString()}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {total > 20 && (
                    <div className="p-4 border-t border-border/50 flex justify-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="bg-muted text-foreground px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button 
                            disabled={page * 20 >= total}
                            onClick={() => setPage(page + 1)}
                            className="bg-muted text-foreground px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* modals - same as admin but calling reseller APIs */}
            <FormModal 
                open={showCreate || !!editTarget} 
                onClose={() => { setShowCreate(false); setEditTarget(null); }} 
                title={editTarget ? "Edit Managed Client" : "Initialize New Client"} 
                onSubmit={editTarget ? handleUpdate : handleCreate} 
                submitLabel={editTarget ? "Save Production State" : "Provision Identity"} 
                loading={actionLoading}
            >
                <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name"><input className={inputClasses} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
                    <Field label="Last Name"><input className={inputClasses} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
                </div>
                <Field label="Client Email (Identity Key)"><input className={inputClasses} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Username (Internal)"><input className={inputClasses} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                
                <div className="grid grid-cols-2 gap-4 border-y border-border/50 py-4 my-2">
                    <Field label="ISO Country Code">
                        <input className={inputClasses} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} placeholder="US" />
                    </Field>
                    <Field label="City Location">
                        <input className={inputClasses} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New York" />
                    </Field>
                </div>

                <Field label="Phone Contact"><input className={inputClasses} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                {!editTarget && (
                    <Field label="Force Password Override (Optional)"><input className={inputClasses} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Keep empty for secure random" /></Field>
                )}
            </FormModal>

            <FormModal 
                open={!!deleteTarget} 
                onClose={() => setDeleteTarget(null)} 
                title="Decommission Identity" 
                onSubmit={handleDelete} 
                submitLabel="CONFIRM WIPE" 
                loading={actionLoading}
            >
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                    <p className="text-xs font-black text-destructive uppercase tracking-widest text-center">Caution: Irreversible Action</p>
                    <p className="text-sm font-medium text-center mt-2">You are about to permanently delete <span className="font-bold underline">{deleteTarget?.email}</span>. This will terminate all active subscriptions associated with this client node.</p>
                </div>
            </FormModal>
        </div>
    );
}

