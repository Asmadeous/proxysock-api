import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Server,
  Monitor,
  Smartphone,
  ShoppingCart,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Lock,
} from "lucide-react";
// import { isVPNPlan } from "../../constants/vpn";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "../../services/api";


interface ProductStats {
  vps: {
    total: number;
    running: number;
    stopped: number;
    creating: number;
    error: number;
  };
  rdp: {
    total: number;
    running: number;
    stopped: number;
    creating: number;
    error: number;
  };
  esim: {
    total: number;
    active: number;
    expired: number;
    pending: number;
  };
  proxy: {
    total: number;
    active: number;
    expired: number;
    pending: number;
  };
  vpn: {
    total: number;
    active: number;
    expired: number;
    pending: number;
  };
}

const ProductManagementPage = () => {
  const [stats, setStats] = useState<ProductStats>({
    vps: { total: 0, running: 0, stopped: 0, creating: 0, error: 0 },
    rdp: { total: 0, running: 0, stopped: 0, creating: 0, error: 0 },
    esim: { total: 0, active: 0, expired: 0, pending: 0 },
    proxy: { total: 0, active: 0, expired: 0, pending: 0 },
    vpn: { total: 0, active: 0, expired: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const { accessToken, user } = useAuth();

  useEffect(() => {
    if (accessToken) {
      fetchProductStats();
    }
  }, [accessToken, user]);

  const fetchProductStats = async () => {
    if (!user) {
      console.error('No user available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.get('/web/api/orders');
      const orders = data.orders || [];

      setStats(() => {
        const newStats = {
          vps: { total: 0, running: 0, stopped: 0, creating: 0, error: 0 },
          rdp: { total: 0, running: 0, stopped: 0, creating: 0, error: 0 },
          esim: { total: 0, active: 0, expired: 0, pending: 0 },
          proxy: { total: 0, active: 0, expired: 0, pending: 0 },
          vpn: { total: 0, active: 0, expired: 0, pending: 0 },
        };

        orders.forEach((o: any) => {
          let cat = o.product_type;
          if (cat === 'vm') cat = 'vps';

          const target = newStats[cat as keyof ProductStats];
          if (target) {
            target.total += 1;
            if (o.status === 'active' || o.status === 'completed' || o.status === 'delivered') {
              (target as any).active !== undefined ? (target as any).active++ : (target as any).running++;
            } else if (o.status === 'pending') {
              (target as any).pending !== undefined ? (target as any).pending++ : (target as any).creating++;
            } else if (o.status === 'expired' || o.status === 'suspended') {
              (target as any).expired !== undefined ? (target as any).expired++ : (target as any).stopped++;
            }
          }
        });

        return newStats;
      });
    } catch (error) {
      console.error('Failed to fetch product stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const productCards = [
    {
      title: "VPS Hosting",
      description: "Manage your Virtual Private Servers",
      icon: Server,
      color: "red",
      link: "/dashboard/VPS-management",
      stats: stats.vps,
      statusLabels: {
        primary: "Running",
        secondary: "Stopped",
        tertiary: "Creating",
      },
    },
    {
      title: "RDP Access",
      description: "Manage your Remote Desktop instances",
      icon: Monitor,
      color: "red",
      link: "/dashboard/RDP-management",
      stats: stats.rdp,
      statusLabels: {
        primary: "Running",
        secondary: "Stopped",
        tertiary: "Creating",
      },
    },
    {
      title: "eSIMs",
      description: "Manage your eSIM profiles and data packages",
      icon: Smartphone,
      color: "red",
      link: "/dashboard/esim-management",
      stats: stats.esim,
      statusLabels: {
        primary: "Active",
        secondary: "Expired",
        tertiary: "Pending",
      },
    },
    {
      title: "Proxies",
      description: "Manage your proxy services and credentials",
      icon: ShoppingCart,
      color: "red",
      link: "/dashboard/proxy-management",
      stats: stats.proxy,
      statusLabels: {
        primary: "Active",
        secondary: "Expired",
        tertiary: "Pending",
      },
    },
    {
      title: "VPN",
      description: "Manage your VPN subscriptions",
      icon: Lock,
      color: "red",
      link: "/dashboard/vpn-management",
      stats: stats.vpn,
      statusLabels: {
        primary: "Active",
        secondary: "Expired",
        tertiary: "Pending",
      },
    },
  ];

  const getColorClasses = () => {
    return {
      bg: "bg-primary/10",
      icon: "text-primary",
      accent: "bg-primary/10",
    };
  };

  if (!accessToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="p-4 bg-warning/10 rounded-lg mb-4 inline-block">
              <Settings className="h-16 w-16 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Authentication Required
            </h3>
            <p className="text-muted-foreground">
              Please log in to view your products
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
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>

        {/* Product Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-24 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-6 w-8 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
                {/* Buttons Skeleton */}
                <div className="flex gap-2 pt-4 border-t">
                  <div className="h-9 flex-1 bg-muted animate-pulse rounded" />
                  <div className="h-9 flex-1 bg-muted animate-pulse rounded" />
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Product Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your services from one place
          </p>
        </div>
        <Button
          onClick={fetchProductStats}
          disabled={loading || !accessToken}
          variant="outline"
          className="gap-2"
        >
          <BarChart3 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {productCards.map((product) => {
          const colors = getColorClasses();
          const IconComponent = product.icon;
          const totalCount = product.stats.total;
          const getStat = (status: 'primary' | 'secondary' | 'tertiary') => {
            if (status === 'primary') {
              if ("running" in product.stats) return product.stats.running;
              if ("active" in product.stats) return product.stats.active;
              return 0;
            }
            if (status === 'secondary') {
              if ("stopped" in product.stats) return product.stats.stopped;
              if ("expired" in product.stats) return product.stats.expired;
              return 0;
            }
            if (status === 'tertiary') {
              if ("creating" in product.stats) return product.stats.creating;
              if ("pending" in product.stats) return product.stats.pending;
              return 0;
            }
            return 0;
          };

          const primaryCount = getStat('primary');
          const secondaryCount = getStat('secondary');
          const tertiaryCount = getStat('tertiary');

          return (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Link to={product.link}>
                <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer">
                  {/* Header */}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-3 rounded-lg ${colors.accent}`}>
                        <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <CardTitle className="text-xl">{product.title}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>

                  {/* Stats */}
                  <CardContent className="space-y-4">
                    {/* Total Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Services
                      </span>
                      <span className="text-2xl font-bold">{totalCount}</span>
                    </div>

                    {/* Status Breakdown */}
                    {totalCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-foreground">
                              {product.statusLabels.primary}
                            </span>
                          </div>
                          <Badge variant="success" className="font-medium">
                            {primaryCount}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-foreground">
                              {product.statusLabels.secondary}
                            </span>
                          </div>
                          <Badge variant="destructive" className="font-medium">
                            {secondaryCount}
                          </Badge>
                        </div>

                        {tertiaryCount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-warning" />
                              <span className="text-foreground">
                                {product.statusLabels.tertiary}
                              </span>
                            </div>
                            <Badge variant="warning" className="font-medium">
                              {tertiaryCount}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty State */}
                    {totalCount === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">
                          No services yet
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Click to get started
                        </p>
                      </div>
                    )}

                    {/* Action Hint */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Manage Services
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                          <span>View All</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {/* <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/buy-proxies"
            className="flex items-center space-x-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <ShoppingCart className="h-6 w-6 text-purple-400" />
            <div>
              <p className="text-white font-medium">Buy Proxies</p>
              <p className="text-gray-400 text-sm">Purchase new proxy services</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors ml-auto" />
          </Link>

          <Link
            to="/dashboard/esim-packages"
            className="flex items-center space-x-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <Smartphone className="h-6 w-6 text-green-400" />
            <div>
              <p className="text-white font-medium">eSIM Packages</p>
              <p className="text-gray-400 text-sm">Browse data packages</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors ml-auto" />
          </Link>

          <Link
            to="/dashboard/orders"
            className="flex items-center space-x-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <Settings className="h-6 w-6 text-blue-400" />
            <div>
              <p className="text-white font-medium">Order History</p>
              <p className="text-gray-400 text-sm">View all orders</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors ml-auto" />
          </Link>

          <Link
            to="/dashboard/transactions"
            className="flex items-center space-x-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <BarChart3 className="h-6 w-6 text-yellow-400" />
            <div>
              <p className="text-white font-medium">Transactions</p>
              <p className="text-gray-400 text-sm">Payment history</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors ml-auto" />
          </Link>
        </div>
      </div> */}

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Service Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* VPS Summary */}
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg mb-3 inline-block">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{stats.vps.total}</h3>
              <p className="text-muted-foreground text-sm">VPS Instances</p>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="text-primary font-medium">
                  {stats.vps.running} Running
                </span>
                <span className="text-destructive">
                  {stats.vps.stopped} Stopped
                </span>
              </div>
            </div>

            {/* RDP Summary */}
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg mb-3 inline-block">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{stats.rdp.total}</h3>
              <p className="text-muted-foreground text-sm">RDP Instances</p>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="text-primary font-medium">
                  {stats.rdp.running} Running
                </span>
                <span className="text-destructive">
                  {stats.rdp.stopped} Stopped
                </span>
              </div>
            </div>

            {/* eSIM Summary */}
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg mb-3 inline-block">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{stats.esim.total}</h3>
              <p className="text-muted-foreground text-sm">eSIM Profiles</p>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="text-primary font-medium">
                  {stats.esim.active} Active
                </span>
                <span className="text-destructive">
                  {stats.esim.expired} Expired
                </span>
              </div>
            </div>

            {/* Proxy Summary */}
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg mb-3 inline-block">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{stats.proxy.total}</h3>
              <p className="text-muted-foreground text-sm">Proxy Services</p>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="text-primary font-medium">
                  {stats.proxy.active} Active
                </span>
                <span className="text-destructive">
                  {stats.proxy.expired} Expired
                </span>
              </div>
            </div>

            {/* VPN Summary */}
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg mb-3 inline-block">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{stats.vpn.total}</h3>
              <p className="text-muted-foreground text-sm">VPN Subscriptions</p>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="text-primary font-medium">
                  {stats.vpn.active} Active
                </span>
                <span className="text-destructive">
                  {stats.vpn.expired} Expired
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagementPage;
