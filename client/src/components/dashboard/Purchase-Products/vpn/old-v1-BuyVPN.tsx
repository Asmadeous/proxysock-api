// // import { useEffect, useState } from "react";
// // import {
// //   CheckIcon,
// //   ShoppingCartIcon,
// //   XMarkIcon,
// //   ShieldCheckIcon,
// //   GlobeAltIcon,
// //   BoltIcon,
// //   InformationCircleIcon,
// // } from "@heroicons/react/24/solid";
// // import { fetchVPNCategory, VPNCategory, VPNPlan } from "../services/myProxyService";

// // interface CartItem {
// //   product: string;
// //   productType: 'proxy' | 'vpn';
// //   categorySlug: string;
// //   categoryName?: string;
// //   plan: VPNPlan | null;
// //   locations: {
// //     isp: null;
// //     city: null;
// //   };
// //   locationsString: string;
// //   period: number; // This is the plan_id for VPN
// //   protocol: "http" | "socks5";
// //   totalPrice?: number;
// // }

// // export default function BuyVPN() {
// //   const [vpnCategory, setVpnCategory] = useState<VPNCategory | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
// //   const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);

// //   useEffect(() => {
// //     const loadVPNCategory = async () => {
// //       try {
// //         setLoading(true);
// //         const categoryData = await fetchVPNCategory();
// //         if (!categoryData) {
// //           setError("VPN service is currently unavailable.");
// //           return;
// //         }
// //         setVpnCategory(categoryData);
// //       } catch (err) {
// //         console.error("Error loading VPN category:", err);
// //         setError("Failed to load VPN plans. Please try again.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     loadVPNCategory();
// //   }, []);

// //   const togglePlanSelection = (planId: string) => {
// //     if (selectedPlan === planId) {
// //       setSelectedPlan(null);
// //       return;
// //     }
// //     setSelectedPlan(planId);
// //   };

// //   const handleAddToCart = () => {
// //     const plan = vpnCategory?.vpn_plans?.find((p) => p.id === selectedPlan);

// //     if (!selectedPlan || !plan || !vpnCategory) {
// //       setError("Please select a VPN plan");
// //       return;
// //     }

// //     // VPN uses plan_id as the period parameter according to API docs
// //     const newCartItem: CartItem = {
// //       product: String(plan.plan_id),
// //       productType: "vpn",
// //       categorySlug: vpnCategory.slug, // 'residential-vpn'
// //       categoryName: vpnCategory.name, // 'Residential VPN'
// //       plan: plan,
// //       locations: { isp: null, city: null },
// //       locationsString: "Global VPN Network",
// //       period: plan.plan_id, // Pass plan_id as period for VPN
// //       protocol: "http", // Not used for VPN orders but required for cart structure
// //       totalPrice: Number(plan.price),
// //     };

// //     try {
// //       const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
// //       const updatedCart = [...existingCart, newCartItem];
// //       localStorage.setItem("cartItems", JSON.stringify(updatedCart));
// //       window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: updatedCart.length } }));

// //       setShowSuccessAlert(true);
// //       setTimeout(() => setShowSuccessAlert(false), 3000);
// //       setError(null);
// //       setSelectedPlan(null);
// //     } catch (err) {
// //       setError("Failed to add item to cart. Please try again.");
// //     }
// //   };

// //   const renderVPNPlans = () => {
// //     if (loading) {
// //       return (
// //         <div className="flex items-center justify-center h-48">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
// //         </div>
// //       );
// //     }

// //     if (error && !vpnCategory) {
// //       return (
// //         <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
// //           <p className="text-red-400">{error}</p>
// //         </div>
// //       );
// //     }

// //     if (!vpnCategory?.vpn_plans || vpnCategory.vpn_plans.length === 0) {
// //       return (
// //         <div className="flex flex-col items-center justify-center h-48 text-gray-400">
// //           <InformationCircleIcon className="w-12 h-12 mb-3 opacity-50" />
// //           <p className="text-sm">No VPN plans available at the moment</p>
// //         </div>
// //       );
// //     }

