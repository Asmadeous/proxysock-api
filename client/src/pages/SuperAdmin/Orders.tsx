// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   ShoppingCartIcon,
//   DevicePhoneMobileIcon,
//   ComputerDesktopIcon,
//   ServerIcon,
//   ChartBarIcon,
//   CurrencyDollarIcon,
//   ClockIcon,
//   CheckCircleIcon,
//   ArrowTrendingUpIcon,
//   CalendarIcon,
//   FunnelIcon,
//   ArrowRightIcon,
//   SparklesIcon,
// } from "@heroicons/react/24/outline";
// import { useAuth } from "../context/AuthContext";

// interface OrderStats {
//   proxy: { total: number; active: number; pending: number; revenue: number };
//   esim: { total: number; active: number; pending: number; revenue: number };
//   rdp: { total: number; active: number; pending: number; revenue: number };
//   vps: { total: number; active: number; pending: number; revenue: number };
// }

// const UnifiedOrdersDashboard = () => {
//   const [stats, setStats] = useState<OrderStats>({
//     proxy: { total: 0, active: 0, pending: 0, revenue: 0 },
//     esim: { total: 0, active: 0, pending: 0, revenue: 0 },
//     rdp: { total: 0, active: 0, pending: 0, revenue: 0 },
//     vps: { total: 0, active: 0, pending: 0, revenue: 0 },
//   });
//   const [loading, setLoading] = useState(true);
//   const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
//   const { user, accessToken } = useAuth();

//   useEffect(() => {
//     if (accessToken) {
//       fetchAllOrderStats();
//     }
//   }, [accessToken, timeRange]);

//   const fetchAllOrderStats = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch all order types in parallel
//       const [proxyRes, esimRes, rdpRes, vpsRes] = await Promise.allSettled([
//         fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders?select=status,amount`, {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
//           }
//         }),
//         fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/esim_orders?select=status,total_amount`, {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
//           }
//         }),
//         fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rdp_orders?select=status,total_amount`, {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
//           }
//         }),
//         fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/vps_orders?select=status,total_amount`, {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
//           }
//         }),
//       ]);

//       const newStats: OrderStats = {
//         proxy: { total: 0, active: 0, pending: 0, revenue: 0 },
//         esim: { total: 0, active: 0, pending: 0, revenue: 0 },
//         rdp: { total: 0, active: 0, pending: 0, revenue: 0 },
//         vps: { total: 0, active: 0, pending: 0, revenue: 0 },
//       };

//       // Process proxy orders
//       if (proxyRes.status === 'fulfilled' && proxyRes.value.ok) {
//         const data = await proxyRes.value.json();
//         newStats.proxy.total = data.length;
//         newStats.proxy.active = data.filter((o: any) => o.status === 'completed').length;
//         newStats.proxy.pending = data.filter((o: any) => o.status === 'pending').length;
//         newStats.proxy.revenue = data.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
//       }

//       // Process eSIM orders
//       if (esimRes.status === 'fulfilled' && esimRes.value.ok) {
//         const data = await esimRes.value.json();
//         newStats.esim.total = data.length;
//         newStats.esim.active = data.filter((o: any) => o.status === 'delivered' || o.status === 'allocated').length;
//         newStats.esim.pending = data.filter((o: any) => o.status === 'pending').length;
//         newStats.esim.revenue = data.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
//       }

//       // Process RDP orders
//       if (rdpRes.status === 'fulfilled' && rdpRes.value.ok) {
//         const data = await rdpRes.value.json();
//         newStats.rdp.total = data.length;
//         newStats.rdp.active = data.filter((o: any) => o.status === 'active').length;
//         newStats.rdp.pending = data.filter((o: any) => o.status === 'pending' || o.status === 'provisioning').length;
//         newStats.rdp.revenue = data.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
//       }

//       // Process VPS orders
//       if (vpsRes.status === 'fulfilled' && vpsRes.value.ok) {
//         const data = await vpsRes.value.json();
//         newStats.vps.total = data.length;
//         newStats.vps.active = data.filter((o: any) => o.status === 'active').length;
//         newStats.vps.pending = data.filter((o: any) => o.status === 'pending' || o.status === 'provisioning').length;
//         newStats.vps.revenue = data.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
//       }

