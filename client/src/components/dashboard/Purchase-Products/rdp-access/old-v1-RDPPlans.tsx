// // import { useState, useEffect } from "react";
// // import { useParams, useNavigate } from "react-router-dom";
// // import { createClient } from "@supabase/supabase-js";
// // import {
// //   ComputerDesktopIcon,
// //   CpuChipIcon,
// //   CircleStackIcon,
// //   UsersIcon,
// //   ClockIcon,
// //   ShoppingCartIcon,
// //   CheckIcon,
// //   ArrowRightIcon,
// //   ArrowLeftIcon,
// //   HomeIcon,
// //   BuildingOfficeIcon,
// //   MapPinIcon
// // } from "@heroicons/react/24/outline";

// // // Initialize Supabase client
// // const supabase = createClient(
// //   import.meta.env.VITE_SUPABASE_URL,
// //   import.meta.env.VITE_SUPABASE_ANON_KEY
// // );

// // interface RDPPlan {
// //   id: string;
// //   plan_id: number;
// //   name: string;
// //   slug: string;
// //   price: number;
// //   currency_code: string;
// //   cpu_cores: number;
// //   ram_gb: number;
// //   storage_gb: number;
// //   concurrent_users: number;
// //   session_duration_hours: number;
// //   os_templates: string[]; // JSONB will be deserialized as string[]
// //   features: string[];
// //   locations: string[];
// //   service_type: 'residential' | 'standard';
// //   is_active: boolean;
// // }

// // interface ManagementOption {
// //   type: string;
// //   name: string;
// //   description: string;
// //   features: string[];
// //   priceMultiplier: number;
// //   badge: string;
// // }

// // interface Country {
// //   code: string;
// //   name: string;
// //   flag: string;
// // }

// // interface OSMetadata {
// //   name: string;
// //   icon: string;
// //   description: string;
// // }

// // export default function RDPPlans() {
// //   const { type } = useParams<{ type: string }>();
// //   const navigate = useNavigate();
// //   const [rdpPlans, setRdpPlans] = useState<RDPPlan[]>([]);
// //   const [managementOptions, setManagementOptions] = useState<ManagementOption[]>([]);
// //   const [residentialCountries, setResidentialCountries] = useState<Country[]>([]);
// //   const [osMetadata, setOsMetadata] = useState<OSMetadata[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [selectedPlan, setSelectedPlan] = useState<RDPPlan | null>(null);
// //   const [selectedOS, setSelectedOS] = useState("");
// //   const [selectedDuration, setSelectedDuration] = useState(1);
// //   const [selectedManagement, setSelectedManagement] = useState('unmanaged');
// //   const [selectedCountry, setSelectedCountry] = useState('');
// //   const [showModal, setShowModal] = useState(false);
// //   const [serviceFilter, setServiceFilter] = useState('all');

// //   useEffect(() => {
// //     if (type && (type === 'residential' || type === 'standard')) {
// //       setServiceFilter(type);
// //     } else {
// //       setServiceFilter('all');
// //     }
// //     fetchData();
// //   }, [type]);

// //   const fetchData = async () => {
// //     try {
// //       setLoading(true);

// //       // Fetch RDP plans
// //       const { data: plansData, error: plansError } = await supabase
// //         .from('rdp_plans')
// //         .select('*')
// //         .eq('is_active', true)
// //         .order('price', { ascending: true });

// //       if (plansError) throw new Error(`Failed to fetch RDP plans: ${plansError.message}`);
// //       if (!plansData) throw new Error('No RDP plans found');

// //       // Fallback data
// //       const managementOptionsFallback = [
// //         {
// //           type: 'unmanaged',
// //           name: 'Unmanaged',
// //           description: 'Full administrator access, you manage everything',
// //           features: ['Complete control', 'Admin access', 'Custom software installs', 'Self-managed updates'],
// //           priceMultiplier: 1.0,
// //           badge: 'Most Popular'
// //         },
// //         {
// //           type: 'managed',
// //           name: 'Managed',
// //           description: 'We handle RDP server management for you',
// //           features: ['OS updates & patches', 'Security monitoring', 'Software installations', '24/7 support'],
// //           priceMultiplier: 1.4,
// //           badge: 'Hassle-Free'
// //         }
// //       ];

// //       const residentialCountriesFallback = [
// //         { code: 'US', name: 'United States', flag: '🇺🇸' },
// //         { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
// //         // { code: 'DE', name: 'Germany', flag: '🇩🇪' },
// //         // { code: 'CA', name: 'Canada', flag: '🇨🇦' },
// //         // { code: 'AU', name: 'Australia', flag: '🇦🇺' }
// //       ];

// //       const osMetadataFallback = [
// //         { name: 'Windows Server 2022', icon: 'WindowsIcon', description: 'Enterprise-grade Windows server OS' },
// //         { name: 'Windows 11 Pro', icon: 'WindowsIcon', description: 'Modern Windows desktop experience' },
// //         { name: 'Windows 10 Pro', icon: 'WindowsIcon', description: 'Stable Windows desktop OS' },
// //         { name: 'Ubuntu Desktop 22.04', icon: 'UbuntuIcon', description: 'User-friendly Linux with LTS support' },
// //         { name: 'Debian 11', icon: 'DebianIcon', description: 'Stable and lightweight Linux distribution' },
// //         { name: 'CentOS Stream 9', icon: 'CentOSIcon', description: 'Enterprise-focused Linux with continuous updates' },
// //         { name: 'Fedora 39', icon: 'FedoraIcon', description: 'Cutting-edge Linux for developers' },
// //         { name: 'Rocky Linux 9', icon: 'RockyIcon', description: 'Enterprise-grade Linux, CentOS alternative' }
// //       ];

// //       // Fetch config
// //       const { data: configData, error: configError } = await supabase
// //         .from('system_config')
// //         .select('management_options, residential_countries, os_metadata')
// //         .eq('config_key', 'rdp_settings')
// //         .single();

// //       if (configError) {
// //         console.warn(`Config fetch failed: ${configError.message}. Using fallback data.`);
// //         await supabase.from('system_logs').insert({
// //           component: 'rdp-plans',
// //           action: 'fetch_config',
// //           level: 'warning',
// //           message: `Failed to fetch system_config: ${configError.message}. Using fallback data.`,
// //           created_at: new Date().toISOString(),
// //         });
// //       }

