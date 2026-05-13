"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Monitor,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Search,
  Calendar,
  DollarSign,
  Server,
  Cpu,
  HardDrive,
  Users,
  AlertTriangle,
  Sparkles,
  Globe,
  Shield,
  FileText,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { CryptoRefundModal } from "@/components/dashboard/Orders/CryptoRefundModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RDPOrder {
  id: string;
  order_number: string;
  transaction_id: string;
  plan_id: number;
  vm_id: number;
  node: string;
  os_template: string;
  hostname: string;
  concurrent_users: number;
  total_amount: number;
  currency_code: string;
  status: 'pending' | 'provisioning' | 'active' | 'suspended' | 'terminated' | 'failed' | 'cancelled';
  service_type: 'residential' | 'standard';
  payment_method: string;
  payment_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  management_type: string;
  country: string;
  duration: number;
  activated_at: string;
  ip_address: string;
  dns_name?: string;
  rdp_port: number;
  // Related plan data
  plan?: {
    name: string;
    cpu_cores: number;
    ram_gb: number;
    storage_gb: number;
    price: number;
    features: string[];
  };
}

const RDPOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RDPOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<RDPOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'terminated'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RDPOrder | null>(null);
  const [refundDialogOrderId, setRefundDialogOrderId] = useState<string | null>(null);
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const { accessToken } = useAuth();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    terminated: 0,
    failed: 0,
    totalSpent: 0,
    totalVMs: 0,
    totalCores: 0
  });

  useEffect(() => {
    if (accessToken) {
      fetchRDPOrders();
    }
  }, [accessToken]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, activeTab, searchTerm]);

  const fetchRDPOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/web/api/orders?product_type=rdp');
      if (response.data && response.data.orders) {
        const transformedOrders = response.data.orders.map((order: any) => ({
          ...order,
          plan: {
            cpu_cores: order.cpu_cores || order.metadata?.plan_details?.cpu_cores || order.metadata?.cpu_cores || 0,
            ram_gb: order.ram_gb || order.metadata?.plan_details?.ram_gb || order.metadata?.ram_gb || 0,
            storage_gb: order.storage_gb || order.metadata?.plan_details?.storage_gb || order.metadata?.storage_gb || 0,
            bandwidth_gb: order.bandwidth_gb || order.metadata?.plan_details?.bandwidth_gb || order.metadata?.bandwidth_gb || 0,
            name: order.plan_name || order.metadata?.plan_details?.name || order.metadata?.name || 'Standard'
          }
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Failed to fetch RDP orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(o => {
        if (activeTab === 'active') {
          const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
          return (o.status === 'active' || o.status === 'provisioning') && !isExpired;
        }
        if (activeTab === 'pending') return o.status === 'pending';
        if (activeTab === 'terminated') {
          const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
          return o.status === 'terminated' || o.status === 'suspended' || isExpired;
        }
        if (activeTab === 'failed') return o.status === 'failed' || o.status === 'cancelled';
        return true;
      });
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vm_id?.toString().includes(searchTerm)
      );
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const active = orders.filter(o => {
      const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
      return (o.status === 'active' || o.status === 'provisioning') && !isExpired;
    }).length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const terminated = orders.filter(o => {
      const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
      return o.status === 'terminated' || o.status === 'suspended' || isExpired;
    }).length;
    const failed = orders.filter(o => o.status === 'failed' || o.status === 'cancelled').length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const totalVMs = orders.filter(o => o.vm_id).length;
    const totalCores = orders.reduce((sum, o) => sum + (o.plan?.cpu_cores || 0), 0);

    setStats({
      total: orders.length,
      active,
      pending,
      terminated,
      failed,
      totalSpent,
      totalVMs,
      totalCores
    });
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case 'active':
        return "success";
      case 'provisioning':
      case 'pending':
        return "warning";
      case 'suspended':
      case 'terminated':
      case 'failed':
      case 'cancelled':
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'provisioning':
      case 'pending':
        return Clock;
      case 'suspended':
      case 'terminated':
      case 'failed':
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const downloadOrderDetails = (order: RDPOrder) => {
    const content = `
RDP Order Details
==================
Order ID: ${order.order_number}
Transaction ID: ${order.transaction_id}
VM ID: ${order.vm_id || 'Not assigned'}
Status: ${order.status}
Purchase Date: ${new Date(order.created_at).toLocaleDateString()}
${order.activated_at ? `Activated: ${new Date(order.activated_at).toLocaleDateString()}` : ''}
${order.expires_at ? `Expires: ${new Date(order.expires_at).toLocaleDateString()}` : ''}

Server Configuration
====================
Hostname: ${order.hostname || 'Not assigned'}
OS Template: ${order.os_template}
Service Type: ${order.service_type}
Management Type: ${order.management_type}
Country: ${order.country || 'Default'}

Resources
=========
CPU Cores: ${order.plan?.cpu_cores || 'N/A'} vCPU
RAM: ${order.plan?.ram_gb || 'N/A'} GB
Storage: ${order.plan?.storage_gb || 'N/A'} GB
Concurrent Users: ${order.concurrent_users}

Network Information
==================
Subdomain: ${order.dns_name || 'Generating...'}
RDP Port: ${order.rdp_port || '3389'}

Billing
=======
Plan: ${order.plan?.name || 'N/A'}
Duration: ${order.duration} month(s)
Total Amount: ${order.currency_code} ${order.total_amount}
Payment Method: ${order.payment_method || 'N/A'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rdp-order-${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleWalletRefund = async (order: RDPOrder) => {
    if (!confirm("Are you sure you want to refund this RDP order to your wallet?")) return;
    
    try {
      setRefundingOrderId(order.id);
      const response = await api.post(`/web/api/orders/${order.id}/refund`);
      toast.success(response.data.message || "Order successfully refunded to wallet.");
      fetchRDPOrders();
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to refund order.";
      toast.error(msg, { duration: 5000 });
      fetchRDPOrders();
    } finally {
      setRefundingOrderId(null);
    }
  };

  if (!accessToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="p-4 bg-warning/10 rounded-lg mb-4 inline-block">
              <AlertTriangle className="h-16 w-16 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Authentication Required
            </h3>
            <p className="text-muted-foreground">
              Please log in to view your RDP orders
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-40" />

        {/* Header Skeleton */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-10 w-36" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Filter Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-20" />
                ))}
              </div>
              <Skeleton className="h-10 w-64 ml-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Orders Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
                <div className="flex gap-2 pt-4 border-t">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate("/dashboard/orders")}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Orders
      </Button>

      {/* Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">RDP Orders</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage your Remote Desktop subscriptions
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Order New RDP Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/dashboard/rdp-plans")}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Order New RDP
              </Button>
            </motion.div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Orders</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Server className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active RDPs</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {stats.active}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Spent</p>
                  <p className="text-3xl font-bold mt-1">
                    ${stats.totalSpent.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Cores</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalCores}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {[
                { id: 'all', label: 'All', count: stats.total },
                { id: 'active', label: 'Active', count: stats.active },
                { id: 'pending', label: 'Pending', count: stats.pending },
                { id: 'terminated', label: 'Terminated', count: stats.terminated },
                { id: 'failed', label: 'Failed', count: stats.failed }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by order ID, hostname, or VM ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="p-4 bg-muted rounded-lg mb-4 inline-block">
              <Monitor className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria' : 'You haven\'t ordered any RDP instances yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            const isExpired = order.expires_at && new Date(order.expires_at) < new Date();

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 6) }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="transition-all hover:shadow-lg hover:border-primary/50">
                  {/* Header */}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Monitor className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {order.hostname || `RDP-${order.vm_id || 'Pending'}`}
                          </CardTitle>
                          <CardDescription>#{order.order_number}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={isExpired ? "destructive" : getStatusBadgeVariant(order.status)}
                        className="gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {isExpired ? 'Expired' : order.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Details */}
                  <CardContent className="space-y-4">
                    {/* Compact Spec Bar */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                      <div className="flex flex-col items-center justify-center py-1">
                        <Cpu className="h-3.5 w-3.5 text-primary/70 mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">CPU</span>
                        <span className="text-xs font-mono">{order.plan?.cpu_cores || 0}vC</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-1 border-x border-border/30">
                        <Monitor className="h-3.5 w-3.5 text-primary/70 mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">RAM</span>
                        <span className="text-xs font-mono">{order.plan?.ram_gb || 0}GB</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-1">
                        <HardDrive className="h-3.5 w-3.5 text-primary/70 mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">SSD</span>
                        <span className="text-xs font-mono">{order.plan?.storage_gb || 0}GB</span>
                      </div>
                    </div>

                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-tight">
                          <Globe className="h-3.5 w-3.5" />
                          Location
                        </span>
                        <span className="font-bold text-foreground">{order.country || 'Default'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-tight">
                          <Users className="h-3.5 w-3.5" />
                          Capacity
                        </span>
                        <span className="font-bold text-foreground">{order.concurrent_users} users</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-tight">
                          <Calendar className="h-3.5 w-3.5" />
                          Duration
                        </span>
                        <span className="font-bold text-foreground">{order.duration} month(s)</span>
                      </div>
                    </div>

                    {/* OS and Service Type Tags */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {order.os_template}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {order.service_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {order.management_type}
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="text-xl font-bold">
                        {order.currency_code === 'USD' ? '$' : order.currency_code} {order.total_amount}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {order.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="col-span-2 flex items-center justify-center gap-2 text-xs"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await api.get(`/web/api/orders/${order.id}/download_invoice`, {
                                  responseType: 'blob'
                                });
                                const blob = new Blob([response.data], { type: 'application/pdf' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `invoice-${order.order_number}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Failed to download invoice:', error);
                              }
                            }}
                            className="col-span-2 flex items-center justify-center gap-2 text-xs"
                            title="Download Invoice"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Invoice
                          </Button>

                          {(order.dns_name || order.ip_address) && (
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/web/api/orders/${order.id}/download_rdp_config`, {
                                    responseType: 'blob'
                                  });
                                  const blob = new Blob([response.data], { type: 'application/rdp' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${order.hostname || 'RDP'}-${order.order_number}.rdp`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Failed to download RDP config:', error);
                                  downloadOrderDetails(order);
                                }
                              }}
                              className="col-span-2 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border-none font-bold"
                            >
                              <Monitor className="h-4 w-4" />
                              Download RDP Session (.rdp)
                            </Button>
                          )}
                        </>
                      )}

                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="col-span-2 flex items-center justify-center gap-2 text-xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Details
                        </Button>
                      )}

                      {(order.status === "failed" || order.status === "cancelled") && (
                        <>
                          <Button
                            onClick={() => navigate("/dashboard/support?tab=tickets")}
                            className="col-span-2 flex items-center justify-center gap-2 text-xs"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Open Ticket
                          </Button>

                          {order.payment_method === "wallet" && (
                            <Button
                              variant="outline"
                              onClick={() => handleWalletRefund(order)}
                              className="col-span-2 flex items-center justify-center gap-2 border-amber-500 text-amber-500 hover:bg-amber-50"
                              disabled={refundingOrderId === order.id}
                            >
                              <DollarSign className="h-4 w-4" />
                              {refundingOrderId === order.id ? "Refunding..." : "Refund to Wallet"}
                            </Button>
                          )}
                          
                          {["plisio", "payvra", "hundredpay"].includes(order.payment_method) && (
                            <Button
                              variant="destructive"
                              onClick={() => setRefundDialogOrderId(order.id)}
                              className="col-span-2 flex items-center justify-center gap-2"
                            >
                              <DollarSign className="h-4 w-4" />
                              Refund
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">RDP Order Details</DialogTitle>
            <DialogDescription>
              Detailed information about your RDP order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Info */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Order ID</span>
                      <p className="font-medium mt-1">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Transaction ID</span>
                      <p className="font-medium mt-1 truncate">{selectedOrder.transaction_id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">VM ID</span>
                      <p className="font-medium mt-1">{selectedOrder.vm_id || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Status</span>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Server Configuration */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Server Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Hostname</span>
                      <p className="font-medium mt-1">{selectedOrder.hostname || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">OS Template</span>
                      <p className="font-medium mt-1">{selectedOrder.os_template}</p>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-sm">Service Type</span>
                      <p className="font-medium mt-1 capitalize">{selectedOrder.service_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Management</span>
                      <p className="font-medium mt-1 capitalize">{selectedOrder.management_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Country</span>
                      <p className="font-medium mt-1">{selectedOrder.country || 'Default'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <Cpu className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedOrder.plan?.cpu_cores || 0}</p>
                      <p className="text-xs text-muted-foreground">vCPU Cores</p>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <Server className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedOrder.plan?.ram_gb || 0}</p>
                      <p className="text-xs text-muted-foreground">GB RAM</p>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <HardDrive className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedOrder.plan?.storage_gb || 0}</p>
                      <p className="text-xs text-muted-foreground">GB Storage</p>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedOrder.concurrent_users}</p>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Information */}
              {(selectedOrder.dns_name || selectedOrder.ip_address) && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Network Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-sm">Subdomain</span>
                        <p className="font-medium mt-1">{selectedOrder.dns_name || 'Generating...'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">RDP Port</span>
                        <p className="font-medium mt-1">{selectedOrder.rdp_port || '3389'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => downloadOrderDetails(selectedOrder)}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Details
                </Button>
                {selectedOrder.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/RDP-management')}
                    className="flex-1 gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Manage Instance
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <CryptoRefundModal
        orderId={refundDialogOrderId}
        isOpen={!!refundDialogOrderId}
        onClose={() => setRefundDialogOrderId(null)}
        onSuccess={fetchRDPOrders}
      />
    </div>
  );
};

export default RDPOrdersPage;
