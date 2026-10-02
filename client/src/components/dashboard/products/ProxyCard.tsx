import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { updateMobileRotation } from "@/services/api";
import { motion } from "framer-motion";
import {
  GlobeAltIcon,
  ShoppingCartIcon,
  CogIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  KeyIcon,
  MapPinIcon,
  ServerIcon,
  DevicePhoneMobileIcon,
  CalendarIcon,
  ArrowPathIcon as RotateIcon
} from "@heroicons/react/24/outline";

interface ProxyOrder {
  id: string;
  order_id: string;
  product_name: string;
  product_type: 'datacenter' | 'isp' | 'premium-isp' | 'static-residential' | 'residential-rotating' | 'mobile' | 'global-isp';
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  period: number;
  protocol: 'http' | 'socks5';
  locations: string[];
  credentials: {
    username: string;
    password: string;
    endpoints: string[];
  };
  whitelist_ips: string[];
  expires_at: string;
  created_at: string;
  traffic_used?: number;
  traffic_limit?: number;
  subscription_active?: boolean;
  auto_renew?: boolean;
  renewal_method?: string;
  rotation?: 'on' | 'off';
}

interface ProxyCardProps {
  order: ProxyOrder;
  onOpenModal: (type: any, order: ProxyOrder) => void;
  onReorder: (id: string) => void;
}

const ProxyCard = ({ order, onOpenModal, onReorder }: ProxyCardProps) => {
  const [rotation, setRotation] = useState<'on' | 'off'>(order.rotation || 'on');
  const [savingRotation, setSavingRotation] = useState(false);

  // Mobile IPs rotate every 30 minutes unless the customer turns rotation off.
  const toggleRotation = async () => {
    const next = rotation === 'on' ? 'off' : 'on';
    setSavingRotation(true);
    try {
      await updateMobileRotation(order.id, next);
      setRotation(next);
      toast.success(`IP rotation turned ${next}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to change rotation');
    } finally {
      setSavingRotation(false);
    }
  };
  const { ref } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Orders also arrive refunded, failed or processing, beyond the statuses typed above.
  const status = String(order.status);
  const closedMessage =
    status === 'refunded' ? 'Refunded. No credentials.'
    : status === 'cancelled' ? 'Cancelled. No credentials.'
    : status === 'failed' ? 'Order failed. No credentials.'
    : status === 'expired' ? 'Expired. Renew to use this proxy again.'
    : null;
  const endpointCount = order.credentials.endpoints?.length || 0;
  const missingCredentialsMessage =
    closedMessage
    ?? (['pending', 'processing'].includes(status)
      ? 'Provisioning credentials...'
      : 'Credentials unavailable. Contact support.');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-primary/10 text-primary', icon: CheckCircleIcon },
      'almost-expired': { color: 'bg-yellow-500/10 text-yellow-500', icon: ClockIcon },
      expired: { color: 'bg-destructive/10 text-destructive', icon: XCircleIcon },
      pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: ClockIcon },
      cancelled: { color: 'bg-muted text-muted-foreground', icon: XCircleIcon },
      refunded: { color: 'bg-muted text-muted-foreground', icon: XCircleIcon },
      failed: { color: 'bg-destructive/10 text-destructive', icon: XCircleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-transparent ${config.color}`}>
        <IconComponent className="h-3 w-3" />
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'datacenter':
      case 'isp':
      case 'premium-isp':
        return ServerIcon;
      case 'static-residential':
      case 'residential-rotating':
        return GlobeAltIcon;
      case 'mobile':
        return DevicePhoneMobileIcon;
      default:
        return ServerIcon;
    }
  };

  const getProductTypeBadge = (type: string) => {
    const typeConfig = {
      'datacenter': { color: 'bg-primary/10 text-primary', text: 'Datacenter' },
      'isp': { color: 'bg-primary/10 text-primary', text: 'ISP' },
      'premium-isp': { color: 'bg-primary/10 text-primary', text: 'Premium ISP' },
      'static-residential': { color: 'bg-primary/10 text-primary', text: 'Static Residential' },
      'residential-rotating': { color: 'bg-primary/10 text-primary', text: 'Residential Rotating' },
      'mobile': { color: 'bg-primary/10 text-primary', text: 'Mobile' },
      'global-isp': { color: 'bg-primary/10 text-primary', text: 'Global ISP' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.datacenter;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ProductIcon = getProductTypeIcon(order.product_type);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border transition-all duration-300 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ProductIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{order.product_name}</h3>
            <p className="text-muted-foreground text-sm">Order ID: {order.order_id}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getProductTypeBadge(order.product_type)}
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyIcon className="h-4 w-4" />
          <span>Protocol: <span className="text-foreground uppercase">{order.protocol}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>Period: <span className="text-foreground">{order.period} month{order.period > 1 ? 's' : ''}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPinIcon className="h-4 w-4" />
          <span>Locations: <span className="text-foreground">{order.locations.length}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>Expires: <span className="text-foreground">{formatDate(order.expires_at)}</span></span>
        </div>
      </div>

      {/* Traffic Usage for Residential Rotating */}
      {order.product_type === 'residential-rotating' && (
        <div className="mb-4 bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Traffic Usage</span>
            <span>
              {(order.traffic_used! / 1024 / 1024 / 1024).toFixed(2)} GB / {order.traffic_limit} GB
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${Math.min((order.traffic_used! / (order.traffic_limit! * 1024 * 1024 * 1024)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Credentials Preview */}
      <div className="bg-muted/30 rounded-lg p-3 mb-4 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Authentication</span>
          {!closedMessage && (
            <button
              onClick={() => onOpenModal('credentials', order)}
              className="text-primary hover:text-primary/80 text-xs font-medium"
            >
              Manage
            </button>
          )}
        </div>
        {!closedMessage && order.credentials.username ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">User</span>
              <p className="font-mono truncate">{order.credentials.username}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Endpoints</span>
              <p>{endpointCount > 0 ? `${endpointCount} active` : 'Not received. Contact support.'}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center">{missingCredentialsMessage}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onOpenModal('details', order)}
          className="flex-1 py-2 px-3 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <EyeIcon className="h-4 w-4" />
          Details
        </button>
        {!closedMessage && (
          <>
            <button
              onClick={() => onOpenModal('credentials', order)}
              className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors"
              title="Credentials"
            >
              <KeyIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onOpenModal('whitelist', order)}
              className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors"
              title="Whitelist"
            >
              <CogIcon className="h-4 w-4" />
            </button>
          </>
        )}
        {order.status === 'active' && order.product_type === 'mobile' && (
          <button
            onClick={toggleRotation}
            disabled={savingRotation}
            aria-pressed={rotation === 'on'}
            className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors disabled:opacity-50"
            title="IP rotation every 30 minutes"
          >
            Rotation: {rotation === 'on' ? 'On' : 'Off'}
          </button>
        )}
        {order.status === 'active' && (
          <button
            onClick={() => onOpenModal('subscription', order)}
            className="py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RotateIcon className="h-4 w-4" />
            Auto-Renew
          </button>
        )}
        {order.status === 'expired' && (
          <button
            onClick={() => onReorder(order.id)}
            className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCartIcon className="h-4 w-4" />
            Reorder
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProxyCard;