// //       setRdpPlans(plansData);
// //       setManagementOptions(configData?.management_options || managementOptionsFallback);
// //       setResidentialCountries(configData?.residential_countries || residentialCountriesFallback);
// //       setOsMetadata(configData?.os_metadata || osMetadataFallback);
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Failed to fetch data');
// //       await supabase.from('system_logs').insert({
// //         component: 'rdp-plans',
// //         action: 'fetch_data',
// //         level: 'error',
// //         message: err instanceof Error ? err.message : 'Unknown error fetching data',
// //         created_at: new Date().toISOString(),
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const filteredPlans = rdpPlans.filter(plan =>
// //     serviceFilter === 'all' || plan.service_type === serviceFilter
// //   );

// //   const formatPrice = (price: number, duration = 1, managementType = 'unmanaged') => {
// //     const managementMultiplier = managementOptions.find(opt => opt.type === managementType)?.priceMultiplier || 1.0;
// //     let discount = 0;
// //     if (duration === 3) discount = 0.05;
// //     else if (duration === 6) discount = 0.10;
// //     else if (duration === 12) discount = 0.15;

// //     const totalPrice = price * duration * managementMultiplier * (1 - discount);
// //     return duration > 1 ? `${totalPrice.toFixed(2)} (${duration} months)` : `${totalPrice.toFixed(2)}/mo`;
// //   };

// //   const handleAddToCart = async () => {
// //   if (!selectedPlan || !selectedOS) return;
// //   if (selectedPlan.service_type === 'residential' && !selectedCountry) {
// //     alert('Please select a country for residential RDP');
// //     return;
// //   }

// //   // Generate hostname and RDP credentials
// //   const hostname = `rdp-${Math.random().toString(36).substring(2, 8)}`;
// //   // const rdpUsername = "Administrator";

// //   const cartItem = {
// //     rdpPlan: selectedPlan,
// //     osTemplate: selectedOS, // Keep as osTemplate (not os_template)
// //     hostname: hostname, // Add hostname
// //     rdpUsername: hostname, // Add RDP username
// //     duration: selectedDuration,
// //     managementType: selectedManagement,
// //     productType: 'rdp',
// //     location: selectedPlan.service_type === 'residential' ? {
// //       country: residentialCountries.find(c => c.code === selectedCountry)?.name || '',
// //       countryCode: selectedCountry
// //     } : undefined
// //   };

// //   try {
// //     const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
// //     const updatedCart = [...existingCart, cartItem];
// //     localStorage.setItem("cartItems", JSON.stringify(updatedCart));

// //     window.dispatchEvent(new CustomEvent("cart-updated", {
// //       detail: { count: updatedCart.length }
// //     }));

// //     await supabase.from('cart_events').insert({
// //       user_id: (await supabase.auth.getUser()).data.user?.id,
// //       event_type: 'add_to_cart',
// //       product_type: 'rdp',
// //       plan_id: selectedPlan.plan_id,
// //       os_template: selectedOS,
// //       created_at: new Date().toISOString(),
// //     });

// //     setShowModal(false);
// //     setSelectedPlan(null);
// //     setSelectedOS("");
// //     setSelectedDuration(1);
// //     setSelectedManagement('unmanaged');
// //     setSelectedCountry('');

// //     alert(`${selectedPlan.name} (${selectedManagement}, ${selectedOS}) added to cart!`);
// //   } catch (err) {
// //     console.error("Failed to add to cart:", err);
// //     setError('Failed to add item to cart');

// //     await supabase.from('system_logs').insert({
// //       component: 'rdp-plans',
// //       action: 'add_to_cart',
// //       level: 'error',
// //       message: err instanceof Error ? err.message : 'Unknown error adding to cart',
// //       created_at: new Date().toISOString(),
// //     });
// //   }
// // };
// //   const openConfigModal = (plan: RDPPlan): void => {
// //     setSelectedPlan(plan);
// //     setSelectedOS(plan.os_templates[0] || "");
// //     setSelectedDuration(1);
// //     setSelectedManagement('unmanaged');
// //     setSelectedCountry('');
// //     setShowModal(true);
// //   };

// //   const getServiceTypeIcon = (type: string) => {
// //     return type === 'residential' ? HomeIcon : BuildingOfficeIcon;
// //   };

// //   const getServiceTypeBadge = (type: string) => {
// //     if (type === 'residential') {
// //       return (
// //         <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
// //           Residential
// //         </span>
// //       );
// //     }
// //     return (
// //       <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
// //         Standard
// //       </span>
// //     );
// //   };

// //   const getOSIcon = (osName: string) => {
// //     const os = osMetadata.find(os => os.name === osName);
// //     const icons: { [key: string]: string } = {
// //       WindowsIcon: 'fab fa-windows',
// //       UbuntuIcon: 'fab fa-ubuntu',
// //       DebianIcon: 'fab fa-debian',
// //       CentOSIcon: 'fab fa-centos',
// //       FedoraIcon: 'fab fa-fedora',
// //       RockyIcon: 'fas fa-server'
// //     };
// //     return os ? (
// //       <i className={`${icons[os.icon] || 'fas fa-desktop'} text-lg mr-2`} />
// //     ) : null;
// //   };

// //   const getServiceInfo = () => {
// //     if (type === 'residential') {
// //       return {
// //         title: 'Residential RDP Plans',
// //         subtitle: 'Premium residential IP remote desktop access with multiple OS options',
// //         color: 'text-green-500'
// //       };
// //     } else if (type === 'standard') {
// //       return {
// //         title: 'Standard RDP Plans',
// //         subtitle: 'High-performance datacenter remote desktop solutions with diverse OS support',
// //         color: 'text-blue-500'
// //       };
// //     }
// //     return {
// //       title: 'RDP Access Plans',
// //       subtitle: 'Remote desktop solutions with residential and datacenter IPs, supporting Windows and Linux',
// //       color: 'text-blue-500'
// //     };
// //   };

// //   const serviceInfo = getServiceInfo();

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
// //           <p className="text-slate-400">Loading RDP plans...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
// //         <div className="text-center bg-red-900/20 border border-red-700 rounded-xl p-6">
// //           <p className="text-red-400 mb-2">Error loading RDP plans</p>
// //           <p className="text-slate-400 text-sm">{error}</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
// //       {/* Header */}
// //       <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 px-4 py-8">
// //         <div className="max-w-7xl mx-auto">
// //           <div className="text-center">
// //             <div className="flex items-center justify-center gap-3 mb-4">
// //               <ComputerDesktopIcon className={`h-10 w-10 ${serviceInfo.color}`} />
// //               <h1 className="text-4xl md:text-5xl font-bold text-white">{serviceInfo.title}</h1>
// //             </div>
// //             <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
// //               {serviceInfo.subtitle}
// //             </p>

// //             {type && (
// //               <button
// //                 onClick={() => navigate('/dashboard/rdp')}
// //                 className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
// //               >
// //                 <ArrowLeftIcon className="w-4 h-4" />
// //                 Back to RDP Types
// //               </button>
// //             )}
// //           </div>

// //           {!type && (
// //             <div className="flex justify-center mt-8">
// //               <div className="bg-slate-700/50 rounded-xl p-1 flex gap-1">
// //                 <button
// //                   onClick={() => setServiceFilter('all')}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
// //                     serviceFilter === 'all'
// //                       ? 'bg-slate-600 text-white shadow-lg'
// //                       : 'text-slate-400 hover:text-white'
// //                   }`}
// //                 >
// //                   All Plans
// //                 </button>
// //                 <button
// //                   onClick={() => setServiceFilter('residential')}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
// //                     serviceFilter === 'residential'
// //                       ? 'bg-green-600 text-white shadow-lg'
// //                       : 'text-slate-400 hover:text-white'
// //                   }`}
// //                 >
// //                   <HomeIcon className="h-4 w-4" />
// //                   Residential
// //                 </button>
// //                 <button
// //                   onClick={() => setServiceFilter('standard')}
// //                   className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
// //                     serviceFilter === 'standard'
// //                       ? 'bg-blue-600 text-white shadow-lg'
// //                       : 'text-slate-400 hover:text-white'
// //                   }`}
// //                 >
// //                   <BuildingOfficeIcon className="h-4 w-4" />
// //                   Standard
// //                 </button>
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-4 py-8">
// //         {filteredPlans.length === 0 ? (
// //           <div className="text-center py-12">
// //             <ComputerDesktopIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
// //             <h3 className="text-xl font-semibold text-white mb-2">No RDP plans available</h3>
// //             <p className="text-slate-400">
// //               {serviceFilter === 'all'
// //                 ? 'Check back later for available plans'
// //                 : `No ${serviceFilter} plans available at this time`
// //               }
// //             </p>
// //           </div>
// //         ) : (
// //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //             {filteredPlans.map((plan) => {
// //               const ServiceIcon = getServiceTypeIcon(plan.service_type);
// //               return (
// //                 <div
// //                   key={plan.id}
// //                   className={`bg-slate-800 rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-2xl ${
// //                     plan.service_type === 'residential'
// //                       ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/10'
// //                       : 'border-slate-700 hover:border-blue-500/50 hover:shadow-blue-500/10'
// //                   }`}
// //                 >
// //                   <div className="p-6 border-b border-slate-700">
// //                     <div className="flex items-start justify-between">
// //                       <div>
// //                         <div className="flex items-center gap-2 mb-2">
// //                           <h3 className="text-xl font-bold text-white">{plan.name}</h3>
// //                           {getServiceTypeBadge(plan.service_type)}
// //                         </div>
// //                         <div className="flex items-baseline gap-1">
// //                           <span className={`text-3xl font-bold ${
// //                             plan.service_type === 'residential' ? 'text-green-400' : 'text-blue-400'
// //                           }`}>
// //                             ${plan.price.toFixed(2)}
// //                           </span>
// //                           <span className="text-slate-400">/month</span>
// //                         </div>
// //                       </div>
// //                       <div className={`p-2 rounded-lg ${
// //                         plan.service_type === 'residential' ? 'bg-green-500/10' : 'bg-blue-500/10'
// //                       }`}>
// //                         <ServiceIcon className={`h-6 w-6 ${
// //                           plan.service_type === 'residential' ? 'text-green-500' : 'text-blue-500'
// //                         }`} />
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <div className="p-6 space-y-4">
// //                     <div className="grid grid-cols-2 gap-4">
// //                       <div className="flex items-center gap-2 text-sm">
// //                         <CpuChipIcon className="h-4 w-4 text-blue-400" />
// //                         <span className="text-slate-300">{plan.cpu_cores} vCPU</span>
// //                       </div>
// //                       <div className="flex items-center gap-2 text-sm">
// //                         <CircleStackIcon className="h-4 w-4 text-green-400" />
// //                         <span className="text-slate-300">{plan.ram_gb} GB RAM</span>
// //                       </div>
// //                       <div className="flex items-center gap-2 text-sm">
// //                         <UsersIcon className="h-4 w-4 text-purple-400" />
// //                         <span className="text-slate-300">{plan.concurrent_users} User{plan.concurrent_users > 1 ? 's' : ''}</span>
// //                       </div>
// //                       <div className="flex items-center gap-2 text-sm">
// //                         <ClockIcon className="h-4 w-4 text-orange-400" />
// //                         <span className="text-slate-300">
// //                           {plan.session_duration_hours > 0
// //                             ? `${plan.session_duration_hours}h sessions`
// //                             : 'Unlimited'
// //                           }
// //                         </span>
// //                       </div>
// //                     </div>

// //                     {plan.features && plan.features.length > 0 && (
// //                       <div>
// //                         <h4 className="text-sm font-semibold text-slate-300 mb-2">Features:</h4>
// //                         <div className="space-y-1">
// //                           {plan.features.slice(0, 3).map((feature, i) => (
// //                             <div key={i} className="flex items-center gap-2 text-sm">
// //                               <CheckIcon className="h-3 w-3 text-green-400 flex-shrink-0" />
// //                               <span className="text-slate-400">{feature}</span>
// //                             </div>
// //                           ))}
// //                         </div>
// //                       </div>
// //                     )}

// //                     {plan.service_type === 'residential' && (
// //                       <div>
// //                         <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
// //                           <MapPinIcon className="h-4 w-4" />
// //                           Available Locations:
// //                         </h4>
// //                         <div className="flex flex-wrap gap-1">
// //                           {residentialCountries.map((country, i) => (
// //                             <span key={i} className="bg-green-500/10 text-green-300 px-2 py-1 rounded text-xs flex items-center gap-1">
// //                               <span>{country.flag}</span>
// //                               <span>{country.name}</span>
// //                             </span>
// //                           ))}
// //                         </div>
// //                       </div>
// //                     )}

// //                     {plan.os_templates && plan.os_templates.length > 0 && (
// //                       <div>
// //                         <h4 className="text-sm font-semibold text-slate-300 mb-2">OS Options:</h4>
// //                         <div className="flex flex-wrap gap-2">
// //                           {plan.os_templates.slice(0, 3).map((os, i) => (
// //                             <span key={i} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center gap-1">
// //                               {getOSIcon(os)}
// //                               {os}
// //                             </span>
// //                           ))}
// //                           {plan.os_templates.length > 3 && (
// //                             <span className="text-slate-400 text-xs">+{plan.os_templates.length - 3} more</span>
// //                           )}
// //                         </div>
// //                       </div>
// //                     )}

// //                     <div className={`p-3 rounded-lg ${
// //                       plan.service_type === 'residential'
// //                         ? 'bg-green-500/10 border border-green-500/20'
// //                         : 'bg-blue-500/10 border border-blue-500/20'
// //                     }`}>
// //                       <p className="text-xs text-slate-300">
// //                         {plan.service_type === 'residential'
// //                           ? '🏠 Residential IP addresses for authentic browsing and location-based tasks'
// //                           : '🏢 High-performance datacenter infrastructure with enterprise-grade connectivity'
// //                         }
// //                       </p>
// //                     </div>
// //                   </div>

// //                   <div className="p-6 pt-0">
// //                     <button
// //                       onClick={() => openConfigModal(plan)}
// //                       className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg ${
// //                         plan.service_type === 'residential'
// //                           ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
// //                           : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
// //                       }`}
// //                     >
// //                       <ShoppingCartIcon className="h-5 w-5" />
// //                       Configure & Add to Cart
// //                       <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
// //                     </button>
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         )}
// //       </div>

