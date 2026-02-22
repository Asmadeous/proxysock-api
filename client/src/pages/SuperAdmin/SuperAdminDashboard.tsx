import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ... (keep other imports)
import { fetchOrders, fetchCompletedOrdersTotal } from "../../services/orders";
import { fetchTransactions } from "../../services/transaction";
import { fetchUsers, fetchUserRole } from "../../services/user";
import { Order } from "../../types/index";
import { Transaction } from "../../types/index";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // ... (keep state)

  // ...

  const [userName, setUserName] = useState<string>("Super Admin");

  // Set user name from context
  // Set user name from context
  useEffect(() => {
    if (user) {
      // Cast to any to access potential metadata or just use email
      const meta = (user as any).user_metadata;
      if (meta?.full_name) {
        setUserName(meta.full_name);
      } else if (user.email) {
        const emailName = user.email.split("@")[0];
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    }
  }, [user]);

  // ...

  const handleProcessOrder = async (orderId: string) => {
    // Stub
    console.warn("Manual order processing via Supabase webhook simulation is deprecated for order:", orderId);
    alert("Manual order processing is currently disabled during migration.");
    /*
    try {
      // Logic removed as part of Supabase removal
    } catch (error) {
      console.error("Error processing order:", error);
    }
    */
  };
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Sidebar Navigation Items
  const sidebarItems = [
    { id: "overview", name: "Overview", icon: ChartBarIcon },
    { id: "users", name: "Users", icon: UsersIcon, count: "2K" },
    { id: "orders", name: "Orders", icon: ClipboardDocumentListIcon },
    { id: "payments", name: "Transactions", icon: CurrencyDollarIcon, badge: "New" },
  ];

  // State for users
  const [users, setUsers] = useState<
    { id: string; email: string; username: string; city: string; country: string }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Add new state for payment stats at the top of the component
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    loading: true,
    error: null as string | null,
  });

  // Fetch users using user service
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setUsersError(null);

        // First get the user role
        const role = await fetchUserRole();
        setUserRole(role);

        // Only fetch users if admin
        if (role === "admin") {
          const userData = await fetchUsers();
          setUsers(userData);
        }
      } catch (error) {
        console.error("Error loading users:", error);
        setUsersError(error instanceof Error ? error.message : "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Add this useEffect to check role and redirect
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const role = await fetchUserRole();
        if (role !== "admin") {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        navigate("/");
      }
    };

    checkRoleAndRedirect();
  }, [navigate]);

  // Add orders state
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Fetch orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        const ordersData = await fetchOrders();
        if (!ordersData) {
          setUsersError("No orders data received");
          return;
        }
        setOrders(ordersData);
      } catch (err) {
        setUsersError("Failed to load orders");
        console.error("Load orders error:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  // Process orders
  const processedOrders =
    orders?.map((order) => ({
      id: order.api_order_id || order.id,
      packageName: "Premsocks Proxy", // You can modify this based on your data
      amount: order.currency
        ? `${order.currency.toUpperCase()} ${order.amount}`
        : `$${order.amount}`,
      purchasedOn: order.created_at,
      status:
        order.status === "completed" || order.status === "succeeded"
          ? "succeeded"
          : order.status === "pending"
            ? "pending"
            : "failed",
      userId: order.user_id,
    })) || [];

  // Tabs for orders
  const orderTabs = [
    {
      status: "succeeded",
      label: "Active",
      icon: CheckCircleIcon,
      count: processedOrders.filter((o) => o.status === "succeeded").length,
    },
    {
      status: "pending",
      label: "Pending",
      icon: ClockIcon,
      count: processedOrders.filter((o) => o.status === "pending").length,
    },
    {
      status: "failed",
      label: "Failed",
      icon: ExclamationCircleIcon,
      count: processedOrders.filter((o) => o.status === "failed").length,
    },
  ];

  const [activeOrderTab, setActiveOrderTab] = useState<"succeeded" | "pending" | "failed">(
    "succeeded"
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      succeeded: "text-green-500",
      pending: "text-yellow-500",
      failed: "text-red-500",
    };
    return colors[status];
  };

  // Add transactions state
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Fetch transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);
        const transactionsData = await fetchTransactions();
        if (!transactionsData) {
          setUsersError("No transactions data received");
          return;
        }
        // Sort transactions by date (newest first)
        const sortedTransactions = transactionsData.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTransactions(sortedTransactions);
      } catch (err) {
        setUsersError("Failed to load transactions");
        console.error("Load transactions error:", err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadTransactions();
  }, []);

  // Process transactions
  const processedTransactions =
    transactions?.map((transaction) => ({
      id: transaction.id,
      orderId: transaction.order_id,
      userId: transaction.user_id,
      amount: transaction.currency
        ? `${transaction.currency.toUpperCase()} ${transaction.amount}`
        : `$${transaction.amount}`,
      date: transaction.created_at,
      status: transaction.payment_status || "unknown",
      paymentMethod: transaction.payment_method,
    })) || [];

  // Add transaction tabs state
  const [activeTransactionTab, setActiveTransactionTab] = useState<
    "succeeded" | "pending" | "failed"
  >("succeeded");

  // Transaction tabs
  const transactionTabs = [
    {
      status: "succeeded",
      label: "Succeeded",
      icon: CheckCircleIcon,
      count: processedTransactions.filter((t) => t.status === "succeeded").length,
    },
    {
      status: "pending",
      label: "Pending",
      icon: ClockIcon,
      count: processedTransactions.filter((t) => t.status === "pending").length,
    },
    {
      status: "failed",
      label: "Failed",
      icon: ExclamationCircleIcon,
      count: processedTransactions.filter((t) => t.status === "failed").length,
    },
  ];

  // Update stats array to include all metrics with spinning loaders
  const stats = [
    {
      name: "Active Users",
      value: users.length,
      change: "+8.7%",
      icon: UsersIcon,
      display: (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 h-full">
          <div className="flex items-center justify-between mb-4">
            <UsersIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-green-500">+8.7%</span>
          </div>
          {loadingUsers ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-white mb-1">{users.length}</p>
              <p className="text-sm text-gray-400">Active Users</p>
            </>
          )}
        </div>
      ),
    },
    {
      name: "Total Revenue",
      value: paymentStats.totalRevenue,
      change: "+23.1%",
      icon: BanknotesIcon,
      display: (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 h-full">
          <div className="flex items-center justify-between mb-4">
            <BanknotesIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-green-500">+23.1%</span>
          </div>
          {paymentStats.loading ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-white mb-1">
                ${paymentStats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Total Revenue</p>
            </>
          )}
        </div>
      ),
    },
    {
      name: "Total Transactions",
      value: paymentStats.totalTransactions,
      change: "+15.2%",
      icon: ShoppingCartIcon,
      display: (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 h-full">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-green-500">+15.2%</span>
          </div>
          {paymentStats.loading ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-white mb-1">{paymentStats.totalTransactions}</p>
              <p className="text-sm text-gray-400">Total Transactions</p>
            </>
          )}
        </div>
      ),
    },
    {
      name: "Total Orders",
      value: processedOrders.length,
      change: "+12.4%",
      icon: ClipboardDocumentListIcon,
      display: (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 h-full">
          <div className="flex items-center justify-between mb-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-green-500">+12.4%</span>
          </div>
          {loadingOrders ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-white mb-1">{processedOrders.length}</p>
              <p className="text-sm text-gray-400">Total Orders</p>
            </>
          )}
        </div>
      ),
    },
  ];

  // Fetch payment stats
  useEffect(() => {
    const loadPaymentStats = async () => {
      try {
        setPaymentStats((prev) => ({ ...prev, loading: true, error: null }));

        // Fetch completed orders total
        const { orderTotal, error } = await fetchCompletedOrdersTotal();
        if (error) throw new Error(error);

        // Fetch total transactions count
        const transactionsData = await fetchTransactions();
        const totalTransactions = transactionsData?.length || 0;

        setPaymentStats({
          totalRevenue: orderTotal || 0,
          totalTransactions,
          loading: false,
          error: null,
        });
      } catch (error) {
        setPaymentStats((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load payment stats",
        }));
        console.error("Error loading payment stats:", error);
      }
    };

    loadPaymentStats();
  }, []);



  // Update order tab click handler
  const handleOrderTabClick = (status: "succeeded" | "pending" | "failed") => {
    setActiveOrderTab(status);
  };

  // Update transaction tab click handler
  const handleTransactionTabClick = (status: "succeeded" | "pending" | "failed") => {
    setActiveTransactionTab(status);
  };



  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Add this useEffect for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700/50 hidden lg:block">
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h1 className="text-xl font-bold text-white">Super Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all
                  ${activeTab === item.id
                    ? "bg-red-500/10 text-red-500"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                  }`}>
                <item.icon
                  className={`mr-3 h-5 w-5 ${activeTab === item.id ? "text-red-500" : ""}`}
                />
                <span className="flex-1 text-left">{item.name}</span>
                {item.count && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700/50">
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-500">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Admin Profile */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="flex items-center space-x-3 bg-gray-700/30 p-3 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white font-medium">{userName?.charAt(0) || "SA"}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobile && isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden">
            <div className="h-full bg-gray-800 border-r border-gray-700/50">
              {/* Logo Section */}
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h1 className="text-xl font-bold text-white">Super Admin</h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all
                      ${activeTab === item.id
                        ? "bg-red-500/10 text-red-500"
                        : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                      }`}>
                    <item.icon
                      className={`mr-3 h-5 w-5 ${activeTab === item.id ? "text-red-500" : ""}`}
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.count && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700/50">
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-500">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Admin Profile */}
              <div className="p-4 border-t border-gray-700/50">
                <div className="flex items-center space-x-3 bg-gray-700/30 p-3 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white font-medium">{userName?.charAt(0) || "SA"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-gray-400">Super Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-gray-800 border-b border-gray-700/50 p-4 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
              {isSidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            <h1 className="text-xl font-bold text-white">Super Admin</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        )}

        {/* Content */}
        <div className="h-full overflow-y-auto p-4 sm:p-6">
          {/* Content Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              {sidebarItems.find((item) => item.id === activeTab)?.name}
            </h1>
            <p className="mt-2 text-gray-400">Complete overview of your proxy service</p>
          </div>

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                      text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Users Table */}
              {loadingUsers ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
                </div>
              ) : usersError ? (
                <div className="bg-red-500/10 p-4 rounded-lg text-red-500">
                  Error loading users: {usersError}
                </div>
              ) : userRole !== "admin" ? (
                <div className="bg-yellow-500/10 p-4 rounded-lg text-yellow-500">
                  You must be an admin to view all users.
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            City
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Country
                          </th>
                          <th scope="col" className="relative px-6 py-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {users
                          .filter((user) =>
                            user.username?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((user) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    <span className="text-white font-medium">
                                      {user.username?.charAt(0) || "U"}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-white">
                                      {user.username || "No username"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {user.city || "Unknown"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {user.country || "Unknown"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-gray-400 hover:text-white transition-colors">
                                  <EllipsisVerticalIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Orders</h1>
                  <div className="flex items-center text-sm text-gray-400">
                    <span>Dashboard</span>
                    <ChevronRightIcon className="w-4 h-4 mx-2" />
                    <span>Orders</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {orderTabs.map(({ status, label, icon: Icon, count }) => (
                  <motion.div
                    key={status}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-gray-800 rounded-xl p-4 border border-gray-700/50 cursor-pointer ${activeOrderTab === status ? "ring-2 ring-red-500" : ""
                      }`}
                    onClick={() =>
                      handleOrderTabClick(status as "succeeded" | "pending" | "failed")
                    }>
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2 rounded-lg ${activeOrderTab === status ? "bg-red-500/10" : "bg-gray-700/50"
                          }`}>
                        <Icon className={`w-6 h-6 ${getStatusColor(status)}`} />
                      </div>
                      <span className="text-2xl font-bold text-white">{count}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-400 text-sm">{label} Orders</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                layout
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-4 text-gray-400 font-medium">Order ID</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Package</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Purchased On</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedOrders
                        .filter((order) => order.status === activeOrderTab)
                        .map((order) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                            <td className="p-4 text-white font-medium">{order.id}</td>
                            <td className="p-4 text-white">{order.packageName}</td>
                            <td className="p-4 text-white font-medium">{order.amount}</td>
                            <td className="p-4 text-gray-300">
                              {new Date(order.purchasedOn).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-sm ${getStatusColor(
                                  order.status
                                )} bg-opacity-10 bg-current`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                <span className="capitalize">
                                  {order.status === "succeeded" ? "active" : order.status}
                                </span>
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleProcessOrder(order.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                disabled={order.status === "succeeded"}>
                                Process
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Payment Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-green-500">+23.1%</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    ${paymentStats.loading ? "Loading..." : paymentStats.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-green-500">+15.2%</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {paymentStats.loading ? "Loading..." : paymentStats.totalTransactions}
                  </p>
                  <p className="text-sm text-gray-400">Total Transactions</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-green-500">+8.7%</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{users.length}</p>
                  <p className="text-sm text-gray-400">Active Users</p>
                </div>
              </div>

              {/* Combined History Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Transactions Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="p-6 border-b border-gray-700/50">
                    <h3 className="text-lg font-medium text-white">Transaction History</h3>
                  </div>

                  {/* Transaction Tabs */}
                  <div className="grid grid-cols-3 gap-4 p-4">
                    {transactionTabs.map(({ status, label, icon: Icon, count }) => (
                      <motion.div
                        key={status}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-gray-800 rounded-xl p-4 border border-gray-700/50 cursor-pointer ${activeTransactionTab === status ? "ring-2 ring-red-500" : ""
                          }`}
                        onClick={() =>
                          handleTransactionTabClick(status as "succeeded" | "pending" | "failed")
                        }>
                        <div className="flex items-center justify-between">
                          <div
                            className={`p-2 rounded-lg ${activeTransactionTab === status ? "bg-red-500/10" : "bg-gray-700/50"
                              }`}>
                            <Icon className={`w-6 h-6 ${getStatusColor(status)}`} />
                          </div>
                          <span className="text-2xl font-bold text-white">{count}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-gray-400 text-sm">{label} Transactions</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="overflow-x-auto h-[400px]">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {processedTransactions
                          .filter((transaction) => transaction.status === activeTransactionTab)
                          .map((transaction) => {
                            const user = users.find((u) => u.id === transaction.userId);
                            return (
                              <motion.tr
                                key={transaction.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                  {transaction.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                  {transaction.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${transaction.status === "succeeded"
                                      ? "bg-green-500/10 text-green-500"
                                      : transaction.status === "pending"
                                        ? "bg-yellow-500/10 text-yellow-500"
                                        : "bg-red-500/10 text-red-500"
                                      }`}>
                                    {transaction.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-sm text-white">
                                      {user ? user.username : "Unknown User"}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {user ? user.email : ""}
                                    </span>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden h-[600px] overflow-y-auto">
                  <div className="p-6 border-b border-gray-700/50">
                    <h3 className="text-lg font-medium text-white">Order History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Package
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {processedOrders.map((order) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {order.packageName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {order.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {new Date(order.purchasedOn).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${order.status === "succeeded"
                                  ? "bg-green-500/10 text-green-500"
                                  : order.status === "pending"
                                    ? "bg-yellow-500/10 text-yellow-500"
                                    : "bg-red-500/10 text-red-500"
                                  }`}>
                                {order.status}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full">
                    {stat.display}
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stats.length * 0.1 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 h-full">
                  {loadingTransactions ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" />
                    </div>
                  ) : (
                    null
                  )}
                </motion.div>
              </div>

              {/* Add more overview content here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
