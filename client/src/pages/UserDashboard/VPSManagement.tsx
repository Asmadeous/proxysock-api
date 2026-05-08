import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ServerIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  KeyIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import VPSCard, { VPSInstance } from "@/components/dashboard/products/VPSCard";
import ManageSubscriptionModal from "@/components/dashboard/ManageSubscriptionModal";
import { useAuth } from "../../context/AuthContext";



type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'status' | 'created' | 'cost' | 'usage';
type SortOrder = 'asc' | 'desc';

import api, { fetchVms, startVm, stopVm, rebootVm, deleteVm, changeVmPassword } from "../../services/api";
import { toast } from "react-hot-toast";

const VPSManagement = () => {
  const [vpsInstances, setVpsInstances] = useState<VPSInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [selectedInstance, setSelectedInstance] = useState<VPSInstance | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<VPSInstance | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { accessToken } = useAuth();
  const location = useLocation();

  // Handle auto-search from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);

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

  const [subscriptionModalInstance, setSubscriptionModalInstance] = useState<VPSInstance | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadVPSInstances();
    }
  }, [accessToken]);

  const loadVPSInstances = async () => {
    try {
      setLoading(true);
      const response = await fetchVms({ vm_type: 'vps' });
      const allVms: VPSInstance[] = response.data.vms || [];
      setVpsInstances(allVms);
    } catch (error) {
      console.error('Failed to fetch VPS instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string | number, action: 'start' | 'stop' | 'reboot' | 'delete') => {
    try {
      let response;

      switch (action) {
        case 'start': response = await startVm(id); break;
        case 'stop': response = await stopVm(id); break;
        case 'reboot': response = await rebootVm(id); break;
        case 'delete': response = await deleteVm(id); break;
      }

      toast.success(response?.data?.message || `Action ${action} initiated`);

      // OPTIONAL: Poll status or just refresh after a delay
      setTimeout(loadVPSInstances, 2000);
    } catch (error) {
      // Error is already toasted by api.ts interceptor
    }
  };

  const handleChangePassword = async () => {
    if (!showPasswordModal || !newPassword) return;

    try {
      setIsUpdatingPassword(true);
      await changeVmPassword(showPasswordModal.id, newPassword);
      toast.success('Password change initiated successfully');
      setShowPasswordModal(null);
      setNewPassword('');
      loadVPSInstances();
    } catch (error) {
      // Error is toasted by interceptor
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Get unique values for filter options
  const statusOptions = useMemo(() => {
    const statuses = [...new Set(vpsInstances.map(instance => instance.status).filter(Boolean) as string[])];
    return statuses.sort((a, b) => a.localeCompare(b));
  }, [vpsInstances]);

  const osOptions = useMemo(() => {
    const osTemplates = [...new Set(vpsInstances.map(instance => instance.os_template).filter(Boolean) as string[])];
    return osTemplates.sort((a, b) => a.localeCompare(b));
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
        instance.vm_id?.toString().includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
      const matchesOS = osFilter === 'all' || instance.os_template === osFilter;
      const matchesPlan = planFilter === 'all' || instance.plan_name === planFilter;

      return matchesSearch && matchesStatus && matchesOS && matchesPlan;
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

  const getSubdomain = (instance: VPSInstance) => {
    return instance.dns_name || 'Generating...';
  };

  const getSSHPort = (instance: VPSInstance) => {
    const template = instance.os_template?.toLowerCase() || '';
    if (template.includes('windows') || template.includes('rdp')) {
      return instance.rdp_port || 3389;
    }
    return instance.ssh_port || 22;
  };

  const getSSHCommand = (instance: VPSInstance) => {
    const subdomain = getSubdomain(instance);
    const port = getSSHPort(instance);
    const isWindows = instance.os_template?.toLowerCase().includes('windows');
    const user = instance.username || (isWindows ? 'Administrator' : (instance.hostname || 'root'));
    return subdomain !== 'Generating...' ? `ssh ${user}@${subdomain} -p ${port}` : 'Subdomain pending...';
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



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };



  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOSFilter('all');
    setNodeFilter('all');
    setPlanFilter('all');
  };

  const activeFiltersCount = [statusFilter, osFilter, nodeFilter, planFilter].filter(f => f !== 'all').length;

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
          {filteredAndSortedInstances.map(instance => (
            <VPSCard 
              key={instance.id} 
              instance={instance} 
              onAction={handleAction}
              onShowDetails={(inst) => setSelectedInstance(inst)}
              onShowSubscription={(inst) => setSubscriptionModalInstance(inst)}
              onShowPasswordModal={(inst) => setShowPasswordModal(inst)}
            />
          ))}
        </div>
      );
    }
    
    // Simple fallback for list view using the same card component for now
    return (
      <div className="flex flex-col gap-4">
        {filteredAndSortedInstances.map(instance => (
          <VPSCard 
            key={instance.id} 
            instance={instance} 
            onAction={handleAction}
            onShowDetails={(inst) => setSelectedInstance(inst)}
            onShowSubscription={(inst) => setSubscriptionModalInstance(inst)}
            onShowPasswordModal={(inst) => setShowPasswordModal(inst)}
          />
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/products"
            className="p-2 hover:bg-muted rounded-full transition-colors group"
            title="Back to Product Management"
          >
            <ArrowLeftIcon className="h-6 w-6 text-muted-foreground group-hover:text-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">VPS Management</h1>
            <p className="text-muted-foreground mt-1">
              {filteredAndSortedInstances.length} of {vpsInstances.length} instances
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
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
            onClick={loadVPSInstances}
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
            placeholder="Search by hostname or VM ID..."
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border"
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
                      <span className="text-muted-foreground">Subdomain:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{getSubdomain(selectedInstance)}</span>
                        {selectedInstance.dns_name && (
                          <button
                            onClick={() => copyToClipboard(selectedInstance.dns_name || '')}
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
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Username:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono">
                              {selectedInstance.username || (selectedInstance.os_template?.toLowerCase().includes('windows') ? 'Administrator' : (selectedInstance.hostname || 'root'))}
                            </span>
                            <button
                              onClick={() => copyToClipboard(selectedInstance.username || (selectedInstance.os_template?.toLowerCase().includes('windows') ? 'Administrator' : (selectedInstance.hostname || 'root')))}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
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
                    {selectedInstance.dns_name && (
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
                      <span className="text-foreground ml-2">{selectedInstance.expires_at ? new Date(selectedInstance.expires_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-md w-full border border-primary/20 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <KeyIcon className="h-5 w-5 mr-2 text-primary" />
                  Change Password
                </h2>
                <button
                  onClick={() => setShowPasswordModal(null)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Updating password for <strong>{showPasswordModal.hostname || `VM ${showPasswordModal.vm_id}`}</strong>.
                This will securely update the credentials on your instance. Please allow a few minutes for the changes to apply.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(null)}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword || !newPassword}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : 'Update Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Subscription Management Modal */}
      <ManageSubscriptionModal
        isOpen={!!subscriptionModalInstance}
        onClose={() => setSubscriptionModalInstance(null)}
        orderId={subscriptionModalInstance?.order_id || ''}
        autoRenew={!!subscriptionModalInstance?.auto_renew}
        renewalMethod={subscriptionModalInstance?.renewal_method || 'wallet'}
        expiresAt={subscriptionModalInstance?.expires_at || ''}
        onUpdate={loadVPSInstances}
        api={api}
      />

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-md w-full border shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Change VPS Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a new root/administrator password for <strong>{showPasswordModal.hostname}</strong>. 
                The instance will need to be running for this to take effect.
              </p>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-background border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(null)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isUpdatingPassword || !newPassword}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VPSManagement;