// //       {showModal && selectedPlan && (
// //         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
// //           <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
// //             <div className="p-6 border-b border-slate-700">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <h3 className="text-xl font-bold text-white">Configure RDP</h3>
// //                   <div className="flex items-center gap-2 mt-1">
// //                     <p className="text-slate-400">{selectedPlan.name}</p>
// //                     {getServiceTypeBadge(selectedPlan.service_type)}
// //                   </div>
// //                 </div>
// //                 <button
// //                   onClick={() => setShowModal(false)}
// //                   className="text-slate-400 hover:text-white transition-colors"
// //                 >
// //                   ✕
// //                 </button>
// //               </div>
// //             </div>

// //             <div className="p-6 space-y-6">
// //               <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
// //                 <div className="grid grid-cols-2 gap-4 text-sm">
// //                   <div className="flex items-center gap-2">
// //                     <CpuChipIcon className="h-4 w-4 text-blue-400" />
// //                     <span className="text-slate-300">{selectedPlan.cpu_cores} vCPU</span>
// //                   </div>
// //                   <div className="flex items-center gap-2">
// //                     <CircleStackIcon className="h-4 w-4 text-green-400" />
// //                     <span className="text-slate-300">{selectedPlan.ram_gb} GB RAM</span>
// //                   </div>
// //                   <div className="flex items-center gap-2">
// //                     <UsersIcon className="h-4 w-4 text-purple-400" />
// //                     <span className="text-slate-300">{selectedPlan.concurrent_users} User{selectedPlan.concurrent_users > 1 ? 's' : ''}</span>
// //                   </div>
// //                   <div className="flex items-center gap-2">
// //                     <ClockIcon className="h-4 w-4 text-orange-400" />
// //                     <span className="text-slate-300">
// //                       {selectedPlan.session_duration_hours > 0
// //                         ? `${selectedPlan.session_duration_hours}h`
// //                         : 'Unlimited'
// //                       }
// //                     </span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {selectedPlan.service_type === 'residential' && (
// //                 <div>
// //                   <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
// //                     <MapPinIcon className="h-4 w-4" />
// //                     Select Country
// //                   </label>
// //                   <div className="space-y-2">
// //                     {residentialCountries.map((country) => (
// //                       <label key={country.code} className="flex items-center">
// //                         <input
// //                           type="radio"
// //                           name="country"
// //                           value={country.code}
// //                           checked={selectedCountry === country.code}
// //                           onChange={(e) => setSelectedCountry(e.target.value)}
// //                           className="h-4 w-4 text-green-600"
// //                         />
// //                         <span className="ml-3 flex items-center gap-2 text-slate-300">
// //                           <span>{country.flag}</span>
// //                           <span>{country.name}</span>
// //                         </span>
// //                       </label>
// //                     ))}
// //                   </div>
// //                 </div>
// //               )}

