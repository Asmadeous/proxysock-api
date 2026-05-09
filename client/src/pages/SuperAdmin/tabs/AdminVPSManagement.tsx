import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ServerIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    XCircleIcon,
    TrashIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { fetchAdminVms, startAdminVm, stopAdminVm, rebootAdminVm, deleteAdminVm } from "@/services/adminApi";
import { toast } from "react-hot-toast";
import ManagementFilters from "../components/ManagementFilters";

interface VPSInstance {
    id: string | number;
    vm_id: number;
    status: string;
    cpu_cores: number;
    ram_gb: number;
    storage_gb: number;
    ip_address: string;
    dns_name?: string;
    proxmox_public_ip: string;
    hostname: string;
    rdp_username: string;
    rdp_password: string;
    expires_at: string;
    plan_name?: string;
    order_id?: string | number;
    user_email?: string;
}

export default function AdminVPSManagement() {
    const [instances, setInstances] = useState<VPSInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState(""); // "" | "User" | "Reseller"
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
    const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadInstances();
    }, [userType]);

    const loadInstances = async () => {
        try {
            setLoading(true);
            const params: any = { vm_type: 'vps' };
            if (userType) params.entity_type = userType;
            
            const response = await fetchAdminVms(params);
            setInstances(response.data.vms || []);
        } catch (error) {
            console.error('Failed to fetch admin VPS:', error);
            toast.error("Failed to load VPS instances");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string | number, action: 'start' | 'stop' | 'reboot' | 'delete') => {
        if (action === 'delete' && !confirm("Are you sure you want to PERMANENTLY DELETE this VM? This cannot be undone.")) return;
        
        try {
            setRefreshing(prev => ({ ...prev, [id]: true }));
            if (action === 'start') await startAdminVm(id);
            if (action === 'stop') await stopAdminVm(id);
            if (action === 'reboot') await rebootAdminVm(id);
            if (action === 'delete') await deleteAdminVm(id);
            
            toast.success(`${action} initiated`);
            setTimeout(loadInstances, 2000);
        } catch (error: any) {
            toast.error(error.message || `${action} failed`);
        } finally {
            setRefreshing(prev => ({ ...prev, [id]: false }));
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading VPS Instances...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">VPS Management (Admin)</h1>
                    <p className="text-muted-foreground mt-1">Manage all Virtual Private Server instances across the platform.</p>
                </div>
                <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((vps) => (
                    <motion.div key={vps.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ServerIcon className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-foreground truncate max-w-[150px]">{vps.hostname || `VPS-${vps.vm_id}`}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <UserIcon className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{vps.user_email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                vps.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                                vps.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                            }`}>{vps.status}</div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IP Address:</span>
                                <span className="text-foreground">{vps.ip_address || 'Allocating...'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User:</span>
                                <span className="text-foreground">{vps.rdp_username || 'root'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pass:</span>
                                <span className="text-foreground">{showPassword[vps.id] ? vps.rdp_password : '••••••••'}</span>
                                <button onClick={() => setShowPassword(p => ({ ...p, [vps.id]: !p[vps.id] }))} className="text-muted-foreground hover:text-foreground">
                                    {showPassword[vps.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleAction(vps.id, 'start')} disabled={refreshing[vps.id]} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50" title="Start">
                                <ArrowPathIcon className={`w-4 h-4 mx-auto ${refreshing[vps.id] ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={() => handleAction(vps.id, 'stop')} disabled={refreshing[vps.id]} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Stop">
                                <XCircleIcon className="w-4 h-4 mx-auto" />
                            </button>
                            <button onClick={() => handleAction(vps.id, 'reboot')} disabled={refreshing[vps.id]} className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50" title="Reboot">
                                <ArrowPathIcon className="w-4 h-4 mx-auto" />
                            </button>
                            <button onClick={() => handleAction(vps.id, 'delete')} disabled={refreshing[vps.id]} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50" title="Delete">
                                <TrashIcon className="w-4 h-4 mx-auto" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
            {instances.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <ServerIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No VPS instances found.</p>
                </div>
            )}
        </div>
    );
}