// //     return (
// //       <div className="grid gap-6">
// //         {vpnCategory.vpn_plans.map((plan) => (
// //           <div
// //             key={plan.plan_id}
// //             className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl transition-all duration-300 cursor-pointer border-2 ${
// //               selectedPlan === plan.id
// //                 ? "border-yellow-500 shadow-yellow-500/25 transform scale-[1.02] bg-gradient-to-br from-yellow-900/20 to-gray-900"
// //                 : "border-gray-700/50 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10"
// //             }`}
// //             onClick={() => togglePlanSelection(plan.id)}
// //           >
// //             {selectedPlan === plan.id && (
// //               <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full p-2 shadow-lg">
// //                 <CheckIcon className="w-5 h-5 text-white" />
// //               </div>
// //             )}
// //             <div className="flex items-start justify-between mb-4">
// //               <div className="flex-1">
// //                 <div className="flex items-center gap-3 mb-2">
// //                   <ShieldCheckIcon className="w-6 h-6 text-yellow-400" />
// //                 </div>
// //                 <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
// //                 <div className="flex flex-wrap gap-2 mb-4">
// //                   {plan.bandwidth_gb > 0 && (
// //                     <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-700/70 text-yellow-300 border border-yellow-600">
// //                       <BoltIcon className="w-3 h-3 mr-1" />
// //                       {plan.bandwidth_gb} GB Bandwidth
// //                     </span>
// //                   )}
// //                   <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-700/70 text-green-300 border border-green-600">
// //                     <GlobeAltIcon className="w-3 h-3 mr-1" />
// //                     Global Network
// //                   </span>
// //                 </div>
// //                 {plan.features && plan.features.length > 0 && (
// //                   <div className="space-y-2 mt-3">
// //                     {plan.features.map((feature, idx) => (
// //                       <div key={idx} className="flex items-start">
// //                         <CheckIcon className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
// //                         <span className="text-sm text-gray-300">{feature}</span>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 )}
// //                 {plan.locations && plan.locations.length > 0 && (
// //                   <div className="flex flex-wrap gap-2 mt-3">
// //                     {plan.locations.map((location, idx) => (
// //                       <div key={idx} className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1 border border-gray-600">
// //                         <GlobeAltIcon className="w-3 h-3 text-gray-400" />
// //                         <span className="text-xs text-gray-300">{location}</span>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 )}
// //               </div>
// //               <div className="text-right ml-6 flex-shrink-0">
// //                 <div className="bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl p-4 text-white">
// //                   <p className="text-2xl font-bold">${Number(plan.price).toFixed(2)}</p>
// //                   <p className="text-xs opacity-80">one-time</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     );
// //   };

// //   const selectedPlanData = vpnCategory?.vpn_plans?.find((p) => p.id === selectedPlan);

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900/20 to-gray-900 p-4">
// //       <div className="max-w-7xl mx-auto">
// //         <div className="text-center mb-8">
// //           <div className="flex items-center justify-center mb-4">
// //             <ShieldCheckIcon className="w-12 h-12 text-yellow-400 mr-3" />
// //             <h1 className="text-4xl font-bold text-white">VPN Services</h1>
// //           </div>
// //           <p className="text-gray-300">Secure, fast, and reliable VPN connections worldwide</p>
// //         </div>

// //         {showSuccessAlert && (
// //           <div className="mb-8 mx-auto max-w-md">
// //             <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center">
// //               <CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
// //               <div>
// //                 <h3 className="text-green-400 font-medium">Added to Cart!</h3>
// //                 <p className="text-green-300 text-sm">Your VPN plan has been added to cart.</p>
// //               </div>
// //               <button
// //                 onClick={() => setShowSuccessAlert(false)}
// //                 className="ml-auto text-green-400 hover:text-green-300"
// //               >
// //                 <XMarkIcon className="w-5 h-5" />
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //           <div className="lg:col-span-2">
// //             <h2 className="text-2xl font-bold text-white mb-6">Available VPN Plans</h2>
// //             {renderVPNPlans()}
// //           </div>

// //           <div className="lg:col-span-1">
// //             {selectedPlan && selectedPlanData ? (
// //               <div className="space-y-6">
// //                 <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

