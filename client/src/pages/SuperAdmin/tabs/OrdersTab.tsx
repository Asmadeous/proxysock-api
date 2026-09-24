import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowPathIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    GlobeAltIcon,
    Cog6ToothIcon as CogIcon,
    KeyIcon,
    XCircleIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    ShieldCheckIcon,
    EyeIcon,
    PlusIcon,
    PencilSquareIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import {
    Globe, Smartphone, Monitor, Server, ShieldCheck, ShoppingCart
} from "lucide-react";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ManagementFilters from "../components/ManagementFilters";
import { getApiError } from "../utils/errors";
import {
    fetchAdminOrders,
    fetchAdminOrder,
    updateAdminOrder,
    deleteAdminOrder,
    createAdminOrder,
    fetchAdminProducts,
    refundOrder,
    rescueOrder,
    renewOrder,
    reorderOrder,
    fetchOrderCredentials,
    updateProxyCredentials,
    rotateProxyIp,
    changeProxyProtocol,
    whitelistAdd,
    whitelistDelete
} from "../../../services/adminApi";
import { toast } from "sonner";

interface OrderRow {
    id: number;
    order_number: string;
    status: string;
    product_name: string;
    product_type: string;
    total_amount: number;
    quantity: number;
    entity_type: string;
    entity_name: string;
    entity_email: string;
    payment_method?: string;
    created_at: string;
    proxy_details?: {
        whitelist_ips: string[];
        protocol: string;
    };
}

