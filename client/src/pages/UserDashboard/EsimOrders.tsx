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
  Phone,
  Filter,
  ArrowLeft,
  MessageSquare,
  PlusCircle,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import { useAuth } from "../../context/AuthContext";
import { countryName } from "@/hooks/useESIMPackages";
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

import EsimTopupDialog from "./EsimTopupDialog";

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
  status: "pending" | "allocated" | "delivered" | "failed" | "cancelled" | "completed" | "active";
  payment_method: string;
  created_at: string;
  updated_at: string;
  api_order_id: string;
  reorderable?: boolean;
  product_type?: string;
  product_name?: string;
  amount?: number;
  credentials_list?: any[];
  // True while support confirms an order whose provider outcome was unknown.
  review_pending?: boolean;
  // Active MeiSIM phone-number line that can be topped up.
  topup_eligible?: boolean;
  metadata?: Record<string, any>;
  // Related profile data
  profiles?: EsimProfile[];
}

interface EsimProfile {
  iccid: string;
  qr_code_url: string | null;
  activation_code: string;
  // Set for carrier-held eSIMs (Moxee) that come with a QR image and no activation code.
  qr_image_path?: string | null;
  install_links?: { ios?: string; android?: string };
  phone_number?: string | null;
  total_volume: number;
  data_label?: string | null;
  location_name: string;
  validity_days?: number | null;
  expired_time: string | null;
}