// //               <div>
// //                 <label className="block text-sm font-semibold text-slate-300 mb-3">
// //                   Management Type
// //                 </label>
// //                 <div className="space-y-3">
// //                   {managementOptions.map((option) => (
// //                     <label
// //                       key={option.type}
// //                       className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
// //                         selectedManagement === option.type
// //                           ? 'border-blue-500 bg-blue-500/10'
// //                           : 'border-slate-600 hover:border-slate-500'
// //                       }`}
// //                     >
// //                       <input
// //                         type="radio"
// //                         name="management"
// //                         value={option.type}
// //                         checked={selectedManagement === option.type}
// //                         onChange={(e) => setSelectedManagement(e.target.value)}
// //                         className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 mt-0.5"
// //                       />
// //                       <div className="ml-3 flex-1">
// //                         <div className="flex items-center gap-2 mb-2">
// //                           <span className="font-medium text-white">{option.name}</span>
// //                           <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
// //                             {option.badge}
// //                           </span>
// //                         </div>
// //                         <p className="text-sm text-slate-400 mb-2">{option.description}</p>
// //                         <div className="text-xs text-slate-500">
// //                           Price: {option.priceMultiplier === 1 ? 'Standard' : `+${((option.priceMultiplier - 1) * 100).toFixed(0)}%`}
// //                         </div>
// //                       </div>
// //                     </label>
// //                   ))}
// //                 </div>
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-semibold text-slate-300 mb-3">
// //                   Operating System
// //                 </label>
// //                 <div className="space-y-2">
// //                   {selectedPlan.os_templates?.map((os) => {
// //                     const osMeta = osMetadata.find(meta => meta.name === os);
// //                     return (
// //                       <label key={os} className="flex items-center">
// //                         <input
// //                           type="radio"
// //                           name="os"
// //                           value={os}
// //                           checked={selectedOS === os}
// //                           onChange={(e) => setSelectedOS(e.target.value)}
// //                           className={`h-4 w-4 bg-slate-700 border-slate-600 focus:ring-2 ${
// //                             selectedPlan.service_type === 'residential'
// //                               ? 'text-green-600 focus:ring-green-500'
// //                               : 'text-blue-600 focus:ring-blue-500'
// //                           }`}
// //                         />
// //                         <span className="ml-3 text-slate-300 flex items-center gap-2">
// //                           {getOSIcon(os)}
// //                           <span>{os}</span>
// //                           {osMeta && (
// //                             <span className="text-xs text-slate-500">({osMeta.description})</span>
// //                           )}
// //                         </span>
// //                       </label>
// //                     );
// //                   })}
// //                 </div>
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-semibold text-slate-300 mb-3">
// //                   Billing Period
// //                 </label>
// //                 <select
// //                   value={selectedDuration}
// //                   onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
// //                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:border-transparent focus:ring-blue-500"
// //                 >
// //                   <option value={1}>1 Month</option>
// //                   <option value={3}>3 Months (Save 5%)</option>
// //                   <option value={6}>6 Months (Save 10%)</option>
// //                   <option value={12}>12 Months (Save 15%)</option>
// //                 </select>
// //               </div>