export default function OrdersTab() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("q") || "");
    const [statusFilter, setStatusFilter] = useState("");
    const [entityTypeFilter, setEntityTypeFilter] = useState("");
    const [productTypeFilter, setProductTypeFilter] = useState("");
    const [stats, setStats] = useState({
        total: 0, active: 0, pending: 0, failed: 0, processing: 0,
        by_type: {} as Record<string, number>,
        revenue_by_type: {} as Record<string, number>
    });
    
    const [rescueTarget, setRescueTarget] = useState<OrderRow | null>(null);
    const [refundTarget, setRefundTarget] = useState<OrderRow | null>(null);
    const [proxyConfigTarget, setProxyConfigTarget] = useState<OrderRow | null>(null);
    const [proxyCreds, setProxyCreds] = useState<Record<string, string> | null>(null);
    const [proxyActionLoading, setProxyActionLoading] = useState(false);
    const [newCreds, setNewCreds] = useState({ username: '', password: '' });
    const [newIp, setNewIp] = useState('');
    const [modalSubTab, setModalSubTab] = useState<'creds' | 'whitelist' | 'protocol'>('creds');
    const [refundMethod, setRefundMethod] = useState<"wallet" | "original">("wallet");
    const [actionLoading, setActionLoading] = useState(false);

    // Detail / edit
    const [detailId, setDetailId] = useState<string | number | null>(null);
    const [detail, setDetail] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<{ status: string; quantity: string; total_amount: string; currency: string; expires_at: string; metadata: string }>({
        status: "", quantity: "", total_amount: "", currency: "", expires_at: "", metadata: "{}"
    });

    // Create
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ product_id: "", customer_email: "", quantity: "1", metadata: "{}" });
    const [products, setProducts] = useState<{ id: string | number; name: string }[]>([]);

    // Cancel (soft-delete)
    const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);
    const [cancelDeprovision, setCancelDeprovision] = useState(false);

    const PER = 25;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), per: String(PER) };
            if (search) params.q = search;
            if (statusFilter) params.status = statusFilter;
            if (entityTypeFilter) params.entity_type = entityTypeFilter;
            if (productTypeFilter) params.product_type = productTypeFilter;
            const res = await fetchAdminOrders(params);
            setOrders(res.data.orders);
            setTotal(res.data.total);
            setStats(res.data.stats);
        } catch (err) { toast.error(getApiError(err, "Failed to load orders")); }
        finally { setLoading(false); }
    }, [page, search, statusFilter, entityTypeFilter, productTypeFilter]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const q = searchParams.get("search") || searchParams.get("q");
        if (q && q !== search) {
            setSearch(q);
            setPage(1);
        }
    }, [searchParams, search]);

    const handleRescue = async () => {
        if (!rescueTarget) return;
        setActionLoading(true);
        try {
            await rescueOrder(rescueTarget.id);
            toast.success("Rescue triggered");
            setRescueTarget(null);
            load();
        } catch (err: any) {
            toast.error(getApiError(err, "Rescue failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleProxyModalOpen = async (order: OrderRow) => {
        setProxyConfigTarget(order);
        setProxyActionLoading(true);
        try {
            const res = await fetchOrderCredentials(order.id);
            setProxyCreds(res.data);
            setNewCreds({ username: res.data.username || '', password: res.data.password || '' });
        } catch (err) {
            toast.error("Failed to load proxy details");
        } finally {
            setProxyActionLoading(false);
        }
    };

    const handleProxyAction = async (action: string, data?: string) => {
        if (!proxyConfigTarget) return;
        setProxyActionLoading(true);
        try {
            switch (action) {
                case 'update-creds':
                    await updateProxyCredentials(proxyConfigTarget.id, newCreds);
                    toast.success("Credentials updated");
                    break;
                case 'rotate':
                    await rotateProxyIp(proxyConfigTarget.id);
                    toast.success("IP rotation triggered");
                    break;
                case 'change-protocol':
                    if (!data) break;
                    await changeProxyProtocol(proxyConfigTarget.id, data);
                    toast.success(`Protocol changed to ${data}`);
                    break;
                case 'whitelist-add':
                    await whitelistAdd(proxyConfigTarget.id, newIp);
                    toast.success("IP added to whitelist");
                    setNewIp('');
                    break;
                case 'whitelist-delete':
                    if (!data) break;
                    await whitelistDelete(proxyConfigTarget.id, data);
                    toast.success("IP removed from whitelist");
                    break;
                case 'renew':
                    await renewOrder(proxyConfigTarget.id);
                    toast.success("Order renewed");
                    break;
                case 'reorder':
                    await reorderOrder(proxyConfigTarget.id);
                    toast.success("Reorder created");
                    break;
            }
            const res = await fetchOrderCredentials(proxyConfigTarget.id);
            setProxyCreds(res.data);
        } catch (err: any) {
            toast.error(getApiError(err, "Action failed"));
        } finally {
            setProxyActionLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!refundTarget) return;
        setActionLoading(true);
        try {
            await refundOrder(refundTarget.id, { refund_method: refundMethod });
            toast.success(`Order refunded (${refundMethod === "original" ? "original payment" : "wallet"})`);
            setRefundTarget(null);
            setRefundMethod("wallet");
            load();
        } catch (err: any) {
            toast.error(getApiError(err, "Refund failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const openRefund = (row: OrderRow) => {
        setRefundTarget(row);
        setRefundMethod(row.payment_method && row.payment_method !== "balance" ? "original" : "wallet");
    };

    const openDetail = async (row: OrderRow) => {
        setDetailId(row.id);
        setDetail(null);
        setEditMode(false);
        setDetailLoading(true);
        try {
            const res = await fetchAdminOrder(row.id as unknown as number);
            setDetail(res.data);
        } catch (err) {
            toast.error(getApiError(err, "Failed to load order"));
        } finally {
            setDetailLoading(false);
        }
    };

    const startEdit = () => {
        if (!detail) return;
        setEditForm({
            status: detail.status ?? "",
            quantity: String(detail.quantity ?? ""),
            total_amount: String(detail.total_amount ?? ""),
            currency: detail.currency ?? "",
            expires_at: detail.expires_at ? new Date(detail.expires_at).toISOString().slice(0, 16) : "",
            metadata: JSON.stringify(detail.metadata ?? {}, null, 2),
        });
        setEditMode(true);
    };

    const handleUpdate = async () => {
        if (!detailId) return;
        let metadata: Record<string, unknown> | undefined;
        if (editForm.metadata.trim()) {
            try { metadata = JSON.parse(editForm.metadata); }
            catch { toast.error("Metadata must be valid JSON"); return; }
        }
        setActionLoading(true);
        try {
            const payload: Record<string, unknown> = {
                status: editForm.status,
                quantity: Number(editForm.quantity),
                total_amount: editForm.total_amount,
                currency: editForm.currency,
                expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : null,
            };
            if (metadata) payload.metadata = metadata;
            const res = await updateAdminOrder(detailId, payload);
            setDetail(res.data);
            setEditMode(false);
            toast.success("Order updated");
            load();
        } catch (err) {
            toast.error(getApiError(err, "Update failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelTarget) return;
        setActionLoading(true);
        try {
            await deleteAdminOrder(cancelTarget.id, { deprovision: cancelDeprovision });
            toast.success(`Order #${String(cancelTarget.id).slice(0, 8)} cancelled`);
            setCancelTarget(null);
            setCancelDeprovision(false);
            if (detailId === cancelTarget.id) setDetailId(null);
            load();
        } catch (err) {
            toast.error(getApiError(err, "Cancel failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const openCreate = async () => {
        setCreateForm({ product_id: "", customer_email: "", quantity: "1", metadata: "{}" });
        setCreateOpen(true);
        if (products.length === 0) {
            try {
                const res = await fetchAdminProducts();
                const list = res.data.products || res.data || [];
                setProducts(list.map((p: any) => ({ id: p.id, name: p.name })));
            } catch { /* product picker falls back to manual id entry */ }
        }
    };

    const handleCreate = async () => {
        if (!createForm.product_id || !createForm.customer_email.trim()) {
            toast.error("Product and customer email are required");
            return;
        }
        let metadata: Record<string, unknown> | undefined;
        if (createForm.metadata.trim()) {
            try { metadata = JSON.parse(createForm.metadata); }
            catch { toast.error("Metadata must be valid JSON"); return; }
        }
        setActionLoading(true);
        try {
            await createAdminOrder({
                product_id: String(createForm.product_id),
                customer_email: createForm.customer_email.trim(),
                quantity: Number(createForm.quantity) || 1,
                metadata,
            });
            toast.success("Order created — provisioning started");
            setCreateOpen(false);
            load();
        } catch (err) {
            toast.error(getApiError(err, "Create failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const paymentLabel = (method?: string) => {
        if (!method || method === " balance") return "Balance";
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };

    const columns = [
        {
            key: "id", label: "Order ID", sortable: true,
            render: (row: OrderRow) => (
                <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                    #{String(row.id).slice(0, 8)}
                </span>
            ),
        },
        { 
            key: "product_name", label: "Product", sortable: true,
            render: (row: OrderRow) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1.5 rounded-lg",
                        row.product_type === 'rdp' ? "bg-orange-500/10 text-orange-500" :
                        row.product_type === 'vps' ? "bg-blue-500/10 text-blue-500" :
                        row.product_type === 'esim' ? "bg-green-500/10 text-green-500" :
                        "bg-primary/10 text-primary"
                    )}>
                        {row.product_type === 'rdp' && <Monitor className="w-4 h-4" />}
                        {row.product_type === 'vps' && <Server className="w-4 h-4" />}
                        {row.product_type === 'esim' && <Smartphone className="w-4 h-4" />}
                        {row.product_type === 'proxy' && <Globe className="w-4 h-4" />}
                        {row.product_type === 'vpn' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <span className="font-medium text-foreground">{row.product_name}</span>
                </div>
            )
        },
        {
            key: "entity_name", label: "Customer",
            render: (row: OrderRow) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{row.entity_name}</p>
                    <div className="flex items-center gap-1">
                        <span className={cn(
                            "text-[10px] px-1 rounded uppercase font-bold",
                            row.entity_type === 'Reseller' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                            {row.entity_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">• {row.entity_email}</span>
                    </div>
                </div>
            ),
        },
        { 
            key: "total_amount", label: "Amount", sortable: true, 
            render: (row: OrderRow) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">${Number(row.total_amount).toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{paymentLabel(row.payment_method)}</span>
                </div>
            )
        },
        { key: "status", label: "Status", sortable: true, render: (row: OrderRow) => <StatusBadge status={row.status} /> },
        { 
            key: "created_at", label: "Date", sortable: true, 
            render: (row: OrderRow) => (
                <div className="text-xs text-muted-foreground">
                    <p>{new Date(row.created_at).toLocaleDateString()}</p>
                    <p className="opacity-60">{new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            )
        },
    ];

    const productTypes = [
        { id: "proxy", label: "Proxy", icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10" },
        { id: "esim", label: "eSIM", icon: Smartphone, color: "text-green-500", bg: "bg-green-500/10" },
        { id: "rdp", label: "RDP", icon: Monitor, color: "text-orange-500", bg: "bg-orange-500/10" },
        { id: "vps", label: "VPS", icon: Server, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "vpn", label: "VPN", icon: ShieldCheck, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    ];

    const statuses = [
        { id: "active", label: "Active", icon: CheckCircleIcon, color: "text-green-500", bg: "bg-green-500/10" },
        { id: "pending", label: "Pending", icon: ClockIcon, color: "text-yellow-500", bg: "bg-yellow-500/10" },
        { id: "failed", label: "Failed", icon: ExclamationCircleIcon, color: "text-red-500", bg: "bg-red-500/10" },
        { id: "processing", label: "Processing", icon: ArrowPathIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Monitor and control every transaction across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ManagementFilters entityType={entityTypeFilter} onEntityTypeChange={(t) => { setEntityTypeFilter(t); setPage(1); }} />
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-sm font-bold text-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Order
                    </button>
                    <button
                        onClick={() => load()}
                        disabled={loading}
                        className="p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-all shadow-sm"
                    >
                        <ArrowPathIcon className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm"
                >
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Volume</p>
                        <h3 className="text-3xl font-black text-foreground">{stats.total}</h3>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-bold">+{Math.round(stats.active / stats.total * 100) || 0}% Active</span>
                        </div>
                    </div>
                    <ShoppingCart className="absolute -right-4 -bottom-4 w-32 h-32 text-muted-foreground/5 group-hover:text-muted-foreground/10 transition-all rotate-12 group-hover:rotate-0" />
                </motion.div>

                {statuses.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}
                        onClick={() => { setStatusFilter(statusFilter === s.id ? "" : s.id); setPage(1); }}
                        className={cn(
                            "bg-card border rounded-2xl p-6 cursor-pointer transition-all shadow-sm group relative overflow-hidden",
                            statusFilter === s.id ? "border-primary ring-4 ring-primary/5" : "border-border hover:border-muted-foreground/30"
                        )}
                    >
                        <s.icon className="absolute -right-4 -bottom-4 w-32 h-32 text-muted-foreground/5 group-hover:text-muted-foreground/10 transition-all rotate-12 group-hover:rotate-0 z-0" />
                        <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{s.label}</p>
                                <h3 className="text-3xl font-black text-foreground">
                                    {s.id === 'active' ? stats.active :
                                     s.id === 'pending' ? stats.pending :
                                     s.id === 'failed' ? stats.failed : stats.processing}
                                </h3>
                            </div>
                            <div className={cn("p-2 rounded-xl", s.bg, s.color)}>
                                <s.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                                className={cn("h-full rounded-full transition-all duration-1000", s.id === 'active' ? "bg-green-500" : s.id === 'pending' ? "bg-yellow-500" : "bg-red-500")} 
                                style={{ width: `${Math.round(((s.id === 'active' ? stats.active : s.id === 'pending' ? stats.pending : stats.failed) / stats.total) * 100) || 0}%` }} 
                            />
                        </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase mr-2 tracking-widest">Category</span>
                <button 
                    onClick={() => { setProductTypeFilter(""); setPage(1); }}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all border shadow-sm",
                        productTypeFilter === "" ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-muted-foreground"
                    )}
                >
                    All Orders
                </button>
                {productTypes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => { setProductTypeFilter(t.id); setPage(1); }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border shadow-sm",
                            productTypeFilter === t.id 
                                ? cn("bg-foreground text-background border-foreground")
                                : "bg-card border-border text-muted-foreground hover:border-muted-foreground"
                        )}
                    >
                        <t.icon className={cn("w-4 h-4", productTypeFilter === t.id ? "text-background" : t.color)} />
                        {t.label}
                        <span className={cn(
                            "text-[10px] px-1.5 rounded-full",
                            productTypeFilter === t.id ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                        )}>
                            {stats.by_type[t.id] || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Data Section */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input 
                            type="text"
                            placeholder="Search by Order ID, Customer, or Email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowsUpDownIcon className="w-4 h-4" />
                        <span>Sorted by Latest First</span>
                    </div>
                </div>

                <DataTable
                    columns={columns} data={orders} loading={loading}
                    searchPlaceholder=""
                    onSearch={() => {}} // Controlled by external input
                    page={page} totalPages={Math.ceil(total / PER)} onPageChange={setPage} total={total}
                    emptyMessage="No orders match your current filters."
                    actions={(row: OrderRow) => (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => openDetail(row)}
                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-500/20"
                                title="View / Edit Order"
                            >
                                <EyeIcon className="h-5 w-5" />
                            </button>
                            {(row.status === "failed" || row.status === "error") && (
                                <button 
                                    onClick={() => setRescueTarget(row)} 
                                    className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-yellow-500/20"
                                    title="Rescue Order"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                </button>
                            )}
                            {row.status !== "refunded" && (
                                <button 
                                    onClick={() => openRefund(row)} 
                                    className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-orange-500/20"
                                    title="Issue Refund"
                                >
                                    <BanknotesIcon className="h-5 w-5" />
                                </button>
                            )}
                            {row.product_type === 'proxy' && row.status === 'active' && (
                                <button
                                    onClick={() => handleProxyModalOpen(row)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-primary/20"
                                    title="Proxy Config"
                                >
                                    <CogIcon className="h-5 w-5" />
                                </button>
                            )}
                            {row.status !== "cancelled" && row.status !== "refunded" && (
                                <button
                                    onClick={() => { setCancelTarget(row); setCancelDeprovision(false); }}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-500/20"
                                    title="Cancel Order"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    )}
                />
            </div>

            {/* Rescue Modal */}
            <AnimatePresence>
                {rescueTarget && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                            onClick={() => setRescueTarget(null)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="p-4 bg-yellow-500/10 rounded-3xl w-fit">
                                <ArrowPathIcon className="w-10 h-10 text-yellow-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground">Rescue Order?</h3>
                                <p className="text-muted-foreground">This will attempt to re-provision the infrastructure for order <span className="font-mono text-foreground font-bold">#{String(rescueTarget.id).slice(0, 8)}</span>. Use this for stuck orders.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setRescueTarget(null)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
                                <button onClick={handleRescue} disabled={actionLoading} className="flex-1 px-6 py-4 rounded-2xl text-sm font-black bg-yellow-500 text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-yellow-500/20">
                                    {actionLoading ? "Processing..." : "Rescue Now"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Refund Modal */}
            <AnimatePresence>
                {refundTarget && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                            onClick={() => { setRefundTarget(null); setRefundMethod("wallet"); }} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-orange-500/10 rounded-3xl">
                                    <BanknotesIcon className="w-10 h-10 text-orange-500" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Refund Amount</p>
                                    <h2 className="text-3xl font-black text-foreground">${Number(refundTarget.total_amount).toFixed(2)}</h2>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Customer</span>
                                    <span className="font-bold text-foreground">{refundTarget.entity_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Payment Method</span>
                                    <span className="font-bold text-foreground uppercase text-xs">{paymentLabel(refundTarget.payment_method)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Refund Destination</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setRefundMethod("wallet")}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                            refundMethod === "wallet" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
                                        )}
                                    >
                                        <BanknotesIcon className="w-6 h-6" />
                                        <span className="text-xs font-bold">User Wallet</span>
                                    </button>
                                    {refundTarget.payment_method && refundTarget.payment_method !== "balance" && (
                                        <button
                                            onClick={() => setRefundMethod("original")}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center",
                                                refundMethod === "original" ? "border-purple-500 bg-purple-500/5 text-purple-500" : "border-border text-muted-foreground hover:border-muted-foreground"
                                            )}
                                        >
                                            <GlobeAltIcon className="w-6 h-6" />
                                            <span className="text-xs font-bold">Original Gateway</span>
                                        </button>
                                    )}
                                </div>
                                {refundMethod === "original" && (
                                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-yellow-500 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 leading-relaxed font-medium">
                                        ⚠ Gateway refunds are processed via {paymentLabel(refundTarget.payment_method)}. Automated for fiat; manual claim required for crypto.
                                    </motion.p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setRefundTarget(null)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Discard</button>
                                <button onClick={handleRefund} disabled={actionLoading} className="flex-1 px-6 py-4 rounded-2xl text-sm font-black bg-orange-500 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20">
                                    {actionLoading ? "Processing..." : "Confirm Refund"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Proxy Config Modal - Optimized */}
            <AnimatePresence>
                {proxyConfigTarget && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                            onClick={() => setProxyConfigTarget(null)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }}
                            className="relative bg-card border border-border rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-border flex justify-between items-start bg-muted/20">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><GlobeAltIcon className="w-6 h-6" /></div>
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">Proxy Infrastructure</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-mono">#{proxyConfigTarget.order_number}</span>
                                        <span>•</span>
                                        <span>{proxyConfigTarget.product_name}</span>
                                    </div>
                                </div>
                                <button onClick={() => setProxyConfigTarget(null)} className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground">
                                    <XCircleIcon className="w-8 h-8" />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="flex p-2 bg-muted/10 border-b border-border gap-2">
                                {[
                                    { id: 'creds', label: 'Auth & Access', icon: KeyIcon },
                                    { id: 'whitelist', label: 'IP Whitelist', icon: ShieldCheckIcon },
                                    { id: 'protocol', label: 'Network Settings', icon: GlobeAltIcon },
                                ].map((tab) => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setModalSubTab(tab.id as any)} 
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all",
                                            modalSubTab === tab.id ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {proxyActionLoading && !proxyCreds ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                        <ArrowPathIcon className="w-12 h-12 animate-spin text-primary" />
                                        <p className="font-bold text-lg animate-pulse">Syncing with nodes...</p>
                                    </div>
                                ) : proxyCreds ? (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        {modalSubTab === 'creds' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Authentication</h4>
                                                    <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Username</label>
                                                            <input 
                                                                className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                                                                value={newCreds.username} 
                                                                onChange={e => setNewCreds({...newCreds, username: e.target.value})} 
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Password</label>
                                                            <input 
                                                                className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                                                                value={newCreds.password} 
                                                                onChange={e => setNewCreds({...newCreds, password: e.target.value})} 
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => handleProxyAction('update-creds')}
                                                            disabled={proxyActionLoading}
                                                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                                        >
                                                            Sync New Credentials
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Quick Operations</h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <button 
                                                            onClick={() => handleProxyAction('rotate')}
                                                            disabled={proxyActionLoading}
                                                            className="p-4 bg-card border border-border rounded-2xl hover:border-primary transition-all flex items-center gap-4 group"
                                                        >
                                                            <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:rotate-180 transition-all duration-500">
                                                                <ArrowPathIcon className="w-5 h-5" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-xs font-black text-foreground">Force Rotation</p>
                                                                <p className="text-[10px] text-muted-foreground">Immediate IP change request</p>
                                                            </div>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleProxyAction('renew')}
                                                            className="p-4 bg-card border border-border rounded-2xl hover:border-green-500 transition-all flex items-center gap-4 group"
                                                        >
                                                            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:scale-110 transition-all">
                                                                <ClockIcon className="w-5 h-5" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-xs font-black text-foreground">Renew Duration</p>
                                                                <p className="text-[10px] text-muted-foreground">Add 30 days to expiry</p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Live Status Card */}
                                                <div className="md:col-span-2 bg-foreground text-background rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-xl">
                                                    <div className="flex gap-8">
                                                        <div>
                                                            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Current Endpoint</p>
                                                            <p className="text-xl font-mono font-bold">{proxyCreds.ip}:{proxyCreds.port}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Protocol</p>
                                                            <p className="text-xl font-bold uppercase">{proxyCreds.protocol}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => copyToClipboard(`${proxyCreds.ip}:${proxyCreds.port}:${newCreds.username}:${newCreds.password}`)} className="bg-background text-foreground px-6 py-3 rounded-2xl text-xs font-black hover:opacity-90 transition-all flex items-center gap-2">
                                                        <DocumentDuplicateIcon className="w-4 h-4" /> Copy Access Line
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {modalSubTab === 'whitelist' && (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Authorized IPs</h4>
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-black uppercase">{proxyConfigTarget.proxy_details?.whitelist_ips?.length || 0} / 10 Active</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {proxyConfigTarget.proxy_details?.whitelist_ips?.map((ip: string) => (
                                                        <div key={ip} className="bg-muted/20 border border-border p-4 rounded-2xl flex justify-between items-center group hover:bg-muted/40 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <ShieldCheckIcon className="w-5 h-5 text-primary" />
                                                                <span className="text-sm font-mono font-bold">{ip}</span>
                                                            </div>
                                                            <button onClick={() => handleProxyAction('whitelist-delete', ip)} className="text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-all">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <div className="bg-card border border-border border-dashed p-4 rounded-2xl flex flex-col gap-4">
                                                        <div className="flex gap-2">
                                                            <input 
                                                                className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm font-mono outline-none focus:ring-4 focus:ring-primary/10" 
                                                                placeholder="Enter IPv4 Address..." 
                                                                value={newIp}
                                                                onChange={e => setNewIp(e.target.value)}
                                                            />
                                                            <button 
                                                                onClick={() => handleProxyAction('whitelist-add')}
                                                                disabled={proxyActionLoading || !newIp}
                                                                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                                            >
                                                                Authorize
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">Changes take up to 60 seconds to propagate to edge nodes.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {modalSubTab === 'protocol' && (
                                            <div className="space-y-8">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground text-center">Infrastructure Protocol</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <button 
                                                        onClick={() => handleProxyAction('change-protocol', 'http')}
                                                        className={cn(
                                                            "p-8 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 text-center",
                                                            proxyCreds.protocol === 'http' ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        <div className={cn("p-4 rounded-3xl", proxyCreds.protocol === 'http' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                            <GlobeAltIcon className="w-10 h-10" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xl font-black mb-1">HTTP / HTTPS</p>
                                                            <p className="text-xs text-muted-foreground font-medium">Recommended for browsers and standard scrapers.</p>
                                                        </div>
                                                        {proxyCreds.protocol === 'http' && <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Current Configuration</span>}
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleProxyAction('change-protocol', 'socks5')}
                                                        className={cn(
                                                            "p-8 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 text-center",
                                                            proxyCreds.protocol === 'socks5' ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        <div className={cn("p-4 rounded-3xl", proxyCreds.protocol === 'socks5' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                            <ShieldCheckIcon className="w-10 h-10" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xl font-black mb-1">SOCKS5</p>
                                                            <p className="text-xs text-muted-foreground font-medium">Advanced networking with UDP support and proxy chaining.</p>
                                                        </div>
                                                        {proxyCreds.protocol === 'socks5' && <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Current Configuration</span>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : null}
                            </div>
                            
                            <div className="p-6 bg-muted/20 border-t border-border flex justify-between items-center">
                                <p className="text-[10px] text-muted-foreground font-medium max-w-[200px]">Node synchronization may cause a momentary connection reset.</p>
                                <button onClick={() => setProxyConfigTarget(null)} className="bg-foreground text-background px-8 py-3 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-xl">Close Panel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Order Detail / Edit Modal */}
            <AnimatePresence>
                {detailId && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                            onClick={() => { setDetailId(null); setEditMode(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }}
                            className="relative bg-card border border-border rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><DocumentDuplicateIcon className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground tracking-tight">
                                            Order #{detail?.order_number || (detailId ? String(detailId).slice(0, 8) : "")}
                                        </h3>
                                        {detail && <StatusBadge status={detail.status} />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {detail && !editMode && (
                                        <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-foreground text-background hover:opacity-90 transition-all">
                                            <PencilSquareIcon className="w-4 h-4" /> Edit
                                        </button>
                                    )}
                                    <button onClick={() => { setDetailId(null); setEditMode(false); }} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all">
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {detailLoading || !detail ? (
                                    <div className="flex items-center justify-center h-40 text-muted-foreground">Loading…</div>
                                ) : editMode ? (
                                    <div className="space-y-4">
                                        <p className="text-[11px] text-yellow-500 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 font-medium">
                                            ⚠ Free edit: status &amp; amount are written directly and will NOT trigger provisioning, refund or deprovision side-effects.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Status</span>
                                                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                                                    {["pending", "awaiting_payment", "processing", "active", "expired", "cancelled", "failed", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Quantity</span>
                                                <input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Total Amount</span>
                                                <input type="number" step="0.01" value={editForm.total_amount} onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Currency</span>
                                                <input value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                                            </label>
                                            <label className="space-y-1 col-span-2">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Expires At</span>
                                                <input type="datetime-local" value={editForm.expires_at} onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                                            </label>
                                            <label className="space-y-1 col-span-2">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Metadata (JSON)</span>
                                                <textarea value={editForm.metadata} onChange={(e) => setEditForm({ ...editForm, metadata: e.target.value })} rows={8} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono" />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <DetailGrid items={[
                                            ["Product", `${detail.product?.name} (${detail.product?.type})`],
                                            ["Total", `$${Number(detail.total_amount).toFixed(2)} ${detail.currency || ""}`],
                                            ["Quantity", detail.quantity],
                                            ["Payment", paymentLabel(detail.payment_method)],
                                            ["Provider Order ID", detail.provider_order_id || "—"],
                                            ["Created", new Date(detail.created_at).toLocaleString()],
                                            ["Expires", detail.expires_at ? new Date(detail.expires_at).toLocaleString() : "—"],
                                        ]} />
                                        <Section title="Customer">
                                            <DetailGrid items={[
                                                ["Name", detail.customer?.name],
                                                ["Email", detail.customer?.email],
                                                ["Type", detail.customer?.type],
                                            ]} />
                                        </Section>
                                        {detail.pricing && (
                                            <Section title="Pricing">
                                                <DetailGrid items={[
                                                    ["Duration", `${detail.pricing.duration_value} ${detail.pricing.duration_type}`],
                                                    ["Selling", detail.pricing.user_selling_price ?? detail.pricing.selling_price],
                                                    ["Cost", detail.pricing.cost_price ?? "—"],
                                                ]} />
                                            </Section>
                                        )}
                                        {detail.provisioned && <Section title="Provisioned"><JsonBlock value={detail.provisioned} /></Section>}
                                        {Array.isArray(detail.credentials) ? (detail.credentials.length > 0 && <Section title="Credentials"><JsonBlock value={detail.credentials} /></Section>) : (detail.credentials && <Section title="Credentials"><JsonBlock value={detail.credentials} /></Section>)}
                                        <Section title="Metadata"><JsonBlock value={detail.metadata ?? {}} /></Section>
                                        {detail.timeline?.length > 0 && (
                                            <Section title="Timeline">
                                                <div className="space-y-2">
                                                    {detail.timeline.map((t: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
                                                            <span className="font-mono text-foreground">{t.action}</span>
                                                            <span className="text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Section>
                                        )}
                                    </div>
                                )}
                            </div>

                            {editMode && (
                                <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
                                    <button onClick={() => setEditMode(false)} className="px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
                                    <button onClick={handleUpdate} disabled={actionLoading} className="px-6 py-3 rounded-2xl text-sm font-black bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg">
                                        {actionLoading ? "Saving…" : "Save Changes"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Order Modal */}
            <AnimatePresence>
                {createOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setCreateOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary"><PlusIcon className="w-7 h-7" /></div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground">New Order</h3>
                                    <p className="text-xs text-muted-foreground">Provisions immediately and emails credentials to the customer.</p>
                                </div>
                            </div>
                            <label className="space-y-1 block">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Product</span>
                                {products.length > 0 ? (
                                    <select value={createForm.product_id} onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                                        <option value="">Select a product…</option>
                                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                ) : (
                                    <input value={createForm.product_id} onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })} placeholder="Product ID" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                                )}
                            </label>
                            <label className="space-y-1 block">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Customer Email</span>
                                <input type="email" value={createForm.customer_email} onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })} placeholder="customer@example.com" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                            </label>
                            <label className="space-y-1 block">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Quantity</span>
                                <input type="number" min={1} value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
                            </label>
                            <label className="space-y-1 block">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Metadata (JSON, optional)</span>
                                <textarea value={createForm.metadata} onChange={(e) => setCreateForm({ ...createForm, metadata: e.target.value })} rows={3} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono" />
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setCreateOpen(false)} className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
                                <button onClick={handleCreate} disabled={actionLoading} className="flex-1 px-6 py-3 rounded-2xl text-sm font-black bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg">
                                    {actionLoading ? "Creating…" : "Create & Provision"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cancel (soft-delete) Modal */}
            <AnimatePresence>
                {cancelTarget && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setCancelTarget(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                            <div className="p-4 bg-red-500/10 rounded-3xl w-fit"><TrashIcon className="w-10 h-10 text-red-500" /></div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground">Cancel Order?</h3>
                                <p className="text-muted-foreground">Order <span className="font-mono text-foreground font-bold">#{String(cancelTarget.id).slice(0, 8)}</span> will be marked <span className="font-bold">cancelled</span>. The record is kept for history/financials.</p>
                            </div>
                            <label className="flex items-center gap-3 bg-muted/30 rounded-2xl p-4 cursor-pointer">
                                <input type="checkbox" checked={cancelDeprovision} onChange={(e) => setCancelDeprovision(e.target.checked)} className="w-4 h-4" />
                                <span className="text-sm text-foreground">Also flag provisioned resources for teardown</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setCancelTarget(null)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Keep Order</button>
                                <button onClick={handleCancelOrder} disabled={actionLoading} className="flex-1 px-6 py-4 rounded-2xl text-sm font-black bg-red-500 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20">
                                    {actionLoading ? "Cancelling…" : "Cancel Order"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h4>
            {children}
        </div>
    );
}

function DetailGrid({ items }: { items: [string, ReactNode][] }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {items.map(([label, value], i) => (
                <div key={i} className="bg-muted/30 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-foreground break-words">{value ?? "—"}</p>
                </div>
            ))}
        </div>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return (
        <pre className="bg-muted/40 border border-border rounded-xl p-3 text-[11px] font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(value, null, 2)}
        </pre>
    );
}
