import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ArrowPathIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    GlobeAltIcon,
    Cog6ToothIcon as CogIcon,
    KeyIcon,
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
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import WorkspaceDialog from "../components/WorkspaceDialog";
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

    const productIcon = (type: string) => type === 'rdp' ? Monitor : type === 'vps' ? Server : type === 'esim' ? Smartphone : type === 'vpn' ? ShieldCheck : Globe;
    const columns = [
        {
            key: "id", label: "Order", sortable: true,
            render: (row: OrderRow) => <span className="ws-mono">#{String(row.id).slice(0, 8)}</span>,
        },
        {
            key: "product_name", label: "Product", sortable: true,
            render: (row: OrderRow) => {
                const Icon = productIcon(row.product_type);
                return <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-[var(--ov-accent)]" aria-hidden="true" /><strong>{row.product_name}</strong></span>;
            },
        },
        {
            key: "entity_name", label: "Customer",
            render: (row: OrderRow) => (
                <div>
                    <strong className="block">{row.entity_name}</strong>
                    <span className="ws-mono">{row.entity_type} · {row.entity_email}</span>
                </div>
            ),
        },
        {
            key: "total_amount", label: "Amount", sortable: true,
            render: (row: OrderRow) => (
                <div className="tabular-nums">
                    <strong className="block">${Number(row.total_amount).toFixed(2)}</strong>
                    <span className="ws-mono">{paymentLabel(row.payment_method)}</span>
                </div>
            ),
        },
        { key: "status", label: "Status", sortable: true, render: (row: OrderRow) => <StatusBadge status={row.status} /> },
        {
            key: "created_at", label: "Date", sortable: true,
            render: (row: OrderRow) => (
                <time className="whitespace-nowrap text-[var(--ov-muted)]" dateTime={row.created_at}>
                    {new Date(row.created_at).toLocaleDateString()}<span className="block ws-mono">{new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </time>
            ),
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

    const statusCounts: Record<string, number> = { active: stats.active, pending: stats.pending, failed: stats.failed, processing: stats.processing };

    return (
        <div className="ws-stack">
            <PageHeader
                title="Orders"
                description="Monitor and manage every order across the platform."
                actions={<>
                    <Button onClick={openCreate}><PlusIcon aria-hidden="true" />New order</Button>
                    <button type="button" className="overview-icon-button" onClick={() => load()} disabled={loading} aria-label="Refresh orders"><ArrowPathIcon className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" /></button>
                </>}
            />

            <div className="overview-metrics" style={{ gridTemplateColumns: "repeat(5,minmax(0,1fr))", marginBottom: 0 }}>
                <div className="overview-metric">
                    <span>Total orders<ShoppingCart size={16} aria-hidden="true" /></span>
                    <strong>{stats.total}</strong>
                    <small>{Math.round(stats.active / stats.total * 100) || 0}% active</small>
                </div>
                {statuses.map(s => (
                    <button type="button" key={s.id} className="overview-metric text-left" aria-pressed={statusFilter === s.id}
                        onClick={() => { setStatusFilter(statusFilter === s.id ? "" : s.id); setPage(1); }}
                        style={statusFilter === s.id ? { background: "var(--ov-wash)", boxShadow: "inset 0 -2px 0 var(--ov-accent)" } : undefined}>
                        <span>{s.label}<s.icon className="h-4 w-4" aria-hidden="true" /></span>
                        <strong>{statusCounts[s.id]}</strong>
                        <small>{statusFilter === s.id ? "Filtering · click to clear" : "Click to filter"}</small>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="ws-tabs" role="group" aria-label="Product type">
                    <button type="button" aria-pressed={productTypeFilter === ""} onClick={() => { setProductTypeFilter(""); setPage(1); }}>All orders</button>
                    {productTypes.map(t => (
                        <button type="button" key={t.id} aria-pressed={productTypeFilter === t.id} onClick={() => { setProductTypeFilter(t.id); setPage(1); }}>
                            <t.icon aria-hidden="true" />{t.label}<span className="ws-count">{stats.by_type[t.id] || 0}</span>
                        </button>
                    ))}
                </div>
                <ManagementFilters entityType={entityTypeFilter} onEntityTypeChange={(t) => { setEntityTypeFilter(t); setPage(1); }} />
            </div>

            <section className="ws-stack" aria-label="Order list">
                <div className="ws-toolbar" style={{ marginBottom: 0 }}>
                    <label className="ws-search">
                        <span className="sr-only">Search orders</span>
                        <MagnifyingGlassIcon aria-hidden="true" />
                        <input type="search" placeholder="Search by order ID, customer or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </label>
                    <span className="inline-flex items-center gap-2 text-[11px] text-[var(--ov-muted)]"><ArrowsUpDownIcon className="h-4 w-4" aria-hidden="true" />Latest first</span>
                </div>

                <DataTable
                    columns={columns} data={orders} loading={loading}
                    page={page} totalPages={Math.ceil(total / PER)} onPageChange={setPage} total={total}
                    emptyMessage="No orders match your current filters."
                    actions={(row: OrderRow) => (
                        <>
                            <button type="button" className="ws-icon-button" onClick={() => openDetail(row)} title="View or edit order" aria-label="View or edit order"><EyeIcon aria-hidden="true" /></button>
                            {(row.status === "failed" || row.status === "error") && (
                                <button type="button" className="ws-icon-button" onClick={() => setRescueTarget(row)} title="Rescue order" aria-label="Rescue order"><ArrowPathIcon aria-hidden="true" /></button>
                            )}
                            {row.status !== "refunded" && (
                                <button type="button" className="ws-icon-button" onClick={() => openRefund(row)} title="Issue refund" aria-label="Issue refund"><BanknotesIcon aria-hidden="true" /></button>
                            )}
                            {row.product_type === 'proxy' && row.status === 'active' && (
                                <button type="button" className="ws-icon-button" onClick={() => handleProxyModalOpen(row)} title="Proxy settings" aria-label="Proxy settings"><CogIcon aria-hidden="true" /></button>
                            )}
                            {row.status !== "cancelled" && row.status !== "refunded" && (
                                <button type="button" className="ws-icon-button" onClick={() => { setCancelTarget(row); setCancelDeprovision(false); }} title="Cancel order" aria-label="Cancel order"><TrashIcon aria-hidden="true" /></button>
                            )}
                        </>
                    )}
                />
            </section>

            <WorkspaceDialog
                open={Boolean(rescueTarget)}
                onClose={() => setRescueTarget(null)}
                title="Rescue order?"
                footer={<>
                    <Button variant="secondary" onClick={() => setRescueTarget(null)}>Cancel</Button>
                    <Button onClick={handleRescue} loading={actionLoading}>{actionLoading ? "Processing…" : "Rescue now"}</Button>
                </>}
            >
                <p>This tries to provision order <span className="ws-mono">#{String(rescueTarget?.id ?? "").slice(0, 8)}</span> again. Use it for stuck or failed orders.</p>
            </WorkspaceDialog>

            <WorkspaceDialog
                open={Boolean(refundTarget)}
                onClose={() => { setRefundTarget(null); setRefundMethod("wallet"); }}
                title={`Refund $${Number(refundTarget?.total_amount ?? 0).toFixed(2)}`}
                description="Choose where the money goes back to."
                footer={<>
                    <Button variant="secondary" onClick={() => setRefundTarget(null)}>Discard</Button>
                    <Button onClick={handleRefund} loading={actionLoading}>{actionLoading ? "Processing…" : "Confirm refund"}</Button>
                </>}
            >
                {refundTarget && <>
                    <dl className="ws-rows">
                        <div><dt>Customer</dt><dd>{refundTarget.entity_name}</dd></div>
                        <div><dt>Payment method</dt><dd>{paymentLabel(refundTarget.payment_method)}</dd></div>
                    </dl>
                    <div className="ws-options" role="group" aria-label="Refund destination">
                        <button type="button" className="ws-option" aria-pressed={refundMethod === "wallet"} onClick={() => setRefundMethod("wallet")}>
                            <BanknotesIcon aria-hidden="true" /><strong>Customer wallet</strong><small>Credit the balance instantly.</small>
                        </button>
                        {refundTarget.payment_method && refundTarget.payment_method !== "balance" && (
                            <button type="button" className="ws-option" aria-pressed={refundMethod === "original"} onClick={() => setRefundMethod("original")}>
                                <GlobeAltIcon aria-hidden="true" /><strong>Original gateway</strong><small>Send it back through {paymentLabel(refundTarget.payment_method)}.</small>
                            </button>
                        )}
                    </div>
                    {refundMethod === "original" && (
                        <p className="ws-callout">Gateway refunds go through {paymentLabel(refundTarget.payment_method)}. Card and bank refunds are automatic; crypto refunds must be claimed manually.</p>
                    )}
                </>}
            </WorkspaceDialog>

            <WorkspaceDialog
                open={Boolean(proxyConfigTarget)}
                onClose={() => setProxyConfigTarget(null)}
                wide tall
                title="Proxy settings"
                description={proxyConfigTarget && <><span className="ws-mono">#{proxyConfigTarget.order_number}</span> · {proxyConfigTarget.product_name}</>}
                footer={<>
                    <span className="mr-auto self-center text-[10px] text-[var(--ov-muted)]">Changes can briefly reset open connections.</span>
                    <Button variant="secondary" onClick={() => setProxyConfigTarget(null)}>Close</Button>
                </>}
            >
                <div className="ws-tabs" role="group" aria-label="Proxy settings section">
                    {[
                        { id: 'creds', label: 'Access', icon: KeyIcon },
                        { id: 'whitelist', label: 'IP whitelist', icon: ShieldCheckIcon },
                        { id: 'protocol', label: 'Protocol', icon: GlobeAltIcon },
                    ].map(tab => (
                        <button type="button" key={tab.id} aria-pressed={modalSubTab === tab.id} onClick={() => setModalSubTab(tab.id as any)}><tab.icon aria-hidden="true" />{tab.label}</button>
                    ))}
                </div>
                {proxyActionLoading && !proxyCreds ? (
                    <div className="ws-empty"><span className="ws-empty-mark"><ArrowPathIcon className="animate-spin" aria-hidden="true" /></span><h3>Loading proxy details…</h3></div>
                ) : proxyCreds ? (
                    <>
                        {modalSubTab === 'creds' && (
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="grid gap-3">
                                    <h4 className="ws-section-title">Credentials</h4>
                                    <div className="ws-field"><label htmlFor="proxy-username">Username</label><input id="proxy-username" className="ws-input" value={newCreds.username} onChange={e => setNewCreds({ ...newCreds, username: e.target.value })} /></div>
                                    <div className="ws-field"><label htmlFor="proxy-password">Password</label><input id="proxy-password" className="ws-input" value={newCreds.password} onChange={e => setNewCreds({ ...newCreds, password: e.target.value })} /></div>
                                    <Button onClick={() => handleProxyAction('update-creds')} disabled={proxyActionLoading}>Save credentials</Button>
                                </div>
                                <div className="grid content-start gap-3">
                                    <h4 className="ws-section-title">Quick actions</h4>
                                    <button type="button" className="ws-option" onClick={() => handleProxyAction('rotate')} disabled={proxyActionLoading}><ArrowPathIcon aria-hidden="true" /><strong>Rotate IP</strong><small>Request a new IP now.</small></button>
                                    <button type="button" className="ws-option" onClick={() => handleProxyAction('renew')}><ClockIcon aria-hidden="true" /><strong>Renew</strong><small>Add 30 days to the expiry.</small></button>
                                </div>
                                <div className="ws-panel md:col-span-2" style={{ padding: 18 }}>
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <dl className="ws-facts" style={{ gridTemplateColumns: "auto auto", gap: "0 32px" }}>
                                            <div><dt>Endpoint</dt><dd className="font-mono">{proxyCreds.ip}:{proxyCreds.port}</dd></div>
                                            <div><dt>Protocol</dt><dd className="uppercase">{proxyCreds.protocol}</dd></div>
                                        </dl>
                                        <Button variant="secondary" onClick={() => copyToClipboard(`${proxyCreds.ip}:${proxyCreds.port}:${newCreds.username}:${newCreds.password}`)}><DocumentDuplicateIcon aria-hidden="true" />Copy access line</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalSubTab === 'whitelist' && (
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="ws-section-title">Allowed IPs</h4>
                                    <span className="ws-status">{proxyConfigTarget?.proxy_details?.whitelist_ips?.length || 0} / 10 used</span>
                                </div>
                                <div className="ws-list">
                                    {proxyConfigTarget?.proxy_details?.whitelist_ips?.map((ip: string) => (
                                        <div key={ip}>
                                            <span className="inline-flex items-center gap-2 font-mono"><ShieldCheckIcon className="h-4 w-4 text-[var(--ov-accent)]" aria-hidden="true" />{ip}</span>
                                            <button type="button" className="ws-icon-button" onClick={() => handleProxyAction('whitelist-delete', ip)} aria-label={`Remove ${ip}`}><TrashIcon aria-hidden="true" /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <label className="sr-only" htmlFor="whitelist-ip">IPv4 address</label>
                                    <input id="whitelist-ip" className="ws-input font-mono" placeholder="IPv4 address" value={newIp} onChange={e => setNewIp(e.target.value)} />
                                    <Button onClick={() => handleProxyAction('whitelist-add')} disabled={proxyActionLoading || !newIp}>Allow</Button>
                                </div>
                                <p className="ws-field-hint">Changes can take up to 60 seconds to apply.</p>
                            </div>
                        )}

                        {modalSubTab === 'protocol' && (
                            <div className="ws-options" role="group" aria-label="Protocol">
                                <button type="button" className="ws-option" aria-pressed={proxyCreds.protocol === 'http'} onClick={() => handleProxyAction('change-protocol', 'http')}>
                                    <GlobeAltIcon aria-hidden="true" /><strong>HTTP / HTTPS</strong><small>For browsers and standard scrapers.</small>{proxyCreds.protocol === 'http' && <span className="ws-status" data-tone="good">Current</span>}
                                </button>
                                <button type="button" className="ws-option" aria-pressed={proxyCreds.protocol === 'socks5'} onClick={() => handleProxyAction('change-protocol', 'socks5')}>
                                    <ShieldCheckIcon aria-hidden="true" /><strong>SOCKS5</strong><small>UDP support and proxy chaining.</small>{proxyCreds.protocol === 'socks5' && <span className="ws-status" data-tone="good">Current</span>}
                                </button>
                            </div>
                        )}
                    </>
                ) : null}
            </WorkspaceDialog>

            <WorkspaceDialog
                open={Boolean(detailId)}
                onClose={() => { setDetailId(null); setEditMode(false); }}
                wide tall
                title={`Order #${detail?.order_number || (detailId ? String(detailId).slice(0, 8) : "")}`}
                description={detail && <StatusBadge status={detail.status} />}
                headerActions={detail && !editMode && <Button variant="secondary" size="sm" onClick={startEdit}><PencilSquareIcon aria-hidden="true" />Edit</Button>}
                footer={editMode && <>
                    <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} loading={actionLoading}>{actionLoading ? "Saving…" : "Save changes"}</Button>
                </>}
            >
                {detailLoading || !detail ? (
                    <div className="ws-empty"><h3>Loading…</h3></div>
                ) : editMode ? (
                    <div className="grid gap-4">
                        <p className="ws-callout">Direct edit: status and amount are saved as entered. Nothing is provisioned, refunded or torn down.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="ws-field"><label htmlFor="edit-status">Status</label>
                                <select id="edit-status" className="ws-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                    {["pending", "awaiting_payment", "processing", "active", "expired", "cancelled", "failed", "refunded"].map((st) => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                            <div className="ws-field"><label htmlFor="edit-quantity">Quantity</label><input id="edit-quantity" className="ws-input" type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} /></div>
                            <div className="ws-field"><label htmlFor="edit-total">Total amount</label><input id="edit-total" className="ws-input" type="number" step="0.01" value={editForm.total_amount} onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })} /></div>
                            <div className="ws-field"><label htmlFor="edit-currency">Currency</label><input id="edit-currency" className="ws-input" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} /></div>
                            <div className="ws-field col-span-2"><label htmlFor="edit-expires">Expires at</label><input id="edit-expires" className="ws-input" type="datetime-local" value={editForm.expires_at} onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })} /></div>
                            <div className="ws-field col-span-2"><label htmlFor="edit-metadata">Metadata (JSON)</label><textarea id="edit-metadata" className="ws-input font-mono" rows={8} value={editForm.metadata} onChange={(e) => setEditForm({ ...editForm, metadata: e.target.value })} /></div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <DetailGrid items={[
                            ["Product", `${detail.product?.name} (${detail.product?.type})`],
                            ["Total", `$${Number(detail.total_amount).toFixed(2)} ${detail.currency || ""}`],
                            ["Quantity", detail.quantity],
                            ["Payment", paymentLabel(detail.payment_method)],
                            ["Provider order ID", detail.provider_order_id || "—"],
                            ["Created", new Date(detail.created_at).toLocaleString()],
                            ["Expires", detail.expires_at ? new Date(detail.expires_at).toLocaleString() : "—"],
                        ]} />
                        <Section title="Customer">
                            <DetailGrid items={[["Name", detail.customer?.name], ["Email", detail.customer?.email], ["Type", detail.customer?.type]]} />
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
                                <div className="ws-list">
                                    {detail.timeline.map((t: any, i: number) => (
                                        <div key={i}><span className="font-mono">{t.action}</span><span className="text-[var(--ov-muted)]">{new Date(t.created_at).toLocaleString()}</span></div>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>
                )}
            </WorkspaceDialog>

            <WorkspaceDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="New order"
                description="Provisions straight away and emails the credentials to the customer."
                footer={<>
                    <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} loading={actionLoading}>{actionLoading ? "Creating…" : "Create and provision"}</Button>
                </>}
            >
                <div className="ws-field"><label htmlFor="create-product">Product</label>
                    {products.length > 0 ? (
                        <select id="create-product" className="ws-input" value={createForm.product_id} onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })}>
                            <option value="">Select a product…</option>
                            {products.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                        </select>
                    ) : (
                        <input id="create-product" className="ws-input" value={createForm.product_id} onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })} placeholder="Product ID" />
                    )}
                </div>
                <div className="ws-field"><label htmlFor="create-email">Customer email</label><input id="create-email" className="ws-input" type="email" value={createForm.customer_email} onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })} placeholder="customer@example.com" /></div>
                <div className="ws-field"><label htmlFor="create-quantity">Quantity</label><input id="create-quantity" className="ws-input" type="number" min={1} value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })} /></div>
                <div className="ws-field"><label htmlFor="create-metadata">Metadata (JSON, optional)</label><textarea id="create-metadata" className="ws-input font-mono" rows={3} value={createForm.metadata} onChange={(e) => setCreateForm({ ...createForm, metadata: e.target.value })} /></div>
            </WorkspaceDialog>

            <WorkspaceDialog
                open={Boolean(cancelTarget)}
                onClose={() => setCancelTarget(null)}
                title="Cancel order?"
                footer={<>
                    <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep order</Button>
                    <Button variant="danger" onClick={handleCancelOrder} loading={actionLoading}>{actionLoading ? "Cancelling…" : "Cancel order"}</Button>
                </>}
            >
                <p>Order <span className="ws-mono">#{String(cancelTarget?.id ?? "").slice(0, 8)}</span> will be marked cancelled. The record stays for history and accounting.</p>
                <label className="ws-check"><input type="checkbox" checked={cancelDeprovision} onChange={(e) => setCancelDeprovision(e.target.checked)} />Also flag its provisioned resources for teardown</label>
            </WorkspaceDialog>
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="grid gap-3">
            <h4 className="ws-section-title">{title}</h4>
            {children}
        </section>
    );
}

function DetailGrid({ items }: { items: [string, ReactNode][] }) {
    return (
        <dl className="ws-facts">
            {items.map(([label, value], i) => (
                <div key={i}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>
            ))}
        </dl>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return <pre className="ws-code">{JSON.stringify(value, null, 2)}</pre>;
}