//       setStats(newStats);
//     } catch (error) {
//       console.error('Failed to fetch order stats:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const orderCategories = [
//     {
//       id: 'proxy',
//       title: 'Proxy Orders',
//       icon: ShoppingCartIcon,
//       color: 'purple',
//       gradient: 'from-purple-600 to-pink-600',
//       bgGradient: 'from-purple-900/20 to-pink-900/20',
//       link: '/dashboard/proxy-orders',
//       stats: stats.proxy,
//     },
//     {
//       id: 'esim',
//       title: 'eSIM Orders',
//       icon: DevicePhoneMobileIcon,
//       color: 'green',
//       gradient: 'from-green-600 to-teal-600',
//       bgGradient: 'from-green-900/20 to-teal-900/20',
//       link: '/dashboard/esim-orders',
//       stats: stats.esim,
//     },
//     {
//       id: 'rdp',
//       title: 'RDP Orders',
//       icon: ComputerDesktopIcon,
//       color: 'red',
//       gradient: 'from-red-600 to-orange-600',
//       bgGradient: 'from-red-900/20 to-orange-900/20',
//       link: '/dashboard/rdp-orders',
//       stats: stats.rdp,
//     },
//     {
//       id: 'vps',
//       title: 'VPS Orders',
//       icon: ServerIcon,
//       color: 'blue',
//       gradient: 'from-blue-600 to-indigo-600',
//       bgGradient: 'from-blue-900/20 to-indigo-900/20',
//       link: '/dashboard/vps-orders',
//       stats: stats.vps,
//     },
//   ];

//   const totalOrders = Object.values(stats).reduce((sum, cat) => sum + cat.total, 0);
//   const totalActive = Object.values(stats).reduce((sum, cat) => sum + cat.active, 0);
//   const totalPending = Object.values(stats).reduce((sum, cat) => sum + cat.pending, 0);
//   const totalRevenue = Object.values(stats).reduce((sum, cat) => sum + cat.revenue, 0);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-pink-900/30 p-8 border border-purple-500/20">
//         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
//         <div className="relative z-10">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center space-x-3 mb-2">
//                 <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
//                   <ChartBarIcon className="h-8 w-8 text-purple-400" />
//                 </div>
//                 <div>
//                   <h1 className="text-4xl font-bold text-white">Orders Dashboard</h1>
//                   <p className="text-gray-300 text-lg mt-1">Manage all your orders in one place</p>
//                 </div>
//               </div>
//             </div>
            
//             {/* Time Range Selector */}
//             <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
//               {(['week', 'month', 'year'] as const).map((range) => (
//                 <button
//                   key={range}
//                   onClick={() => setTimeRange(range)}
//                   className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
//                     timeRange === range
//                       ? 'bg-purple-600 text-white'
//                       : 'text-gray-400 hover:text-white'
//                   }`}
//                 >
//                   {range}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Overall Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm">Total Orders</p>
//                   <p className="text-3xl font-bold text-white mt-1">{totalOrders}</p>
//                   <p className="text-xs text-gray-500 mt-1">All services combined</p>
//                 </div>
//                 <div className="p-3 bg-purple-500/20 rounded-lg">
//                   <ChartBarIcon className="h-8 w-8 text-purple-400" />
//                 </div>
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm">Active Services</p>
//                   <p className="text-3xl font-bold text-green-400 mt-1">{totalActive}</p>
//                   <p className="text-xs text-gray-500 mt-1">Currently running</p>
//                 </div>
//                 <div className="p-3 bg-green-500/20 rounded-lg">
//                   <CheckCircleIcon className="h-8 w-8 text-green-400" />
//                 </div>
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm">Pending Orders</p>
//                   <p className="text-3xl font-bold text-yellow-400 mt-1">{totalPending}</p>
//                   <p className="text-xs text-gray-500 mt-1">Being processed</p>
//                 </div>
//                 <div className="p-3 bg-yellow-500/20 rounded-lg">
//                   <ClockIcon className="h-8 w-8 text-yellow-400" />
//                 </div>
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.4 }}
//               className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm">Total Revenue</p>
//                   <p className="text-3xl font-bold text-white mt-1">${totalRevenue.toFixed(0)}</p>
//                   <p className="text-xs text-gray-500 mt-1">This {timeRange}</p>
//                 </div>
//                 <div className="p-3 bg-green-500/20 rounded-lg">
//                   <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* Service Categories */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
//         {orderCategories.map((category, index) => {
//           const Icon = category.icon;
//           const activePercentage = category.stats.total > 0 
//             ? Math.round((category.stats.active / category.stats.total) * 100)
//             : 0;