// //               <div className="bg-slate-700/50 rounded-lg p-4">
// //                 <div className="flex justify-between items-center">
// //                   <span className="text-slate-300">Total Price:</span>
// //                   <span className={`text-xl font-bold ${
// //                     selectedPlan.service_type === 'residential' ? 'text-green-400' : 'text-blue-400'
// //                   }`}>
// //                     ${formatPrice(selectedPlan.price, selectedDuration, selectedManagement)}
// //                   </span>
// //                 </div>
// //                 {selectedDuration > 1 && (
// //                   <div className="text-xs text-slate-400 mt-1">
// //                     Monthly: ${(selectedPlan.price * (selectedManagement === 'managed' ? managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier || 1.4 : 1.0)).toFixed(2)}
// //                   </div>
// //                 )}
// //                 {selectedManagement === 'managed' && (
// //                   <div className="text-xs text-blue-400 mt-1">
// //                     Includes +{(((managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier ?? 1.4) - 1) * 100).toFixed(0)}% for managed services
// //                   </div>
// //                 )}
// //               </div>

// //               <div className="flex gap-3">
// //                 <button
// //                   onClick={() => setShowModal(false)}
// //                   className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   onClick={handleAddToCart}
// //                   disabled={!selectedOS || (selectedPlan.service_type === 'residential' && !selectedCountry)}
// //                   className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
// //                     selectedPlan.service_type === 'residential'
// //                       ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
// //                       : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
// //                   }`}
// //                 >
// //                   Add to Cart
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <div className="max-w-7xl mx-auto px-4 pb-16">
// //         <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
// //           <h3 className="text-2xl font-bold text-white text-center mb-8">Why Choose Our RDP Services?</h3>

// //           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
// //             <div className="text-center">
// //               <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
// //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
// //                 </svg>
// //               </div>
// //               <h4 className="text-lg font-semibold text-white mb-2">Instant Setup</h4>
// //               <p className="text-slate-400 text-sm">Your RDP server is configured and ready within minutes of payment</p>
// //             </div>

// //             <div className="text-center">
// //               <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
// //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
// //                 </svg>
// //               </div>
// //               <h4 className="text-lg font-semibold text-white mb-2">Secure Access</h4>
// //               <p className="text-slate-400 text-sm">Industry-standard encryption and security protocols for safe remote access</p>
// //             </div>

// //             <div className="text-center">
// //               <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
// //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
// //                 </svg>
// //               </div>
// //               <h4 className="text-lg font-semibold text-white mb-2">24/7 Support</h4>
// //               <p className="text-slate-400 text-sm">Round-the-clock technical support to keep your RDP running smoothly</p>
// //             </div>

// //             <div className="text-center">
// //               <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
// //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
// //                 </svg>
// //               </div>
// //               <h4 className="text-lg font-semibold text-white mb-2">High Performance</h4>
// //               <p className="text-slate-400 text-sm">Optimized servers with SSD storage and high-speed network connections</p>
// //             </div>
// //           </div>

// //           <div className="mt-12 text-center">
// //             <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600">
// //               <h4 className="text-lg font-semibold text-white mb-3">Need Help Choosing?</h4>
// //               <p className="text-slate-400 mb-4">
// //                 Not sure which plan is right for you? Our team can help you find the perfect RDP solution for your needs.
// //               </p>
// //               <div className="flex flex-col sm:flex-row gap-3 justify-center">
// //                 <button
// //                   onClick={() => navigate('/contact')}
// //                   className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
// //                 >
// //                   Contact Support
// //                 </button>
// //                 <button
// //                   onClick={() => navigate('/dashboard/rdp')}
// //                   className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
// //                 >
// //                   View All Types
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// import { useState, useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { createClient } from "@supabase/supabase-js";
// import {
//   ComputerDesktopIcon,
//   CpuChipIcon,
//   CircleStackIcon,
//   UsersIcon,
//   ClockIcon,
//   ShoppingCartIcon,
//   CheckIcon,
//   ArrowRightIcon,
//   ArrowLeftIcon,
//   HomeIcon,
//   MapPinIcon,
//   BoltIcon,
//   ShieldCheckIcon
// } from "@heroicons/react/24/outline";

// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// );

// interface RDPPlan {
//   id: string;
//   plan_id: number;
//   name: string;
//   slug: string;
//   price: number;
//   currency_code: string;
//   cpu_cores: number;
//   ram_gb: number;
//   storage_gb: number;
//   concurrent_users: number;
//   session_duration_hours: number;
//   os_templates: string[];
//   features: string[];
//   locations: string[];
//   is_active: boolean;
//   country_pricing?: Record<string, number>; // e.g. {"Canada": 28, "CA": 28}
// }

