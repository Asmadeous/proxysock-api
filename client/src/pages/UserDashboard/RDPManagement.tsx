import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComputerDesktopIcon,
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
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";

interface RDPInstance {
  vm_external_port: number;
  id: string;
  rdp_order_id: string;
  user_id: string;
  vm_id: number;
  node: string;
  status: 'creating' | 'active' | 'stopped' | 'suspended' | 'terminated' | 'error';
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  ip_address: string;
  hostname: string;
  os_template: string;
  rdp_username: string;
  rdp_password: string;
  rdp_port: number;
  concurrent_users: number;
  active_sessions: number;
  service_type: 'residential' | 'standard';
  network_config: any;
  resource_usage: {
    cpu_percent: number;
    ram_percent: number;
    disk_percent: number;
  };
  session_logs: any[];
  last_connection: string;
  last_ping: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  plan_name?: string;
  monthly_cost?: number;
  features?: string[];
}

interface RDPFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  serviceTypeFilter: string;
  setServiceTypeFilter: (val: string) => void;
  clearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

const RDPFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  serviceTypeFilter,
  setServiceTypeFilter,
  clearFilters,
  filteredCount,
  totalCount
}: RDPFiltersProps) => (
  <div className="bg-card rounded-xl p-6 border">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
      <div className="relative flex-1 max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by hostname, IP, VM ID, node, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="stopped">Stopped</option>
            <option value="creating">Creating</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
            <option value="error">Error</option>
          </select>
        </div>

        <select
          value={serviceTypeFilter}
          onChange={(e) => setServiceTypeFilter(e.target.value)}
          className="px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="residential">Residential</option>
          <option value="standard">Standard</option>
        </select>

        {(searchTerm || statusFilter !== "all" || serviceTypeFilter !== "all") && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>

    <div className="mt-4 text-sm text-gray-400">
      Showing {filteredCount} of {totalCount} instances
      {searchTerm && <span> matching "{searchTerm}"</span>}
      {(statusFilter !== "all" || serviceTypeFilter !== "all") && <span> with applied filters</span>}
    </div>
  </div>
);

interface RDPInstanceCardProps {
  instance: RDPInstance;
  getStatusIcon: (status: string) => any;
  getStatusColor: (status: string) => string;
  showPassword: Record<string, boolean>;
  setShowPassword: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  copyToClipboard: (text: string) => void;
  downloadRDPFile: (id: string) => Promise<void>;
  downloadingRDP: string | null;
}

const RDPInstanceCard = ({
  instance,
  getStatusIcon,
  getStatusColor,
  showPassword,
  setShowPassword,
  copyToClipboard,
  downloadRDPFile,
  downloadingRDP
}: RDPInstanceCardProps) => {
  const StatusIcon = getStatusIcon(instance.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ComputerDesktopIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{instance.hostname || `RDP-${instance.vm_id}`}</h3>
            <p className="text-sm text-muted-foreground">{instance.plan_name || `${instance.service_type} - VM ${instance.vm_id}`}</p>
          </div>
        </div>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {instance.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <CpuChipIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{instance.cpu_cores} vCPU</span>
        </div>
        <div className="flex items-center space-x-2">
          <CircleStackIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{instance.ram_gb} GB RAM</span>
        </div>
        <div className="flex items-center space-x-2">
          <CloudIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{instance.storage_gb} GB SSD</span>
        </div>
        <div className="flex items-center space-x-2">
          <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{instance.node}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>CPU Usage</span>
            <span>{instance.resource_usage?.cpu_percent || 0}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${instance.resource_usage?.cpu_percent || 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>RAM Usage</span>
            <span>{instance.resource_usage?.ram_percent || 0}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${instance.resource_usage?.ram_percent || 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Active Sessions</span>
            <span>{instance.active_sessions}/{instance.concurrent_users}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(instance.active_sessions / instance.concurrent_users) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">IP Address:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{instance.ip_address || 'Pending'}</span>
            {instance.ip_address && (
              <button
                onClick={() => copyToClipboard(instance.ip_address)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">RDP Port:</span>
          <span className="text-sm font-mono">{instance.vm_external_port || instance.rdp_port || 3389}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Username:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{instance.rdp_username}</span>
            <button
              onClick={() => copyToClipboard(instance.rdp_username)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">
              {showPassword[instance.id] ? instance.rdp_password : '••••••••'}
            </span>
            <button
              onClick={() => setShowPassword(prev => ({
                ...prev,
                [instance.id]: !prev[instance.id]
              }))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword[instance.id] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(instance.rdp_password)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => downloadRDPFile(instance.id)}
        disabled={downloadingRDP === instance.id || instance.status !== 'active' || !instance.ip_address}
        className="w-full flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DocumentArrowDownIcon className={`h-5 w-5 mr-2 ${downloadingRDP === instance.id ? 'animate-pulse' : ''}`} />
        {downloadingRDP === instance.id ? 'Generating...' : 'Download RDP File'}
      </button>

      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="text-xs text-muted-foreground mb-2">Quick Connect:</div>
        <div className="space-y-1 text-xs">
          <div className="text-foreground">
            <span className="text-muted-foreground">Host:</span>
            <span className="font-mono ml-1">
              {instance.ip_address || 'Pending'}:{instance.vm_external_port || instance.rdp_port || 3389}
            </span>
          </div>
          <div className="text-foreground">
            <span className="text-muted-foreground">User:</span>
            <span className="font-mono ml-1">{instance.rdp_username}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Monthly Cost: <span className="text-primary font-semibold">${instance.monthly_cost || 'N/A'}</span></span>
        <span>Expires: {instance.expires_at ? new Date(instance.expires_at).toLocaleDateString() : 'N/A'}</span>
      </div>
    </motion.div>
  );
};

interface RDPInstanceDetailsModalProps {
  instance: RDPInstance | null;
  onClose: () => void;
  getStatusTextColor: (status: string) => string;
  showPassword: Record<string, boolean>;
  setShowPassword: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  copyToClipboard: (text: string) => void;
}

const RDPInstanceDetailsModal = ({
  instance,
  onClose,
  getStatusTextColor,
  showPassword,
  setShowPassword,
  copyToClipboard
}: RDPInstanceDetailsModalProps) => (
  <AnimatePresence>
    {instance && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ComputerDesktopIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{instance.hostname || `RDP-${instance.vm_id}`}</h2>
                <p className="text-muted-foreground">{instance.plan_name || instance.service_type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <CpuChipIcon className="h-5 w-5 mr-2 text-primary" />
                System Information
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">CPU:</span><span className="text-foreground">{instance.cpu_cores} vCPU</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">RAM:</span><span className="text-foreground">{instance.ram_gb} GB</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Storage:</span><span className="text-foreground">{instance.storage_gb} GB SSD</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Operating System:</span><span className="text-foreground">{instance.os_template}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Node:</span><span className="text-foreground">{instance.node}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service Type:</span><span className="text-foreground capitalize">{instance.service_type}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-red-400" />
                Connection Details
              </h3>
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">IP Address:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">{instance.ip_address || 'Pending'}</span>
                    {instance.ip_address && (
                      <button onClick={() => copyToClipboard(instance.ip_address)} className="p-1 text-gray-400 hover:text-white transition-colors">
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-gray-400">RDP Port:</span><span className="text-white font-mono">{instance.vm_external_port || instance.rdp_port || 3389}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Username:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">{instance.rdp_username}</span>
                    <button onClick={() => copyToClipboard(instance.rdp_username)} className="p-1 text-gray-400 hover:text-white transition-colors">
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Password:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">{showPassword[instance.id] ? instance.rdp_password : '••••••••••••'}</span>
                    <button onClick={() => setShowPassword(prev => ({ ...prev, [instance.id]: !prev[instance.id] }))} className="p-1 text-gray-400 hover:text-white transition-colors">
                      {showPassword[instance.id] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                    <button onClick={() => copyToClipboard(instance.rdp_password)} className="p-1 text-gray-400 hover:text-white transition-colors">
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-muted/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Billing Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Monthly Cost:</span><span className="text-primary font-semibold ml-2">${instance.monthly_cost || 'N/A'}</span></div>
              <div><span className="text-muted-foreground">Created:</span><span className="text-foreground ml-2">{new Date(instance.created_at).toLocaleDateString()}</span></div>
              <div><span className="text-muted-foreground">Expires:</span><span className="text-foreground ml-2">{instance.expires_at ? new Date(instance.expires_at).toLocaleDateString() : 'N/A'}</span></div>
              <div><span className="text-muted-foreground">Status:</span><span className={`ml-2 capitalize ${getStatusTextColor(instance.status)}`}>{instance.status}</span></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const RDPPManagement = () => {
  const [rdpInstances, setRdpInstances] = useState<RDPInstance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<RDPInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [selectedInstance, setSelectedInstance] = useState<RDPInstance | null>(null);
  const [downloadingRDP, setDownloadingRDP] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const { accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      fetchRDPInstances();
    }
  }, [accessToken]);

  // Filter instances based on search and filters
  useEffect(() => {
    let filtered = rdpInstances;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(instance =>
        instance.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.vm_id.toString().includes(searchTerm) ||
        instance.node?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.rdp_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(instance => instance.status === statusFilter);
    }

    // Service type filter
    if (serviceTypeFilter !== "all") {
      filtered = filtered.filter(instance => instance.service_type === serviceTypeFilter);
    }

    setFilteredInstances(filtered);
  }, [rdpInstances, searchTerm, statusFilter, serviceTypeFilter]);

  const fetchRDPInstances = async () => {
    if (!accessToken) {
      console.error('No authentication token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rdp-instances`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRdpInstances(data.instances || []);
      } else {
        console.error('Failed to fetch RDP instances:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch RDP instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadRDPFile = async (instanceId: string) => {
    try {
      setDownloadingRDP(instanceId);
      const instance = rdpInstances.find(i => i.id === instanceId);
      if (!instance) return;

      // Use vm_external_port instead of rdp_port
      const rdpPort = instance.vm_external_port || instance.rdp_port || 3389;

      const rdpContent = `screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
winposstr:s:0,3,0,0,800,600
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
displayconnectionbar:i:1
enableworkspacereconnect:i:0
disable wallpaper:i:0
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
full address:s:${instance.ip_address}:${rdpPort}
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
autoreconnection enabled:i:1
authentication level:i:2
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
username:s:${instance.rdp_username}`;

      const blob = new Blob([rdpContent], { type: 'application/rdp' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = instance.hostname || `RDP-${instance.vm_id}`;
      link.download = `${fileName}.rdp`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download RDP file:', error);
    } finally {
      setDownloadingRDP(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-primary bg-primary/10';
      case 'stopped': return 'text-destructive bg-destructive/10';
      case 'creating': return 'text-secondary-foreground bg-secondary';
      case 'suspended': return 'text-destructive bg-destructive/10';
      case 'terminated': return 'text-muted-foreground bg-muted';
      case 'error': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-primary';
      case 'stopped': return 'text-destructive';
      case 'creating': return 'text-secondary-foreground';
      case 'suspended': return 'text-destructive';
      case 'terminated': return 'text-muted-foreground';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'stopped': return XCircleIcon;
      case 'creating': return ArrowPathIcon;
      case 'suspended': return ExclamationTriangleIcon;
      case 'terminated': return XCircleIcon;
      case 'error': return ExclamationTriangleIcon;
      default: return XCircleIcon;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setServiceTypeFilter("all");
  };

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
          <p className="text-gray-400">Please log in to view your RDP instances</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2"></div>
          </div>
          <div className="h-10 w-28 bg-muted animate-pulse rounded-lg"></div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-lg"></div>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
              <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-xl p-6 border">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
                  <div>
                    <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>

              {/* Usage Stats */}
              <div className="space-y-3 mb-4">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-1">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-2 w-full bg-muted animate-pulse rounded-full"></div>
                  </div>
                ))}
              </div>

              {/* Connection Details */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <div className="h-12 w-full bg-muted animate-pulse rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RDP Management</h1>
          <p className="text-muted-foreground mt-2">View and manage your Remote Desktop instances</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchRDPInstances}
            disabled={loading || !accessToken}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <RDPFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceTypeFilter={serviceTypeFilter}
        setServiceTypeFilter={setServiceTypeFilter}
        clearFilters={clearFilters}
        filteredCount={filteredInstances.length}
        totalCount={rdpInstances.length}
      />

      {/* RDP Instances Grid */}
      {filteredInstances.length === 0 ? (
        <div className="text-center py-12">
          <ComputerDesktopIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {rdpInstances.length === 0 ? "No RDP Instances" : "No Matching Instances"}
          </h3>
          <p className="text-gray-500">
            {rdpInstances.length === 0
              ? "You don't have any RDP instances yet."
              : "Try adjusting your search or filters."}
          </p>
          {rdpInstances.length > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInstances.map((instance) => (
            <RDPInstanceCard
              key={instance.id}
              instance={instance}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              copyToClipboard={copyToClipboard}
              downloadRDPFile={downloadRDPFile}
              downloadingRDP={downloadingRDP}
            />
          ))}
        </div>
      )}

      <RDPInstanceDetailsModal
        instance={selectedInstance}
        onClose={() => setSelectedInstance(null)}
        getStatusTextColor={getStatusTextColor}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        copyToClipboard={copyToClipboard}
      />
    </div>
  );
};

export default RDPPManagement;