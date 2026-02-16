import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SignalIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import railsApi from "@/lib/railsApi";

interface ESIMProfile {
  id: string;
  esim_order_id: string;
  user_id: string;
  esim_tran_no: string
  order_no: string;
  iccid: string;
  imsi: string;
  msisdn: string;
  qr_code_url: string;
  activation_code: string;
  smdp_status: string;
  esim_status: string;
  eid: string;
  package_code: string;
  package_name: string;
  location_code: string;
  location_name: string;
  total_volume: number; // in MB
  total_duration: number;
  duration_unit: string;
  order_usage: number; // in MB
  expired_time: string;
  created_at: string;
  updated_at: string;
  pdf_url: string;
  // Enhanced fields from edge function
  usage_percent: number;
  remaining_data: number;
  is_expired: boolean;
  days_remaining: number | null;
  order_total: number;
  order_status: string;
}

const ESIMManagement = () => {
  const [esimProfiles, setEsimProfiles] = useState<ESIMProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ESIMProfile | null>(null);
  const [showActivationCode, setShowActivationCode] = useState<{ [key: string]: boolean }>({});
  const [showQRModal, setShowQRModal] = useState<ESIMProfile | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      fetchESIMProfiles();
    }
  }, [accessToken]);

  const fetchESIMProfiles = async () => {
    try {
      setLoading(true);
      // Fetch orders filtering for eSIM type
      const { data } = await railsApi.get('/orders');

      let orders: any[] = [];
      if (Array.isArray(data)) {
        orders = data;
      } else if (data && Array.isArray((data as any).orders)) {
        orders = (data as any).orders;
      }

      // Filter eSIM orders
      const esimOrders = orders.filter((o: any) =>
        (o.product_type === 'esim' || o.type === 'esim') && (o.profiles && o.profiles.length > 0)
      );

      // Flatten and map to ESIMProfile with calculated stats
      const profiles: ESIMProfile[] = esimOrders.flatMap((order: any) =>
        order.profiles.map((p: any) => {
          const total = p.total_volume || 0;
          const usage = p.order_usage || 0; // Assuming backend provides usage, otherwise default 0
          const percent = total > 0 ? (usage / total) * 100 : 0;
          const remaining = Math.max(0, total - usage);
          const now = new Date();
          const expiry = p.expired_time ? new Date(p.expired_time) : null;
          const isExpired = expiry ? now > expiry : false;
          // If expired, days remaining is 0 or negative
          const days = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

          return {
            ...p,
            id: p.id || `${order.id}-${p.iccid}`, // Ensure ID
            esim_order_id: order.id,
            order_no: order.order_number || order.id,
            // Inherit from order or profile
            package_name: p.package_name || order.package_name || order.product_name,
            order_total: order.total_amount || 0,
            order_status: order.status,
            // Calculated fields
            usage_percent: Math.round(percent),
            remaining_data: remaining,
            is_expired: isExpired,
            days_remaining: days,
            // Fill missing if needed
            created_at: p.created_at || order.created_at,
            esim_status: isExpired ? 'Expired' : (p.status || order.status), // Infer status
          } as ESIMProfile;
        })
      );

      setEsimProfiles(profiles);
    } catch (error) {
      console.error('Failed to fetch eSIM profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDataSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb} MB`;
  };

  const getStatusColor = (status: string, isExpired: boolean) => {
    if (isExpired) return 'text-destructive bg-destructive/10';

    switch (status?.toLowerCase()) {
      case 'active':
      case 'activated':
      case 'delivered':
        return 'text-primary bg-primary/10';
      case 'pending':
      case 'allocated':
        return 'text-secondary-foreground bg-secondary';
      case 'inactive':
      case 'suspended':
        return 'text-muted-foreground bg-muted';
      case 'failed':
      case 'error':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string, isExpired: boolean) => {
    if (isExpired) return XCircleIcon;

    switch (status?.toLowerCase()) {
      case 'active':
      case 'activated':
      case 'delivered':
        return CheckCircleIcon;
      case 'pending':
      case 'allocated':
        return ClockIcon;
      case 'inactive':
      case 'suspended':
        return ExclamationTriangleIcon;
      case 'failed':
      case 'error':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">eSIM Management</h1>
          <p className="text-muted-foreground mt-2">Manage your eSIM profiles and data plans</p>
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

      {/* eSIM Profiles Grid */}
      {esimProfiles.length === 0 ? (
        <div className="text-center py-12">
          <DevicePhoneMobileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No eSIM Profiles</h3>
          <p className="text-muted-foreground">You don't have any eSIM profiles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {esimProfiles.map((profile) => {
            const StatusIcon = getStatusIcon(profile.esim_status, profile.is_expired);
            const displayStatus = profile.is_expired ? 'Expired' : profile.esim_status;

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-6 border transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DevicePhoneMobileIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{profile.package_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {profile.location_name}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(displayStatus, profile.is_expired)}`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {displayStatus}
                  </div>
                </div>

                {/* Data Plan Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDataSize(profile.total_volume)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile.total_duration} {profile.duration_unit}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.location_code.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <SignalIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile.days_remaining ? `${profile.days_remaining} days left` : 'Expired'}
                    </span>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Data Usage</span>
                      <span>{formatDataSize(profile.order_usage)} / {formatDataSize(profile.total_volume)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getUsageColor(profile.usage_percent)} h-2 rounded-full transition-all`}
                        style={{ width: `${profile.usage_percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{profile.usage_percent}% used</span>
                      <span>{formatDataSize(profile.remaining_data)} remaining</span>
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ICCID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-right truncate max-w-[150px]">
                        {profile.iccid}
                      </span>
                      <button
                        onClick={() => copyToClipboard(profile.iccid)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {profile.msisdn && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Phone:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">{profile.msisdn}</span>
                        <button
                          onClick={() => copyToClipboard(profile.msisdn)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {profile.activation_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Activation:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono truncate max-w-[120px]">
                          {showActivationCode[profile.id]
                            ? profile.activation_code
                            : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowActivationCode(prev => ({
                            ...prev,
                            [profile.id]: !prev[profile.id]
                          }))}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showActivationCode[profile.id] ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(profile.activation_code)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {profile.qr_code_url && (
                    <button
                      onClick={() => setShowQRModal(profile)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    >
                      <QrCodeIcon className="h-4 w-4 mr-2" />
                      QR Code
                    </button>
                  )}
                  {profile.pdf_url && (
                    <a
                      href={profile.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      PDF
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedProfile(profile)}
                    className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Validity Info */}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Cost: <span className="text-primary font-semibold">${(profile.order_total / 10000).toFixed(2) || 'N/A'}</span></span>
                  <span>
                    {profile.expired_time
                      ? `Expires: ${new Date(profile.expired_time).toLocaleDateString()}`
                      : 'No expiry'}
                  </span>
                </div>
              </motion.div>
            );
          })}
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
                    <div className="grid grid-cols-2 gap-4">
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
                      <span className="text-primary font-semibold">${(selectedProfile.order_total / 10000).toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Purchase Date</span>
                      <span className="text-sm">
                        {new Date(selectedProfile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedProfile.expired_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Expiry Date</span>
                        <span className={`text-sm ${selectedProfile.is_expired ? 'text-destructive' : ''}`}>
                          {new Date(selectedProfile.expired_time).toLocaleDateString()}
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
    </div>
  );
};

export default ESIMManagement;