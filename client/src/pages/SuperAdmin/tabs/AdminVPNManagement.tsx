import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShieldCheckIcon,
    GlobeAltIcon,
    UserIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    EyeSlashIcon
} from "@heroicons/react/24/outline";
import { fetchAdminOrders } from "@/services/adminApi";
import { toast } from "react-hot-toast";
import ManagementFilters from "../components/ManagementFilters";

interface VPNInstance {
    id: number;
    product_name: string;
    status: string;
    user_email: string;
    expires_at: string;
    country?: string;
    username?: string;
    password?: string;
    server?: string;
}

export default function AdminVPNManagement() {
    const [vpns, setVpns] = useState<VPNInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState("");
    const [search, setSearch] = useState("");
    const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchVpns();
    }, [search, userType]);

    const fetchVpns = async () => {
        setLoading(true);
        try {
            const params: any = { product_type: 'vpn' };
            if (search) params.q = search;
            if (userType) params.entity_type = userType;
            
            const response = await fetchAdminOrders(params);
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.map((order: any) => ({
                    id: order.id,
                    product_name: order.product_name,
                    status: order.status,
                    user_email: order.entity_email || order.user_email,
                    expires_at: order.expires_at,
                    country: order.country,
                    username: order.credentials?.username,
                    password: order.credentials?.password,
                    server: order.credentials?.server || order.credentials?.ip
                }));
                setVpns(transformed);
            }
        } catch (error) {
            console.error('Failed to fetch admin VPNs:', error);
            toast.error("Failed to load VPN instances");
        } finally {
            setLoading(false);
        }
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
                        placeholder="Search User/Order..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center animate-pulse text-muted-foreground">Loading VPNs...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vpns.map((vpn) => (
                        <motion.div key={vpn.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><ShieldCheckIcon className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="font-bold text-foreground truncate max-w-[150px]">{vpn.product_name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <UserIcon className="w-3 h-3 text-muted-foreground" />
                                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{vpn.user_email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    vpn.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-secondary-foreground'
                                }`}>{vpn.status}</div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm font-mono overflow-hidden">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Server:</span>
                                    <span className="text-foreground truncate">{vpn.server || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">User:</span>
                                    <span className="text-foreground truncate">{vpn.username || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">Pass:</span>
                                    <span className="text-foreground truncate">{showPassword[vpn.id] ? (vpn.password || 'N/A') : '••••••••'}</span>
                                    <button
                                        onClick={() => setShowPassword(p => ({ ...p, [vpn.id]: !p[vpn.id] }))}
                                        aria-label={showPassword[vpn.id] ? "Hide password" : "Show password"}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword[vpn.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <GlobeAltIcon className="w-3.5 h-3.5" />
                                    <span>{vpn.country || 'Global'}</span>
                                </div>
                                <span>Expires: {vpn.expires_at ? new Date(vpn.expires_at).toLocaleDateString() : 'N/A'}</span>
                            </div>

                        </motion.div>
                    ))}
                </div>
            )}
            
            {!loading && vpns.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <ShieldCheckIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No VPN instances found.</p>
                </div>
            )}
        </div>
    );
}
