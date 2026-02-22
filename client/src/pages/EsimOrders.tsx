"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Search,
  Calendar,
  DollarSign,
  Signal,
  BarChart3,
  QrCode,
  AlertTriangle,
  Sparkles,
  Wifi,
  MapPin,

  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import railsApi from "@/lib/railsApi";

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

interface ESIMOrder {
  id: string;
  order_number: string;
  esim_order_no: string;
  package_code: string;
  package_slug: string;
  package_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency_code: string;
  status: "pending" | "allocated" | "delivered" | "failed" | "cancelled";
  payment_method: string;
  created_at: string;
  updated_at: string;
  api_order_id: string;
  // Related profile data
  profiles?: {
    iccid: string;
    qr_code_url: string;
    activation_code: string;
    total_volume: number;
    location_name: string;
    expired_time: string;
  }[];
}

const ESIMOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ESIMOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ESIMOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "delivered" | "pending" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ESIMOrder | null>(null);
  const { accessToken } = useAuth();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
    failed: 0,
    totalSpent: 0,
    totalData: 0,
    totalEsims: 0,
  });

  useEffect(() => {
    if (accessToken) {
      fetchESIMOrders();
    }
  }, [accessToken]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, activeTab, searchTerm]);

  const fetchESIMOrders = async () => {
    try {
      setLoading(true);
      // Fetch orders filtering for eSIM type if possible, or filter client side
      const { data } = await railsApi.get('/orders', { params: { type: 'esim' } });

      let ordersData: any[] = [];
      if (Array.isArray(data)) {
        ordersData = data;
      } else if (data && Array.isArray((data as any).orders)) {
        ordersData = (data as any).orders;
      }

      // Filter for eSIM orders if backend didn't filter
      const esimOrders = ordersData.filter((o: any) => o.product_type === 'esim' || o.type === 'esim');

      setOrders(esimOrders);
    } catch (error) {
      console.error("Failed to fetch eSIM orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((o) => {
        if (activeTab === "delivered") return o.status === "delivered" || o.status === "allocated";
        if (activeTab === "pending") return o.status === "pending";
        if (activeTab === "failed") return o.status === "failed" || o.status === "cancelled";
        return true;
      });
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter((o) =>
        o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.esim_order_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const delivered = orders.filter((o) => o.status === "delivered" || o.status === "allocated").length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const failed = orders.filter((o) => o.status === "failed" || o.status === "cancelled").length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount / 10000 || 0), 0);
    const totalEsims = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);

    // Calculate total data from profiles
    const totalData = orders.reduce((sum, o) => {
      const profileData = o.profiles?.reduce((pSum, p) => pSum + (p.total_volume || 0), 0) || 0;
      return sum + profileData;
    }, 0);

    setStats({
      total: orders.length,
      delivered,
      pending,
      failed,
      totalSpent,
      totalData: Math.round(totalData / 1024), // Convert MB to GB
      totalEsims,
    });
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case "delivered":
      case "allocated":
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
      case "delivered":
      case "allocated":
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

  const downloadOrderDetails = (order: ESIMOrder) => {
    const content = `
eSIM Order Details
==================
Order ID: ${order.order_number}
eSIM Order No: ${order.esim_order_no || "N/A"}
Package: ${order.package_name}
Status: ${order.status}
Purchase Date: ${new Date(order.created_at).toLocaleDateString()}
Quantity: ${order.quantity}
Total Amount: ${order.currency_code} ${order.total_amount / 10000}

${order.profiles
        ?.map(
          (profile, index) => `
eSIM Profile ${index + 1}
==============
ICCID: ${profile.iccid}
Location: ${profile.location_name}
Data: ${profile.total_volume} MB
Activation Code: ${profile.activation_code}
Expires: ${profile.expired_time ? new Date(profile.expired_time).toLocaleDateString() : "No expiry"}
`
        )
        .join("\n") || "No profiles available"}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `esim-order-${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
              Please log in to view your eSIM orders
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
              <Skeleton className="h-10 w-32" />
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

        {/* Filter Tabs Skeleton */}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
                {[1, 2, 3].map((j) => (
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
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">eSIM Orders</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Track your eSIM purchases and activations
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Buy New eSIM Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/dashboard/esim-packages")}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Buy New eSIM
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
                  <p className="text-muted-foreground text-sm">Active eSIMs</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {stats.delivered}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Signal className="h-6 w-6 text-primary" />
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
                    ${stats.totalSpent}
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
                  <p className="text-muted-foreground text-sm">Total Data</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalData} GB</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Wifi className="h-6 w-6 text-primary" />
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
                { id: "all", label: "All", count: stats.total },
                { id: "delivered", label: "Delivered", count: stats.delivered },
                { id: "pending", label: "Pending", count: stats.pending },
                { id: "failed", label: "Failed", count: stats.failed },
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
                placeholder="Search by order ID, package name, or eSIM order number..."
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
              <Smartphone className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "You haven't purchased any eSIMs yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            const hasProfiles = order.profiles && order.profiles.length > 0;

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
                          <Smartphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {order.package_name}
                          </CardTitle>
                          <CardDescription>#{order.order_number}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        className="gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Details */}
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Wifi className="h-4 w-4" />
                          Data
                        </span>
                        <span className="font-medium">
                          {order.profiles?.[0]?.total_volume
                            ? `${Math.round(order.profiles[0].total_volume / 1024)} GB`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Location
                        </span>
                        <span className="font-medium">
                          {order.profiles?.[0]?.location_name || "Global"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Smartphone className="h-4 w-4" />
                          Quantity
                        </span>
                        <span className="font-medium">{order.quantity} eSIM(s)</span>
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
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="text-xl font-bold">
                        {order.currency_code === "USD" ? "$" : order.currency_code}{" "}
                        {order.total_amount / 10000}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        Details
                      </Button>
                      {hasProfiles && (
                        <Button
                          onClick={() => downloadOrderDetails(order)}
                          className="flex-1 gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
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
            <DialogTitle className="text-2xl">eSIM Order Details</DialogTitle>
            <DialogDescription>
              Detailed information about your eSIM order
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
                      <span className="text-muted-foreground text-sm">eSIM Order No</span>
                      <p className="font-medium mt-1">
                        {selectedOrder.esim_order_no || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Package</span>
                      <p className="font-medium mt-1">
                        {selectedOrder.package_name}
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
                      <span className="text-muted-foreground text-sm">Quantity</span>
                      <p className="font-medium mt-1">{selectedOrder.quantity}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Total Amount</span>
                      <p className="font-medium mt-1">
                        {selectedOrder.currency_code} {selectedOrder.total_amount / 10000}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* eSIM Profiles */}
              {selectedOrder.profiles && selectedOrder.profiles.length > 0 && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">eSIM Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.profiles.map((profile, index) => (
                        <div key={profile.iccid} className="bg-card rounded-lg p-3 space-y-2 border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Profile {index + 1}
                            </span>
                            {profile.qr_code_url && (
                              <Badge variant="outline" className="text-xs">
                                QR Code Available
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">ICCID:</span>
                              <p className="font-mono text-xs truncate mt-1">{profile.iccid}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <p className="mt-1">{profile.location_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data:</span>
                              <p className="mt-1">{Math.round(profile.total_volume / 1024)} GB</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expires:</span>
                              <p className="mt-1">
                                {profile.expired_time
                                  ? new Date(profile.expired_time).toLocaleDateString()
                                  : "No expiry"}
                              </p>
                            </div>
                          </div>
                          {profile.activation_code && (
                            <div className="mt-2">
                              <span className="text-muted-foreground text-xs">Activation Code:</span>
                              <p className="font-mono text-xs break-all mt-1 bg-muted p-2 rounded">
                                {profile.activation_code}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => downloadOrderDetails(selectedOrder)}
                        className="w-full gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Details
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

export default ESIMOrdersPage;