// //                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
// //                   <h3 className="text-lg font-semibold text-white mb-4">Selected Plan</h3>
// //                   <div className="space-y-3">
// //                     <div className="flex justify-between">
// //                       <span className="text-gray-300">Plan:</span>
// //                       <span className="text-white font-medium">{selectedPlanData.name}</span>
// //                     </div>
// //                     {selectedPlanData.bandwidth_gb > 0 && (
// //                       <div className="flex justify-between">
// //                         <span className="text-gray-300">Bandwidth:</span>
// //                         <span className="text-white font-medium">{selectedPlanData.bandwidth_gb} GB</span>
// //                       </div>
// //                     )}
// //                     <div className="flex justify-between">
// //                       <span className="text-gray-300">Network:</span>
// //                       <span className="text-white font-medium">Global</span>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-xl">
// //                   <div className="mb-4">
// //                     <div className="flex justify-between items-center mb-2">
// //                       <span className="text-gray-300">Total Price:</span>
// //                       <span className="text-2xl font-bold text-white">
// //                         ${Number(selectedPlanData.price).toFixed(2)}
// //                       </span>
// //                     </div>
// //                     <div className="text-gray-400 text-sm">
// //                       One-time payment
// //                     </div>
// //                   </div>
// //                   <button
// //                     onClick={handleAddToCart}
// //                     disabled={!selectedPlan}
// //                     className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${
// //                       selectedPlan
// //                         ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 shadow-lg shadow-yellow-500/30 transform hover:scale-105"
// //                         : "bg-gray-700 text-gray-400 cursor-not-allowed"
// //                     }`}
// //                   >
// //                     <ShoppingCartIcon className="w-6 h-6 mr-2" />
// //                     Add to Cart
// //                   </button>
// //                   {error && (
// //                     <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
// //                       <p className="text-red-400 text-sm">{error}</p>
// //                     </div>
// //                   )}
// //                 </div>
// //               </div>
// //             ) : (
// //               <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
// //                 <div className="text-center">
// //                   <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
// //                   <h3 className="text-lg font-semibold text-white mb-2">Select a VPN Plan</h3>
// //                   <p className="text-gray-400 text-sm">
// //                     Choose a VPN plan from the left to view details and add to cart
// //                   </p>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </div>

// //         {vpnCategory?.information && vpnCategory.information.length > 0 && (
// //           <div className="mt-12">
// //             <h2 className="text-2xl font-bold text-white mb-6">About Our VPN Service</h2>
// //             <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
// //               <div className="space-y-3">
// //                 {vpnCategory.information.map((info, index) => (
// //                   <div key={index} className="flex items-start">
// //                     <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
// //                     <p className="text-gray-300">{info}</p>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// import { useEffect, useState } from "react";
// import {
//   CheckIcon,
//   ShoppingCartIcon,
//   XMarkIcon,
//   ShieldCheckIcon,
//   GlobeAltIcon,
//   BoltIcon,
//   InformationCircleIcon,
// } from "@heroicons/react/24/solid";
// import { fetchVPNCategory, VPNCategory, VPNPlan } from "../services/myProxyService";

// interface CartItem {
//   product: string;
//   productType: 'proxy' | 'vpn';
//   categorySlug: string;
//   categoryName?: string;
//   plan: any | null;
//   vpnPlan?: VPNPlan | null;
//   locations: {
//     isp: null;
//     city: null;
//   };
//   locationsString: string;
//   period: number;
//   protocol: "http" | "socks5";
//   totalPrice?: number;
// }

// export default function BuyVPN() {
//   const [vpnCategory, setVpnCategory] = useState<VPNCategory | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
//   const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);

//   useEffect(() => {
//     const loadVPNCategory = async () => {
//       try {
//         setLoading(true);
//         const categoryData = await fetchVPNCategory();
//         if (!categoryData) {
//           setError("VPN service is currently unavailable.");
//           return;
//         }
//         setVpnCategory(categoryData);
//       } catch (err) {
//         console.error("Error loading VPN category:", err);
//         setError("Failed to load VPN plans. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadVPNCategory();
//   }, []);

