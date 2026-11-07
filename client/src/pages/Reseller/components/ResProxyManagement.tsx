import { useState, useEffect } from "react";
import { getApiError } from "@/utils/apiError";
import { CalendarClock, Copy, Eye, Globe, KeyRound, RefreshCw, Shield, Trash2 } from "lucide-react";
import {
    fetchResellerOrders,
    rotateProxyIp,
    renewResellerOrder,
    updateProxyCredentials,
    changeProxyProtocol,
    whitelistAdd,
    whitelistDelete
} from "@/services/resellerApi";
import resellerApi from "@/services/resellerApi";
import { toast } from "sonner";
import ManageSubscriptionModal from "@/components/dashboard/ManageSubscriptionModal";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";
import WorkspaceDialog from "../../SuperAdmin/components/WorkspaceDialog";
import ServiceCard, { ServiceGrid } from "../../SuperAdmin/components/ServiceCard";

const DIALOG_TABS = [
    { id: "details", label: "Details" },
    { id: "credentials", label: "Credentials" },
    { id: "whitelist", label: "Whitelist" },
    { id: "protocol", label: "Protocol" },
] as const;

interface ProxyOrder {
    id: string;
    order_id: string;
    product_name: string;
    product_type: 'datacenter' | 'isp' | 'premium-isp' | 'static-residential' | 'residential-rotating' | 'mobile' | 'global-isp';
    status: 'active' | 'expired' | 'pending' | 'cancelled';
    period: number;
    protocol: 'http' | 'socks5';
    locations: string[];
    credentials: {
        username: string;
        password: string;
        endpoints: string[];
    };
    whitelist_ips: string[];
    expires_at: string;
    created_at: string;
    traffic_used?: number;
    traffic_limit?: number;
    auto_renew?: boolean;
    renewal_method?: string;
}

