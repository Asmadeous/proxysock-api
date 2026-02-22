import { useState, useEffect } from "react";
import railsApi from "@/lib/railsApi";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  RefreshCw,
  X,
  ShoppingCart,
  Smartphone,
  Monitor,
  Server,
  Wifi,
  Eye,
  ExternalLink,
  User,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface Transaction {
  id: string;
  payment_id: string;
  amount: number;
  usd_amount?: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  transaction_type: "payment" | "deposit" | "refund";
  created_at: string;
  updated_at: string;
  transaction_details?: any;
  order_id?: string;
  esim_order_id?: string;
  vps_order_id?: string;
  rdp_order_id?: string;
}

interface TransactionStats {
  totalPurchases: number;
  totalDeposits: number;
  totalRefunds: number;
  monthlySpending: number;
  pendingTransactions: number;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalPurchases: 0,
    totalDeposits: 0,
    totalRefunds: 0,
    monthlySpending: 0,
    pendingTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "purchases" | "deposits">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const { user, accessToken } = useAuth();

  useEffect(() => {
    document.title = "Transactions - ProxySock Dashboard";
    if (accessToken && user?.id) {
      fetchTransactions();
    }
  }, [accessToken, user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await railsApi.get('/billing/transactions');

      if (Array.isArray(data)) {
        console.log("Transactions data:", data);
        setTransactions(data);
        calculateStats(data);
      } else if (data && Array.isArray(data.transactions)) {
        console.log("Transactions data:", data.transactions);
        setTransactions(data.transactions);
        calculateStats(data.transactions);
      } else {
        console.error("Failed to fetch transactions or invalid format:", data);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactions: Transaction[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalPurchases = transactions
      .filter(
        (t) =>
          t.transaction_type === "payment" && t.payment_status === "completed",
      )
      .reduce((sum, t) => sum + (t.usd_amount || t.amount), 0);

    const totalDeposits = transactions
      .filter(
        (t) =>
          t.transaction_type === "deposit" && t.payment_status === "completed",
      )
      .reduce((sum, t) => sum + (t.usd_amount || t.amount), 0);

    const totalRefunds = transactions
      .filter(
        (t) =>
          t.transaction_type === "refund" && t.payment_status === "completed",
      )
      .reduce((sum, t) => sum + (t.usd_amount || t.amount), 0);

    const monthlySpending = transactions
      .filter((t) => {
        const transactionDate = new Date(t.created_at);
        return (
          t.transaction_type === "payment" &&
          t.payment_status === "completed" &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + (t.usd_amount || t.amount), 0);

    const pendingTransactions = transactions.filter(
      (t) =>
        t.payment_status === "pending" || t.payment_status === "processing",
    ).length;

    setStats({
      totalPurchases,
      totalDeposits,
      totalRefunds,
      monthlySpending,
      pendingTransactions,
    });
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter by tab
    if (activeTab === "purchases") {
      filtered = filtered.filter(
        (t) =>
          t.transaction_type === "payment" || t.transaction_type === "refund",
      );
    } else if (activeTab === "deposits") {
      filtered = filtered.filter((t) => t.transaction_type === "deposit");
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.payment_method.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.payment_status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      let dateThreshold = new Date();

      switch (dateFilter) {
        case "7days":
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case "30days":
          dateThreshold.setDate(now.getDate() - 30);
          break;
        case "90days":
          dateThreshold.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter(
        (t) => new Date(t.created_at) >= dateThreshold,
      );
    }

    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4 text-warning" />;
      case "failed":
      case "cancelled":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
      case "processing":
        return "warning";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.esim_order_id) return <Smartphone className="h-4 w-4" />;
    if (transaction.vps_order_id) return <Server className="h-4 w-4" />;
    if (transaction.rdp_order_id) return <Monitor className="h-4 w-4" />;
    if (transaction.order_id) return <Wifi className="h-4 w-4" />;
    if (transaction.transaction_type === "deposit") return <ArrowDown className="h-4 w-4" />;
    if (transaction.transaction_type === "refund") return <ArrowUp className="h-4 w-4" />;
    return <ShoppingCart className="h-4 w-4" />;
  };

  const getServiceName = (transaction: Transaction) => {
    if (transaction.esim_order_id) return "eSIM Package";
    if (transaction.vps_order_id) return "VPS Instance";
    if (transaction.rdp_order_id) return "RDP Instance";
    if (transaction.order_id) return "Proxy Service";
    if (transaction.transaction_type === "deposit") return "Account Deposit";
    if (transaction.transaction_type === "refund") return "Refund";
    return "Purchase";
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.transaction_type === "deposit") return "text-emerald-600 dark:text-emerald-400";
    if (transaction.transaction_type === "refund") return "text-orange-600 dark:text-orange-400";
    return "text-primary";
  };

  const formatAmount = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  if (!accessToken || !user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="p-4 bg-warning/10 rounded-lg mb-4 inline-block">
              <AlertTriangle className="h-16 w-16 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">Please log in to view your transactions</p>
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
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
        </Card>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Section Skeleton */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ArrowDownUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Transactions</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-base mt-1">
                    <User className="h-4 w-4" />
                    {user.email || "User Dashboard"}
                  </CardDescription>
                </div>
              </div>
            </div>

            <Button
              onClick={fetchTransactions}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <ArrowUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">{formatAmount(stats.totalDeposits)}</p>
              <p className="text-muted-foreground text-sm mt-1">Total Deposits</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <TrendingDown className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">{formatAmount(stats.totalPurchases)}</p>
              <p className="text-muted-foreground text-sm mt-1">Total Purchases</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">{formatAmount(stats.monthlySpending)}</p>
              <p className="text-muted-foreground text-sm mt-1">This Month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <ArrowUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalRefunds > 0 ? `$${stats.totalRefunds.toFixed(2)}` : 'None'}
                </Badge>
              </div>
              <p className="text-3xl font-bold">{formatAmount(stats.totalRefunds)}</p>
              <p className="text-muted-foreground text-sm mt-1">Total Refunds</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <Badge variant="warning" className="text-xs">
                  {stats.pendingTransactions}
                </Badge>
              </div>
              <p className="text-3xl font-bold">{stats.pendingTransactions}</p>
              <p className="text-muted-foreground text-sm mt-1">Pending</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {["all", "purchases", "deposits"].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  variant={activeTab === tab ? "default" : "ghost"}
                  size="sm"
                  className="capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setDateFilter("all");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/50 rounded-lg mb-4 inline-block">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {transactions.length === 0
                  ? "You haven't made any transactions yet."
                  : "No transactions match your current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${transaction.transaction_type === "deposit"
                        ? "bg-emerald-500/10"
                        : transaction.transaction_type === "refund"
                          ? "bg-orange-500/10"
                          : "bg-primary/10"
                        }`}
                    >
                      <span className={getTransactionColor(transaction)}>
                        {getTransactionIcon(transaction)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {transaction.payment_id}
                        </p>
                        <Badge
                          variant={
                            transaction.transaction_type === "deposit"
                              ? "default"
                              : transaction.transaction_type === "refund"
                                ? "secondary"
                                : "default"
                          }
                          className="text-xs capitalize"
                        >
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getServiceName(transaction)}</span>
                        <span>•</span>
                        <span>{transaction.payment_method}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatAmount(
                          transaction.usd_amount || transaction.amount,
                          transaction.currency,
                        )}
                      </p>
                      {transaction.usd_amount && transaction.currency !== "USD" && (
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </p>
                      )}
                    </div>

                    <Badge variant={getStatusVariant(transaction.payment_status)} className="gap-1">
                      {getStatusIcon(transaction.payment_status)}
                      <span className="capitalize">{transaction.payment_status}</span>
                    </Badge>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(transaction.order_id ||
                        transaction.esim_order_id ||
                        transaction.vps_order_id ||
                        transaction.rdp_order_id) && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