//   const togglePlanSelection = (planId: string) => {
//     if (selectedPlan === planId) {
//       setSelectedPlan(null);
//       return;
//     }
//     setSelectedPlan(planId);
//   };

//   const handleAddToCart = () => {
//     const plan = vpnCategory?.vpn_plans?.find((p) => p.id === selectedPlan);

//     if (!selectedPlan || !plan || !vpnCategory) {
//       setError("Please select a VPN plan");
//       return;
//     }

//     // Fixed: Use vpnPlan property instead of plan for VPN items
//     const newCartItem: CartItem = {
//       product: String(plan.plan_id),
//       productType: "vpn",
//       categorySlug: vpnCategory.slug,
//       categoryName: vpnCategory.name,
//       plan: null, // Set to null for VPN items
//       vpnPlan: plan, // ✅ Add the plan to vpnPlan property
//       locations: { isp: null, city: null },
//       locationsString: "Global VPN Network",
//       period: plan.plan_id,
//       protocol: "http",
//       totalPrice: Number(plan.price),
//     };

//     try {
//       const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
//       const updatedCart = [...existingCart, newCartItem];
//       localStorage.setItem("cartItems", JSON.stringify(updatedCart));
//       window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: updatedCart.length } }));

//       setShowSuccessAlert(true);
//       setTimeout(() => setShowSuccessAlert(false), 3000);
//       setError(null);
//       setSelectedPlan(null);
//     } catch (err) {
//       setError("Failed to add item to cart. Please try again.");
//     }
//   };

//   const renderVPNPlans = () => {
//     if (loading) {
//       return (
//         <div className="flex items-center justify-center h-48">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
//         </div>
//       );
//     }

//     if (error && !vpnCategory) {
//       return (
//         <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
//           <p className="text-red-400">{error}</p>
//         </div>
//       );
//     }

//     if (!vpnCategory?.vpn_plans || vpnCategory.vpn_plans.length === 0) {
//       return (
//         <div className="flex flex-col items-center justify-center h-48 text-gray-400">
//           <InformationCircleIcon className="w-12 h-12 mb-3 opacity-50" />
//           <p className="text-sm">No VPN plans available at the moment</p>
//         </div>
//       );
//     }

//     return (
//       <div className="grid gap-6">
//         {vpnCategory.vpn_plans.map((plan) => (
//           <div
//             key={plan.plan_id}
//             className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl transition-all duration-300 cursor-pointer border-2 ${
//               selectedPlan === plan.id
//                 ? "border-yellow-500 shadow-yellow-500/25 transform scale-[1.02] bg-gradient-to-br from-yellow-900/20 to-gray-900"
//                 : "border-gray-700/50 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10"
//             }`}
//             onClick={() => togglePlanSelection(plan.id)}
//           >
//             {selectedPlan === plan.id && (
//               <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full p-2 shadow-lg">
//                 <CheckIcon className="w-5 h-5 text-white" />
//               </div>
//             )}
//             <div className="flex items-start justify-between mb-4">
//               <div className="flex-1">
//                 <div className="flex items-center gap-3 mb-2">
//                   <ShieldCheckIcon className="w-6 h-6 text-yellow-400" />
//                 </div>
//                 <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
//                 <div className="flex flex-wrap gap-2 mb-4">
//                   {plan.bandwidth_gb > 0 && (
//                     <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-700/70 text-yellow-300 border border-yellow-600">
//                       <BoltIcon className="w-3 h-3 mr-1" />
//                       {plan.bandwidth_gb} GB Bandwidth
//                     </span>
//                   )}
//                   <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-700/70 text-green-300 border border-green-600">
//                     <GlobeAltIcon className="w-3 h-3 mr-1" />
//                     Global Network
//                   </span>
//                 </div>
//                 {plan.features && plan.features.length > 0 && (
//                   <div className="space-y-2 mt-3">
//                     {plan.features.map((feature, idx) => (
//                       <div key={idx} className="flex items-start">
//                         <CheckIcon className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
//                         <span className="text-sm text-gray-300">{feature}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//                 {plan.locations && plan.locations.length > 0 && (
//                   <div className="flex flex-wrap gap-2 mt-3">
//                     {plan.locations.map((location, idx) => (
//                       <div key={idx} className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1 border border-gray-600">
//                         <GlobeAltIcon className="w-3 h-3 text-gray-400" />
//                         <span className="text-xs text-gray-300">{location}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//               <div className="text-right ml-6 flex-shrink-0">
//                 <div className="bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl p-4 text-white">
//                   <p className="text-2xl font-bold">${Number(plan.price).toFixed(2)}</p>
//                   <p className="text-xs opacity-80">one-time</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const selectedPlanData = vpnCategory?.vpn_plans?.find((p) => p.id === selectedPlan);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900/20 to-gray-900 p-4">
//       <div className="max-w-7xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center mb-4">
//             <ShieldCheckIcon className="w-12 h-12 text-yellow-400 mr-3" />
//             <h1 className="text-4xl font-bold text-white">VPN Services</h1>
//           </div>
//           <p className="text-gray-300">Secure, fast, and reliable VPN connections worldwide</p>
//         </div>