//           return (
//             <motion.div
//               key={category.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 * (index + 1) }}
//               whileHover={{ y: -5, scale: 1.02 }}
//               className="group cursor-pointer"
//               onClick={() => window.location.href = category.link}
//             >
//               <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${category.bgGradient} p-6 border border-gray-700/50 hover:border-${category.color}-500/50 transition-all`}>
//                 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
                
//                 {/* Header */}
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center space-x-3">
//                     <div className={`p-3 bg-gradient-to-br ${category.gradient} rounded-xl shadow-lg`}>
//                       <Icon className="h-6 w-6 text-white" />
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-bold text-white">{category.title}</h3>
//                       <p className="text-sm text-gray-400">{category.stats.total} total orders</p>
//                     </div>
//                   </div>
//                   <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
//                 </div>

//                 {/* Stats Grid */}
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <p className="text-xs text-gray-400">Active</p>
//                       <p className="text-2xl font-bold text-green-400">{category.stats.active}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-400">Pending</p>
//                       <p className="text-2xl font-bold text-yellow-400">{category.stats.pending}</p>
//                     </div>
//                   </div>

//                   {/* Progress Bar */}
//                   <div>
//                     <div className="flex justify-between text-xs text-gray-400 mb-2">
//                       <span>Active Rate</span>
//                       <span>{activePercentage}%</span>
//                     </div>
//                     <div className="w-full bg-gray-700 rounded-full h-2">
//                       <div
//                         className={`bg-gradient-to-r ${category.gradient} h-2 rounded-full transition-all`}
//                         style={{ width: `${activePercentage}%` }}
//                       />
//                     </div>
//                   </div>

//                   {/* Revenue */}
//                   <div className="pt-4 border-t border-gray-700/50">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm text-gray-400">Revenue</span>
//                       <span className="text-lg font-bold text-white">
//                         ${category.stats.revenue.toFixed(0)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Hover Action */}
//                 <div className="mt-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                   <span className="text-sm text-white font-medium">View All Orders</span>
//                 </div>
//               </div>
//             </motion.div>
//           );
//         })}
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
//           <SparklesIcon className="h-6 w-6 text-yellow-400" />
//         </div>
        
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => window.location.href = '/dashboard/buy-proxies'}
//             className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-lg transition-all group"
//           >
//             <ShoppingCartIcon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
//             <p className="text-white font-medium">Buy Proxy</p>
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => window.location.href = '/dashboard/esim-packages'}
//             className="p-4 bg-gradient-to-r from-green-600/20 to-teal-600/20 hover:from-green-600/30 hover:to-teal-600/30 rounded-lg transition-all group"
//           >
//             <DevicePhoneMobileIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
//             <p className="text-white font-medium">Get eSIM</p>
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => window.location.href = '/dashboard/rdp-plans'}
//             className="p-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 rounded-lg transition-all group"
//           >
//             <ComputerDesktopIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
//             <p className="text-white font-medium">Order RDP</p>
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => window.location.href = '/dashboard/vps-plans'}
//             className="p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 rounded-lg transition-all group"
//           >
//             <ServerIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
//             <p className="text-white font-medium">Get VPS</p>
//           </motion.button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UnifiedOrdersDashboard;