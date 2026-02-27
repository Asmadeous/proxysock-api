"use client";

import { useState, useEffect, FC } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Smartphone,
  Monitor,
  Server,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  User,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useNavigate } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";


// Define interfaces for order stats and recent orders
interface OrderStats {
  proxy: { total: number; active: number; pending: number; failed: number; revenue: number };
  esim: { total: number; active: number; pending: number; failed: number; revenue: number };
  rdp: { total: number; active: number; pending: number; failed: number; revenue: number };
  vps: { total: number; active: number; pending: number; failed: number; revenue: number };
  vpn: { total: number; active: number; pending: number; failed: number; revenue: number };
}

interface RecentOrder {
  id: string;
  type: "proxy" | "esim" | "rdp" | "vps" | "vpn";
  name: string;
  status: string;
  amount: number;
  date: string;
}

const UnifiedOrdersDashboard: FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrderStats>({
    proxy: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
    esim: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
    rdp: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
    vps: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
    vpn: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (accessToken && user?.id) {
      fetchUserOrderStats();
    }
  }, [accessToken, user, timeRange]);



  const fetchUserOrderStats = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.get('/web/api/orders');
      const orders = data.orders || [];

      const newStats: OrderStats = {
        proxy: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
        esim: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
        rdp: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
        vps: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
        vpn: { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 },
      };

      const allRecentOrders: RecentOrder[] = [];

      // Group by product_type
      orders.forEach((order: any) => {
        const type = order.product_type === 'vps' ? 'vps' : (order.product_type || 'proxy');
        const key = type as keyof OrderStats;
        if (newStats[key]) {
          newStats[key].total++;
          if (order.status === 'active' || order.status === 'completed' || order.status === 'delivered') {
            newStats[key].active++;
          }
          if (order.status === 'pending') {
            newStats[key].pending++;
          }
          if (order.status === 'failed' || order.status === 'cancelled') {
            newStats[key].failed++;
          }
          newStats[key].revenue += Number.parseFloat(order.total_amount) || 0;
        }

        allRecentOrders.push({
          id: order.id,
          type: type as RecentOrder['type'],
          name: `${order.product_name || type.toUpperCase()} Order #${String(order.id).slice(0, 8)}`,
          status: order.status,
          amount: Number.parseFloat(order.total_amount) || 0,
          date: order.created_at,
        });
      });

      allRecentOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentOrders(allRecentOrders.slice(0, 10));
      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderCategories = [
    {
      id: "proxy",
      title: "Proxy Orders",
      icon: ShoppingCart,
      color: "primary",
      link: "/dashboard/proxy-orders",
      stats: stats.proxy,
    },
    {
      id: "esim",
      title: "eSIM Orders",
      icon: Smartphone,
      color: "primary",
      link: "/dashboard/esim-orders",
      stats: stats.esim,
    },
    {
      id: "rdp",
      title: "RDP Orders",
      icon: Monitor,
      color: "primary",
      link: "/dashboard/rdp-orders",
      stats: stats.rdp,
    },
    {
      id: "vps",
      title: "VPS Orders",
      icon: Server,
      color: "primary",
      link: "/dashboard/vps-orders",
      stats: stats.vps,
    },
    {
      id: "vpn",
      title: "VPN Orders",
      icon: Lock,
      color: "primary",
      link: "/dashboard/vpn-orders",
      stats: stats.vpn,
    },
  ];

  const totalOrders = Object.values(stats).reduce(
    (sum, cat) => sum + cat.total,
    0,
  );
  const totalActive = Object.values(stats).reduce(
    (sum, cat) => sum + cat.active,
    0,
  );
  const totalPending = Object.values(stats).reduce(
    (sum, cat) => sum + cat.pending,
    0,
  );
  const totalRevenue = Object.values(stats).reduce(
    (sum, cat) => sum + cat.revenue,
    0,
  );

  const getStatusColor = (
    status: string,
  ): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status?.toLowerCase()) {
      case "active":
      case "completed":
      case "delivered":
      case "allocated":
        return "default"; // Changed from success to default (primary)
      case "pending":
      case "provisioning":
        return "secondary"; // Changed from warning to secondary
      case "failed":
      case "cancelled":
      case "terminated":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTimeRangeLabel = (): string => {
    switch (timeRange) {
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      case "all":
        return "All Time";
      default:
        return "Unknown";
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };

  if (!accessToken || !user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-lg mb-4 inline-block">
              <AlertTriangle className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Authentication Required
            </h3>
            <p className="text-muted-foreground">
              Please log in to view your orders
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
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-16" />
                ))}
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-8 w-16" />
                ))}
              </div>
              <Skeleton className="h-10 w-64 ml-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Orders Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-20" />
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
      {/* Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">My Orders</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-base mt-1">
                    <User className="h-4 w-4" />
                    {user.email || "User Dashboard"}
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto max-w-full scrollbar-hide">
              {(["7d", "30d", "90d", "all"] as const).map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                >
                  {range === "7d" && "7 Days"}
                  {range === "30d" && "30 Days"}
                  {range === "90d" && "90 Days"}
                  {range === "all" && "All Time"}
                </Button>
              ))}
            </div>
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
                  <p className="text-muted-foreground text-sm">
                    My Total Orders
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTimeRangeLabel()}
                  </p>
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
                  <p className="text-muted-foreground text-sm">
                    Active Services
                  </p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {totalActive}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently running
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
                  <p className="text-muted-foreground text-sm">
                    Pending Orders
                  </p>
                  <p className="text-3xl font-bold text-muted-foreground mt-1">
                    {totalPending}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Being processed
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Clock className="h-6 w-6 text-muted-foreground" />
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
                  <p className="text-muted-foreground text-sm">Total Spent</p>
                  <p className="text-3xl font-bold mt-1">
                    ${totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTimeRangeLabel()}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>
          </div>
        </CardHeader>
      </Card>

      {/* Service Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {orderCategories.map((category, index) => {
          const Icon = category.icon;
          const activePercentage =
            category.stats.total > 0
              ? Math.round((category.stats.active / category.stats.total) * 100)
              : 0;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group cursor-pointer"
              onClick={() => navigate(category.link)}
            // onClick={() => (window.location.href = )}
            >
              <Card className="transition-all hover:shadow-lg hover:border-primary/50">
                {/* Header */}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {category.title}
                        </CardTitle>
                        <CardDescription>
                          {category.stats.total} orders
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardHeader>

                {/* Stats Grid */}
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-primary">
                        {category.stats.active}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-muted-foreground">
                        {category.stats.pending}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Active Rate</span>
                      <span>{activePercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${activePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Spent
                      </span>
                      <span className="text-lg font-bold">
                        ${formatAmount(category.stats.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Hover Action */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    <span className="text-sm font-medium">
                      View All {category.title}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent orders
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {order.type === "proxy" && (
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        )}
                        {order.type === "esim" && (
                          <Smartphone className="h-4 w-4 text-primary" />
                        )}
                        {order.type === "rdp" && (
                          <Monitor className="h-4 w-4 text-primary" />
                        )}
                        {order.type === "vps" && (
                          <Server className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        ${formatAmount(order.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
            <Sparkles className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate("/dashboard/proxies")}
                  className="w-full h-auto flex-col gap-2 py-6"
                  variant="default"
                >
                  <ShoppingCart className="h-8 w-8" />
                  <span className="font-medium">Buy Proxy</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate("/dashboard/esim")}
                  className="w-full h-auto flex-col gap-2 py-6 bg-emerald-600 hover:bg-emerald-700"
                  variant="default"
                >
                  <Smartphone className="h-8 w-8" />
                  <span className="font-medium">Get eSIM</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate("/dashboard/rdp-plans")}
                  className="w-full h-auto flex-col gap-2 py-6"
                  variant="default"
                >
                  <Monitor className="h-8 w-8" />
                  <span className="font-medium">Order RDP</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate("/dashboard/vps-plans")}
                  className="w-full h-auto flex-col gap-2 py-6 bg-blue-600 hover:bg-blue-700"
                  variant="default"
                >
                  <Server className="h-8 w-8" />
                  <span className="font-medium">Get VPS</span>
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedOrdersDashboard;