//         {showSuccessAlert && (
//           <div className="mb-8 mx-auto max-w-md">
//             <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center">
//               <CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
//               <div>
//                 <h3 className="text-green-400 font-medium">Added to Cart!</h3>
//                 <p className="text-green-300 text-sm">Your VPN plan has been added to cart.</p>
//               </div>
//               <button
//                 onClick={() => setShowSuccessAlert(false)}
//                 className="ml-auto text-green-400 hover:text-green-300"
//               >
//                 <XMarkIcon className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2">
//             <h2 className="text-2xl font-bold text-white mb-6">Available VPN Plans</h2>
//             {renderVPNPlans()}
//           </div>

//           <div className="lg:col-span-1">
//             {selectedPlan && selectedPlanData ? (
//               <div className="space-y-6">
//                 <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

//                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
//                   <h3 className="text-lg font-semibold text-white mb-4">Selected Plan</h3>
//                   <div className="space-y-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-300">Plan:</span>
//                       <span className="text-white font-medium">{selectedPlanData.name}</span>
//                     </div>
//                     {selectedPlanData.bandwidth_gb > 0 && (
//                       <div className="flex justify-between">
//                         <span className="text-gray-300">Bandwidth:</span>
//                         <span className="text-white font-medium">{selectedPlanData.bandwidth_gb} GB</span>
//                       </div>
//                     )}
//                     <div className="flex justify-between">
//                       <span className="text-gray-300">Network:</span>
//                       <span className="text-white font-medium">Global</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-xl">
//                   <div className="mb-4">
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-gray-300">Total Price:</span>
//                       <span className="text-2xl font-bold text-white">
//                         ${Number(selectedPlanData.price).toFixed(2)}
//                       </span>
//                     </div>
//                     <div className="text-gray-400 text-sm">
//                       One-time payment
//                     </div>
//                   </div>
//                   <button
//                     onClick={handleAddToCart}
//                     disabled={!selectedPlan}
//                     className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${
//                       selectedPlan
//                         ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 shadow-lg shadow-yellow-500/30 transform hover:scale-105"
//                         : "bg-gray-700 text-gray-400 cursor-not-allowed"
//                     }`}
//                   >
//                     <ShoppingCartIcon className="w-6 h-6 mr-2" />
//                     Add to Cart
//                   </button>
//                   {error && (
//                     <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
//                       <p className="text-red-400 text-sm">{error}</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
//                 <div className="text-center">
//                   <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
//                   <h3 className="text-lg font-semibold text-white mb-2">Select a VPN Plan</h3>
//                   <p className="text-gray-400 text-sm">
//                     Choose a VPN plan from the left to view details and add to cart
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {vpnCategory?.information && vpnCategory.information.length > 0 && (
//           <div className="mt-12">
//             <h2 className="text-2xl font-bold text-white mb-6">About Our VPN Service</h2>
//             <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
//               <div className="space-y-3">
//                 {vpnCategory.information.map((info, index) => (
//                   <div key={index} className="flex items-start">
//                     <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
//                     <p className="text-gray-300">{info}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
