import { useState, useEffect, useMemo } from "react";
import railsApi from "@/lib/railsApi";
import { motion, AnimatePresence } from "framer-motion";
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
  CommandLineIcon,
  WifiIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  TagIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

interface VPSInstance {
  id: string;
  vps_order_id: string;
  user_id: string;
  vm_id: number;
  node: string;
  status: 'creating' | 'running' | 'stopped' | 'suspended' | 'terminated' | 'error';
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  ip_address: string;
  hostname: string;
  os_template: string;
  root_password: string;
  ssh_keys: string[];
  network_config: any;
  resource_usage: {
    cpu_percent: number;
    ram_percent: number;
    disk_percent: number;
    bandwidth_used: number;
  };
  last_ping: string;
  expired_at: string;
  created_at: string;
  updated_at: string;
  rdp_enabled: boolean;
  rdp_users_configured: number;
  active_sessions: number;
  session_logs: any[];
  last_connection: string;
  plan_name?: string;
  monthly_cost?: number;
  bandwidth_gb?: number;
  vm_external_port?: number;
  proxmox_public_ip?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'status' | 'created' | 'cost' | 'usage';
type SortOrder = 'asc' | 'desc';

const VPSManagement = () => {
  const [vpsInstances, setVpsInstances] = useState<VPSInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [selectedInstance, setSelectedInstance] = useState<VPSInstance | null>(null);
  const { accessToken } = useAuth();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [osFilter, setOSFilter] = useState<string>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchVPSInstances();
    }
  }, [accessToken]);

  const fetchVPSInstances = async () => {
    try {
      setLoading(true);
      const { data } = await railsApi.get('/vms');
      if (Array.isArray(data)) {
        // Filter out RDP instances (assuming they have rdp_username)
        const vpsOnly = data.filter((inst: any) => !inst.rdp_username);
        setVpsInstances(vpsOnly);
      } else {
        setVpsInstances([]);
      }
    } catch (error) {
      console.error('Failed to fetch VPS instances:', error);
      setVpsInstances([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter options
  const statusOptions = useMemo(() => {
    const statuses = [...new Set(vpsInstances.map(instance => instance.status))];
    return statuses.sort((a, b) => a.localeCompare(b));
  }, [vpsInstances]);

  const osOptions = useMemo(() => {
    const osTemplates = [...new Set(vpsInstances.map(instance => instance.os_template))];
    return osTemplates.sort((a, b) => a.localeCompare(b));
  }, [vpsInstances]);

  const nodeOptions = useMemo(() => {
    const nodes = [...new Set(vpsInstances.map(instance => instance.node))];
    return nodes.sort((a, b) => a.localeCompare(b));
  }, [vpsInstances]);

  const planOptions = useMemo(() => {
    const plans = [...new Set(vpsInstances.map(instance => instance.plan_name).filter(Boolean) as string[])];
    return plans.sort((a, b) => a.localeCompare(b));
  }, [vpsInstances]);

  // Filter and sort instances
  const filteredAndSortedInstances = useMemo(() => {
    let filtered = vpsInstances.filter(instance => {
      const matchesSearch = !searchTerm ||
        instance.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.vm_id?.toString().includes(searchTerm) ||
        instance.ip_address?.includes(searchTerm) ||
        (instance.proxmox_public_ip?.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
      const matchesOS = osFilter === 'all' || instance.os_template === osFilter;
      const matchesNode = nodeFilter === 'all' || instance.node === nodeFilter;
      const matchesPlan = planFilter === 'all' || instance.plan_name === planFilter;

      return matchesSearch && matchesStatus && matchesOS && matchesNode && matchesPlan;
    });

    // Sort instances
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {

        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'cost':
          aValue = a.monthly_cost || 0;
          bValue = b.monthly_cost || 0;
          break;
        case 'usage':
          aValue = a.resource_usage?.cpu_percent || 0;
          bValue = b.resource_usage?.cpu_percent || 0;
          break;
        case 'name':
        default:
          aValue = (a.hostname || '').toLowerCase();
          bValue = (b.hostname || '').toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [vpsInstances, searchTerm, statusFilter, osFilter, nodeFilter, planFilter, sortBy, sortOrder]);

  // Group instances by status for categorization
  const instancesByStatus = useMemo(() => {
    const groups: Record<string, VPSInstance[]> = {};
    filteredAndSortedInstances.forEach(instance => {
      if (!groups[instance.status]) {
        groups[instance.status] = [];
      }
      groups[instance.status].push(instance);
    });
    return groups;
  }, [filteredAndSortedInstances]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConnectionIP = (instance: VPSInstance) => {
    return instance.proxmox_public_ip || instance.ip_address;
  };

  const getSSHPort = (instance: VPSInstance) => {
    return instance.vm_external_port || 22;
  };

  const getSSHCommand = (instance: VPSInstance) => {
    const ip = getConnectionIP(instance);
    const port = getSSHPort(instance);
    return ip ? `ssh root@${ip} -p ${port}` : 'IP address pending...';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-primary bg-primary/10';
      case 'stopped': return 'text-destructive bg-destructive/10';
      case 'creating': return 'text-secondary-foreground bg-secondary';
      case 'suspended': return 'text-destructive bg-destructive/10';
      case 'terminated': return 'text-muted-foreground bg-muted';
      case 'error': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return CheckCircleIcon;
      case 'stopped': return XCircleIcon;
      case 'creating': return ArrowPathIcon;
      case 'suspended': return ExclamationTriangleIcon;
      case 'terminated': return XCircleIcon;
      case 'error': return ExclamationTriangleIcon;
      default: return XCircleIcon;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOSFilter('all');
    setNodeFilter('all');
    setPlanFilter('all');
  };

  const activeFiltersCount = [statusFilter, osFilter, nodeFilter, planFilter].filter(f => f !== 'all').length;

  const renderVPSCard = (instance: VPSInstance) => {
    const StatusIcon = getStatusIcon(instance.status);
    const connectionIP = getConnectionIP(instance);
    const sshPort = getSSHPort(instance);
    const sshCommand = getSSHCommand(instance);

    return (
      <motion.div
        key={instance.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ServerIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{instance.hostname || `VPS-${instance.vm_id}`}</h3>
              <p className="text-sm text-muted-foreground">{instance.plan_name || `VM ID: ${instance.vm_id}`}</p>
            </div>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {instance.status}
          </div>
        </div>

        {/* Specs */}
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
            <WifiIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{instance.bandwidth_gb || 'Unlimited'} GB</span>
          </div>
        </div>

        {/* Usage Stats */}
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
              <span>Disk Usage</span>
              <span>{instance.resource_usage?.disk_percent || 0}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${instance.resource_usage?.disk_percent || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Connection IP:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">{connectionIP || 'Pending'}</span>
              {connectionIP && (
                <button
                  onClick={() => copyToClipboard(connectionIP)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SSH Port:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">{sshPort}</span>
              <button
                onClick={() => copyToClipboard(sshPort.toString())}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {instance.ip_address && instance.proxmox_public_ip && instance.ip_address !== instance.proxmox_public_ip && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Internal IP:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">{instance.ip_address}</span>
                <button
                  onClick={() => copyToClipboard(instance.ip_address)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Root Password:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">
                {showPassword[instance.id] ? (instance.root_password || 'Not set') : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(prev => ({
                  ...prev,
                  [instance.id]: !prev[instance.id]
                }))}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword[instance.id] ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
              {instance.root_password && (
                <button
                  onClick={() => copyToClipboard(instance.root_password)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Node:</span>
            <span className="text-sm">{instance.node}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">OS Template:</span>
            <span className="text-sm">{instance.os_template}</span>
          </div>
          {instance.rdp_enabled && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">RDP Users:</span>
              <span className="text-sm">{instance.rdp_users_configured}</span>
            </div>
          )}
        </div>

        {/* SSH Connection Command */}
        <div className="p-3 bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center">
              <CommandLineIcon className="h-4 w-4 mr-1" />
              SSH Connection
            </span>
            {connectionIP && (
              <button
                onClick={() => copyToClipboard(sshCommand)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <code className="text-xs text-primary font-mono break-all">
            {sshCommand}
          </code>
        </div>

        {/* Instance Info Button */}
        <button
          onClick={() => setSelectedInstance(instance)}
          className="w-full mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center"
        >
          View Details
        </button>

        {/* Billing Info */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Monthly Cost: <span className="text-primary font-semibold">${instance.monthly_cost || 'N/A'}</span></span>
          <span>Expires: {instance.expired_at ? new Date(instance.expired_at).toLocaleDateString() : 'N/A'}</span>
        </div>
      </motion.div>
    );
  };

  const renderVPSList = (instance: VPSInstance) => {
    const StatusIcon = getStatusIcon(instance.status);
    const connectionIP = getConnectionIP(instance);

    return (
      <motion.div
        key={instance.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card rounded-lg p-4 border transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ServerIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{instance.hostname || `VPS-${instance.vm_id}`}</h3>
              <p className="text-sm text-muted-foreground">{instance.plan_name} • {instance.os_template} • {instance.node}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CPU/RAM</p>
              <p className="text-sm">{instance.cpu_cores}c/{instance.ram_gb}GB</p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">IP Address</p>
              <p className="text-sm font-mono">{connectionIP || 'Pending'}</p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="text-sm text-primary font-semibold">${instance.monthly_cost || 'N/A'}</p>
            </div>

            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {instance.status}
            </div>

            <button
              onClick={() => setSelectedInstance(instance)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
          <p className="text-gray-400">Please log in to view your VPS instances</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-28 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-10 w-28 bg-muted animate-pulse rounded-lg"></div>
          </div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded-lg"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-28 bg-muted animate-pulse rounded-lg"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-36 bg-muted animate-pulse rounded-lg"></div>
              <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
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
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>

              {/* SSH Command */}
              <div className="h-16 w-full bg-muted/50 animate-pulse rounded-lg mb-4"></div>

              {/* View Details Button */}
              <div className="h-10 w-full bg-muted animate-pulse rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const renderInstances = () => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedInstances.map(renderVPSCard)}
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {filteredAndSortedInstances.map(renderVPSList)}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">VPS Management</h1>
          <p className="text-muted-foreground mt-2">
            {filteredAndSortedInstances.length} of {vpsInstances.length} instances
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? (
              <>
                <ListBulletIcon className="h-5 w-5 mr-2" />
                List View
              </>
            ) : (
              <>
                <Squares2X2Icon className="h-5 w-5 mr-2" />
                Grid View
              </>
            )}
          </button>
          <button
            onClick={fetchVPSInstances}
            disabled={loading || !accessToken}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by hostname, VM ID, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 bg-card border rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="created">Sort by Created</option>
              <option value="cost">Sort by Cost</option>
              <option value="usage">Sort by CPU Usage</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border"
            >
              <div>
                <label htmlFor="status-filter" className="block text-sm text-muted-foreground mb-2">Status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="os-filter" className="block text-sm text-muted-foreground mb-2">Operating System</label>
                <select
                  id="os-filter"
                  value={osFilter}
                  onChange={(e) => setOSFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">All OS</option>
                  {osOptions.map(os => (
                    <option key={os} value={os}>{os}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="node-filter" className="block text-sm text-muted-foreground mb-2">Node</label>
                <select
                  id="node-filter"
                  value={nodeFilter}
                  onChange={(e) => setNodeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">All Nodes</option>
                  {nodeOptions.map(node => (
                    <option key={node} value={node}>{node}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="plan-filter" className="block text-sm text-muted-foreground mb-2">Plan</label>
                <select
                  id="plan-filter"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">All Plans</option>
                  {planOptions.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* VPS Instances */}
      {filteredAndSortedInstances.length === 0 ? (
        <div className="text-center py-12">
          <ServerIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {vpsInstances.length === 0 ? 'No VPS Instances' : 'No Matching Instances'}
          </h3>
          <p className="text-gray-500">
            {vpsInstances.length === 0
              ? "You don't have any VPS instances yet."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {vpsInstances.length > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        renderInstances()
      )}

      {/* Categorized View (Alternative) */}
      {filteredAndSortedInstances.length > 0 && Object.keys(instancesByStatus).length > 1 && (
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <TagIcon className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="text-lg font-semibold">Grouped by Status</h2>
          </div>
          <div className="space-y-6">
            {Object.entries(instancesByStatus).map(([status, instances]) => (
              <div key={status}>
                <div className={`flex items-center mb-3 px-3 py-1 rounded-lg inline-flex ${getStatusColor(status)}`}>
                  <span className="font-medium capitalize">{status}</span>
                  <span className="ml-2 text-xs">({instances.length})</span>
                </div>
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "space-y-3"
                }>
                  {instances.map(instance =>
                    viewMode === 'grid' ? renderVPSCard(instance) : renderVPSList(instance)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instance Details Modal */}
      <AnimatePresence>
        {selectedInstance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInstance(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">VPS Details</h2>
                <button
                  onClick={() => setSelectedInstance(null)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Detailed instance information */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="detail-hostname" className="text-sm text-muted-foreground">Instance Name</label>
                      <p id="detail-hostname" className="font-medium">{selectedInstance.hostname || `VPS-${selectedInstance.vm_id}`}</p>
                    </div>
                    <div>
                      <label htmlFor="detail-plan" className="text-sm text-muted-foreground">Plan</label>
                      <p id="detail-plan" className="font-medium">{selectedInstance.plan_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label htmlFor="detail-vmid" className="text-sm text-muted-foreground">VM ID</label>
                      <p id="detail-vmid" className="font-medium">{selectedInstance.vm_id}</p>
                    </div>
                    <div>
                      <label htmlFor="detail-node" className="text-sm text-muted-foreground">Node</label>
                      <p id="detail-node" className="font-medium">{selectedInstance.node}</p>
                    </div>
                  </div>
                </div>

                {/* System Specs */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">System Specifications</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU Cores:</span>
                      <span className="text-foreground">{selectedInstance.cpu_cores} vCPU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RAM:</span>
                      <span className="text-foreground">{selectedInstance.ram_gb} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <span className="text-foreground">{selectedInstance.storage_gb} GB SSD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bandwidth:</span>
                      <span className="text-foreground">{selectedInstance.bandwidth_gb || 'Unlimited'} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">OS Template:</span>
                      <span className="text-foreground">{selectedInstance.os_template}</span>
                    </div>
                  </div>
                </div>

                {/* Connection Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Connection Details</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Connection IP:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{getConnectionIP(selectedInstance) || 'Pending'}</span>
                        {getConnectionIP(selectedInstance) && (
                          <button
                            onClick={() => copyToClipboard(getConnectionIP(selectedInstance))}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">SSH Port:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{getSSHPort(selectedInstance)}</span>
                        <button
                          onClick={() => copyToClipboard(getSSHPort(selectedInstance).toString())}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {selectedInstance.ip_address && selectedInstance.proxmox_public_ip && selectedInstance.ip_address !== selectedInstance.proxmox_public_ip && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Internal IP:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">{selectedInstance.ip_address}</span>
                          <button
                            onClick={() => copyToClipboard(selectedInstance.ip_address)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Root Password:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">
                          {showPassword[selectedInstance.id] ? (selectedInstance.root_password || 'Not set') : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPassword(prev => ({
                            ...prev,
                            [selectedInstance.id]: !prev[selectedInstance.id]
                          }))}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword[selectedInstance.id] ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                        {selectedInstance.root_password && (
                          <button
                            onClick={() => copyToClipboard(selectedInstance.root_password)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SSH Command */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-sm text-muted-foreground mb-2">SSH Connection Command:</h4>
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-primary font-mono">
                      {getSSHCommand(selectedInstance)}
                    </code>
                    {getConnectionIP(selectedInstance) && (
                      <button
                        onClick={() => copyToClipboard(getSSHCommand(selectedInstance))}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Billing */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Billing Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Monthly Cost:</span>
                      <span className="text-primary font-semibold ml-2">${selectedInstance.monthly_cost || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 capitalize px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInstance.status)}`}>
                        {selectedInstance.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-foreground ml-2">{new Date(selectedInstance.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="text-foreground ml-2">{selectedInstance.expired_at ? new Date(selectedInstance.expired_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VPSManagement;