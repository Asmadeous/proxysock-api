import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ComputerDesktopIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { fetchResellerVms } from "@/services/resellerApi";
import { startVm, stopVm, rebootVm } from "@/services/api";
import { toast } from "react-hot-toast";
import { getApiError } from "../../SuperAdmin/utils/errors";
import { Skeleton } from "@/components/ui/skeleton";

interface RDPInstance {
    id: string | number;
    vm_id: number;
    status: string;
    cpu_cores: number;
    ram_gb: number;
    storage_gb: number;
    ip_address: string;
    proxmox_public_ip: string;
    hostname: string;
    rdp_username: string;
    rdp_password: string;
    rdp_port: number;
    expires_at: string;
    plan_name?: string;
}

export default function ResRDPManagement() {
    const [instances, setInstances] = useState<RDPInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
    const [_refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadInstances();
    }, []);

    const loadInstances = async () => {
        try {
            setLoading(true);
            const response = await fetchResellerVms({ vm_type: 'rdp' });
            setInstances(response.data.vms || []);
        } catch (error) {
            toast.error(getApiError(error, "Failed to load RDP instances"));
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
            toast.error(getApiError(error, `${action} failed`));
        } finally {
            setRefreshing(prev => ({ ...prev, [id]: false }));
        }
    };

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <Skeleton className="h-8 rounded-lg" />
                        <Skeleton className="h-8 rounded-lg" />
                        <Skeleton className="h-8 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">RDP Management</h1>
                <p className="text-muted-foreground mt-1">Manage your Windows Remote Desktop instances.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((rdp) => (
                    <motion.div key={rdp.id} className="bg-card rounded-xl border p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><ComputerDesktopIcon className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold truncate max-w-[150px]">{rdp.hostname || `RDP-${rdp.vm_id}`}</h3>
                                    <p className="text-xs text-muted-foreground">{rdp.plan_name}</p>
                                </div>
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">{rdp.status}</div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IP:Port</span>
                                <span>{rdp.proxmox_public_ip || rdp.ip_address}:{rdp.rdp_port}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User:</span>
                                <span>{rdp.rdp_username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pass:</span>
                                <span>{showPassword[rdp.id] ? rdp.rdp_password : '••••••••'}</span>
                                <button
                                    onClick={() => setShowPassword(p => ({ ...p, [rdp.id]: !p[rdp.id] }))}
                                    aria-label={showPassword[rdp.id] ? "Hide password" : "Show password"}
                                >
                                    {showPassword[rdp.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleAction(rdp.id, 'start')} className="p-2 rounded-lg bg-green-500/10 text-green-500"><ArrowPathIcon className="w-4 h-4 mx-auto" /></button>
                            <button onClick={() => handleAction(rdp.id, 'stop')} className="p-2 rounded-lg bg-red-500/10 text-red-500"><XCircleIcon className="w-4 h-4 mx-auto" /></button>
                            <button onClick={() => handleAction(rdp.id, 'reboot')} className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ArrowPathIcon className="w-4 h-4 mx-auto" /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
