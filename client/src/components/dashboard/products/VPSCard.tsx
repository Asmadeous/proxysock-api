import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudIcon,
  GlobeAltIcon,
  CommandLineIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { fetchVmStatus } from "../../../services/api";
import { toast } from "react-hot-toast";

export interface VPSInstance {
  id: string | number;
  vm_id: number;
  proxmox_vm_id: string;
  vm_type: 'vps' | 'rdp' | 'mobile_proxy';
  node: string;
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
  rdp_port: number;
  external_port: number;
  username?: string;
  resource_usage?: {
    cpu_percent: number;
    ram_percent: number;
    disk_percent: number;
  };
  expires_at: string;
  created_at: string;
  plan_name?: string;
  monthly_cost?: number;
  bandwidth_gb?: number;
  auto_renew?: boolean;
  renewal_method?: string;
  order_id?: string;
}

interface VPSCardProps {
  instance: VPSInstance;
  onAction: (id: string | number, action: 'start' | 'stop' | 'reboot' | 'delete') => Promise<void>;
  onShowDetails: (instance: VPSInstance) => void;
  onShowSubscription: (instance: VPSInstance) => void;
  onShowPasswordModal: (instance: VPSInstance) => void;
}

const VPSCard = ({ instance, onAction, onShowDetails, onShowSubscription, onShowPasswordModal }: VPSCardProps) => {
  const [liveData, setLiveData] = useState<Partial<VPSInstance>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const status = liveData.status || instance.status;
  const resource_usage = liveData.resource_usage || instance.resource_usage;

  useEffect(() => {
    if (inView && status !== 'terminated' && status !== 'failed') {
      fetchLiveStats();
    }
  }, [inView, instance.id]);

  const fetchLiveStats = async () => {
    if (loadingStats) return;
    setLoadingStats(true);
    try {
      const response = await fetchVmStatus(instance.id);
      if (response.data) {
        setLiveData({
          status: response.data.status,
          resource_usage: response.data.resource_usage
        });
      }
    } catch (error) {
      console.error('Failed to fetch live stats for', instance.id, error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLocalAction = async (action: 'start' | 'stop' | 'reboot' | 'delete') => {
    setRefreshing(true);
    try {
      await onAction(instance.id, action);
      // Wait a bit and refresh stats
      setTimeout(fetchLiveStats, 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'running': return 'text-primary bg-primary/10';
      case 'stopped': return 'text-destructive bg-destructive/10';
      case 'suspended': return 'text-destructive bg-destructive/10';
      case 'terminated': return 'text-muted-foreground bg-muted';
      case 'error': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'running':
      case 'active': return CheckCircleIcon;
      case 'stopped':
      case 'terminated': return XCircleIcon;
      case 'creating':
      case 'provisioning':
      case 'starting':
      case 'stopping':
      case 'rebooting': return ArrowPathIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const StatusIcon = getStatusIcon(status);
  const sshPort = instance.os_template?.toLowerCase().includes('windows') ? (instance.rdp_port || 3389) : (instance.ssh_port || 22);
  const user = instance.username || (instance.os_template?.toLowerCase().includes('windows') ? 'Administrator' : (instance.hostname || 'root'));
  const sshCommand = instance.dns_name ? `ssh ${user}@${instance.dns_name} -p ${sshPort}` : 'Generating...';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ServerIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{instance.hostname || `VPS-${instance.vm_id}`}</h3>
            <p className="text-sm text-muted-foreground">{instance.plan_name ? `${instance.plan_name} (VM: ${instance.vm_id})` : `VM ID: ${instance.vm_id}`}</p>
          </div>
        </div>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          <StatusIcon className={`h-4 w-4 mr-1 ${['starting', 'stopping', 'rebooting'].includes(status) ? 'animate-spin' : ''}`} />
          {status}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
          <div className="flex flex-col items-center justify-center py-1">
            <CpuChipIcon className="h-3.5 w-3.5 text-primary/70 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase text-center">CPU</span>
            <span className="text-xs font-mono">{instance.cpu_cores}vC</span>
          </div>
          <div className="flex flex-col items-center justify-center py-1 border-x border-border/30">
            <CircleStackIcon className="h-3.5 w-3.5 text-primary/70 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase text-center">RAM</span>
            <span className="text-xs font-mono">{instance.ram_gb}GB</span>
          </div>
          <div className="flex flex-col items-center justify-center py-1">
            <CloudIcon className="h-3.5 w-3.5 text-primary/70 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase text-center">SSD</span>
            <span className="text-xs font-mono">{instance.storage_gb}GB</span>
          </div>
        </div>

        <div className="space-y-3 p-3 bg-muted/20 rounded-xl border border-border/50">
          {loadingStats ? (
            <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>CPU</span>
                  <span>{resource_usage?.cpu_percent?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all ${(resource_usage?.cpu_percent ?? 0) > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, resource_usage?.cpu_percent || 0)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>RAM</span>
                  <span>{resource_usage?.ram_percent?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all ${(resource_usage?.ram_percent ?? 0) > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, resource_usage?.ram_percent || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 mb-4 border border-border/50 space-y-3">
        <div className="space-y-1.5 group">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subdomain</span>
          </div>
          <div className="flex items-center gap-2 w-full bg-background/50 rounded-lg p-2 border border-border/30">
            <span className="text-sm font-mono font-medium truncate flex-1" title={instance.dns_name}>
              {instance.dns_name || 'Generating...'}
            </span>
            {instance.dns_name && (
              <button onClick={() => copyToClipboard(instance.dns_name!)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0">
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Password</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-mono">{showPassword ? (instance.root_password || 'Not set') : '••••••••'}</span>
              <button onClick={() => setShowPassword(!showPassword)} className="p-1 rounded hover:bg-muted text-muted-foreground transition-all">
                {showPassword ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
              </button>
              {instance.root_password && (
                <button onClick={() => copyToClipboard(instance.root_password)} className="p-1 rounded hover:bg-muted text-muted-foreground transition-all">
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => onShowPasswordModal(instance)} className="p-1 rounded hover:bg-primary/10 text-primary transition-all">
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 mb-4 group/ssh relative overflow-hidden">
        <div className="flex items-center justify-between mb-2 relative z-10">
          <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest flex items-center">
            <CommandLineIcon className="h-3 w-3 mr-1.5" />
            SSH Command
          </span>
          {instance.dns_name && (
            <button onClick={() => copyToClipboard(sshCommand)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
              <ClipboardDocumentIcon className="h-3 w-3" />
            </button>
          )}
        </div>
        <code className="text-[11px] text-gray-300 font-mono break-all relative z-10 block pr-6">{sshCommand}</code>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button
          onClick={() => handleLocalAction('start')}
          disabled={refreshing || status === 'running'}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all disabled:opacity-30"
        >
          <ArrowPathIcon className={`h-4 w-4 mb-1.5 ${refreshing && status === 'starting' ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Start</span>
        </button>
        <button
          onClick={() => handleLocalAction('stop')}
          disabled={refreshing || status === 'stopped' || status === 'terminated'}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all disabled:opacity-30"
        >
          <XCircleIcon className={`h-4 w-4 mb-1.5 ${refreshing && status === 'stopping' ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Stop</span>
        </button>
        <button
          onClick={() => handleLocalAction('reboot')}
          disabled={refreshing}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 transition-all disabled:opacity-30"
        >
          <ArrowPathIcon className={`h-4 w-4 mb-1.5 ${refreshing && status === 'rebooting' ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Reboot</span>
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={() => onShowDetails(instance)} className="flex-1 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors flex items-center justify-center text-sm font-medium">
          <EyeIcon className="h-4 w-4 mr-2" /> Details
        </button>
        <button onClick={() => onShowSubscription(instance)} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center text-sm font-medium">
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Monthly Cost: <span className="text-primary font-semibold">${instance.monthly_cost || 'N/A'}</span></span>
        <span>Expires: {instance.expires_at ? new Date(instance.expires_at).toLocaleDateString() : 'N/A'}</span>
      </div>
    </motion.div>
  );
};

export default VPSCard;
