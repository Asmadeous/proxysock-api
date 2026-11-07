import { useState, useEffect } from "react";
import { CalendarClock, Play, RefreshCw, RotateCw, Square, Server } from "lucide-react";
import resellerApi, { fetchResellerVms, startResellerVm as startVm, stopResellerVm as stopVm, rebootResellerVm as rebootVm } from "@/services/resellerApi";
import { toast } from "sonner";
import { getApiError } from "../../SuperAdmin/utils/errors";
import ManageSubscriptionModal from "@/components/dashboard/ManageSubscriptionModal";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import ServiceCard, { ServiceGrid } from "../../SuperAdmin/components/ServiceCard";

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
    os_template: string;
    root_password: string;
    ssh_port: number;
    port?: number;
    protocol?: "ssh" | "rdp";
    username?: string;
    expires_at: string;
    plan_name?: string;
    order_id?: string | number;
    order_number?: string;
    auto_renew?: boolean;
    renewal_method?: string;
}

export default function ResVPSManagement() {
    const [instances, setInstances] = useState<VPSInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});
    const [subscriptionVps, setSubscriptionVps] = useState<VPSInstance | null>(null);

    useEffect(() => {
        loadInstances();
    }, []);

    const loadInstances = async () => {
        try {
            setLoading(true);
            const response = await fetchResellerVms({ vm_type: 'vps' });
            setInstances(response.data.vms || []);
        } catch (error) {
            toast.error(getApiError(error, "Failed to load VPS instances"));
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

    const running = instances.filter(i => ["running", "active"].includes((i.status || "").toLowerCase())).length;

    return (
        <div className="ws-stack">
            <PageHeader
                title="VPS"
                description="Manage your virtual private servers."
                actions={<button type="button" onClick={loadInstances} disabled={loading} aria-label="Refresh" title="Refresh" className="ws-icon-button"><RefreshCw className={loading ? "animate-spin" : ""} /></button>}
            />

            {!loading && instances.length > 0 && (
                <div className="proxy-summary" style={{ marginBottom: 0 }}>
                    <span><strong>{instances.length}</strong> Instances</span>
                    <span><strong>{running}</strong> Running</span>
                </div>
            )}

            <ServiceGrid loading={loading} empty={instances.length === 0} emptyIcon={Server} emptyTitle="No VPS instances yet" emptyText="Servers you order appear here with their connection details.">
                {instances.map((vm) => (
                    <ServiceCard
                        key={vm.id}
                        icon={Server}
                        kind="VPS"
                        status={vm.status}
                        title={vm.hostname || `VPS-${vm.vm_id}`}
                        subtitle={vm.plan_name}
                        facts={[
                            { label: "CPU", value: `${vm.cpu_cores} cores` },
                            { label: "Memory", value: `${vm.ram_gb} GB` },
                            { label: "Host", value: vm.dns_name || vm.ip_address || "Generating…", copy: vm.dns_name || vm.ip_address || undefined },
                            { label: vm.protocol === "rdp" ? "RDP port" : "SSH port", value: vm.port ?? vm.ssh_port },
                            { label: "Username", value: vm.username || "root", copy: vm.username || "root" },
                            { label: "Password", value: vm.root_password, copy: vm.root_password, secret: true },
                        ]}
                        note={vm.expires_at ? `Expires ${new Date(vm.expires_at).toLocaleDateString()}` : undefined}
                        actions={<>
                            <button type="button" onClick={() => handleAction(vm.id, "start")} disabled={refreshing[vm.id]}><Play size={14} aria-hidden="true" /> Start</button>
                            <button type="button" onClick={() => handleAction(vm.id, "stop")} disabled={refreshing[vm.id]}><Square size={14} aria-hidden="true" /> Stop</button>
                            <button type="button" onClick={() => handleAction(vm.id, "reboot")} disabled={refreshing[vm.id]}><RotateCw size={14} aria-hidden="true" /> Reboot</button>
                            {vm.order_id && <button type="button" onClick={() => setSubscriptionVps(vm)}><CalendarClock size={14} aria-hidden="true" /> Renewal</button>}
                        </>}
                    />
                ))}
            </ServiceGrid>

            <ManageSubscriptionModal
                isOpen={!!subscriptionVps}
                onClose={() => setSubscriptionVps(null)}
                orderId={subscriptionVps?.order_id || ''}
                autoRenew={!!subscriptionVps?.auto_renew}
                renewalMethod={subscriptionVps?.renewal_method || 'wallet'}
                expiresAt={subscriptionVps?.expires_at || ''}
                onUpdate={loadInstances}
                api={resellerApi}
                apiPrefix=""
            />
        </div>
    );
}