// interface ManagementOption {
//   type: string;
//   name: string;
//   description: string;
//   features: string[];
//   priceMultiplier: number;
//   badge: string;
// }

// interface Country {
//   code: string;
//   name: string;
//   flag: string;
// }

// interface OSMetadata {
//   name: string;
//   icon: string;
//   description: string;
// }

// export default function RDPPlans() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const countryParam = searchParams.get("country") || "";

//   const [rdpPlans, setRdpPlans] = useState<RDPPlan[]>([]);
//   const [managementOptions, setManagementOptions] = useState<ManagementOption[]>([]);
//   const [countries, setCountries] = useState<Country[]>([]);
//   const [osMetadata, setOsMetadata] = useState<OSMetadata[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedPlan, setSelectedPlan] = useState<RDPPlan | null>(null);
//   const [selectedOS, setSelectedOS] = useState("");
//   const [selectedDuration, setSelectedDuration] = useState(1);
//   const [selectedManagement, setSelectedManagement] = useState("unmanaged");
//   const [selectedCountry, setSelectedCountry] = useState(countryParam);
//   const [showModal, setShowModal] = useState(false);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (countryParam) {
//       setSelectedCountry(countryParam);
//     }
//   }, [countryParam]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       const { data: plansData, error: plansError } = await supabase
//         .from("rdp_plans")
//         .select("*")
//         .eq("is_active", true)
//         .order("price", { ascending: true });

//       if (plansError) throw plansError;
//       if (!plansData) throw new Error("No plans found");

//       const managementOptionsFallback = [
//         { type: "unmanaged", name: "Unmanaged", description: "Full administrator access, you manage everything", features: ["Complete control", "Admin access", "Custom software installs", "Self-managed updates"], priceMultiplier: 1.0, badge: "Most Popular" },
//         { type: "managed", name: "Managed", description: "We handle RDP server management for you", features: ["OS updates & patches", "Security monitoring", "Software installations", "24/7 support"], priceMultiplier: 1.4, badge: "Hassle-Free" }
//       ];

//       const countriesFallback = [
//         { code: "US", name: "United States", flag: "🇺🇸" },
//         { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
//         { code: "DE", name: "Germany", flag: "🇩🇪" },
//         { code: "CA", name: "Canada", flag: "🇨🇦" },
//         { code: "AU", name: "Australia", flag: "🇦🇺" }
//       ];

//       const osMetadataFallback = [
//         { name: "Windows Server 2022", icon: "WindowsIcon", description: "Enterprise-grade Windows server OS" },
//         { name: "Windows 11 Pro", icon: "WindowsIcon", description: "Modern Windows desktop experience" },
//         { name: "Windows 10 Pro", icon: "WindowsIcon", description: "Stable Windows desktop OS" },
//         { name: "Ubuntu Desktop 22.04", icon: "UbuntuIcon", description: "User-friendly Linux with LTS support" },
//         { name: "Debian 11", icon: "DebianIcon", description: "Stable and lightweight Linux distribution" },
//         { name: "CentOS Stream 9", icon: "CentOSIcon", description: "Enterprise-focused Linux with continuous updates" },
//         { name: "Fedora 39", icon: "FedoraIcon", description: "Cutting-edge Linux for developers" },
//         { name: "Rocky Linux 9", icon: "RockyIcon", description: "Enterprise-grade Linux, CentOS alternative" }
//       ];

//       const { data: configData } = await supabase.from("system_config").select("management_options, residential_countries, os_metadata").eq("config_key", "rdp_settings").single();

//       setRdpPlans(plansData || []);
//       setManagementOptions(configData?.management_options || managementOptionsFallback);
//       setCountries(configData?.residential_countries || countriesFallback);
//       setOsMetadata(configData?.os_metadata || osMetadataFallback);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to load data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Works whether your JSON key is "Canada" or "CA" – tries both
//   const getEffectivePrice = (plan: RDPPlan): number => {
//     if (!selectedCountry || !plan.country_pricing) return plan.price;

//     const countryName = countries.find(c => c.code === selectedCountry)?.name;
//     const possibleKeys = countryName ? [countryName, selectedCountry] : [selectedCountry];

//     for (const key of possibleKeys) {
//       if (plan.country_pricing[key] !== undefined) {
//         return Number(plan.country_pricing[key]);
//       }
//     }

//     return plan.price;
//   };

//   const calculateTotal = (): number => {
//     if (!selectedPlan) return 0;

//     const base = getEffectivePrice(selectedPlan);
//     const multiplier = managementOptions.find(o => o.type === selectedManagement)?.priceMultiplier || 1;
//     const discount = selectedDuration === 3 ? 0.05 : selectedDuration === 6 ? 0.10 : selectedDuration === 12 ? 0.15 : 0;

//     return Number((base * selectedDuration * multiplier * (1 - discount)).toFixed(2));
//   };

//   const getMonthlyRate = (): string => {
//     if (!selectedPlan) return "0.00";
//     return (calculateTotal() / selectedDuration).toFixed(2);
//   };

//   const handleAddToCart = async () => {
//     if (!selectedPlan || !selectedOS || !selectedCountry) {
//       alert("Please select a country");
//       return;
//     }

//     const hostname = `rdp-${Math.random().toString(36).substring(2, 8)}`;

//     const cartItem = {
//       rdpPlan: selectedPlan,
//       osTemplate: selectedOS,
//       hostname,
//       rdpUsername: hostname,
//       duration: selectedDuration,
//       managementType: selectedManagement,
//       productType: "rdp",
//       location: { country: countries.find(c => c.code === selectedCountry)?.name || "", countryCode: selectedCountry },
//       effective_base_price: getEffectivePrice(selectedPlan),
//       total_amount: calculateTotal()
//     };

//     try {
//       const existing = JSON.parse(localStorage.getItem("cartItems") || "[]");
//       localStorage.setItem("cartItems", JSON.stringify([...existing, cartItem]));
//       window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: existing.length + 1 } }));

//       setShowModal(false);
//       setSelectedPlan(null);
//       setSelectedOS("");
//       setSelectedDuration(1);
//       setSelectedManagement("unmanaged");

