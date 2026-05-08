import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import {
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SignalIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  MapPinIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export interface ESIMProfile {
  id: string;
  esim_order_id: string;
  product_type: string;
  order_no: string;
  plan_name: string;
  package_name: string;
  location_name: string;
  location_code: string;
  total_volume: number;
  total_duration: number;
  duration_unit: string;
  order_usage: number;
  usage_percent: number;
  remaining_data: number;
  iccid: string;
  msisdn?: string;
  activation_code?: string;
  qr_code_url?: string;
  pdf_url?: string;
  esim_status: string;
  is_expired: boolean;
  days_remaining: number | null;
  order_total: number;
  order_status: string;
  expired_time: string;
  package_code?: string;
  imsi?: string;
  eid?: string;
  smdp_status?: string;
  created_at?: string;
  auto_renew?: boolean;
  renewal_method?: string;
  esim_tran_no?: string;
}

interface ESIMCardProps {
  profile: ESIMProfile;
  onShowQR: (profile: ESIMProfile) => void;
  onShowDetails: (profile: ESIMProfile) => void;
  onShowSubscription: (profile: ESIMProfile) => void;
  onReorder: (orderId: string) => void;
  onCopy: (text: string) => void;
}

const ESIMCard = ({ profile, onShowQR, onShowDetails, onShowSubscription, onReorder, onCopy }: ESIMCardProps) => {
  const [showActivationCode, setShowActivationCode] = useState(false);
  const { ref } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const formatDataSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
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
      case 'processing':
      case 'allocated':
        return 'text-secondary-foreground bg-secondary';
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
      default:
        return ClockIcon;
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'from-destructive to-destructive';
    if (percent >= 70) return 'from-secondary to-secondary';
    return 'from-primary to-primary';
  };

  const displayStatus = profile.is_expired ? 'Expired' : profile.esim_status;
  const StatusIcon = getStatusIcon(displayStatus, profile.is_expired);

  return (
    <motion.div
      ref={ref}
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
            <h3 className="text-lg font-semibold truncate max-w-[150px]">{profile.package_name}</h3>
            <p className="text-sm text-muted-foreground flex items-center">
              <MapPinIcon className="h-3 w-3 mr-1" />
              {profile.location_name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${profile.product_type === 'usa_esim' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
            {profile.product_type === 'usa_esim' ? 'USA eSIM' : 'eSIM Access'}
          </div>
          <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(displayStatus, profile.is_expired)}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {displayStatus}
          </div>
        </div>
      </div>

      {/* Data Plan Info */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted/20 rounded-xl border border-border/50">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{formatDataSize(profile.total_volume)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{profile.total_duration} {profile.duration_unit}</span>
        </div>
        <div className="flex items-center space-x-2">
          <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{profile.location_code.toUpperCase()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <SignalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {profile.days_remaining ? `${profile.days_remaining}d left` : 'Expired'}
          </span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="space-y-2 mb-4 bg-muted/30 p-3 rounded-xl border border-border/50">
        <div>
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mb-1">
            <span>Data Usage</span>
            <span>{formatDataSize(profile.order_usage)} / {formatDataSize(profile.total_volume)}</span>
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${getUsageColor(profile.usage_percent)} h-full rounded-full transition-all`}
              style={{ width: `${profile.usage_percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mt-1">
            <span>{profile.usage_percent}% used</span>
            <span>{formatDataSize(profile.remaining_data)} remaining</span>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="bg-slate-950 rounded-xl p-3 mb-4 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">ICCID</span>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-gray-300 truncate max-w-[150px]">{profile.iccid}</span>
            <button onClick={() => onCopy(profile.iccid)} className="p-1 text-gray-500 hover:text-white transition-colors"><ClipboardDocumentIcon className="h-3 w-3" /></button>
          </div>
        </div>
        {profile.activation_code && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Activation</span>
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-mono text-gray-300 truncate max-w-[120px]">{showActivationCode ? profile.activation_code : '••••••••••••'}</span>
              <button onClick={() => setShowActivationCode(!showActivationCode)} className="p-1 text-gray-500 hover:text-white transition-colors">{showActivationCode ? <EyeSlashIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}</button>
              <button onClick={() => onCopy(profile.activation_code!)} className="p-1 text-gray-500 hover:text-white transition-colors"><ClipboardDocumentIcon className="h-3 w-3" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {profile.qr_code_url && (
          <button onClick={() => onShowQR(profile)} className="flex-1 flex items-center justify-center px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm font-medium">
            <QrCodeIcon className="h-4 w-4 mr-2" /> QR
          </button>
        )}
        <button onClick={() => onShowDetails(profile)} className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors" title="Details">
          <EyeIcon className="h-4 w-4" />
        </button>
        {profile.order_status === 'active' && (
          <button onClick={() => onShowSubscription(profile)} className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors" title="Subscription">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}
        {profile.is_expired && (
          <button onClick={() => onReorder(profile.esim_order_id)} className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium">
            <ArrowPathIcon className="h-4 w-4" /> Reorder
          </button>
        )}
      </div>

      {/* Validity Info */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        <span>Cost: <span className="text-primary">${profile.order_total?.toFixed(2)}</span></span>
        <span>{profile.expired_time ? `Exp: ${new Date(profile.expired_time).toLocaleDateString()}` : 'No expiry'}</span>
      </div>
    </motion.div>
  );
};

export default ESIMCard;
