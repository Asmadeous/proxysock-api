import { useState, useEffect } from "react";
import { ServerIcon, ArrowPathIcon, TrashIcon, PlayIcon, StopIcon } from "@heroicons/react/24/outline";
import ServiceCard, { ServiceGrid } from "../components/ServiceCard";
import { fetchAdminVms, startAdminVm, stopAdminVm, rebootAdminVm, deleteAdminVm } from "@/services/adminApi";
import { toast } from "sonner";
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
    host?: string;
    port?: number;
    protocol?: "ssh" | "rdp";
    username?: string;
    password?: string;
    expires_at: string;
    plan_name?: string;
    order_id?: string | number;
    user_email?: string;
}

export default function AdminVPSManagement() {
    const [instances, setInstances] = useState<VPSInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState(""); // "" | "User" | "Reseller"
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


    const fmt = (v?: string) => (v ? new Date(v).toLocaleDateString() : "—");

    return (
        <div>
            <div className="ws-toolbar">
                <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
                <button type="button" onClick={loadInstances} disabled={loading} aria-label="Refresh" className="ws-icon-button"><ArrowPathIcon className={loading ? "animate-spin" : ""} /></button>
            </div>
            <ServiceGrid loading={loading} empty={instances.length === 0} emptyIcon={ServerIcon}>
                {instances.map((vm) => (
                    <ServiceCard
                        key={vm.id}
                        icon={ServerIcon}
                        kind="VPS"
                        status={vm.status}
                        title={vm.hostname || `VPS-${vm.vm_id}`}
                        subtitle={[vm.user_email, vm.plan_name].filter(Boolean).join(" · ")}
                        facts={[
                            { label: "Host", value: (vm.host || vm.ip_address || ""), copy: (vm.host || vm.ip_address || "") || undefined },
                            { label: "Port", value: (vm.port ?? "—") + (vm.protocol ? ` (${vm.protocol.toUpperCase()})` : "") },
                            { label: "Username", value: (vm.username || "root"), copy: (vm.username || "root") },
                            { label: "Password", value: vm.password || "—", copy: vm.password || undefined, secret: Boolean(vm.password) },
                            { label: "Resources", value: `${vm.cpu_cores} vCPU · ${vm.ram_gb} GB · ${vm.storage_gb} GB` },
                            { label: "Expires", value: fmt(vm.expires_at) },
                        ]}
                        actions={
                            <>
                                <button type="button" onClick={() => handleAction(vm.id, "start")} disabled={refreshing[vm.id]}><PlayIcon className="h-3.5 w-3.5" /> Start</button>
                                <button type="button" onClick={() => handleAction(vm.id, "stop")} disabled={refreshing[vm.id]}><StopIcon className="h-3.5 w-3.5" /> Stop</button>
                                <button type="button" onClick={() => handleAction(vm.id, "reboot")} disabled={refreshing[vm.id]}><ArrowPathIcon className={`h-3.5 w-3.5 ${refreshing[vm.id] ? "animate-spin" : ""}`} /> Reboot</button>
                                <button type="button" onClick={() => handleAction(vm.id, "delete")} disabled={refreshing[vm.id]}><TrashIcon className="h-3.5 w-3.5" /> Delete</button>
                            </>
                        }
                    />
                ))}
            </ServiceGrid>
        </div>
    );
}