//       alert("Added to cart!");
//     } catch (err) {
//       setError("Failed to add to cart");
//     }
//   };

//   const openConfigModal = (plan: RDPPlan) => {
//     setSelectedPlan(plan);
//     setSelectedOS(plan.os_templates[0] || "");
//     setShowModal(true);
//   };

//   const getOSIcon = (osName: string) => {
//     const os = osMetadata.find(o => o.name === osName);
//     const icons: Record<string, string> = {
//       WindowsIcon: "fab fa-windows",
//       UbuntuIcon: "fab fa-ubuntu",
//       DebianIcon: "fab fa-debian",
//       CentOSIcon: "fab fa-centos",
//       FedoraIcon: "fab fa-fedora",
//       RockyIcon: "fas fa-server"
//     };
//     return os ? <i className={`${icons[os.icon] || "fas fa-desktop"} text-lg mr-2`} /> : null;
//   };

//   const selectedCountryData = countries.find(c => c.code === selectedCountry);

//   if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div><p className="text-slate-400 text-lg">Loading...</p></div></div>;
//   if (error) return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center"><div className="text-center bg-red-900/20 border border-red-700 rounded-2xl p-8"><p className="text-red-400 text-xl font-bold">Error</p><p className="text-slate-400">{error}</p></div></div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950">
//       {/* Header */}
//       <div className="relative bg-gradient-to-r from-red-950/90 via-slate-900/90 to-red-950/90 border-b border-red-500/20 px-4 py-12 overflow-hidden">
//         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

//         <div className="max-w-7xl mx-auto relative z-10 text-center">
//           <button onClick={() => navigate("/dashboard/rdp")} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 hover:border-red-500/30">
//             <ArrowLeftIcon className="w-4 h-4" /> Back to Country Selection
//           </button>

//           <div className="inline-flex items-center gap-3 mb-6 bg-red-950/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-red-500/20">
//             <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600"><HomeIcon className="h-6 w-6 text-white" /></div>
//             <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">Residential RDP Plans</span>
//           </div>

//           {selectedCountryData && (
//             <div className="flex items-center justify-center gap-3 mb-6">
//               <span className="text-6xl">{selectedCountryData.flag}</span>
//               <div className="text-left">
//                 <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{selectedCountryData.name}</h1>
//                 <p className="text-red-400 font-semibold text-lg">Residential IP Location</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Plans Grid - Price now ALWAYS reflects selected country (including Canada) */}
//       <div className="max-w-7xl mx-auto px-4 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {rdpPlans.map((plan) => {
//             const price = getEffectivePrice(plan);

//             return (
//               <div key={plan.id} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-red-500/20 hover:border-red-500/50 transition-all group hover:shadow-2xl hover:shadow-red-500/10 hover:scale-[1.02]">
//                 <div className="p-8 border-b border-red-500/10">
//                   <h3 className="text-2xl font-bold text-white mb-3">{plan.name}</h3>
//                   <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
//                     <HomeIcon className="h-3 w-3" /> Residential
//                   </div>
//                   <div className="flex items-baseline gap-2">
//                     <span className="text-4xl font-black text-red-400">${price.toFixed(2)}</span>
//                     <span className="text-slate-400 font-semibold">/month</span>
//                   </div>
//                 </div>

//                 <div className="p-8 space-y-6">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                       <div className="flex items-center gap-2 mb-2"><CpuChipIcon className="h-5 w-5 text-blue-400" /><span className="text-xs text-slate-400 uppercase font-semibold">CPU</span></div>
//                       <span className="text-white font-bold text-lg">{plan.cpu_cores} vCPU</span>
//                     </div>
//                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                       <div className="flex items-center gap-2 mb-2"><CircleStackIcon className="h-5 w-5 text-green-400" /><span className="text-xs text-slate-400 uppercase font-semibold">RAM</span></div>
//                       <span className="text-white font-bold text-lg">{plan.ram_gb} GB</span>
//                     </div>
//                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                       <div className="flex items-center gap-2 mb-2"><UsersIcon className="h-5 w-5 text-purple-400" /><span className="text-xs text-slate-400 uppercase font-semibold">Users</span></div>
//                       <span className="text-white font-bold text-lg">{plan.concurrent_users}</span>
//                     </div>
//                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                       <div className="flex items-center gap-2 mb-2"><ClockIcon className="h-5 w-5 text-orange-400" /><span className="text-xs text-slate-400 uppercase font-semibold">Session</span></div>
//                       <span className="text-white font-bold text-sm">{plan.session_duration_hours > 0 ? `${plan.session_duration_hours}h` : "Unlimited"}</span>
//                     </div>
//                   </div>

//                   {plan.features?.length > 0 && (
//                     <div>
//                       <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Key Features</h4>
//                       <div className="space-y-2">
//                         {plan.features.slice(0, 3).map((f, i) => (
//                           <div key={i} className="flex items-center gap-2">
//                             <div className="p-1 rounded-md bg-red-500/10"><CheckIcon className="h-3 w-3 text-red-400" /></div>
//                             <span className="text-slate-300 text-sm">{f}</span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {plan.os_templates?.length > 0 && (
//                     <div>
//                       <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">OS Options</h4>
//                       <div className="flex flex-wrap gap-2">
//                         {plan.os_templates.slice(0, 3).map((os, i) => (
//                           <span key={i} className="bg-slate-800/70 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1">
//                             {getOSIcon(os)}{os.split(" ")[0]}
//                           </span>
//                         ))}
//                         {plan.os_templates.length > 3 && <span className="text-red-400 text-xs font-semibold px-2 py-1.5">+{plan.os_templates.length - 3} more</span>}
//                       </div>
//                     </div>
//                   )}

