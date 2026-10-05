import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    GlobeAltIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    ClipboardDocumentIcon,
    UserIcon,
    MagnifyingGlassIcon,
    KeyIcon
} from "@heroicons/react/24/outline";
import { fetchAdminOrders, rotateProxyIp } from "@/services/adminApi";
import { toast } from "react-hot-toast";
import ManagementFilters from "../components/ManagementFilters";

interface ProxyInstance {
    id: number;
    product_name: string;
    product_type: string;
    ip: string;
    port: number;
    username: string;
    password: string;
    status: string;
    user_email: string;
    expires_at: string;
    country?: string;
    protocol?: string;
}

export default function AdminProxyManagement() {
    const [proxies, setProxies] = useState<ProxyInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState("");
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        fetchProxies();
    }, [search, userType]);

    const fetchProxies = async () => {
        setLoading(true);
        try {
            const params: any = { product_type: 'proxy' };
            if (search) params.q = search;
            if (userType) params.entity_type = userType;
            
            const response = await fetchAdminOrders(params);
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.map((order: any) => ({
                    id: order.id,
                    product_name: order.product_name,
                    product_type: order.product_type,
                    ip: order.credentials?.ip || 'N/A',
                    port: order.credentials?.port || 0,
                    username: order.credentials?.username || 'N/A',
                    password: order.credentials?.password || 'N/A',
                    status: order.status,
                    user_email: order.entity_email || order.user_email,
                    expires_at: order.expires_at,
                    country: order.country,
                    protocol: order.metadata?.protocol || 'http'
                }));
                setProxies(transformed);
            }
        } catch (error) {
            console.error('Failed to fetch admin proxies:', error);
            toast.error("Failed to load proxies");
        } finally {
            setLoading(false);
        }
    };

    const handleRotate = async (id: number) => {
        try {
            setRefreshing(prev => ({ ...prev, [id]: true }));
            await rotateProxyIp(id);
            toast.success("IP rotation triggered");
            setTimeout(fetchProxies, 3000);
        } catch (error: any) {
            toast.error(error.message || "Rotation failed");
        } finally {
            setRefreshing(prev => ({ ...prev, [id]: false }));
        }
    };

    const copy = (t: string) => {
        navigator.clipboard.writeText(t);
        toast.success('Copied!');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
                </div>
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search IP/User/Order..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center animate-pulse text-muted-foreground">Loading proxies...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proxies.map((proxy) => (
                        <motion.div key={proxy.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><GlobeAltIcon className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="font-bold text-foreground truncate max-w-[150px]">{proxy.product_name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <UserIcon className="w-3 h-3 text-muted-foreground" />
                                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{proxy.user_email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    proxy.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-secondary-foreground'
                                }`}>{proxy.status}</div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm font-mono overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Address:</span>
                                    <span className="text-foreground truncate">{proxy.ip}:{proxy.port}</span>
                                    <button onClick={() => copy(`${proxy.ip}:${proxy.port}`)} className="text-muted-foreground hover:text-foreground"><ClipboardDocumentIcon className="w-4 h-4" /></button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Auth:</span>
                                    <span className="text-foreground truncate">{proxy.username}:{proxy.password}</span>
                                    <button onClick={() => copy(`${proxy.username}:${proxy.password}`)} className="text-muted-foreground hover:text-foreground"><KeyIcon className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                                    <span>{proxy.protocol?.toUpperCase()}</span>
                                </div>
                                <span>Expires: {new Date(proxy.expires_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRotate(proxy.id)}
                                    disabled={refreshing[proxy.id]}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                    <ArrowPathIcon className={`w-4 h-4 ${refreshing[proxy.id] ? 'animate-spin' : ''}`} />
                                    Rotate IP
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            
            {!loading && proxies.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <GlobeAltIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No proxies found.</p>
                </div>
            )}
        </div>
    );
}
