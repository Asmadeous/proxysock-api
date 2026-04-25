import { useState, useEffect, useCallback } from "react";
import {
    ArrowPathIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ShoppingCartIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    ServerIcon,
    GlobeAltIcon,
    Cog6ToothIcon as CogIcon,
    KeyIcon,
    XCircleIcon,
    DocumentDuplicateIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import StatsCard from "../components/StatsCard";
import { getApiError } from "../utils/errors";
import {
    fetchAdminOrders,
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
import { toast } from "react-hot-toast";

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
    const [search, setSearch] = useState("");
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
        } catch { toast.error("Failed to load orders"); }
        finally { setLoading(false); }
    }, [page, search, statusFilter, entityTypeFilter, productTypeFilter]);

    useEffect(() => { load(); }, [load]);

    const handleRescue = async () => {
        if (!rescueTarget) return;
        setActionLoading(true);
        try {
            await rescueOrder(rescueTarget.id);
            toast.success("Rescue triggered");
            setRescueTarget(null);
            load();
        } catch (err) {
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
            // Refresh credentials if still in modal
            const res = await fetchOrderCredentials(proxyConfigTarget.id);
            setProxyCreds(res.data);
        } catch (err) {
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
        } catch (err) {
            toast.error(getApiError(err, "Refund failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const openRefund = (row: OrderRow) => {
        setRefundTarget(row);
        setRefundMethod(row.payment_method && row.payment_method !== "balance" ? "original" : "wallet");
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
            key: "id", label: "Order", sortable: true,
            render: (row: OrderRow) => <span className="text-sm font-mono text-foreground">#{String(row.id).slice(0, 8)}</span>,
        },
        { key: "product_name", label: "Product", sortable: true },
        {
            key: "entity_name", label: "Customer",
            render: (row: OrderRow) => (
                <div>
                    <p className="text-sm text-foreground">{row.entity_name}</p>
                    <p className="text-xs text-muted-foreground">{row.entity_type}</p>
                </div>
            ),
        },
        { key: "total_amount", label: "Amount", sortable: true, render: (row: OrderRow) => <span className="text-sm font-medium">${Number(row.total_amount).toFixed(2)}</span> },
        {
            key: "payment_method", label: "Payment",
            render: (row: OrderRow) => (
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                    row.payment_method === "balance"
                        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        : "text-purple-400 bg-purple-500/10 border-purple-500/20"
                }`}>
                    {paymentLabel(row.payment_method)}
                </span>
            )
        },
        { key: "status", label: "Status", sortable: true, render: (row: OrderRow) => <StatusBadge status={row.status} /> },
        { key: "created_at", label: "Date", sortable: true, render: (row: OrderRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
    ];

    const statusTabs = [
        { key: "", label: "All", count: stats.total },
        { key: "active", label: "Active", count: stats.active, icon: CheckCircleIcon, color: "text-green-400" },
        { key: "pending", label: "Pending", count: stats.pending, icon: ClockIcon, color: "text-yellow-400" },
        { key: "failed", label: "Failed", count: stats.failed, icon: ExclamationCircleIcon, color: "text-red-400" },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Orders</h2>

            {/* Type Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { type: "proxy", label: "Proxy Orders", icon: ShoppingCartIcon, colors: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500", ring: "ring-purple-500/30" }, count: stats.by_type?.proxy || 0, revenue: stats.revenue_by_type?.proxy || 0 },
                    { type: "esim", label: "eSIM Orders", icon: DevicePhoneMobileIcon, colors: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500", ring: "ring-green-500/30" }, count: stats.by_type?.esim || 0, revenue: stats.revenue_by_type?.esim || 0 },
                    { type: "rdp", label: "RDP Orders", icon: ComputerDesktopIcon, colors: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500", ring: "ring-red-500/30" }, count: stats.by_type?.rdp || 0, revenue: stats.revenue_by_type?.rdp || 0 },
                    { type: "vps", label: "VPS Orders", icon: ServerIcon, colors: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500", ring: "ring-blue-500/30" }, count: stats.by_type?.vps || 0, revenue: stats.revenue_by_type?.vps || 0 },
                    { type: "vpn", label: "VPN Orders", icon: GlobeAltIcon, colors: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500", ring: "ring-cyan-500/30" }, count: stats.by_type?.vpn || 0, revenue: stats.revenue_by_type?.vpn || 0 },

                ].map((c) => {
                    const isActive = productTypeFilter === c.type;
                    return (
                        <button
                            key={c.type}
                            onClick={() => { setProductTypeFilter(isActive ? "" : c.type); setPage(1); }}
                            className={`bg-card rounded-xl p-4 flex items-center gap-3 text-left border transition-all ${isActive ? `${c.colors.border} ring-1 ${c.colors.ring}` : "border-border hover:border-muted-foreground/30"}`}
                        >
                            <div className={`p-3 ${c.colors.bg} rounded-xl shrink-0`}><c.icon className={`h-6 w-6 ${c.colors.text}`} /></div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground font-medium truncate">{c.label}</p>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-xl font-bold text-foreground">{c.count}</span>
                                    <span className="text-xs text-muted-foreground">${Number(c.revenue).toFixed(0)}</span>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Status Tabs & Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    {statusTabs.map(({ key, label, count, icon, color }) => (
                        <button
                            key={label}
                            onClick={() => { setStatusFilter(key); setPage(1); }}
                            className={`bg-card rounded-xl p-4 border transition-all text-left
                ${statusFilter === key ? "border-red-500 ring-1 ring-red-500/30" : "border-border hover:border-border"}`}
                        >
                            <div className="flex items-center justify-between">
                                {icon && <StatsCard title="" value="" icon={icon} loading={false} />}
                                <span className="text-2xl font-bold text-foreground">{count}</span>
                            </div>
                            <p className={`text-sm mt-1 ${color || "text-muted-foreground"}`}>{label}</p>
                        </button>
                    ))}
                </div>

                {/* Entity Filter */}
                <div className="shrink-0 flex items-start">
                    <select
                        value={entityTypeFilter}
                        onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
                        className="bg-card text-foreground border border-border rounded-xl text-sm px-4 py-3 h-full max-h-[104px] outline-none hover:border-muted-foreground/30 transition-colors"
                    >
                        <option value="">All Customers</option>
                        <option value="User">Users Only</option>
                        <option value="Reseller">Resellers Only</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns} data={orders} loading={loading}
                searchPlaceholder="Search orders..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                page={page} totalPages={Math.ceil(total / PER)} onPageChange={setPage} total={total}
                emptyMessage="No orders found"
                actions={(row: OrderRow) => (
                    <>
                        {(row.status === "failed" || row.status === "error") && (
                            <button onClick={() => setRescueTarget(row)} className="px-2.5 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-1">
                                <ArrowPathIcon className="h-3.5 w-3.5" /> Rescue
                            </button>
                        )}
                        {row.status !== "refunded" && (
                            <button onClick={() => openRefund(row)} className="px-2.5 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center gap-1">
                                <BanknotesIcon className="h-3.5 w-3.5" /> Refund
                            </button>
                        )}
                        {row.product_type === 'proxy' && row.status === 'active' && (
                            <button onClick={() => handleProxyModalOpen(row)} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1">
                                <CogIcon className="h-3.5 w-3.5" /> Proxy Config
                            </button>
                        )}
                    </>
                )}
            />

            {/* Rescue Modal */}
            {rescueTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setRescueTarget(null)}>
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-foreground">Rescue Order</h3>
                        <p className="text-sm text-muted-foreground">Re-provision order #{String(rescueTarget.id).slice(0, 8)}?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setRescueTarget(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                            <button onClick={handleRescue} disabled={actionLoading} className="px-4 py-2 text-sm bg-yellow-500 text-black font-medium rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                                {actionLoading ? "Rescuing..." : "Rescue"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {refundTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setRefundTarget(null); setRefundMethod("wallet"); }}>
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-foreground">Refund Order</h3>

                        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-medium text-foreground">${Number(refundTarget.total_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Customer</span>
                                <span className="text-foreground">{refundTarget.entity_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid Via</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    refundTarget.payment_method === "balance"
                                        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                        : "text-purple-400 bg-purple-500/10 border-purple-500/20"
                                }`}>
                                    {paymentLabel(refundTarget.payment_method)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Refund To</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setRefundMethod("wallet")}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${refundMethod === "wallet" ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "border-border text-muted-foreground hover:text-foreground"}`}
                                >
                                    Wallet
                                </button>
                                {refundTarget.payment_method && refundTarget.payment_method !== "balance" && (
                                    <button
                                        onClick={() => setRefundMethod("original")}
                                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${refundMethod === "original" ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "border-border text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Original ({paymentLabel(refundTarget.payment_method)})
                                    </button>
                                )}
                            </div>
                            {refundMethod === "original" && (
                                <p className="text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                    ⚠ Gateway refund will be attempted via {paymentLabel(refundTarget.payment_method)}. Manual crypto/plisio refunds require console.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => { setRefundTarget(null); setRefundMethod("wallet"); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                            <button onClick={handleRefund} disabled={actionLoading} className="px-4 py-2 text-sm bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
                                {actionLoading ? "Refunding..." : `Refund to ${refundMethod === "original" ? paymentLabel(refundTarget.payment_method) : "Wallet"}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Proxy Config Modal */}
            {proxyConfigTarget && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProxyConfigTarget(null)}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Proxy Management</h3>
                                <p className="text-xs text-muted-foreground mt-1">Order #{proxyConfigTarget.order_number} • {proxyConfigTarget.product_name}</p>
                            </div>
                            <button onClick={() => setProxyConfigTarget(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                <XCircleIcon className="h-7 w-7" />
                            </button>
                        </div>

                        <div className="flex border-b border-border bg-muted/10">
                            <button onClick={() => setModalSubTab('creds')} className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${modalSubTab === 'creds' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Credentials</button>
                            <button onClick={() => setModalSubTab('whitelist')} className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${modalSubTab === 'whitelist' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Whitelist</button>
                            <button onClick={() => setModalSubTab('protocol')} className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${modalSubTab === 'protocol' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Protocol & Advanced</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {proxyActionLoading && !proxyCreds ? (
                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                    <ArrowPathIcon className="h-8 w-8 animate-spin" />
                                    <p className="text-sm font-medium">Loading proxy details...</p>
                                </div>
                            ) : proxyCreds ? (
                                <div className="space-y-6">
                                    {modalSubTab === 'creds' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <KeyIcon className="h-4 w-4" /> Current Auth
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Username</label>
                                                            <div className="flex items-center gap-2">
                                                                <input className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm outline-none" value={newCreds.username} onChange={e => setNewCreds({...newCreds, username: e.target.value})} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Password</label>
                                                            <div className="flex items-center gap-2">
                                                                <input className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm outline-none" value={newCreds.password} onChange={e => setNewCreds({...newCreds, password: e.target.value})} />
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleProxyAction('update-creds')}
                                                            disabled={proxyActionLoading}
                                                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                                        >
                                                            Update Credentials
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <ArrowPathIcon className="h-4 w-4" /> Operations
                                                    </h4>
                                                    <div className="space-y-2">
                                                        <button 
                                                            onClick={() => handleProxyAction('rotate')}
                                                            disabled={proxyActionLoading}
                                                            className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                                        >
                                                            <ArrowPathIcon className={`h-4 w-4 ${proxyActionLoading ? 'animate-spin' : ''}`} /> Force IP Rotation
                                                        </button>
                                                        <button 
                                                            onClick={() => handleProxyAction('renew')}
                                                            disabled={proxyActionLoading}
                                                            className="w-full py-3 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            <ClockIcon className="h-4 w-4" /> Renew (1 Month)
                                                        </button>
                                                        <button 
                                                            onClick={() => handleProxyAction('reorder')}
                                                            disabled={proxyActionLoading}
                                                            className="w-full py-3 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            <ArrowPathIcon className="h-4 w-4" /> Reorder Product
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {proxyCreds.ip && (
                                                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                                    <h4 className="text-sm font-bold uppercase mb-3 text-muted-foreground">Proxy Details</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase">IP</p>
                                                            <p className="text-sm font-medium">{proxyCreds.ip}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase">Port</p>
                                                            <p className="text-sm font-medium">{proxyCreds.port}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase">Protocol</p>
                                                            <p className="text-sm font-medium uppercase">{proxyCreds.protocol}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => copyToClipboard(`${proxyCreds.ip}:${proxyCreds.port}:${newCreds.username}:${newCreds.password}`)} className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium">
                                                                <DocumentDuplicateIcon className="h-4 w-4" /> Copy All
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {modalSubTab === 'whitelist' && (
                                        <div className="space-y-4">
                                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                                <h4 className="text-sm font-bold uppercase mb-4 text-muted-foreground">Whitelisted IPs</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                                    {proxyConfigTarget.proxy_details?.whitelist_ips?.length ? (
                                                        proxyConfigTarget.proxy_details.whitelist_ips.map((ip: string) => (
                                                            <div key={ip} className="bg-background border border-border p-2 rounded-lg flex justify-between items-center group">
                                                                <span className="text-sm font-mono">{ip}</span>
                                                                <button onClick={() => handleProxyAction('whitelist-delete', ip)} className="text-destructive opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all">
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="col-span-full text-center py-4 text-sm text-muted-foreground italic">No IPs whitelisted.</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" 
                                                        placeholder="Add IP (e.g. 1.2.3.4)" 
                                                        value={newIp}
                                                        onChange={e => setNewIp(e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={() => handleProxyAction('whitelist-add')}
                                                        disabled={proxyActionLoading || !newIp}
                                                        className="bg-primary px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                                                    >
                                                        Add IP
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {modalSubTab === 'protocol' && (
                                        <div className="space-y-6">
                                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                                <h4 className="text-sm font-bold uppercase mb-4 text-muted-foreground">Select Protocol</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button 
                                                        onClick={() => handleProxyAction('change-protocol', 'http')}
                                                        className={`p-4 rounded-xl border-2 transition-all text-center ${proxyCreds.protocol === 'http' ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                                                    >
                                                        <p className="font-bold">HTTP/S</p>
                                                        <p className="text-[10px] text-muted-foreground">Standard web traffic</p>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleProxyAction('change-protocol', 'socks5')}
                                                        className={`p-4 rounded-xl border-2 transition-all text-center ${proxyCreds.protocol === 'socks5' ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                                                    >
                                                        <p className="font-bold">SOCKS5</p>
                                                        <p className="text-[10px] text-muted-foreground">UDP & TCP traffic</p>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        
                        <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground italic">Changes affect the live proxy configuration.</span>
                            <button onClick={() => setProxyConfigTarget(null)} className="px-5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