//                   <div className="p-4 rounded-xl bg-gradient-to-br from-red-950/50 to-slate-900/50 border border-red-500/20">
//                     <div className="flex items-start gap-2">
//                       <HomeIcon className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
//                       <p className="text-xs text-slate-300 leading-relaxed">Residential IP addresses for authentic browsing and location-based tasks</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="p-8 pt-0">
//                   <button onClick={() => openConfigModal(plan)} className="w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30">
//                     <ShoppingCartIcon className="h-5 w-5" /> Configure & Add to Cart <ArrowRightIcon className="h-4 w-4" />
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Modal - total updates instantly when you change country */}
//       {showModal && selectedPlan && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
//           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-red-500/30 w-full max-w-2xl shadow-2xl my-8">
//             <div className="p-8 border-b border-red-500/20 flex justify-between items-center">
//               <div>
//                 <h3 className="text-3xl font-black text-white mb-2">Configure Your RDP</h3>
//                 <div className="flex items-center gap-3">
//                   <p className="text-slate-400 text-lg">{selectedPlan.name}</p>
//                   <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">Residential</span>
//                 </div>
//               </div>
//               <button onClick={() => setShowModal(false)} className="text-3xl hover:bg-red-500/10 w-10 h-10 rounded-lg">×</button>
//             </div>

//             <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
//               <div className="bg-slate-800/50 rounded-2xl p-6 border border-red-500/10">
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                   <div><div className="flex items-center gap-2 mb-2"><CpuChipIcon className="h-4 w-4 text-blue-400" /><span className="text-xs text-slate-400 uppercase font-semibold">CPU</span></div><span className="text-white font-bold">{selectedPlan.cpu_cores} vCPU</span></div>
//                   <div><div className="flex items-center gap-2 mb-2"><CircleStackIcon className="h-4 w-4 text-green-400" /><span className="text-xs text-slate-400 uppercase font-semibold">RAM</span></div><span className="text-white font-bold">{selectedPlan.ram_gb} GB</span></div>
//                   <div><div className="flex items-center gap-2 mb-2"><UsersIcon className="h-4 w-4 text-purple-400" /><span className="text-xs text-slate-400 uppercase font-semibold">Users</span></div><span className="text-white font-bold">{selectedPlan.concurrent_users}</span></div>
//                   <div><div className="flex items-center gap-2 mb-2"><ClockIcon className="h-4 w-4 text-orange-400" /><span className="text-xs text-slate-400 uppercase font-semibold">Session</span></div><span className="text-white font-bold text-sm">{selectedPlan.session_duration_hours > 0 ? `${selectedPlan.session_duration_hours}h` : "Unlimited"}</span></div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide"><MapPinIcon className="h-5 w-5 text-red-400" /> Select Country</label>
//                 <div className="grid grid-cols-1 gap-3">
//                   {countries.map(c => (
//                     <label key={c.code} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCountry === c.code ? "border-red-500 bg-red-500/10" : "border-slate-700 bg-slate-800/30 hover:border-red-500/50"}`}>
//                       <input type="radio" name="country" value={c.code} checked={selectedCountry === c.code} onChange={e => setSelectedCountry(e.target.value)} className="h-5 w-5 text-red-600" />
//                       <span className="ml-4 flex items-center gap-3 text-slate-200 font-semibold text-lg"><span className="text-3xl">{c.flag}</span><span>{c.name}</span></span>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">Management Type</label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {managementOptions.map(option => (
//                     <label key={option.type} className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all ${selectedManagement === option.type ? "border-red-500 bg-red-500/10" : "border-slate-700 bg-slate-800/30 hover:border-red-500/50"}`}>
//                       <input type="radio" name="management" value={option.type} checked={selectedManagement === option.type} onChange={e => setSelectedManagement(e.target.value)} className="absolute top-4 right-4 h-5 w-5 text-red-600" />
//                       <div className="flex-1 pr-8">
//                         <div className="flex items-center gap-2 mb-3">
//                           <span className="font-bold text-white text-lg">{option.name}</span>
//                           <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full font-semibold">{option.badge}</span>
//                         </div>
//                         <p className="text-sm text-slate-400 mb-3">{option.description}</p>
//                         <div className="text-xs font-semibold">
//                           {option.priceMultiplier === 1 ? <span className="text-green-400">Standard Price</span> : <span className="text-red-400">+{((option.priceMultiplier - 1) * 100).toFixed(0)}% Premium</span>}
//                         </div>
//                       </div>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">Operating System</label>
//                 <div className="grid grid-cols-1 gap-3">
//                   {selectedPlan.os_templates.map(os => {
//                     const osMeta = osMetadata.find(m => m.name === os);
//                     return (
//                       <label key={os} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOS === os ? "border-red-500 bg-red-500/10" : "border-slate-700 bg-slate-800/30 hover:border-red-500/50"}`}>
//                         <input type="radio" name="os" value={os} checked={selectedOS === os} onChange={e => setSelectedOS(e.target.value)} className="h-5 w-5 text-red-600" />
//                         <span className="ml-4 flex items-center gap-3 text-slate-200 font-semibold flex-1">
//                           {getOSIcon(os)}
//                           <span className="flex-1">{os}</span>
//                           {osMeta && <span className="text-xs text-slate-500 hidden md:block">({osMeta.description})</span>}
//                         </span>
//                       </label>
//                     );
//                   })}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">Billing Period</label>
//                 <select value={selectedDuration} onChange={e => setSelectedDuration(parseInt(e.target.value))} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-white font-semibold text-lg focus:border-red-500 transition-all">
//                   <option value={1}>1 Month</option>
//                   <option value={3}>3 Months (Save 5%)</option>
//                   <option value={6}>6 Months (Save 10%)</option>
//                   <option value={12}>12 Months (Save 15%)</option>
//                 </select>
//               </div>

//               <div className="bg-gradient-to-br from-red-950/50 to-slate-900/50 rounded-2xl p-6 border border-red-500/30">
//                 <div className="flex justify-between items-center mb-3">
//                   <span className="text-slate-300 font-semibold text-lg">Total Price:</span>
//                   <span className="text-4xl font-black text-red-400">${calculateTotal().toFixed(2)}</span>
//                 </div>
//                 {selectedDuration > 1 && <div className="text-sm text-slate-400">Effective monthly: ${getMonthlyRate()}/mo</div>}
//                 {selectedManagement === "managed" && <div className="text-sm text-red-400 flex items-center gap-2 mt-3"><ShieldCheckIcon className="h-4 w-4" /> Includes +40% for managed services</div>}
//               </div>
//             </div>

//             <div className="p-8 pt-0 flex gap-4">
//               <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold">Cancel</button>
//               <button onClick={handleAddToCart} disabled={!selectedOS || !selectedCountry} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
//                 <ShoppingCartIcon className="h-5 w-5" /> Add to Cart
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
