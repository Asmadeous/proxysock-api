

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GlobeAltIcon,
  ShoppingCartIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  UserIcon,
  KeyIcon,
  MapPinIcon,
  ServerIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  ChartBarIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon as RotateIcon
} from "@heroicons/react/24/outline";
import api, { updateProxyCredentials, rotateProxyIp } from "../../services/api";
import { toast } from "react-hot-toast";

interface ProxyOrder {
  id: string;
  order_id: string;
  product_name: string;
  product_type: 'datacenter' | 'isp' | 'premium-isp' | 'static-residential' | 'residential-rotating' | 'mobile';
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
}

interface ResidentialProxyAccount {
  id: string;
  proxy_username: string;
  proxy_password: string;
  traffic_limit: number;
  traffic_used: number;
  status: 'active' | 'inactive';
  order_id: string;
}

export default function ProxyManagement() {
  const [activeTab, setActiveTab] = useState<'orders' | 'residential' | 'mobile' | 'analytics'>('orders');
  const [proxyOrders, setProxyOrders] = useState<ProxyOrder[]>([]);
  const [residentialAccounts, setResidentialAccounts] = useState<ResidentialProxyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProxyOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'details' | 'credentials' | 'whitelist' | 'extend' | 'residential-account'>('details');
  const [formData, setFormData] = useState<any>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'datacenter' | 'residential' | 'mobile'>('all');

  useEffect(() => {
    fetchProxyData();
  }, [activeTab]);

  const fetchProxyData = async () => {
    setLoading(true);
    try {
      let url = '/web/api/orders?product_type=proxy';

      if (activeTab === 'residential') {
        url += '&category_slug=static-residential,residential-rotating,residential';
      } else if (activeTab === 'mobile') {
        url += '&category_slug=mobile';
      }

      const response = await api.get(url);
      if (response.data && response.data.orders) {
        const transformedOrders = response.data.orders.map((order: any) => ({
          id: String(order.id),
          order_id: order.order_number,
          product_name: order.product_name,
          product_type: order.proxy_type || 'datacenter',
          status: (order.status === 'completed' || order.status === 'active') ? 'active' : order.status,
          period: 1, // To do, extract period appropriately
          protocol: order.proxy_details?.protocol || 'http',
          locations: order.country ? [order.country] : [],
          credentials: order.credentials || {},
          whitelist_ips: order.proxy_details?.whitelist_ips || [],
          expires_at: order.expires_at || order.created_at,
          created_at: order.created_at,
          traffic_used: order.proxy_details?.traffic_used,
          traffic_limit: order.bandwidth_gb,
          subscription_active: order.status === 'completed'
        }));

        setProxyOrders(transformedOrders);
      }
      // Note: residential accounts are fetched separately if applicable, or we stub it empty.
      setResidentialAccounts([]);
    } catch (error) {
      console.error('Failed to fetch proxy data:', error);
    } finally {
      setLoading(false);
    }
  };







  const filteredOrders = proxyOrders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const typeMatch = typeFilter === 'all' ||
      (typeFilter === 'datacenter' && ['datacenter', 'isp', 'premium-isp'].includes(order.product_type)) ||
      (typeFilter === 'residential' && ['static-residential', 'residential-rotating'].includes(order.product_type)) ||
      (typeFilter === 'mobile' && order.product_type === 'mobile');

    return statusMatch && typeMatch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-primary/10 text-primary', icon: CheckCircleIcon },
      'almost-expired': { color: 'bg-yellow-500/10 text-yellow-500', icon: ClockIcon },
      expired: { color: 'bg-destructive/10 text-destructive', icon: XCircleIcon },
      pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: ClockIcon },
      cancelled: { color: 'bg-muted text-muted-foreground', icon: XCircleIcon }
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
      'mobile': { color: 'bg-primary/10 text-primary', text: 'Mobile' }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleProxyAction = async (action: string, _orderId: string, _data?: any) => {
    try {
      // Supabase has been removed.
      alert(`${action} completed successfully!`);
      setShowModal(false);
      fetchProxyData(); // Refresh data
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      alert(`Failed to ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      setLoading(true);
      const { data: _data } = await api.post(`/web/api/orders/${orderId}/reorder`);
      alert('Reorder successful! A new order has been created.');
      fetchProxyData(); // Refresh list to see new order
    } catch (error: any) {
      console.error('Failed to reorder:', error);
      const errorMsg = error.response?.data?.error || 'Failed to reorder';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: typeof modalType, order?: ProxyOrder) => {
    setModalType(type);
    setSelectedOrder(order || null);
    setFormData({});
    setShowModal(true);
  };

  const renderProxyCard = (order: ProxyOrder) => {
    const ProductIcon = getProductTypeIcon(order.product_type);

    return (
      <motion.div
        key={order.id}
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
          <div className="flex items-center gap-2">
            {getProductTypeBadge(order.product_type)}
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
            <span>Protocol: {order.protocol.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>Period: {order.period} month{order.period > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <span>Locations: {order.locations.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>Expires: {formatDate(order.expires_at)}</span>
          </div>
        </div>

        {/* Traffic Usage for Residential Rotating */}
        {order.product_type === 'residential-rotating' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Traffic Usage</span>
              <span className="text-sm">
                {(order.traffic_used! / 1024 / 1024 / 1024).toFixed(2)} GB / {order.traffic_limit} GB
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((order.traffic_used! / (order.traffic_limit! * 1024 * 1024 * 1024)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Credentials Preview */}
        <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Connection Details</span>
            <button
              onClick={() => openModal('credentials', order)}
              className="text-primary hover:text-primary/80 text-xs"
            >
              View All
            </button>
          </div>
          {order.credentials.username && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Username:</span>
                <p className="text-white font-mono truncate">{order.credentials.username}</p>
              </div>
              <div>
                <span className="text-slate-400">Endpoints:</span>
                <p className="text-white">{order.credentials.endpoints?.length || 0} available</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openModal('details', order)}
            className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <EyeIcon className="h-4 w-4" />
            Details
          </button>
          <button
            onClick={() => openModal('credentials', order)}
            className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
          >
            <KeyIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openModal('whitelist', order)}
            className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
          >
            <CogIcon className="h-4 w-4" />
          </button>
          {order.status === 'active' && (
            <button
              onClick={() => openModal('extend', order)}
              className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
          {order.status === 'expired' && (
            <button
              onClick={() => handleReorder(order.id)}
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

  const renderModal = () => {
    if (!showModal || !selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl border w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {modalType === 'details' && 'Proxy Details'}
                {modalType === 'credentials' && 'Connection Credentials'}
                {modalType === 'whitelist' && 'IP Whitelist Management'}
                {modalType === 'extend' && 'Extend Subscription'}
                {modalType === 'residential-account' && 'Residential Proxy Account'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {modalType === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                    <p>{selectedOrder.product_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">{selectedOrder.order_id}</p>
                      <button
                        onClick={() => copyToClipboard(selectedOrder.order_id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Protocol</p>
                    <p>{selectedOrder.protocol.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Period</p>
                    <p>{selectedOrder.period} month{selectedOrder.period > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expires At</p>
                    <p>{formatDate(selectedOrder.expires_at)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setModalType('credentials');
                    }}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    View Credentials
                  </button>
                  <button
                    onClick={() => {
                      setModalType('whitelist');
                    }}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Manage Whitelist
                  </button>
                </div>
              </div>
            )}

            {modalType === 'credentials' && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-4">Connection Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Username:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono">{selectedOrder.credentials.username}</code>
                        <button
                          onClick={() => copyToClipboard(selectedOrder.credentials.username)}
                          className="text-primary hover:text-primary/80"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono">{selectedOrder.credentials.password}</code>
                        <button
                          onClick={() => copyToClipboard(selectedOrder.credentials.password)}
                          className="text-primary hover:text-primary/80"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.credentials.endpoints && selectedOrder.credentials.endpoints.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">Proxy Endpoints</h4>
                      {selectedOrder.product_type === 'mobile' && (
                        <button
                          onClick={async () => {
                            try {
                              await rotateProxyIp(selectedOrder.id);
                              toast.success('IP rotation initiated');
                            } catch (e) { }
                          }}
                          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <RotateIcon className="h-4 w-4" />
                          Rotate IP
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedOrder.credentials.endpoints.map((endpoint) => (
                        <div key={endpoint} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                          <code className="text-primary text-sm">{endpoint}</code>
                          <button
                            onClick={() => copyToClipboard(endpoint)}
                            className="text-primary hover:text-primary/80"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Username"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="flex-1 px-3 py-2 bg-background border rounded-lg text-sm"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="flex-1 px-3 py-2 bg-background border rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        username: selectedOrder.credentials.username,
                        password: selectedOrder.credentials.password
                      });
                      // This just populates the fields, the user clicks "Save Changes" below
                    }}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Reset Fields
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await updateProxyCredentials(selectedOrder.id, {
                          username: formData.username,
                          password: formData.password
                        });
                        toast.success('Credentials update requested');
                        setShowModal(false);
                        fetchProxyData();
                      } catch (e) { }
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {modalType === 'whitelist' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Current Whitelisted IPs</h4>
                  {selectedOrder.whitelist_ips.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.whitelist_ips.map((ip) => (
                        <div key={ip} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                          <code>{ip}</code>
                          <button
                            onClick={() => handleProxyAction('whitelist-remove', selectedOrder.order_id, { ip })}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No IPs whitelisted yet</p>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Add New IP</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="192.168.1.1"
                      value={formData.newIp || ''}
                      onChange={(e) => setFormData({ ...formData, newIp: e.target.value })}
                      className="flex-1 bg-background border rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        if (formData.newIp) {
                          handleProxyAction('whitelist-add', selectedOrder.order_id, {
                            ip: formData.newIp,
                            description: formData.description || 'Added via dashboard'
                          });
                        }
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add IP
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2 w-full bg-background border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {modalType === 'extend' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Extend Subscription</h4>
                  <p className="text-muted-foreground mb-4">
                    Current expiry: {formatDate(selectedOrder.expires_at)}
                  </p>
                </div>

                <div>
                  <label htmlFor="extension-period" className="block text-sm font-medium text-muted-foreground mb-2">
                    Extension Period
                  </label>
                  <select
                    id="extension-period"
                    value={formData.period || 1}
                    onChange={(e) => setFormData({ ...formData, period: Number.parseInt(e.target.value) })}
                    className="w-full bg-background border rounded-lg px-3 py-2"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Extension Cost:</span>
                    <span className="text-xl font-bold text-primary">
                      ${((formData.period || 1) * 15.99).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleProxyAction('extend-order', selectedOrder.order_id, { period: formData.period || 1 })}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Extend Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderResidentialTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Residential Proxy Accounts</h2>
          <p className="text-muted-foreground">Manage your residential rotating proxy accounts and traffic</p>
        </div>
        <button
          onClick={() => openModal('residential-account')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Account
        </button>
      </div>

      {/* Residential Orders */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Active Residential Orders</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders
            .filter(order => order.product_type === 'residential-rotating')
            .map(order => (
              <div key={order.id} className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{order.product_name}</h4>
                  {getStatusBadge(order.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Traffic Used:</span>
                    <span>{(order.traffic_used! / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Traffic Limit:</span>
                    <span>{order.traffic_limit} GB</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((order.traffic_used! / (order.traffic_limit! * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Proxy Accounts */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Proxy Accounts</h3>
        {residentialAccounts.length > 0 ? (
          <div className="space-y-4">
            {residentialAccounts.map(account => (
              <div key={account.id} className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{account.proxy_username}</h4>
                    <p className="text-sm text-muted-foreground">Traffic: {account.traffic_used.toFixed(2)} / {account.traffic_limit} GB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                      }`}>
                      {account.status}
                    </span>
                    <button
                      onClick={() => {
                        // Handle account edit
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Username:</span>
                    <p className="font-mono">{account.proxy_username}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Password:</span>
                    <p className="font-mono">••••••••</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((account.traffic_used / account.traffic_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Proxy Accounts</h3>
            <p className="text-muted-foreground mb-4">Create your first residential proxy account to get started</p>
            <button
              onClick={() => openModal('residential-account')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMobileTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mobile Proxy Management</h2>
        <p className="text-muted-foreground">Manage your mobile proxy orders and rotation settings</p>
      </div>

      {/* Mobile Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders
          .filter(order => order.product_type === 'mobile')
          .map(order => (
            <div key={order.id} className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{order.product_name}</h3>
                    <p className="text-muted-foreground text-sm">{order.order_id}</p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Whitelisted IP:</span>
                  <span className="font-mono">
                    {order.whitelist_ips[0] || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rotation:</span>
                  <span>Every 30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span>{formatDate(order.expires_at)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Handle rotation toggle
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Toggle Rotation
                </button>
                <button
                  onClick={() => {
                    // Handle IP update
                  }}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Update IP
                </button>
              </div>
            </div>
          ))}
      </div>

      {filteredOrders.filter(order => order.product_type === 'mobile').length === 0 && (
        <div className="text-center py-12">
          <DevicePhoneMobileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Mobile Proxies</h3>
          <p className="text-muted-foreground">You don't have any mobile proxy orders yet</p>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Proxy Analytics</h2>
        <p className="text-muted-foreground">Monitor your proxy usage and performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ServerIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{proxyOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircleIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold">
                {proxyOrders.filter(o => o.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <WifiIcon className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Traffic</p>
              <p className="text-2xl font-bold">
                {proxyOrders.reduce((sum, o) => sum + (o.traffic_used || 0), 0) / 1024 / 1024 / 1024 < 1
                  ? `${(proxyOrders.reduce((sum, o) => sum + (o.traffic_used || 0), 0) / 1024 / 1024).toFixed(0)} MB`
                  : `${(proxyOrders.reduce((sum, o) => sum + (o.traffic_used || 0), 0) / 1024 / 1024 / 1024).toFixed(1)} GB`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <CalendarIcon className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold">
                {proxyOrders.filter(o => {
                  const daysUntilExpiry = Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Usage Over Time</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <ChartBarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Chart implementation would go here</p>
            <p className="text-sm text-muted-foreground">Connect your analytics data to see usage trends</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {proxyOrders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{order.product_name}</span>
                <span className="text-muted-foreground text-sm">({order.order_id})</span>
              </div>
              <span className="text-muted-foreground text-sm">{formatDate(order.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'orders', name: 'All Orders', icon: ShoppingCartIcon, count: proxyOrders.length },
    { id: 'residential', name: 'Residential', icon: GlobeAltIcon, count: proxyOrders.filter(o => o.product_type === 'residential-rotating').length },
    { id: 'mobile', name: 'Mobile', icon: DevicePhoneMobileIcon, count: proxyOrders.filter(o => o.product_type === 'mobile').length },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, count: 0 }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-28 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-10 flex-1 bg-muted animate-pulse rounded-lg"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-muted animate-pulse rounded-lg"></div>
                  <div>
                    <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
                  <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="h-3 w-24 bg-muted animate-pulse rounded mb-2"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 flex-1 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proxy Management</h1>
          <p className="text-muted-foreground">Manage all your proxy services and configurations</p>
        </div>
        <GlobeAltIcon className="h-8 w-8 text-primary" />
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm text-muted-foreground">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <span className="text-sm text-muted-foreground">Almost Expired</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive rounded-full"></div>
          <span className="text-sm text-muted-foreground">Expired</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-muted p-1 rounded-xl flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all flex-1 min-w-0 ${activeTab === tab.id
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{tab.name}</span>
              {tab.count > 0 && (
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters for Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-2">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-background border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-muted-foreground mb-2">Type</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-background border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="datacenter">Datacenter</option>
                <option value="residential">Residential</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'orders' && (
        <div>
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(renderProxyCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <GlobeAltIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Proxy Orders</h3>
              <p className="text-muted-foreground">You don't have any proxy orders yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'residential' && renderResidentialTab()}
      {activeTab === 'mobile' && renderMobileTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Modal */}
      {renderModal()}
    </div>
  );
}