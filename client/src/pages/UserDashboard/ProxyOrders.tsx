"use client";

import { useState, useEffect, FC } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Search,
  Calendar,
  DollarSign,
  Globe,
  Shield,
  BarChart3,
  FileText,
  AlertTriangle,
  Sparkles,
  MapPin,
  Server,
  Filter,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
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

interface ProxyOrder {
  id: string;
  order_number: string;
  proxy_plan_id: number;
  plan_name: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "cancelled";
  payment_method: string;
  proxy_details: any;
  credentials: any;
  created_at: string;
  expires_at?: string;
  country?: string;
  proxy_type?: string;
  bandwidth_gb?: number;
  ips_included?: number;
}

const ProxyOrdersPage: FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProxyOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ProxyOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "failed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<ProxyOrder | null>(null);
  

  const { user, accessToken } = useAuth();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    failed: 0,
    totalSpent: 0,
    totalBandwidth: 0,
    totalIPs: 0,
  });

  useEffect(() => {
    if (accessToken && user?.id) {
      fetchProxyOrders();
    }
  }, [accessToken, user]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, activeTab, searchTerm, categoryFilter]);

  const fetchProxyOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/web/api/orders?product_type=proxy');

      if (response.data && response.data.orders) {
        const transformedOrders: ProxyOrder[] = response.data.orders
          .map((order: any) => ({
            id: String(order.id),
            order_number: order.order_number,
            proxy_plan_id: order.product_id,
            plan_name: order.product_name || "Unknown Proxy Plan",
            amount: Number(order.amount) || 0,
            currency: order.currency || "USD",
            status: order.status as any,
            payment_method: order.payment_method || "N/A",
            proxy_details: order.proxy_details || {},
            credentials: order.credentials || {},
            created_at: order.created_at,
            expires_at: order.expires_at,
            country: order.country,
            proxy_type: order.proxy_type,
            bandwidth_gb: Number(order.bandwidth_gb) || 0,
            ips_included: Number(order.ips_included) || 0,
          }));
        setOrders(transformedOrders);
      } else {
        console.error("Failed to fetch proxy orders");
      }
    } catch (error) {
      console.error("Failed to fetch proxy orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((o) => o.proxy_type === categoryFilter);
    }

    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "active") {
        filtered = filtered.filter((o) => o.status === "completed");
      } else if (activeTab === "pending") {
        filtered = filtered.filter((o) => o.status === "pending");
      } else if (activeTab === "failed") {
        filtered = filtered.filter((o) => o.status === "failed" || o.status === "cancelled");
      }
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.proxy_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const active = orders.filter((o) => o.status === "completed").length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const expired = orders.filter((o) => o.expires_at && new Date(o.expires_at) < new Date()).length;
    const failed = orders.filter((o) => o.status === "failed" || o.status === "cancelled").length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalBandwidth = orders.reduce((sum, o) => sum + (o.bandwidth_gb || 0), 0);
    const totalIPs = orders.reduce((sum, o) => sum + (o.ips_included || 0), 0);

    setStats({
      total: orders.length,
      active,
      pending,
      expired,
      failed,
      totalSpent,
      totalBandwidth,
      totalIPs,
    });
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "pending":
        return Clock;
      case "failed":
      case "cancelled":
        return XCircle;
      default:
        return Clock;
    }
  };

  const downloadCredentials = (order: ProxyOrder) => {
    const credentials = order.credentials || {};
    const content = `
Proxy Order Details
==================
Order ID: ${order.order_number}
Plan: ${order.plan_name}
Status: ${order.status}
Purchase Date: ${new Date(order.created_at).toLocaleDateString()}
${order.expires_at ? `Expires: ${new Date(order.expires_at).toLocaleDateString()}` : ""}

Proxy Credentials
================
${JSON.stringify(credentials, null, 2)}

Proxy Details
============
Country: ${order.country || "N/A"}
Bandwidth: ${order.bandwidth_gb || 0} GB
IPs Included: ${order.ips_included || 0}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proxy-order-${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  
  if (!accessToken || !user) {
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
              Please log in to view your proxy orders
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2 bg-card border rounded-lg p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>

        {/* Orders Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
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
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Proxy Orders</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage and track your proxy subscriptions
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Buy New Proxy Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/dashboard/buy-proxies")}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Buy New Proxy
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
                  <BarChart3 className="h-6 w-6 text-primary" />
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
                  <p className="text-muted-foreground text-sm">Active Proxies</p>
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
                  <p className="text-muted-foreground text-sm">Total IPs</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalIPs}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Category:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
                {[
                  { id: "all", label: "All" },
                  { id: "residential-rotating", label: "Residential Rotating" },
                  { id: "static-residential", label: "Static Residential" },
                  { id: "mobile", label: "Mobile" },
                  { id: "datacenter", label: "Datacenter" },
                  { id: "isp", label: "ISP" },
                  { id: "premium-isp", label: "Premium ISP" },
                  { id: "global-isp", label: "Global ISP" },
                ].map((cat) => {
                  const count = cat.id === "all" ? orders.length : orders.filter((o) => o.proxy_type === cat.id).length;
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      variant={categoryFilter === cat.id ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      {cat.label}
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {[
                  { id: "all", label: "All", count: stats.total },
                  { id: "active", label: "Active", count: stats.active },
                  { id: "pending", label: "Pending", count: stats.pending },
                  { id: "failed", label: "Failed", count: stats.failed },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as "all" | "active" | "pending" | "failed")
                    }
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
                  placeholder="Search by order ID, plan name, country, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="p-4 bg-muted rounded-lg mb-4 inline-block">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "You haven't placed any proxy orders yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            const isExpired =
              order.expires_at && new Date(order.expires_at) < new Date();

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
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {order.plan_name}
                          </CardTitle>
                          <CardDescription>#{order.order_number}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            isExpired ? "destructive" : getStatusBadgeVariant(order.status)
                          }
                          className="gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {isExpired ? "Expired" : order.status}
                        </Badge>
                        {order.proxy_type && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {order.proxy_type.replace(/-/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Details */}
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Country
                        </span>
                        <span className="font-medium">
                          {order.country || "Global"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Server className="h-4 w-4" />
                          Bandwidth
                        </span>
                        <span className="font-medium">
                          {order.bandwidth_gb || 0} GB
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          IPs
                        </span>
                        <span className="font-medium">
                          {order.ips_included || 0} IPs
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Purchased
                        </span>
                        <span className="font-medium">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {order.expires_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Expires
                          </span>
                          <span
                            className={
                              isExpired
                                ? "font-medium text-destructive"
                                : "font-medium"
                            }
                          >
                            {new Date(order.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="text-xl font-bold">
                        {order.currency === "USD" ? "$" : order.currency}{" "}
                        {order.amount.toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {order.status === "completed" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Details
                          </Button>
                          {order.credentials && (
                            <Button
                              onClick={() => downloadCredentials(order)}
                              className="flex-1 gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Credentials
                            </Button>
                          )}
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
                            className="gap-2"
                            title="Download Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1 gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Details
                        </Button>
                      )}

                      {(order.status === "failed" || order.status === "cancelled") && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/dashboard/support?tab=tickets&order_id=${order.order_number}`)}
                            className="flex-1 gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Open Ticket
                          </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Order Details</DialogTitle>
            <DialogDescription>
              Detailed information about your proxy order
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
                      <span className="text-muted-foreground text-sm">
                        Order ID
                      </span>
                      <p className="font-medium mt-1">
                        {selectedOrder.order_number}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Status</span>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Plan</span>
                      <p className="font-medium mt-1">
                        {selectedOrder.plan_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">
                        Payment Method
                      </span>
                      <p className="font-medium mt-1">
                        {selectedOrder.payment_method || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Amount</span>
                      <p className="font-medium mt-1">
                        {selectedOrder.currency === "USD" ? "$" : selectedOrder.currency}{" "}
                        {selectedOrder.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">
                        Purchase Date
                      </span>
                      <p className="font-medium mt-1">
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proxy Details */}
              {selectedOrder.proxy_details &&
                Object.keys(selectedOrder.proxy_details).length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Proxy Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm overflow-x-auto bg-card p-4 rounded-lg border">
                        {JSON.stringify(selectedOrder.proxy_details, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

              {/* Credentials */}
              {selectedOrder.credentials &&
                Object.keys(selectedOrder.credentials).length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Access Credentials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm overflow-x-auto bg-card p-4 rounded-lg border">
                        {JSON.stringify(selectedOrder.credentials, null, 2)}
                      </pre>
                      <div className="mt-4">
                        <Button
                          onClick={() => downloadCredentials(selectedOrder)}
                          className="w-full gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Credentials
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProxyOrdersPage;