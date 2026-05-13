import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import ESIMCard, { ESIMProfile } from "@/components/dashboard/products/ESIMCard";
import { toast } from "sonner";



const ESIMManagement = () => {
  const [esimProfiles, setEsimProfiles] = useState<ESIMProfile[]>([]);
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ESIMProfile | null>(null);
  // NOTE: In-house eSIM credentials (e.g., SM-DP+ address and activation code) 
  // cannot be changed programmatically. These are fixed per profile by the provider.
  const [showQRModal, setShowQRModal] = useState<ESIMProfile | null>(null);
  const [subscriptionModalProfile, setSubscriptionModalProfile] = useState<ESIMProfile | null>(null);

  const { accessToken } = useAuth();
  const location = useLocation();

  // Handle auto-search from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search) {
      // For eSIM, we search ICCID, Order No, or Package Name
      // We'll set the productTypeFilter to 'all' to ensure the search is effective
      setProductTypeFilter('all');
      setSearchTerm(search);
    }
  }, [location.search]);

  useEffect(() => {
    fetchESIMProfiles();
  }, []);

  const fetchESIMProfiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/web/api/orders?product_type=esim,usa_esim');
      if (response.data && response.data.orders) {
        const transformedProfiles = response.data.orders
          .flatMap((order: any) => {
            const credentials = order.credentials_list || [order.credentials];
            return credentials.filter(Boolean).map((cred: any, index: number) => ({
              id: `${order.id}-${cred.id || index}`,
              esim_order_id: String(order.id),
              product_type: order.product_type || 'esim',
              order_no: order.order_number, // Keep order_no
              plan_name: order.product_name,
              package_name: order.product_name, // Keep package_name for compatibility
              location_name: order.country || 'Global', // Keep location_name
              location_code: order.proxy_type || 'US', // Keep location_code
              data_limit_gb: order.esim_details?.data_amount_gb || 0,
              duration_days: order.esim_details?.duration_days || 30,
              iccid: cred.iccid || '',
              qr_code_url: cred.qr_code || '',
              activation_code: cred.activation_code || cred.qr_activation_code || '',
              esim_status: (order.status === 'completed' || order.status === 'active') ? 'active' : order.status,
              created_at: order.created_at,
              expires_at: order.expires_at || new Date(new Date(order.created_at).getTime() + (order.esim_details?.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
              expired_time: order.expires_at, // Keep expired_time for compatibility
              total_volume: order.esim_details?.data_amount_gb ? order.esim_details.data_amount_gb * 1024 : 0, // in MB
              order_usage: 0, // Placeholder
              usage_percent: 0, // Placeholder
              remaining_data: order.esim_details?.data_amount_gb ? order.esim_details.data_amount_gb * 1024 : 0, // Placeholder
              usage: {
                data_used_gb: 0,
                data_total_gb: order.esim_details?.data_amount_gb || 0,
                days_left: order.esim_details?.duration_days || 30
              },
              pin1: cred.pin1 || '',
              puk1: cred.puk1 || '',
              pin2: cred.pin2 || '',
              puk2: cred.puk2 || '',
              zip_code: cred.zip_code || '',
              is_expired: order.status === 'expired',
              order_total: Number(order.amount || order.total_amount || 0),
              order_status: order.status,
              days_remaining: order.expires_at ? Math.max(0, Math.ceil((new Date(order.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null,
              auto_renew: order.auto_renew,
              renewal_method: order.renewal_method,
            }));
          });
        setEsimProfiles(transformedProfiles);
      }
    } catch (error) {
      console.error('Failed to fetch eSIM profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => esimProfiles.filter(profile => {
    const matchesProductType = productTypeFilter === 'all' || profile.product_type === productTypeFilter;
    const matchesSearch = !searchTerm || 
      profile.iccid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.order_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.package_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesProductType && matchesSearch;
  }), [esimProfiles, productTypeFilter, searchTerm]);

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleReorder = async (orderId: string) => {
    try {
      setLoading(true);
      await api.post(`/web/api/orders/${orderId}/reorder`);
      toast.success("Reorder successful! A new order has been created.");
      fetchESIMProfiles(); // Refresh data
    } catch (error: any) {
      console.error("Failed to reorder:", error);
      const message = error.response?.data?.error || "Failed to reorder";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDataSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb} MB`;
  };





  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'from-destructive to-destructive';
    if (percent >= 70) return 'from-secondary to-secondary';
    return 'from-primary to-primary';
  };

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to view your eSIM profiles</p>
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
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2"></div>
          </div>
          <div className="h-10 w-28 bg-muted animate-pulse rounded-lg"></div>
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

              {/* Data Plan Info */}
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
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-muted animate-pulse rounded-full"></div>
                  <div className="flex justify-between mt-1">
                    <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <div className="h-10 flex-1 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-10 flex-1 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
              </div>

              {/* Validity Info */}
              <div className="mt-3 flex items-center justify-between">
                <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            <h1 className="text-3xl font-bold">eSIM Management</h1>
            <p className="text-muted-foreground mt-2">Manage your eSIM profiles and data plans</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchESIMProfiles}
            disabled={loading || !accessToken}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by ICCID, Order #, or Plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <GlobeAltIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <select
          value={productTypeFilter}
          onChange={(e) => setProductTypeFilter(e.target.value)}
          className="px-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
        >
          <option value="all">All eSIMs</option>
          <option value="esim">eSIM Access</option>
          <option value="usa_esim">USA eSIM</option>
        </select>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="text-sm text-primary hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* eSIM Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-12">
          <DevicePhoneMobileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No eSIM Profiles</h3>
          <p className="text-muted-foreground">You don't have any eSIM profiles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <ESIMCard
              key={profile.id}
              profile={profile}
              onShowQR={(p) => setShowQRModal(p)}
              onShowDetails={(p) => setSelectedProfile(p)}
              onShowSubscription={(p) => setSubscriptionModalProfile(p)}
              onReorder={handleReorder}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-md w-full border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">eSIM QR Code</h2>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <img
                  src={showQRModal.qr_code_url}
                  alt="eSIM QR Code"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Activation Code:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono break-all">
                      {showQRModal.activation_code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(showQRModal.activation_code)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">📱 To activate your eSIM:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground/80">
                    <li>Go to Settings → Cellular/Mobile</li>
                    <li>Add Cellular/Mobile Plan</li>
                    <li>Scan this QR code</li>
                    <li>Follow the on-screen instructions</li>
                  </ol>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <DevicePhoneMobileIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProfile.package_name}</h2>
                    <p className="text-muted-foreground">{selectedProfile.location_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Package Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Package Details</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-sm">Data Allowance</span>
                        <p className="font-medium">{formatDataSize(selectedProfile.total_volume)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Validity</span>
                        <p className="font-medium">
                          {selectedProfile.total_duration} {selectedProfile.duration_unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Location</span>
                        <p className="font-medium">
                          {selectedProfile.location_name} ({selectedProfile.location_code.toUpperCase()})
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Package Code</span>
                        <p className="font-medium">{selectedProfile.package_code}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Usage Statistics</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Data Usage</span>
                        <span>
                          {formatDataSize(selectedProfile.order_usage)} / {formatDataSize(selectedProfile.total_volume)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3">
                        <div
                          className={`bg-gradient-to-r ${getUsageColor(selectedProfile.usage_percent)} h-3 rounded-full transition-all`}
                          style={{ width: `${selectedProfile.usage_percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{selectedProfile.usage_percent}% used</span>
                        <span>{formatDataSize(selectedProfile.remaining_data)} remaining</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Technical Details</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">ICCID</span>
                      <span className="font-mono text-sm">{selectedProfile.iccid}</span>
                    </div>
                    {selectedProfile.imsi && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">IMSI</span>
                        <span className="font-mono text-sm">{selectedProfile.imsi}</span>
                      </div>
                    )}
                    {selectedProfile.msisdn && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">MSISDN</span>
                        <span className="font-mono text-sm">{selectedProfile.msisdn}</span>
                      </div>
                    )}
                    {selectedProfile.eid && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">EID</span>
                        <span className="font-mono text-sm truncate max-w-[200px]">
                          {selectedProfile.eid}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">eSIM Status</span>
                      <span className={`text-sm ${selectedProfile.is_expired ? 'text-destructive' : 'text-primary'}`}>
                        {selectedProfile.is_expired ? 'Expired' : selectedProfile.esim_status}
                      </span>
                    </div>
                    {selectedProfile.smdp_status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">SM-DP+ Status</span>
                        <span className="text-sm">{selectedProfile.smdp_status}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Order Number</span>
                      <span className="text-sm">{selectedProfile.order_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Transaction</span>
                      <span className="font-mono text-sm">{selectedProfile.esim_tran_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Total Cost</span>
                      <span className="text-primary font-semibold">${selectedProfile.order_total?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Purchase Date</span>
                      <span className="text-sm">
                        {selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {selectedProfile.expired_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Expiry Date</span>
                        <span className={`text-sm ${selectedProfile.is_expired ? 'text-destructive' : ''}`}>
                          {selectedProfile.expired_time ? new Date(selectedProfile.expired_time).toLocaleDateString() : 'N/A'}
                          {selectedProfile.days_remaining && !selectedProfile.is_expired &&
                            ` (${selectedProfile.days_remaining} days remaining)`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  {selectedProfile.qr_code_url && (
                    <button
                      onClick={() => {
                        setShowQRModal(selectedProfile);
                        setSelectedProfile(null);
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <QrCodeIcon className="h-5 w-5 mr-2" />
                      View QR Code
                    </button>
                  )}
                  {selectedProfile.pdf_url && (
                    <a
                      href={selectedProfile.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Subscription Management Modal */}
      <AnimatePresence>
        {subscriptionModalProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border w-full max-w-md shadow-2xl"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ArrowPathIcon className="h-6 w-6 text-primary" />
                  Auto-Renewal Settings
                </h3>
                <button
                  onClick={() => setSubscriptionModalProfile(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Enable Auto-Renewal</h4>
                      <p className="text-sm text-muted-foreground">Automatically renew this eSIM data plan</p>
                    </div>
                    <button
                      onClick={async () => {
                        const newState = !subscriptionModalProfile.auto_renew;
                        try {
                          await api.post(`/web/api/orders/${subscriptionModalProfile.esim_order_id}/update_subscription`, { auto_renew: newState });
                          toast.success(`Auto-renewal ${newState ? 'enabled' : 'disabled'}`);
                          setSubscriptionModalProfile({ ...subscriptionModalProfile, auto_renew: newState });
                          fetchESIMProfiles();
                        } catch (e) {
                          toast.error('Failed to update settings');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${subscriptionModalProfile.auto_renew ? 'bg-primary' : 'bg-muted'
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${subscriptionModalProfile.auto_renew ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm">Preferred Payment Method</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'wallet', name: 'Wallet Balance', icon: ChartBarIcon },
                        { id: 'paystack', name: 'Saved Card (Paystack)', icon: DevicePhoneMobileIcon },
                        // { id: 'fastspring', name: 'FastSpring Subscription', icon: GlobeAltIcon }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={async () => {
                            try {
                              await api.post(`/web/api/orders/${subscriptionModalProfile.esim_order_id}/update_subscription`, { renewal_method: method.id });
                              toast.success(`Payment method updated`);
                              setSubscriptionModalProfile({ ...subscriptionModalProfile, renewal_method: method.id });
                              fetchESIMProfiles();
                            } catch (e) {
                              toast.error('Failed to update method');
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${subscriptionModalProfile.renewal_method === method.id
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border hover:bg-muted'
                            }`}
                        >
                          <method.icon className="h-4 w-4 text-muted-foreground" />
                          <div className="text-left text-sm">
                            <p className="font-medium">{method.name}</p>
                          </div>
                          {subscriptionModalProfile.renewal_method === method.id && (
                            <CheckCircleIcon className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-sm text-yellow-500/90">
                  <ClockIcon className="h-5 w-5 shrink-0" />
                  <p>
                    Ensure your balance is sufficient before <strong>{new Date(subscriptionModalProfile.expired_time).toLocaleDateString()}</strong>.
                  </p>
                </div>

                <button
                  onClick={() => setSubscriptionModalProfile(null)}
                  className="w-full py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ESIMManagement;