// A carrier-held eSIM's QR, loaded with the customer's login from our own API.
const CarrierQr = ({ path }: { path: string }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    api.get(path, { responseType: "blob" })
      .then((res) => { url = URL.createObjectURL(res.data); setSrc(url); })
      .catch(() => setFailed(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [path]);

  if (failed) {
    return <p className="text-xs text-muted-foreground text-center">The QR code is not ready yet. Please check back shortly or contact support.</p>;
  }
  if (!src) return <div className="h-[204px] w-[204px] animate-pulse rounded-lg bg-muted" aria-label="Loading QR code" />;
  return (
    <div className="rounded-lg bg-white p-3">
      <img src={src} width={180} height={180} alt="eSIM installation QR code" />
    </div>
  );
};

// The plan's allowance: its own wording ("Unlimited", "1000 MB") or the recorded amount.
const profileData = (p: EsimProfile) =>
  p.data_label || (p.total_volume ? `${Math.round((p.total_volume / 1024) * 100) / 100} GB` : "N/A");

// Plans without a fixed expiry date start their validity when the eSIM is activated.
const profileExpiry = (p: EsimProfile) =>
  p.expired_time
    ? new Date(p.expired_time).toLocaleDateString()
    : p.validity_days
      ? `Valid ${p.validity_days} days from activation`
      : "No expiry";

const profileLocation = (code?: string | null) =>
  !code || code.toLowerCase() === "global" ? "Global" : /^[A-Za-z]{2}$/.test(code) ? countryName(code.toUpperCase()) : code;

const ESIMOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ESIMOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ESIMOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "delivered" | "pending" | "failed">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "esim" | "usa_esim">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ESIMOrder | null>(null);
  const [topupOrder, setTopupOrder] = useState<ESIMOrder | null>(null);
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
    esimAccessCount: 0,
    usaEsimCount: 0,
  });

  useEffect(() => {
    if (accessToken) {
      fetchESIMOrders();
    }
  }, [accessToken]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, activeTab, searchTerm, categoryFilter]);

  const fetchESIMOrders = async () => {
    try {
      setLoading(true);
      // esim covers eSIM Access and MeiSIM; usa_esim returns legacy USA eSIM orders.
      const [esimResponse, usaEsimResponse] = await Promise.allSettled([
        api.get('/web/api/orders?product_type=esim&per_page=100'),
        api.get('/web/api/orders?product_type=usa_esim&per_page=100'),
      ]);

      const allOrders: ESIMOrder[] = [];

      // Add eSIM Access orders
      if (esimResponse.status === 'fulfilled' && esimResponse.value.data?.orders) {
        esimResponse.value.data.orders.forEach((o: any) => {
          // MeiSIM phone-number lines (US and UK) are grouped with the phone-number eSIMs.
          const isUsLine = ['us_prepaid', 'uk_prepaid'].includes(o.metadata?.meisim_line);
          allOrders.push({ ...o, product_type: isUsLine ? 'usa_esim' : 'esim' });
        });
      }

      // Add USA eSIM orders
      if (usaEsimResponse.status === 'fulfilled' && usaEsimResponse.value.data?.orders) {
        usaEsimResponse.value.data.orders.forEach((o: any) => {
          allOrders.push({
            ...o,
            product_type: 'usa_esim',
          });
        });
      }

      // Sort by date descending
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(allOrders);
    } catch (error) {
      console.error("Failed to fetch eSIM orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((o) => o.product_type === categoryFilter);
    }

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((o) => {
        if (activeTab === "delivered") return o.status === "delivered" || o.status === "allocated" || o.status === "completed" || o.status === "active";
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
        o.esim_order_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const delivered = orders.filter((o) => o.status === "delivered" || o.status === "allocated" || o.status === "completed" || o.status === "active").length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const failed = orders.filter((o) => o.status === "failed" || o.status === "cancelled").length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.amount) || 0), 0);
    const totalEsims = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const esimAccessCount = orders.filter((o) => o.product_type === 'esim').length;
    const usaEsimCount = orders.filter((o) => o.product_type === 'usa_esim').length;

    // Calculate total data from profiles (eSIM Access only)
    const totalData = orders.filter((o) => o.product_type === 'esim').reduce((sum, o) => {
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
      esimAccessCount,
      usaEsimCount,
    });
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case "delivered":
      case "allocated":
      case "completed":
      case "active":
        return "success";
      case "pending":
      case "provisioning":
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
      case "completed":
      case "active":
        return CheckCircle;
      case "pending":
      case "provisioning":
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
Total Amount: ${order.currency_code} ${order.total_amount}

${order.profiles
        ?.map(
          (profile, index) => `
eSIM Profile ${index + 1}
==============
ICCID: ${profile.iccid}${profile.phone_number ? `\nPhone number: ${profile.phone_number}` : ""}
Location: ${profileLocation(profile.location_name)}
Data: ${profileData(profile)}
Activation Code: ${profile.activation_code}
Expires: ${profileExpiry(profile)}
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

  const handleReorder = async (orderId: string) => {
    if (!globalThis.confirm("Are you sure you want to top up this eSIM?")) return;

    try {
      setLoading(true);
      const response = await api.post(`/web/api/orders/${orderId}/reorder`);
      if (response.data) {
        fetchESIMOrders();
      }
    } catch (error: any) {
      console.error("Reorder failed:", error);
      alert(error.response?.data?.error || "Failed to place top-up order");
    } finally {
      setLoading(false);
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
          <div className="flex flex-col gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Category:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {[
                  { id: "all", label: "All eSIMs", count: stats.total },
                  { id: "esim", label: "eSIM Access", count: stats.esimAccessCount },
                  { id: "usa_esim", label: "USA eSIM", count: stats.usaEsimCount },
                ].map((cat) => (
                  <Button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    variant={categoryFilter === cat.id ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    {cat.id === "usa_esim" && <Phone className="h-3 w-3" />}
                    {cat.id === "esim" && <Smartphone className="h-3 w-3" />}
                    {cat.label}
                    {cat.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {cat.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Status Tabs */}
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
                  placeholder="Search by order ID, package name, or provider..."
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
                        <div className={`p-2 rounded-lg ${order.product_type === 'usa_esim' ? 'bg-blue-500/10' : 'bg-primary/10'}`}>
                          {order.product_type === 'usa_esim' ? (
                            <Phone className="h-6 w-6 text-blue-500" />
                          ) : (
                            <Smartphone className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {order.package_name || order.product_name}
                          </CardTitle>
                          <CardDescription>#{order.order_number}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={getStatusBadgeVariant(order.status)}
                          className="gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {order.product_type === 'usa_esim' ? 'USA line' : 'Data eSIM'}
                        </Badge>
                      </div>
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
                          {order.profiles?.[0] ? profileData(order.profiles[0]) : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Location
                        </span>
                        <span className="font-medium">
                          {profileLocation(order.profiles?.[0]?.location_name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Smartphone className="h-4 w-4" />
                          Quantity
                        </span>
                        <span className="font-medium">{order.quantity} eSIM(s)</span>
                      </div>
                      {order.profiles?.[0]?.phone_number && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            Phone number
                          </span>
                          <span className="font-medium">{order.profiles[0].phone_number}</span>
                        </div>
                      )}
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

                    {order.review_pending && (
                      <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                        We're confirming your eSIM with the carrier. Support will follow up shortly.
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="text-xl font-bold">
                        {(order.currency_code || 'USD') === "USD" ? "$" : order.currency_code}{" "}
                        {Number(order.total_amount || order.amount || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {["delivered", "allocated", "completed", "active"].includes(order.status) && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 gap-2 border-primary/30 hover:bg-primary/5"
                          >
                            <QrCode className="h-4 w-4" />
                            Details
                          </Button>

                          {order.topup_eligible && (
                            <Button
                              onClick={() => setTopupOrder(order)}
                              className="order-last basis-full gap-2"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Top up
                            </Button>
                          )}

                          {order.reorderable && !order.topup_eligible && (
                            <Button
                              onClick={() => handleReorder(order.id)}
                              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                              Top-up
                            </Button>
                          )}

                          {hasProfiles && (
                            <Button
                              onClick={() => downloadOrderDetails(order)}
                              className="flex-1 gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          )}
                        </>
                      )}

                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1 gap-2 border-primary/30 hover:bg-primary/5"
                        >
                          <QrCode className="h-4 w-4" />
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

      {topupOrder && (
        <EsimTopupDialog
          orderId={topupOrder.id}
          lineName={topupOrder.package_name || topupOrder.product_name || "Phone-number line"}
          open={!!topupOrder}
          onOpenChange={(open) => !open && setTopupOrder(null)}
        />
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
                        {selectedOrder.currency_code} {selectedOrder.total_amount}
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
                          </div>
                          {!profile.activation_code && profile.qr_image_path && (
                            <div className="flex flex-col items-center gap-3 py-2">
                              <CarrierQr path={profile.qr_image_path} />
                              <p className="text-xs text-muted-foreground text-center">
                                Scan with your phone's camera to install.
                              </p>
                            </div>
                          )}
                          {profile.activation_code?.startsWith("LPA:") && (
                            <div className="flex flex-col items-center gap-3 py-2">
                              {/* White quiet zone so phones can scan it in dark mode too. */}
                              <div className="rounded-lg bg-white p-3">
                                <QRCodeSVG value={profile.activation_code} size={180} aria-label="eSIM installation QR code" />
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                Scan with your phone's camera, or install directly:
                              </p>
                              <div className="flex flex-wrap justify-center gap-2">
                                {profile.install_links?.ios && (
                                  <Button asChild size="sm" variant="outline">
                                    <a href={profile.install_links.ios} target="_blank" rel="noopener noreferrer">Install on iPhone</a>
                                  </Button>
                                )}
                                {profile.install_links?.android && (
                                  <Button asChild size="sm" variant="outline">
                                    <a href={profile.install_links.android} target="_blank" rel="noopener noreferrer">Install on Android</a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">ICCID:</span>
                              <p className="font-mono text-xs truncate mt-1">{profile.iccid}</p>
                            </div>
                            {profile.phone_number && (
                              <div>
                                <span className="text-muted-foreground">Phone number:</span>
                                <p className="mt-1">{profile.phone_number}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <p className="mt-1">{profileLocation(profile.location_name)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data:</span>
                              <p className="mt-1">{profileData(profile)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expires:</span>
                              <p className="mt-1">{profileExpiry(profile)}</p>
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
