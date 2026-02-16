import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import railsApi from "@/lib/railsApi";

import {
  ShoppingCart,
  Smartphone,
  Monitor,
  Server,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wifi,
  Package,
  Clock,
  ArrowRight,
  Activity,
  AlertCircle,
  Lock,
} from "lucide-react";
import { isVPNPlan } from "../constants/vpn";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalOrders: number;
  activeServices: number;
  totalSpent: number;
  dataUsage: number;
  pendingOrders: number;
  monthlySpending: number;
  lastMonthSpending: number;
  proxyCount: number;
  vpsCount: number;
  rdpCount: number;
  esimCount: number;
  vpnCount: number;
}

const DashboardLandingPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeServices: 0,
    totalSpent: 0,
    dataUsage: 0,
    pendingOrders: 0,
    monthlySpending: 0,
    lastMonthSpending: 0,
    proxyCount: 0,
    vpsCount: 0,
    rdpCount: 0,
    esimCount: 0,
    vpnCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const { user, accessToken } = useAuth();

  useEffect(() => {
    setGreeting(getGreeting());
    if (accessToken && user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [accessToken, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [ordersResponse, vmsResponse] = await Promise.allSettled([
        railsApi.get('/orders'),
        railsApi.get('/vms')
      ]);

      const orders = ordersResponse.status === 'fulfilled' && Array.isArray(ordersResponse.value.data)
        ? ordersResponse.value.data
        : (ordersResponse.status === 'fulfilled' && Array.isArray(ordersResponse.value.data?.orders) ? ordersResponse.value.data.orders : []);

      const vms = vmsResponse.status === 'fulfilled' && Array.isArray(vmsResponse.value.data)
        ? vmsResponse.value.data
        : (vmsResponse.status === 'fulfilled' && Array.isArray(vmsResponse.value.data?.instances) ? vmsResponse.value.data.instances : []);

      let newStats: DashboardStats = {
        totalOrders: orders.length,
        activeServices: 0,
        totalSpent: 0,
        dataUsage: 0,
        pendingOrders: orders.filter((o: any) => o.status === "pending").length,
        monthlySpending: 0,
        lastMonthSpending: 0,
        proxyCount: 0,
        vpsCount: 0,
        rdpCount: 0,
        esimCount: 0,
        vpnCount: 0,
      };

      // Financials
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      newStats.totalSpent = orders.reduce((sum: number, order: any) => {
        if (order.status === "completed" || order.status === "active" || order.status === "paid") {
          return sum + (Number.parseFloat(order.total_amount || order.amount) || 0);
        }
        return sum;
      }, 0);

      newStats.monthlySpending = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.created_at);
        if (
          orderDate.getMonth() === currentMonth &&
          (order.status === "completed" || order.status === "active" || order.status === "paid")
        ) {
          return sum + (Number.parseFloat(order.total_amount || order.amount) || 0);
        }
        return sum;
      }, 0);

      newStats.lastMonthSpending = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.created_at);
        if (
          orderDate.getMonth() === lastMonth &&
          (order.status === "completed" || order.status === "active" || order.status === "paid")
        ) {
          return sum + (Number.parseFloat(order.total_amount || order.amount) || 0);
        }
        return sum;
      }, 0);

      // VPN & Proxy (from Orders)
      // Assuming VPN orders have product_type='vpn' or similar
      const vpnOrders = orders.filter((o: any) => o.product_type === 'vpn' || isVPNPlan(Number(o.proxy_plan_id || 0)));
      newStats.vpnCount = vpnOrders.length;
      const activeVPNs = vpnOrders.filter(
        (o: any) => (o.status === "completed" || o.status === "active") && (!o.expires_at || new Date(o.expires_at) > new Date())
      ).length;
      newStats.activeServices += activeVPNs;

      const proxyOrders = orders.filter((o: any) => (o.product_type === 'proxy' || o.product_type === 'residential') && !isVPNPlan(Number(o.proxy_plan_id || 0)));
      newStats.proxyCount = proxyOrders.length;
      const activeProxies = proxyOrders.filter(
        (o: any) => (o.status === "completed" || o.status === "active") && (!o.expires_at || new Date(o.expires_at) > new Date())
      ).length;
      newStats.activeServices += activeProxies;

      // VPS & RDP (from VMS)
      const rdpInstances = vms.filter((vm: any) => vm.rdp_username);
      const vpsInstances = vms.filter((vm: any) => !vm.rdp_username);

      newStats.rdpCount = rdpInstances.length; // Total RDPs active
      newStats.vpsCount = vpsInstances.length; // Total VPSs active

      // Add active VMs to active services
      const runningVms = vms.filter((vm: any) => vm.status === 'running' || vm.status === 'active').length;
      newStats.activeServices += runningVms;

      // eSIMs (from Orders for now)
      const esimOrders = orders.filter((o: any) => o.product_type === 'esim' || o.product_type === 'usa-esim');
      newStats.esimCount = esimOrders.length;
      const activeEsims = esimOrders.filter((o: any) => o.status === 'completed' || o.status === 'active').length;
      newStats.activeServices += activeEsims;

      setStats(newStats);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = () => {
    if (stats.lastMonthSpending === 0) {
      return stats.monthlySpending > 0 ? 100 : 0;
    }
    return Math.round(
      ((stats.monthlySpending - stats.lastMonthSpending) /
        stats.lastMonthSpending) *
      100,
    );
  };

  const spendingChange = calculateChange();
  const isSpendingUp = spendingChange >= 0;

  if (!accessToken || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-center">
              Please log in to access your dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders Section Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-1">
          {greeting}, {user.email?.split("@")[0] || "User"}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your services today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card className="bg-card hover:bg-muted/50 transition-colors border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders > 0 && `${stats.pendingOrders} pending`}
            </p>
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card className="bg-card hover:bg-muted/50 transition-colors border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">Services currently running</p>
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card className="bg-card hover:bg-muted/50 transition-colors border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Spending
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={`$${stats.monthlySpending.toFixed(2)}`}>
              ${stats.monthlySpending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {spendingChange !== 0 && (
                <>
                  {isSpendingUp ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-red-500">
                    {Math.abs(spendingChange)}%
                  </span>
                  <span>from last month</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="bg-card hover:bg-muted/50 transition-colors border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Usage</CardTitle>
            <Wifi className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataUsage} GB</div>
            <p className="text-xs text-muted-foreground">Total data consumed</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Services</h2>
          <Link
            to="/dashboard/products"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* VPN */}
          <Link to="/dashboard/vpn-management">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VPN</CardTitle>
                <div className="p-2 rounded-md bg-primary/10">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vpnCount}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Secure connections
                  </p>
                  {stats.vpnCount > 0 && (
                    <Badge variant="outline" className="border-primary text-primary">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          {/* Proxies */}
          <Link to="/dashboard/proxy-management">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proxies</CardTitle>
                <div className="p-2 rounded-md bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.proxyCount}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Active subscriptions
                  </p>
                  {stats.proxyCount > 0 && (
                    <Badge variant="outline" className="border-primary text-primary">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* eSIMs */}
          <Link to="/dashboard/esim-management">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">eSIMs</CardTitle>
                <div className="p-2 rounded-md bg-primary/10">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.esimCount}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Digital SIM profiles
                  </p>
                  {stats.esimCount > 0 && (
                    <Badge variant="outline" className="border-primary text-primary">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* RDP */}
          <Link to="/dashboard/RDP-management">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RDP</CardTitle>
                <div className="p-2 rounded-md bg-primary/10">
                  <Monitor className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rdpCount}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Remote desktop instances
                  </p>
                  {stats.rdpCount > 0 && (
                    <Badge variant="outline" className="border-primary text-primary">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* VPS */}
          <Link to="/dashboard/VPS-management">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VPS</CardTitle>
                <div className="p-2 rounded-md bg-primary/10">
                  <Server className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vpsCount}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Virtual private servers
                  </p>
                  {stats.vpsCount > 0 && (
                    <Badge variant="outline" className="border-primary text-primary">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Get started with our services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/dashboard/proxies"
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <ShoppingCart className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Buy Proxies</p>
                <p className="text-xs text-muted-foreground">Get started</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/dashboard/esim"
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <Smartphone className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Get eSIM</p>
                <p className="text-xs text-muted-foreground">Global coverage</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/dashboard/rdp"
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <Monitor className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Order RDP</p>
                <p className="text-xs text-muted-foreground">Remote access</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/dashboard/vps"
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <Server className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Get VPS</p>
                <p className="text-xs text-muted-foreground">Cloud servers</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/dashboard/vpn"
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                <Lock className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Get VPN</p>
                <p className="text-xs text-muted-foreground">Secure access</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/dashboard/orders">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                View order history
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/transactions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Lifetime spending</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/contact">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
              <Badge variant="secondary" className="bg-primary text-white">24/7</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Get Support</div>
              <p className="text-xs text-muted-foreground">
                We're here to help
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default DashboardLandingPage;
