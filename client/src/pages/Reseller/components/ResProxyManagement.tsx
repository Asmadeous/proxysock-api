import { useState, useEffect } from "react";
import { getApiError } from "../../../utils/apiError";
import { motion } from "framer-motion";
import {
    GlobeAltIcon,
    Cog6ToothIcon as CogIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    DocumentDuplicateIcon,
    KeyIcon,
    MapPinIcon,
    TrashIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
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
import { toast } from "react-hot-toast";
import ManageSubscriptionModal from "@/components/dashboard/ManageSubscriptionModal";

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
            console.error('Failed to fetch reseller proxy data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { color: 'bg-primary/10 text-primary', icon: CheckCircleIcon },
            expired: { color: 'bg-destructive/10 text-destructive', icon: XCircleIcon },
            pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: ClockIcon },
            cancelled: { color: 'bg-muted text-muted-foreground', icon: XCircleIcon }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const IconComponent = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-transparent ${config.color}`}>
                <IconComponent className="h-3 w-3" />
                <span className="capitalize">{status}</span>
            </span>
        );
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

    const handleProxyAction = async (action: string, data?: any) => {
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

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading Proxies...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Proxy Management</h1>
                <p className="text-muted-foreground mt-1">Manage your reseller proxy pool.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {proxyOrders.map((order) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-xl border p-6 flex flex-col h-full"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <GlobeAltIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold truncate max-w-[150px]">{order.product_name}</h3>
                                    <p className="text-muted-foreground text-xs">#{order.order_id}</p>
                                </div>
                            </div>
                            {getStatusBadge(order.status)}
                        </div>

                        <div className="space-y-2 mb-6 flex-grow">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><KeyIcon className="w-4 h-4" /> Protocol</span>
                                <span className="font-medium uppercase">{order.protocol}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><MapPinIcon className="w-4 h-4" /> Location</span>
                                <span className="font-medium">{order.locations[0] || 'Global'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Expires</span>
                                <span className="font-medium">{new Date(order.expires_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => openModal('credentials', order)}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
                            >
                                <KeyIcon className="w-4 h-4" /> Credentials
                            </button>
                            <button
                                onClick={() => openModal('whitelist', order)}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
                            >
                                <CogIcon className="w-4 h-4" /> Whitelist
                            </button>
                            <button
                                onClick={() => openModal('details', order)}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                            >
                                <EyeIcon className="w-4 h-4" /> Details
                            </button>
                            <button
                                onClick={() => setSubscriptionOrder(order)}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 text-sm font-medium transition-colors"
                            >
                                <ArrowPathIcon className="w-4 h-4" /> Renew
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border w-full max-w-lg shadow-2xl p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><XCircleIcon className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold mb-6">
                            {modalType === 'credentials' ? 'Credentials' : 
                             modalType === 'whitelist' ? 'Whitelist' : 
                             modalType === 'protocol' ? 'Change Protocol' :
                             modalType === 'extend' ? 'Extend Order' :
                             'Proxy Details'}
                        </h3>

                        {modalType === 'credentials' && (
                            <div className="space-y-6">
                                <div className="bg-muted p-4 rounded-lg space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">Username</label>
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 bg-background border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary" 
                                                value={newCreds.username} 
                                                onChange={e => setNewCreds({...newCreds, username: e.target.value})}
                                            />
                                            <button onClick={() => copyToClipboard(newCreds.username)}><DocumentDuplicateIcon className="w-4 h-4 text-primary" /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">Password</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="password"
                                                className="flex-1 bg-background border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary" 
                                                value={newCreds.password} 
                                                onChange={e => setNewCreds({...newCreds, password: e.target.value})}
                                            />
                                            <button onClick={() => copyToClipboard(newCreds.password)}><DocumentDuplicateIcon className="w-4 h-4 text-primary" /></button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleProxyAction('update-creds')}
                                        disabled={actionLoading}
                                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Updating...' : 'Update Credentials'}
                                    </button>
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-3">IP Replacement</p>
                                    <button 
                                        onClick={() => handleProxyAction('rotate')}
                                        disabled={actionLoading}
                                        className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <ArrowPathIcon className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /> 
                                        Rotate Proxy IP
                                    </button>
                                    <p className="text-[10px] text-muted-foreground mt-2 italic text-center">Note: This will replace your current proxy IP. Some providers may charge or have cooldowns.</p>
                                </div>
                            </div>
                        )}

                        {modalType === 'protocol' && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Select your preferred proxy protocol:</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setNewProtocol('http')}
                                        className={`py-4 rounded-xl border-2 transition-all ${newProtocol === 'http' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                    >
                                        <div className="font-bold">HTTP/S</div>
                                        <div className="text-xs text-muted-foreground">Standard Web</div>
                                    </button>
                                    <button 
                                        onClick={() => setNewProtocol('socks5')}
                                        className={`py-4 rounded-xl border-2 transition-all ${newProtocol === 'socks5' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                    >
                                        <div className="font-bold">SOCKS5</div>
                                        <div className="text-xs text-muted-foreground">TCP/UDP Tunneling</div>
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleProxyAction('change-protocol')}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 mt-4"
                                >
                                    {actionLoading ? 'Updating...' : 'Confirm Protocol Change'}
                                </button>
                            </div>
                        )}

                        {modalType === 'extend' && (
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 inline-block mb-2">
                                    <ClockIcon className="w-12 h-12 text-primary" />
                                </div>
                                <h4 className="text-lg font-bold">Extend Your Proxy</h4>
                                <p className="text-sm text-muted-foreground">Extend your current proxy subscription for another billing cycle.</p>
                                <div className="bg-muted p-4 rounded-xl text-left">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Product</span>
                                        <span className="font-medium">{selectedOrder.product_name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Current Expiry</span>
                                        <span className="font-medium">{new Date(selectedOrder.expires_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleProxyAction('extend')}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 mt-2"
                                >
                                    {actionLoading ? 'Extending...' : 'Extend Order Now'}
                                </button>
                                <p className="text-[10px] text-muted-foreground italic">Funds will be deducted from your reseller balance.</p>
                            </div>
                        )}

                        {modalType === 'whitelist' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {selectedOrder.whitelist_ips?.length > 0 ? (
                                        selectedOrder.whitelist_ips.map(ip => (
                                            <div key={ip} className="flex justify-between items-center bg-muted p-2 rounded">
                                                <code>{ip}</code>
                                                <button 
                                                    onClick={() => handleProxyAction('whitelist-delete', ip)}
                                                    className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : <p className="text-sm text-muted-foreground italic text-center py-4">No IPs whitelisted.</p>}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" 
                                        placeholder="Add IP Address" 
                                        value={newIp}
                                        onChange={e => setNewIp(e.target.value)}
                                    />
                                    <button 
                                        onClick={() => handleProxyAction('whitelist-add')}
                                        disabled={actionLoading || !newIp}
                                        className="bg-primary px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalType === 'details' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-secondary/30 p-3 rounded-xl border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Endpoints</p>
                                        <p className="text-sm font-semibold truncate">{selectedOrder.credentials.endpoints?.length || 0} active</p>
                                    </div>
                                    <button 
                                        onClick={() => setModalType('protocol')}
                                        className="bg-secondary/30 p-3 rounded-xl border border-border/50 text-left hover:border-primary/50 transition-colors"
                                    >
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Protocol</p>
                                        <p className="text-sm font-semibold uppercase">{selectedOrder.protocol}</p>
                                    </button>
                                </div>

                                {selectedOrder.credentials.endpoints && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Proxy Endpoints</p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedOrder.credentials.endpoints.map(ep => (
                                                <div key={ep} className="bg-muted/50 p-2.5 rounded-lg flex justify-between items-center group hover:bg-muted transition-colors border border-transparent hover:border-border">
                                                    <code className="text-xs truncate max-w-[280px] font-mono">{ep}</code>
                                                    <button onClick={() => copyToClipboard(ep)} className="p-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity"><DocumentDuplicateIcon className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
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
