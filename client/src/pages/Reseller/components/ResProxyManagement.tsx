import { useState, useEffect } from "react";
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
    TrashIcon
} from "@heroicons/react/24/outline";
import { fetchResellerOrders } from "@/services/resellerApi";
import { toast } from "react-hot-toast";

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
}

export default function ResProxyManagement() {
    const [proxyOrders, setProxyOrders] = useState<ProxyOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<ProxyOrder | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'details' | 'credentials' | 'whitelist'>('details');

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
        navigator.clipboard.writeText(text);
        toast.success('Copied!');
    };

    const openModal = (type: typeof modalType, order?: ProxyOrder) => {
        setModalType(type);
        setSelectedOrder(order || null);
        setShowModal(true);
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
                                <span className="font-medium">{order.protocol.toUpperCase()}</span>
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
                                className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                            >
                                <EyeIcon className="w-4 h-4" /> View Full Details
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border w-full max-w-lg shadow-2xl p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><XCircleIcon className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold mb-6">{modalType === 'credentials' ? 'Credentials' : modalType === 'whitelist' ? 'Whitelist' : 'Proxy Details'}</h3>

                        {modalType === 'credentials' && (
                            <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Username</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm">{selectedOrder.credentials.username}</code>
                                            <button onClick={() => copyToClipboard(selectedOrder.credentials.username)}><DocumentDuplicateIcon className="w-4 h-4 text-primary" /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Password</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm">{selectedOrder.credentials.password}</code>
                                            <button onClick={() => copyToClipboard(selectedOrder.credentials.password)}><DocumentDuplicateIcon className="w-4 h-4 text-primary" /></button>
                                        </div>
                                    </div>
                                </div>
                                {selectedOrder.credentials.endpoints && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Endpoints</p>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {selectedOrder.credentials.endpoints.map(ep => (
                                                <div key={ep} className="bg-muted p-2 rounded flex justify-between items-center">
                                                    <code className="text-xs truncate max-w-[200px]">{ep}</code>
                                                    <button onClick={() => copyToClipboard(ep)}><DocumentDuplicateIcon className="w-4 h-4 text-primary" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {modalType === 'whitelist' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {selectedOrder.whitelist_ips?.length > 0 ? (
                                        selectedOrder.whitelist_ips.map(ip => (
                                            <div key={ip} className="flex justify-between items-center bg-muted p-2 rounded">
                                                <code>{ip}</code>
                                                <button className="text-destructive"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))
                                    ) : <p className="text-sm text-muted-foreground italic">No IPs whitelisted.</p>}
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm" placeholder="Add IP Address" />
                                    <button className="bg-primary px-4 py-2 rounded-lg text-sm text-white">Add</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
