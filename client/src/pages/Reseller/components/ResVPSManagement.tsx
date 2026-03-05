import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ServerIcon,
    CpuChipIcon,
    CircleStackIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { fetchResellerVms } from "@/services/resellerApi";
import { startVm, stopVm, rebootVm } from "@/services/api";
import { toast } from "react-hot-toast";

interface VPSInstance {
    id: string | number;
    vm_id: number;
    status: string;
    cpu_cores: number;
    ram_gb: number;
    storage_gb: number;
    ip_address: string;
    proxmox_public_ip: string;
    hostname: string;
    os_template: string;
    root_password: string;
    ssh_port: number;
    expires_at: string;
    plan_name?: string;
}

export default function ResVPSManagement() {
    const [instances, setInstances] = useState<VPSInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
    const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadInstances();
    }, []);

    const loadInstances = async () => {
        try {
            setLoading(true);
            const response = await fetchResellerVms({ vm_type: 'vps' });
            setInstances(response.data.vms || []);
        } catch (error) {
            console.error('Failed to fetch reseller VPS:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string | number, action: 'start' | 'stop' | 'reboot') => {
        try {
            setRefreshing(prev => ({ ...prev, [id]: true }));
            if (action === 'start') await startVm(id);
            if (action === 'stop') await stopVm(id);
            if (action === 'reboot') await rebootVm(id);
            toast.success(`${action} initiated`);
            setTimeout(loadInstances, 2000);
        } catch (error) {
            // Interceptor handles toast
        } finally {
            setRefreshing(prev => ({ ...prev, [id]: false }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running':
            case 'active': return 'text-primary bg-primary/10';
            case 'stopped': return 'text-destructive bg-destructive/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading VPS Instances...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">VPS Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your virtual private servers.</p>
                </div>
                <button onClick={loadInstances} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((vps) => (
                    <motion.div key={vps.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl border p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><ServerIcon className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold truncate max-w-[150px]">{vps.hostname || `VPS-${vps.vm_id}`}</h3>
                                    <p className="text-xs text-muted-foreground">{vps.plan_name}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(vps.status)}`}>{vps.status}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground"><CpuChipIcon className="w-4 h-4" /> {vps.cpu_cores} Cores</div>
                            <div className="flex items-center gap-2 text-muted-foreground"><CircleStackIcon className="w-4 h-4" /> {vps.ram_gb}GB RAM</div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono relative group">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IP:</span>
                                <span>{vps.proxmox_public_ip || vps.ip_address}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Password:</span>
                                <span>{showPassword[vps.id] ? vps.root_password : '••••••••'}</span>
                                <button onClick={() => setShowPassword(p => ({ ...p, [vps.id]: !p[vps.id] }))}>
                                    {showPassword[vps.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleAction(vps.id, 'start')} disabled={refreshing[vps.id]} className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50">
                                <ArrowPathIcon className={`w-4 h-4 mb-1 ${refreshing[vps.id] && vps.status === 'starting' ? 'animate-spin' : ''}`} />
                                <span className="text-[10px]">Start</span>
                            </button>
                            <button onClick={() => handleAction(vps.id, 'stop')} disabled={refreshing[vps.id]} className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50">
                                <XCircleIcon className="w-4 h-4 mb-1" />
                                <span className="text-[10px]">Stop</span>
                            </button>
                            <button onClick={() => handleAction(vps.id, 'reboot')} disabled={refreshing[vps.id]} className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 disabled:opacity-50">
                                <ArrowPathIcon className="w-4 h-4 mb-1" />
                                <span className="text-[10px]">Reboot</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