export default function ResProxyManagement() {
    const [proxyOrders, setProxyOrders] = useState<ProxyOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<ProxyOrder | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'details' | 'credentials' | 'whitelist' | 'protocol' | 'extend'>('details');
    const [actionLoading, setActionLoading] = useState(false);
    const [newCreds, setNewCreds] = useState({ username: '', password: '' });
    const [newProtocol, setNewProtocol] = useState<'http' | 'socks5'>('http');
    const [newIp, setNewIp] = useState('');
    const [subscriptionOrder, setSubscriptionOrder] = useState<ProxyOrder | null>(null);

    useEffect(() => {
        fetchProxyData();
    }, []);

    const fetchProxyData = async () => {
        setLoading(true);
        try {
            const response = await fetchResellerOrders({ product_type: 'proxy' });
            if (response.data && response.data.orders) {
                const transformedOrders = response.data.orders.map((order: any) => ({
                    id: String(order.id),
                    order_id: order.order_number,
                    product_name: order.product_name,
                    product_type: order.proxy_type || 'datacenter',
                    status: (order.status === 'completed' || order.status === 'active') ? 'active' : order.status,
                    period: 1,
                    protocol: order.proxy_details?.protocol || 'http',
                    locations: order.country ? [order.country] : [],
                    credentials: order.credentials || {},
                    whitelist_ips: order.proxy_details?.whitelist_ips || [],
                    expires_at: order.expires_at || order.created_at,
                    created_at: order.created_at,
                    traffic_used: order.proxy_details?.traffic_used,
                    traffic_limit: order.bandwidth_gb,
                }));
                setProxyOrders(transformedOrders);
            }
        } catch (error) {
            toast.error(getApiError(error, "Failed to load proxy orders"));
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success('Copied!');
    };

    const openModal = (type: typeof modalType, order?: ProxyOrder) => {
        setModalType(type);
        if (order) {
            setSelectedOrder(order);
            setNewCreds({ username: order.credentials.username, password: order.credentials.password });
            setNewProtocol(order.protocol);
        } else {
            setSelectedOrder(null);
        }
        setShowModal(true);
    };

    const handleProxyAction = async (action: string, data?: string) => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            switch (action) {
                case 'rotate':
                    await rotateProxyIp(selectedOrder.id);
                    toast.success('IP replacement triggered');
                    break;
                case 'extend':
                    await renewResellerOrder(selectedOrder.id);
                    toast.success('Order extended successfully');
                    break;
                case 'update-creds':
                    await updateProxyCredentials(selectedOrder.id, newCreds);
                    toast.success('Credentials updated');
                    break;
                case 'change-protocol':
                    await changeProxyProtocol(selectedOrder.id, newProtocol);
                    toast.success('Protocol updated');
                    break;
                case 'whitelist-add':
                    if (!newIp) return;
                    await whitelistAdd(selectedOrder.id, newIp);
                    toast.success('IP added to whitelist');
                    setNewIp('');
                    break;
                case 'whitelist-delete':
                    if (!data) return;
                    await whitelistDelete(selectedOrder.id, data);
                    toast.success('IP removed');
                    break;
            }
            fetchProxyData();
            if (action !== 'whitelist-add' && action !== 'whitelist-delete') {
                setShowModal(false);
            }
        } catch (err: any) {
            toast.error(getApiError(err, "Action failed"));
        } finally {
            setActionLoading(false);
        }
    };

    // Keep the open dialog in sync after whitelist or credential changes reload the list.
    useEffect(() => { setSelectedOrder(prev => (prev ? proxyOrders.find(o => o.id === prev.id) ?? prev : prev)); }, [proxyOrders]);

    const active = proxyOrders.filter(o => o.status === "active").length;

    return (
        <div className="ws-stack">
            <PageHeader
                title="Proxies"
                description="Manage your reseller proxy pool."
                actions={<button type="button" onClick={fetchProxyData} disabled={loading} aria-label="Refresh" title="Refresh" className="ws-icon-button"><RefreshCw className={loading ? "animate-spin" : ""} /></button>}
            />

            {!loading && proxyOrders.length > 0 && (
                <div className="proxy-summary" style={{ marginBottom: 0 }}>
                    <span><strong>{proxyOrders.length}</strong> Proxy orders</span>
                    <span><strong>{active}</strong> Active</span>
                </div>
            )}

            <ServiceGrid loading={loading} empty={proxyOrders.length === 0} emptyIcon={Globe} emptyTitle="No proxies yet" emptyText="Proxies you order appear here with their credentials and endpoints.">
                {proxyOrders.map((order) => (
                    <ServiceCard
                        key={order.id}
                        icon={Globe}
                        kind="Proxy"
                        status={order.status}
                        title={order.product_name}
                        subtitle={`#${order.order_id}`}
                        facts={[
                            { label: "Protocol", value: order.protocol.toUpperCase() },
                            { label: "Location", value: order.locations[0] || "Global" },
                            { label: "Endpoints", value: order.credentials.endpoints?.length || 0 },
                            { label: "Expires", value: new Date(order.expires_at).toLocaleDateString() },
                        ]}
                        actions={<>
                            <button type="button" onClick={() => openModal("details", order)}><Eye size={14} aria-hidden="true" /> Details</button>
                            <button type="button" onClick={() => openModal("credentials", order)}><KeyRound size={14} aria-hidden="true" /> Credentials</button>
                            <button type="button" onClick={() => openModal("whitelist", order)}><Shield size={14} aria-hidden="true" /> Whitelist</button>
                            <button type="button" onClick={() => setSubscriptionOrder(order)}><CalendarClock size={14} aria-hidden="true" /> Renewal</button>
                        </>}
                    />
                ))}
            </ServiceGrid>

            {selectedOrder && (
                <WorkspaceDialog
                    open={showModal}
                    onClose={() => { if (!actionLoading) setShowModal(false); }}
                    title={selectedOrder.product_name}
                    description={`Order #${selectedOrder.order_id}`}
                >
                    <div className="ws-tabs" role="group" aria-label="Proxy settings" style={{ marginBottom: 20 }}>
                        {DIALOG_TABS.map(t => <button type="button" key={t.id} aria-pressed={modalType === t.id} onClick={() => setModalType(t.id)}>{t.label}</button>)}
                    </div>

                    {modalType === "details" && (
                        <div className="grid gap-5">
                            <dl className="ws-rows">
                                <div><dt>Status</dt><dd><span className="overview-status" data-status={selectedOrder.status}>{selectedOrder.status}</span></dd></div>
                                <div><dt>Protocol</dt><dd>{selectedOrder.protocol.toUpperCase()}</dd></div>
                                <div><dt>Location</dt><dd>{selectedOrder.locations[0] || "Global"}</dd></div>
                                <div><dt>Expires</dt><dd>{new Date(selectedOrder.expires_at).toLocaleDateString()}</dd></div>
                            </dl>
                            <div>
                                <p className="ws-label">Endpoints ({selectedOrder.credentials.endpoints?.length || 0})</p>
                                {selectedOrder.credentials.endpoints?.length ? (
                                    <div className="grid gap-2" style={{ maxHeight: 240, overflowY: "auto" }}>
                                        {selectedOrder.credentials.endpoints.map(ep => (
                                            <div className="proxy-endpoint" key={ep} style={{ marginTop: 0 }}>
                                                <code>{ep}</code>
                                                <button type="button" onClick={() => copyToClipboard(ep)} aria-label={`Copy endpoint ${ep}`}><Copy size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="ws-muted text-xs">No endpoints yet.</p>}
                            </div>
                        </div>
                    )}

                    {modalType === "credentials" && (
                        <div className="grid gap-5">
                            <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); handleProxyAction("update-creds"); }}>
                                <div className="ws-field">
                                    <label htmlFor="px-username">Username</label>
                                    <div className="flex gap-2">
                                        <input id="px-username" className="ws-input" value={newCreds.username} onChange={e => setNewCreds({ ...newCreds, username: e.target.value })} />
                                        <button type="button" className="ws-icon-button" onClick={() => copyToClipboard(newCreds.username)} aria-label="Copy username"><Copy /></button>
                                    </div>
                                </div>
                                <div className="ws-field">
                                    <label htmlFor="px-password">Password</label>
                                    <div className="flex gap-2">
                                        <input id="px-password" type="password" autoComplete="new-password" className="ws-input" value={newCreds.password} onChange={e => setNewCreds({ ...newCreds, password: e.target.value })} />
                                        <button type="button" className="ws-icon-button" onClick={() => copyToClipboard(newCreds.password)} aria-label="Copy password"><Copy /></button>
                                    </div>
                                </div>
                                <div><Button type="submit" loading={actionLoading}>Update credentials</Button></div>
                            </form>
                            <div className="grid gap-3" style={{ borderTop: "1px solid var(--ov-line)", paddingTop: 20 }}>
                                <p className="ws-label" style={{ margin: 0 }}>IP replacement</p>
                                <p className="ws-callout">This replaces the current proxy IP. Some providers charge for replacements or apply a cooldown.</p>
                                <div><Button variant="secondary" onClick={() => handleProxyAction("rotate")} loading={actionLoading}><RefreshCw aria-hidden="true" /> Rotate IP</Button></div>
                            </div>
                        </div>
                    )}

                    {modalType === "whitelist" && (
                        <div className="grid gap-5">
                            {selectedOrder.whitelist_ips?.length > 0 ? (
                                <div className="ws-list">
                                    {selectedOrder.whitelist_ips.map(ip => (
                                        <div key={ip}>
                                            <code className="ws-mono" style={{ color: "var(--ov-text)" }}>{ip}</code>
                                            <button type="button" className="ws-icon-button" onClick={() => handleProxyAction("whitelist-delete", ip)} disabled={actionLoading} aria-label={`Remove ${ip}`}><Trash2 /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="ws-muted text-xs">No IPs whitelisted.</p>}
                            <form className="ws-field" onSubmit={(e) => { e.preventDefault(); handleProxyAction("whitelist-add"); }}>
                                <label htmlFor="px-ip">Add IP address</label>
                                <div className="flex gap-2">
                                    <input id="px-ip" className="ws-input" placeholder="203.0.113.10" value={newIp} onChange={e => setNewIp(e.target.value)} />
                                    <Button type="submit" disabled={actionLoading || !newIp}>Add</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {modalType === "protocol" && (
                        <div className="grid gap-5">
                            <div className="ws-options" role="group" aria-label="Proxy protocol">
                                <button type="button" className="ws-option" aria-pressed={newProtocol === "http"} onClick={() => setNewProtocol("http")}><span>HTTP/S</span><small>Standard web traffic.</small></button>
                                <button type="button" className="ws-option" aria-pressed={newProtocol === "socks5"} onClick={() => setNewProtocol("socks5")}><span>SOCKS5</span><small>TCP/UDP tunnelling.</small></button>
                            </div>
                            <div><Button onClick={() => handleProxyAction("change-protocol")} loading={actionLoading} disabled={newProtocol === selectedOrder.protocol}>Change protocol</Button></div>
                        </div>
                    )}

                    {modalType === "extend" && (
                        <div className="grid gap-5">
                            <dl className="ws-rows">
                                <div><dt>Product</dt><dd>{selectedOrder.product_name}</dd></div>
                                <div><dt>Current expiry</dt><dd>{new Date(selectedOrder.expires_at).toLocaleDateString()}</dd></div>
                            </dl>
                            <p className="ws-callout">The renewal is charged to your reseller balance.</p>
                            <div><Button onClick={() => handleProxyAction("extend")} loading={actionLoading}>Extend order</Button></div>
                        </div>
                    )}
                </WorkspaceDialog>
            )}

            <ManageSubscriptionModal
                isOpen={!!subscriptionOrder}
                onClose={() => setSubscriptionOrder(null)}
                orderId={subscriptionOrder?.id || ''}
                autoRenew={!!subscriptionOrder?.auto_renew}
                renewalMethod={subscriptionOrder?.renewal_method || 'wallet'}
                expiresAt={subscriptionOrder?.expires_at || ''}
                onUpdate={fetchProxyData}
                api={resellerApi}
                apiPrefix=""
            />
        </div>
    );
}
