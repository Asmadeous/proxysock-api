import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComputerDesktopIcon,
  CpuChipIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import RDPCard, { RDPInstance } from "@/components/dashboard/products/RDPCard";
import ManageSubscriptionModal from "@/components/dashboard/ManageSubscriptionModal";
import api, { fetchVms, startVm, stopVm, rebootVm, deleteVm, changeVmPassword } from "../../services/api";
import { toast } from "sonner";
import { PencilIcon } from "@heroicons/react/24/outline";



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
          placeholder="Search by hostname, VM ID, or username..."
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

interface RDPInstanceDetailsModalProps {
  instance: RDPInstance | null;
  onClose: () => void;
  getStatusTextColor: (status: string) => string;
  showPassword: Record<string, boolean>;
  setShowPassword: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  copyToClipboard: (text: string) => void;
  onShowPasswordModal: (instance: RDPInstance) => void;
  refreshing: Record<string, boolean>;
}

const RDPInstanceDetailsModal = ({
  instance,
  onClose,
  getStatusTextColor,
  showPassword,
  setShowPassword,
  copyToClipboard,
  onShowPasswordModal,
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
                  <span className="text-gray-400">Subdomain:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">{instance.dns_name || 'Generating...'}</span>
                    {instance.dns_name && (
                      <button
                        onClick={() => copyToClipboard(instance.dns_name!)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-gray-400">RDP Port:</span><span className="text-white font-mono">{instance.rdp_port || 3389}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Username:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">
                      {instance.rdp_username || (instance.os_template?.toLowerCase().includes('win') ? 'Administrator' : instance.hostname)}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(instance.rdp_username || (instance.os_template?.toLowerCase().includes('win') ? 'Administrator' : instance.hostname))} 
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Password:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">{showPassword[instance.id.toString()] ? instance.rdp_password : '••••••••••••'}</span>
                    <button onClick={() => setShowPassword(prev => ({ ...prev, [instance.id.toString()]: !prev[instance.id.toString()] }))} className="p-1 text-gray-400 hover:text-white transition-colors">
                      {showPassword[instance.id.toString()] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                    <button onClick={() => copyToClipboard(instance.rdp_password || '')} className="p-1 text-gray-400 hover:text-white transition-colors">
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onShowPasswordModal(instance)}
                      className="p-1 text-primary hover:text-primary/80 transition-colors"
                      title="Change Password"
                    >
                      <PencilIcon className="h-4 w-4" />
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

const RDPManagement = () => {
  const [rdpInstances, setRdpInstances] = useState<RDPInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});
  const [selectedInstance, setSelectedInstance] = useState<RDPInstance | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [showPasswordModal, setShowPasswordModal] = useState<RDPInstance | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [subscriptionModalInstance, setSubscriptionModalInstance] = useState<RDPInstance | null>(null);
  const { accessToken } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);

  useEffect(() => {
    if (accessToken) {
      loadRDPInstances();
    }
  }, [accessToken]);

  const loadRDPInstances = async () => {
    try {
      setLoading(true);
      const response = await fetchVms({ vm_type: 'rdp' });
      const allRdp: RDPInstance[] = response.data.vms || [];
      setRdpInstances(allRdp);
    } catch (error) {
      console.error('Failed to fetch RDP instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string | number, action: 'start' | 'stop' | 'reboot' | 'delete') => {
    try {
      setRefreshing(prev => ({ ...prev, [id]: true }));
      let response;

      switch (action) {
        case 'start': response = await startVm(id); break;
        case 'stop': response = await stopVm(id); break;
        case 'reboot': response = await rebootVm(id); break;
        case 'delete': response = await deleteVm(id); break;
      }

      toast.success(response?.data?.message || `Action ${action} initiated`);
      setTimeout(loadRDPInstances, 2000);
    } catch (error) {
    } finally {
      setRefreshing(prev => ({ ...prev, [id]: false }));
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
      loadRDPInstances();
    } catch (error) {
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const filteredAndSortedInstances = useMemo(() => {
    let filtered = rdpInstances.filter(instance => {
      const matchesSearch = !searchTerm ||
        instance.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.vm_id?.toString().includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
      const matchesServiceType = serviceTypeFilter === 'all' || instance.service_type === serviceTypeFilter;

      return matchesSearch && matchesStatus && matchesServiceType;
    });

    filtered.sort((a, b) => {
      let aValue: any = a.hostname || '', bValue: any = b.hostname || '';
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rdpInstances, searchTerm, statusFilter, serviceTypeFilter, sortOrder]);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <h1 className="text-3xl font-bold">RDP Management</h1>
            <p className="text-muted-foreground mt-1">
              {filteredAndSortedInstances.length} of {rdpInstances.length} instances
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadRDPInstances}
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
        filteredCount={filteredAndSortedInstances.length}
        totalCount={rdpInstances.length}
      />

      {filteredAndSortedInstances.length === 0 ? (
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
          {filteredAndSortedInstances.map(instance => (
            <RDPCard 
              key={instance.id} 
              instance={instance} 
              onAction={handleAction}
              onShowDetails={(inst) => setSelectedInstance(inst)}
              onShowSubscription={(inst) => setSubscriptionModalInstance(inst)}
              onShowPasswordModal={(inst) => setShowPasswordModal(inst)}
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
        refreshing={refreshing}
        copyToClipboard={copyToClipboard}
        onShowPasswordModal={(inst) => setShowPasswordModal(inst)}
      />
      {/* Subscription Management Modal */}
      <ManageSubscriptionModal
        isOpen={!!subscriptionModalInstance}
        onClose={() => setSubscriptionModalInstance(null)}
        orderId={subscriptionModalInstance?.order_id || ''}
        autoRenew={!!subscriptionModalInstance?.auto_renew}
        renewalMethod={subscriptionModalInstance?.renewal_method || 'wallet'}
        expiresAt={subscriptionModalInstance?.expires_at || ''}
        onUpdate={loadRDPInstances}
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
              <h3 className="text-xl font-bold mb-4">Change RDP Password</h3>
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

export default RDPManagement;