// // // import { useState, useEffect } from "react";
// // // import { useParams, useNavigate } from "react-router-dom";
// // // import { createClient } from "@supabase/supabase-js";
// // // import { 
// // //   ServerIcon, 
// // //   CpuChipIcon, 
// // //   CircleStackIcon,
// // //   GlobeAltIcon,
// // //   ShoppingCartIcon,
// // //   CheckIcon,
// // //   ArrowRightIcon,
// // //   ArrowLeftIcon,
// // //   MapPinIcon,
// // //   HomeIcon,
// // //   BuildingOfficeIcon
// // // } from "@heroicons/react/24/outline";

// // // // Initialize Supabase client
// // // const supabase = createClient(
// // //   import.meta.env.VITE_SUPABASE_URL,
// // //   import.meta.env.VITE_SUPABASE_ANON_KEY
// // // );

// // // interface VPSPlan {
// // //   id: string;
// // //   plan_id: number;
// // //   name: string;
// // //   slug: string;
// // //   price: number;
// // //   currency_code: string;
// // //   cpu_cores: number;
// // //   ram_gb: number;
// // //   storage_gb: number;
// // //   bandwidth_gb: number;
// // //   os_templates: string[];
// // //   features: string[];
// // //   locations: string[];
// // //   service_type: 'residential' | 'standard';
// // //   is_active: boolean;
// // // }

// // // interface ManagementOption {
// // //   type: string;
// // //   name: string;
// // //   description: string;
// // //   features: string[];
// // //   priceMultiplier: number;
// // //   badge: string;
// // // }

// // // interface Country {
// // //   code: string;
// // //   name: string;
// // //   flag: string;
// // // }

// // // interface OSMetadata {
// // //   name: string;
// // //   icon: string;
// // //   description: string;
// // // }

// // // export default function VPSPlans() {
// // //   const { type } = useParams<{ type: string }>();
// // //   const navigate = useNavigate();
// // //   const [vpsPlans, setVpsPlans] = useState<VPSPlan[]>([]);
// // //   const [managementOptions, setManagementOptions] = useState<ManagementOption[]>([]);
// // //   const [residentialCountries, setResidentialCountries] = useState<Country[]>([]);
// // //   const [osMetadata, setOsMetadata] = useState<OSMetadata[]>([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState<string | null>(null);
// // //   const [selectedPlan, setSelectedPlan] = useState<VPSPlan | null>(null);
// // //   const [selectedOS, setSelectedOS] = useState("");
// // //   const [selectedDuration, setSelectedDuration] = useState(1);
// // //   const [selectedManagement, setSelectedManagement] = useState('unmanaged');
// // //   const [selectedCountry, setSelectedCountry] = useState('');
// // //   const [showModal, setShowModal] = useState(false);
// // //   const [serviceFilter, setServiceFilter] = useState('all');

// // //   useEffect(() => {
// // //     if (type && (type === 'residential' || type === 'standard')) {
// // //       setServiceFilter(type);
// // //     } else {
// // //       setServiceFilter('all');
// // //     }
// // //     fetchData();
// // //   }, [type]);

// // //   const fetchData = async () => {
// // //     try {
// // //       setLoading(true);

// // //       // Fetch VPS plans
// // //       const { data: plansData, error: plansError } = await supabase
// // //         .from('vps_plans')
// // //         .select('*')
// // //         .eq('is_active', true)
// // //         .order('price', { ascending: true });

// // //       if (plansError) throw new Error(`Failed to fetch VPS plans: ${plansError.message}`);
// // //       if (!plansData) throw new Error('No VPS plans found');

// // //       // Log fetched plans for debugging
// // //       console.log('Fetched VPS Plans:', plansData);

// // //       // Fetch config
// // //       const { data: configData, error: configError } = await supabase
// // //         .from('system_config')
// // //         .select('management_options, residential_countries, os_metadata')
// // //         .eq('config_key', 'vps_settings')
// // //         .single();

// // //       const managementOptionsFallback = [
// // //         {
// // //           type: 'unmanaged',
// // //           name: 'Unmanaged',
// // //           description: 'Full root access, you manage everything',
// // //           features: ['Complete control', 'Root/Admin access', 'Custom configurations', 'Self-managed updates'],
// // //           priceMultiplier: 1.0,
// // //           badge: 'Most Popular'
// // //         },
// // //         {
// // //           type: 'managed',
// // //           name: 'Managed',
// // //           description: 'We handle server management for you',
// // //           features: ['OS updates & patches', 'Security monitoring', 'Basic troubleshooting', '24/7 support'],
// // //           priceMultiplier: 1.5,
// // //           badge: 'Hassle-Free'
// // //         }
// // //       ];

// // //       const residentialCountriesFallback = [
// // //         { code: 'US', name: 'United States', flag: '🇺🇸' },
// // //         { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
// // //         { code: 'DE', name: 'Germany', flag: '🇩🇪' },
// // //         { code: 'CA', name: 'Canada', flag: '🇨🇦' },
// // //         { code: 'AU', name: 'Australia', flag: '🇦🇺' }
// // //       ];

// // //       const osMetadataFallback = [
// // //         { name: 'Ubuntu 22.04 LTS', icon: 'UbuntuIcon', description: 'Latest Ubuntu LTS with long-term support' },
// // //         { name: 'Ubuntu 20.04 LTS', icon: 'UbuntuIcon', description: 'Stable Ubuntu LTS version' },
// // //         { name: 'Debian 12', icon: 'DebianIcon', description: 'Latest stable Debian release' },
// // //         { name: 'Debian 11', icon: 'DebianIcon', description: 'Stable and lightweight Debian' },
// // //         { name: 'CentOS Stream 9', icon: 'CentOSIcon', description: 'Enterprise-focused Linux with continuous updates' },
// // //         { name: 'Red Hat Enterprise Linux 9', icon: 'RHELIcon', description: 'Enterprise-grade Linux with robust support' },
// // //         { name: 'Rocky Linux 9', icon: 'RockyIcon', description: 'CentOS alternative for enterprise use' },
// // //         { name: 'Windows Server 2022', icon: 'WindowsIcon', description: 'Latest Windows Server for enterprise applications' },
// // //         { name: 'Windows Server 2019', icon: 'WindowsIcon', description: 'Stable Windows Server version' },
// // //         { name: 'FreeBSD 14', icon: 'FreeBSDIcon', description: 'High-performance BSD-based OS' }
// // //       ];

// // //       if (configError) {
// // //         console.warn(`Config fetch failed: ${configError.message}. Using fallback data.`);
// // //         await supabase.from('system_logs').insert({
// // //           component: 'vps-plans',
// // //           action: 'fetch_config',
// // //           level: 'warning',
// // //           message: `Failed to fetch system_config: ${configError.message}. Using fallback data.`,
// // //           created_at: new Date().toISOString(),
// // //         });
// // //       }

// // //       setVpsPlans(plansData);
// // //       setManagementOptions(configData?.management_options || managementOptionsFallback);
// // //       setResidentialCountries(configData?.residential_countries || residentialCountriesFallback);
// // //       setOsMetadata(configData?.os_metadata || osMetadataFallback);
// // //     } catch (err) {
// // //       setError(err instanceof Error ? err.message : 'Failed to fetch data');
// // //       await supabase.from('system_logs').insert({
// // //         component: 'vps-plans',
// // //         action: 'fetch_data',
// // //         level: 'error',
// // //         message: err instanceof Error ? err.message : 'Unknown error fetching data',
// // //         created_at: new Date().toISOString(),
// // //       });
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const filteredPlans = vpsPlans.filter(plan => 
// // //     serviceFilter === 'all' || plan.service_type === serviceFilter
// // //   );

// // //   const formatPrice = (price: number, duration = 1, managementType = 'unmanaged') => {
// // //     const managementMultiplier = managementOptions.find(opt => opt.type === managementType)?.priceMultiplier || 1.0;
// // //     let discount = 0;
// // //     if (duration === 3) discount = 0.05;
// // //     else if (duration === 6) discount = 0.10;
// // //     else if (duration === 12) discount = 0.15;
    
// // //     const totalPrice = price * duration * managementMultiplier * (1 - discount);
// // //     return duration > 1 ? `${totalPrice.toFixed(2)} (${duration} months)` : `${totalPrice.toFixed(2)}/mo`;
// // //   };

// // //   const handleAddToCart = async () => {
// // //   if (!selectedPlan || !selectedOS) return;
// // //   if (selectedPlan.service_type === 'residential' && !selectedCountry) {
// // //     alert('Please select a country for residential VPS');
// // //     return;
// // //   }

// // //   // Generate hostname
// // //   const hostname = `vps-${Math.random().toString(36).substring(2, 8)}`;
  
// // //   const cartItem = {
// // //     vpsPlan: selectedPlan,
// // //     osTemplate: selectedOS, // Keep as osTemplate (not os_template)
// // //     hostname: hostname, // Add hostname
// // //     duration: selectedDuration,
// // //     managementType: selectedManagement,
// // //     productType: 'vps',
// // //     location: selectedPlan.service_type === 'residential' ? {
// // //       country: residentialCountries.find(c => c.code === selectedCountry)?.name || '',
// // //       countryCode: selectedCountry
// // //     } : undefined
// // //   };

// // //   try {
// // //     const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
// // //     const updatedCart = [...existingCart, cartItem];
// // //     localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    
// // //     window.dispatchEvent(new CustomEvent("cart-updated", { 
// // //       detail: { count: updatedCart.length } 
// // //     }));

// // //     await supabase.from('cart_events').insert({
// // //       user_id: (await supabase.auth.getUser()).data.user?.id,
// // //       event_type: 'add_to_cart',
// // //       product_type: 'vps',
// // //       plan_id: selectedPlan.plan_id,
// // //       os_template: selectedOS,
// // //       created_at: new Date().toISOString(),
// // //     });

// // //     setShowModal(false);
// // //     setSelectedPlan(null);
// // //     setSelectedOS("");
// // //     setSelectedDuration(1);
// // //     setSelectedManagement('unmanaged');
// // //     setSelectedCountry('');
    
// // //     alert(`${selectedPlan.name} (${selectedManagement}, ${selectedOS}) added to cart!`);
// // //   } catch (err) {
// // //     console.error("Failed to add to cart:", err);
// // //     setError('Failed to add item to cart');
    
// // //     await supabase.from('system_logs').insert({
// // //       component: 'vps-plans',
// // //       action: 'add_to_cart',
// // //       level: 'error',
// // //       message: err instanceof Error ? err.message : 'Unknown error adding to cart',
// // //       created_at: new Date().toISOString(),
// // //     });
// // //   }
// // // };

// // //   const openConfigModal = (plan: VPSPlan) => {
// // //     setSelectedPlan(plan);
// // //     setSelectedOS(plan.os_templates[0] || "");
// // //     setSelectedDuration(1);
// // //     setSelectedManagement('unmanaged');
// // //     setSelectedCountry('');
// // //     setShowModal(true);
// // //   };

// // //   const getServiceTypeIcon = (type: string) => {
// // //     return type === 'residential' ? HomeIcon : BuildingOfficeIcon;
// // //   };

// // //   const getServiceTypeBadge = (type: string) => {
// // //     if (type === 'residential') {
// // //       return (
// // //         <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
// // //           Residential
// // //         </span>
// // //       );
// // //     }
// // //     return (
// // //       <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
// // //         Standard
// // //       </span>
// // //     );
// // //   };

// // //   const getOSIcon = (osName: string) => {
// // //     const os = osMetadata.find(meta => meta.name === osName);
// // //     const icons: { [key: string]: string } = {
// // //       UbuntuIcon: 'fab fa-ubuntu',
// // //       DebianIcon: 'fab fa-debian',
// // //       CentOSIcon: 'fab fa-centos',
// // //       RHELIcon: 'fab fa-redhat',
// // //       RockyIcon: 'fas fa-server',
// // //       WindowsIcon: 'fab fa-windows',
// // //       FreeBSDIcon: 'fab fa-freebsd'
// // //     };
// // //     return os ? (
// // //       <i className={`${icons[os.icon] || 'fas fa-desktop'} text-lg mr-2`} />
// // //     ) : null;
// // //   };

// // //   const getServiceInfo = () => {
// // //     if (type === 'residential') {
// // //       return {
// // //         title: 'Residential VPS Plans',
// // //         subtitle: 'Premium residential IP virtual private servers with multiple OS options',
// // //         color: 'text-green-500'
// // //       };
// // //     } else if (type === 'standard') {
// // //       return {
// // //         title: 'Standard VPS Plans',
// // //         subtitle: 'High-performance datacenter virtual private servers with diverse OS support',
// // //         color: 'text-blue-500'
// // //       };
// // //     }
// // //     return {
// // //       title: 'VPS Hosting Plans',
// // //       subtitle: 'Choose from residential and standard VPS options with Windows, Linux, and BSD support',
// // //       color: 'text-blue-500'
// // //     };
// // //   };

// // //   const serviceInfo = getServiceInfo();

// // //   if (loading) {
// // //     return (
// // //       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
// // //         <div className="text-center">
// // //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
// // //           <p className="text-slate-400">Loading VPS plans...</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   if (error) {
// // //     return (
// // //       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
// // //         <div className="text-center bg-red-900/20 border border-red-700 rounded-xl p-6">
// // //           <p className="text-red-400 mb-2">Error loading VPS plans</p>
// // //           <p className="text-slate-400 text-sm">{error}</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
// // //       {/* Header */}
// // //       <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 px-4 py-8">
// // //         <div className="max-w-7xl mx-auto">
// // //           <div className="text-center">
// // //             <div className="flex items-center justify-center gap-3 mb-4">
// // //               <ServerIcon className={`h-10 w-10 ${serviceInfo.color}`} />
// // //               <h1 className="text-4xl md:text-5xl font-bold text-white">{serviceInfo.title}</h1>
// // //             </div>
// // //             <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
// // //               {serviceInfo.subtitle}
// // //             </p>
            
// // //             {type && (
// // //               <button
// // //                 onClick={() => navigate('/dashboard/vps')}
// // //                 className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
// // //               >
// // //                 <ArrowLeftIcon className="w-4 h-4" />
// // //                 Back to VPS Types
// // //               </button>
// // //             )}
// // //           </div>

// // //           {!type && (
// // //             <div className="flex justify-center mt-8">
// // //               <div className="bg-slate-700/50 rounded-xl p-1 flex gap-1">
// // //                 <button
// // //                   onClick={() => setServiceFilter('all')}
// // //                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
// // //                     serviceFilter === 'all'
// // //                       ? 'bg-slate-600 text-white shadow-lg'
// // //                       : 'text-slate-400 hover:text-white'
// // //                   }`}
// // //                 >
// // //                   All Plans
// // //                 </button>
// // //                 <button
// // //                   onClick={() => setServiceFilter('residential')}
// // //                   className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
// // //                     serviceFilter === 'residential'
// // //                       ? 'bg-green-600 text-white shadow-lg'
// // //                       : 'text-slate-400 hover:text-white'
// // //                   }`}
// // //                 >
// // //                   <HomeIcon className="h-4 w-4" />
// // //                   Residential
// // //                 </button>
// // //                 <button
// // //                   onClick={() => setServiceFilter('standard')}
// // //                   className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
// // //                     serviceFilter === 'standard'
// // //                       ? 'bg-blue-600 text-white shadow-lg'
// // //                       : 'text-slate-400 hover:text-white'
// // //                   }`}
// // //                 >
// // //                   <BuildingOfficeIcon className="h-4 w-4" />
// // //                   Standard
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>

// // //       <div className="max-w-7xl mx-auto px-4 py-8">
// // //         {filteredPlans.length === 0 ? (
// // //           <div className="text-center py-12">
// // //             <ServerIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
// // //             <h3 className="text-xl font-semibold text-white mb-2">No VPS plans available</h3>
// // //             <p className="text-slate-400">
// // //               {serviceFilter === 'all' 
// // //                 ? 'Check back later for available plans'
// // //                 : `No ${serviceFilter} plans available at this time. Please contact support or try another filter.`}
// // //             </p>
// // //             <button
// // //               onClick={() => navigate('/contact')}
// // //               className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
// // //             >
// // //               Contact Support
// // //             </button>
// // //           </div>
// // //         ) : (
// // //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //             {filteredPlans.map((plan) => {
// // //               const ServiceIcon = getServiceTypeIcon(plan.service_type);
// // //               return (
// // //                 <div
// // //                   key={plan.id}
// // //                   className={`bg-slate-800 rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-2xl ${
// // //                     plan.service_type === 'residential'
// // //                       ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/10'
// // //                       : 'border-blue-500/30 hover:border-blue-500/50 hover:shadow-blue-500/10'
// // //                   }`}
// // //                 >
// // //                   <div className="p-6 border-b border-slate-700">
// // //                     <div className="flex items-start justify-between">
// // //                       <div>
// // //                         <div className="flex items-center gap-2 mb-2">
// // //                           <h3 className="text-xl font-bold text-white">{plan.name}</h3>
// // //                           {getServiceTypeBadge(plan.service_type)}
// // //                         </div>
// // //                         <div className="flex items-baseline gap-1">
// // //                           <span className={`text-3xl font-bold ${
// // //                             plan.service_type === 'residential' ? 'text-green-400' : 'text-blue-400'
// // //                           }`}>
// // //                             ${plan.price.toFixed(2)}
// // //                           </span>
// // //                           <span className="text-slate-400">/month</span>
// // //                         </div>
// // //                       </div>
// // //                       <div className={`p-2 rounded-lg ${
// // //                         plan.service_type === 'residential' ? 'bg-green-500/10' : 'bg-blue-500/10'
// // //                       }`}>
// // //                         <ServiceIcon className={`h-6 w-6 ${
// // //                           plan.service_type === 'residential' ? 'text-green-500' : 'text-blue-500'
// // //                         }`} />
// // //                       </div>
// // //                     </div>
// // //                   </div>

// // //                   <div className="p-6 space-y-4">
// // //                     <div className="grid grid-cols-2 gap-4">
// // //                       <div className="flex items-center gap-2 text-sm">
// // //                         <CpuChipIcon className="h-4 w-4 text-blue-400" />
// // //                         <span className="text-slate-300">{plan.cpu_cores} vCPU</span>
// // //                       </div>
// // //                       <div className="flex items-center gap-2 text-sm">
// // //                         <CircleStackIcon className="h-4 w-4 text-green-400" />
// // //                         <span className="text-slate-300">{plan.ram_gb} GB RAM</span>
// // //                       </div>
// // //                       <div className="flex items-center gap-2 text-sm">
// // //                         <ServerIcon className="h-4 w-4 text-purple-400" />
// // //                         <span className="text-slate-300">{plan.storage_gb} GB SSD</span>
// // //                       </div>
// // //                       <div className="flex items-center gap-2 text-sm">
// // //                         <GlobeAltIcon className="h-4 w-4 text-orange-400" />
// // //                         <span className="text-slate-300">
// // //                           {plan.bandwidth_gb > 0 ? `${plan.bandwidth_gb} GB` : 'Unlimited'}
// // //                         </span>
// // //                       </div>
// // //                     </div>

// // //                     {plan.features && plan.features.length > 0 && (
// // //                       <div>
// // //                         <h4 className="text-sm font-semibold text-slate-300 mb-2">Features:</h4>
// // //                         <div className="space-y-1">
// // //                           {plan.features.slice(0, 3).map((feature, i) => (
// // //                             <div key={i} className="flex items-center gap-2 text-sm">
// // //                               <CheckIcon className="h-3 w-3 text-green-400 flex-shrink-0" />
// // //                               <span className="text-slate-400">{feature}</span>
// // //                             </div>
// // //                           ))}
// // //                         </div>
// // //                       </div>
// // //                     )}

// // //                     {plan.service_type === 'residential' && (
// // //                       <div>
// // //                         <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
// // //                           <MapPinIcon className="h-4 w-4" />
// // //                           Available Locations:
// // //                         </h4>
// // //                         <div className="flex flex-wrap gap-1">
// // //                           {residentialCountries.map((country, i) => (
// // //                             <span key={i} className="bg-green-500/10 text-green-300 px-2 py-1 rounded text-xs flex items-center gap-1">
// // //                               <span>{country.flag}</span>
// // //                               <span>{country.name}</span>
// // //                             </span>
// // //                           ))}
// // //                         </div>
// // //                       </div>
// // //                     )}

// // //                     {plan.os_templates && plan.os_templates.length > 0 && (
// // //                       <div>
// // //                         <h4 className="text-sm font-semibold text-slate-300 mb-2">OS Options:</h4>
// // //                         <div className="flex flex-wrap gap-2">
// // //                           {plan.os_templates.slice(0, 3).map((os, i) => (
// // //                             <span key={i} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center gap-1">
// // //                               {getOSIcon(os)}
// // //                               {os}
// // //                             </span>
// // //                           ))}
// // //                           {plan.os_templates.length > 3 && (
// // //                             <span className="text-slate-400 text-xs">+{plan.os_templates.length - 3} more</span>
// // //                           )}
// // //                         </div>
// // //                       </div>
// // //                     )}

// // //                     <div className={`p-3 rounded-lg ${
// // //                       plan.service_type === 'residential' 
// // //                         ? 'bg-green-500/10 border border-green-500/20' 
// // //                         : 'bg-blue-500/10 border border-blue-500/20'
// // //                     }`}>
// // //                       <p className="text-xs text-slate-300">
// // //                         {plan.service_type === 'residential'
// // //                           ? '🏠 Residential IP addresses for authentic browsing and location-based tasks'
// // //                           : '🏢 High-performance datacenter infrastructure with enterprise-grade connectivity'
// // //                         }
// // //                       </p>
// // //                     </div>
// // //                   </div>

// // //                   <div className="p-6 pt-0">
// // //                     <button
// // //                       onClick={() => openConfigModal(plan)}
// // //                       className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg ${
// // //                         plan.service_type === 'residential'
// // //                           ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
// // //                           : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
// // //                       }`}
// // //                     >
// // //                       <ShoppingCartIcon className="h-5 w-5" />
// // //                       Configure & Add to Cart
// // //                       <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               );
// // //             })}
// // //           </div>
// // //         )}
// // //       </div>

// // //       {showModal && selectedPlan && (
// // //         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
// // //           <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
// // //             <div className="p-6 border-b border-slate-700">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <h3 className="text-xl font-bold text-white">Configure VPS</h3>
// // //                   <div className="flex items-center gap-2 mt-1">
// // //                     <p className="text-slate-400">{selectedPlan.name}</p>
// // //                     {getServiceTypeBadge(selectedPlan.service_type)}
// // //                   </div>
// // //                 </div>
// // //                 <button
// // //                   onClick={() => setShowModal(false)}
// // //                   className="text-slate-400 hover:text-white transition-colors"
// // //                 >
// // //                   ✕
// // //                 </button>
// // //               </div>
// // //             </div>

// // //             <div className="p-6 space-y-6">
// // //               <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
// // //                 <div className="grid grid-cols-2 gap-4 text-sm">
// // //                   <div className="flex items-center gap-2">
// // //                     <CpuChipIcon className="h-4 w-4 text-blue-400" />
// // //                     <span className="text-slate-300">{selectedPlan.cpu_cores} vCPU</span>
// // //                   </div>
// // //                   <div className="flex items-center gap-2">
// // //                     <CircleStackIcon className="h-4 w-4 text-green-400" />
// // //                     <span className="text-slate-300">{selectedPlan.ram_gb} GB RAM</span>
// // //                   </div>
// // //                   <div className="flex items-center gap-2">
// // //                     <ServerIcon className="h-4 w-4 text-purple-400" />
// // //                     <span className="text-slate-300">{selectedPlan.storage_gb} GB SSD</span>
// // //                   </div>
// // //                   <div className="flex items-center gap-2">
// // //                     <GlobeAltIcon className="h-4 w-4 text-orange-400" />
// // //                     <span className="text-slate-300">
// // //                       {selectedPlan.bandwidth_gb > 0 ? `${selectedPlan.bandwidth_gb} GB` : 'Unlimited'}
// // //                     </span>
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               {selectedPlan.service_type === 'residential' && (
// // //                 <div>
// // //                   <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
// // //                     <MapPinIcon className="h-4 w-4" />
// // //                     Select Country
// // //                   </label>
// // //                   <div className="space-y-2">
// // //                     {residentialCountries.map((country) => (
// // //                       <label key={country.code} className="flex items-center">
// // //                         <input
// // //                           type="radio"
// // //                           name="country"
// // //                           value={country.code}
// // //                           checked={selectedCountry === country.code}
// // //                           onChange={(e) => setSelectedCountry(e.target.value)}
// // //                           className="h-4 w-4 text-green-600"
// // //                         />
// // //                         <span className="ml-3 flex items-center gap-2 text-slate-300">
// // //                           <span>{country.flag}</span>
// // //                           <span>{country.name}</span>
// // //                         </span>
// // //                       </label>
// // //                     ))}
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               <div>
// // //                 <label className="block text-sm font-semibold text-slate-300 mb-3">
// // //                   Management Type
// // //                 </label>
// // //                 <div className="space-y-3">
// // //                   {managementOptions.map((option) => (
// // //                     <label
// // //                       key={option.type}
// // //                       className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
// // //                         selectedManagement === option.type
// // //                           ? 'border-blue-500 bg-blue-500/10'
// // //                           : 'border-slate-600 hover:border-slate-500'
// // //                       }`}
// // //                     >
// // //                       <input
// // //                         type="radio"
// // //                         name="management"
// // //                         value={option.type}
// // //                         checked={selectedManagement === option.type}
// // //                         onChange={(e) => setSelectedManagement(e.target.value)}
// // //                         className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 mt-0.5"
// // //                       />
// // //                       <div className="ml-3 flex-1">
// // //                         <div className="flex items-center gap-2 mb-2">
// // //                           <span className="font-medium text-white">{option.name}</span>
// // //                           <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
// // //                             {option.badge}
// // //                           </span>
// // //                         </div>
// // //                         <p className="text-sm text-slate-400 mb-2">{option.description}</p>
// // //                         <div className="text-xs text-slate-500">
// // //                           Price: {option.priceMultiplier === 1 ? 'Standard' : `+${((option.priceMultiplier - 1) * 100).toFixed(0)}%`}
// // //                         </div>
// // //                       </div>
// // //                     </label>
// // //                   ))}
// // //                 </div>
// // //               </div>

// // //               <div>
// // //                 <label className="block text-sm font-semibold text-slate-300 mb-3">
// // //                   Operating System
// // //                 </label>
// // //                 <div className="space-y-2">
// // //                   {selectedPlan.os_templates?.map((os) => {
// // //                     const osMeta = osMetadata.find(meta => meta.name === os);
// // //                     return (
// // //                       <label key={os} className="flex items-center">
// // //                         <input
// // //                           type="radio"
// // //                           name="os"
// // //                           value={os}
// // //                           checked={selectedOS === os}
// // //                           onChange={(e) => setSelectedOS(e.target.value)}
// // //                           className={`h-4 w-4 bg-slate-700 border-slate-600 focus:ring-2 ${
// // //                             selectedPlan.service_type === 'residential'
// // //                               ? 'text-green-600 focus:ring-green-500'
// // //                               : 'text-blue-600 focus:ring-blue-500'
// // //                           }`}
// // //                         />
// // //                         <span className="ml-3 text-slate-300 flex items-center gap-2">
// // //                           {getOSIcon(os)}
// // //                           <span>{os}</span>
// // //                           {osMeta && (
// // //                             <span className="text-xs text-slate-500">({osMeta.description})</span>
// // //                           )}
// // //                         </span>
// // //                       </label>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               </div>

// // //               <div>
// // //                 <label className="block text-sm font-semibold text-slate-300 mb-3">
// // //                   Billing Period
// // //                 </label>
// // //                 <select
// // //                   value={selectedDuration}
// // //                   onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
// // //                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:border-transparent focus:ring-blue-500"
// // //                 >
// // //                   <option value={1}>1 Month</option>
// // //                   <option value={3}>3 Months (Save 5%)</option>
// // //                   <option value={6}>6 Months (Save 10%)</option>
// // //                   <option value={12}>12 Months (Save 15%)</option>
// // //                 </select>
// // //               </div>

// // //               <div className="bg-slate-700/50 rounded-lg p-4">
// // //                 <div className="flex justify-between items-center">
// // //                   <span className="text-slate-300">Total Price:</span>
// // //                   <span className={`text-xl font-bold ${
// // //                     selectedPlan.service_type === 'residential' ? 'text-green-400' : 'text-blue-400'
// // //                   }`}>
// // //                     ${formatPrice(selectedPlan.price, selectedDuration, selectedManagement)}
// // //                   </span>
// // //                 </div>
// // //                 {selectedDuration > 1 && (
// // //                   <div className="text-xs text-slate-400 mt-1">
// // //                     Monthly: ${(selectedPlan.price * (selectedManagement === 'managed' ? managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier || 1.5 : 1.0)).toFixed(2)}
// // //                   </div>
// // //                 )}
// // //                 {selectedManagement === 'managed' && (
// // //                   <div className="text-xs text-blue-400 mt-1">
// // //                     Includes +{(((managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier ?? 1.5) - 1) * 100)}% for managed services
// // //                   </div>
// // //                 )}
// // //               </div>

// // //               <div className="flex gap-3">
// // //                 <button
// // //                   onClick={() => setShowModal(false)}
// // //                   className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
// // //                 >
// // //                   Cancel
// // //                 </button>
// // //                 <button
// // //                   onClick={handleAddToCart}
// // //                   disabled={!selectedOS || (selectedPlan.service_type === 'residential' && !selectedCountry)}
// // //                   className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
// // //                     selectedPlan.service_type === 'residential'
// // //                       ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
// // //                       : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
// // //                   }`}
// // //                 >
// // //                   Add to Cart
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       <div className="max-w-7xl mx-auto px-4 pb-16">
// // //         <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
// // //           <h3 className="text-2xl font-bold text-white text-center mb-8">Why Choose Our VPS Services?</h3>
          
// // //           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
// // //             <div className="text-center">
// // //               <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
// // //                 </svg>
// // //               </div>
// // //               <h4 className="text-lg font-semibold text-white mb-2">Instant Setup</h4>
// // //               <p className="text-slate-400 text-sm">Your VPS is configured and ready within minutes of payment</p>
// // //             </div>

// // //             <div className="text-center">
// // //               <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
// // //                 </svg>
// // //               </div>
// // //               <h4 className="text-lg font-semibold text-white mb-2">Secure Access</h4>
// // //               <p className="text-slate-400 text-sm">Industry-standard encryption and security protocols</p>
// // //             </div>

// // //             <div className="text-center">
// // //               <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
// // //                 </svg>
// // //               </div>
// // //               <h4 className="text-lg font-semibold text-white mb-2">24/7 Support</h4>
// // //               <p className="text-slate-400 text-sm">Round-the-clock technical support</p>
// // //             </div>

// // //             <div className="text-center">
// // //               <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
// // //                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
// // //                 </svg>
// // //               </div>
// // //               <h4 className="text-lg font-semibold text-white mb-2">High Performance</h4>
// // //               <p className="text-slate-400 text-sm">Optimized servers with SSD storage</p>
// // //             </div>
// // //           </div>

// // //           <div className="mt-12 text-center">
// // //             <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600">
// // //               <h4 className="text-lg font-semibold text-white mb-3">Need Help Choosing?</h4>
// // //               <p className="text-slate-400 mb-4">
// // //                 Not sure which plan is right for you? Our team can help you find the perfect VPS solution.
// // //               </p>
// // //               <div className="flex flex-col sm:flex-row gap-3 justify-center">
// // //                 <button 
// // //                   onClick={() => navigate('/contact')}
// // //                   className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
// // //                 >
// // //                   Contact Support
// // //                 </button>
// // //                 <button 
// // //                   onClick={() => navigate('/dashboard/vps')}
// // //                   className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
// // //                 >
// // //                   View All Types
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // import { useState, useEffect } from "react";
// // import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// // import { createClient } from "@supabase/supabase-js";
// // import { 
// //   ServerIcon, 
// //   CpuChipIcon, 
// //   CircleStackIcon,
// //   GlobeAltIcon,
// //   ShoppingCartIcon,
// //   CheckIcon,
// //   ArrowRightIcon,
// //   ArrowLeftIcon,
// //   MapPinIcon,
// //   HomeIcon,
// //   BoltIcon,
// //   ShieldCheckIcon,
// //   ClockIcon
// // } from "@heroicons/react/24/outline";

// // const supabase = createClient(
// //   import.meta.env.VITE_SUPABASE_URL,
// //   import.meta.env.VITE_SUPABASE_ANON_KEY
// // );

// // interface VPSPlan {
// //   id: string;
// //   plan_id: number;
// //   name: string;
// //   slug: string;
// //   price: number;
// //   currency_code: string;
// //   cpu_cores: number;
// //   ram_gb: number;
// //   storage_gb: number;
// //   bandwidth_gb: number;
// //   os_templates: string[];
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

// // export default function VPSPlans() {
// //   const { type } = useParams<{ type: string }>();
// //   const navigate = useNavigate();
// //   const [searchParams] = useSearchParams();
// //   const countryParam = searchParams.get('country');
  
// //   const [vpsPlans, setVpsPlans] = useState<VPSPlan[]>([]);
// //   const [managementOptions, setManagementOptions] = useState<ManagementOption[]>([]);
// //   const [residentialCountries, setResidentialCountries] = useState<Country[]>([]);
// //   const [osMetadata, setOsMetadata] = useState<OSMetadata[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [selectedPlan, setSelectedPlan] = useState<VPSPlan | null>(null);
// //   const [selectedOS, setSelectedOS] = useState("");
// //   const [selectedDuration, setSelectedDuration] = useState(1);
// //   const [selectedManagement, setSelectedManagement] = useState('unmanaged');
// //   const [selectedCountry, setSelectedCountry] = useState(countryParam || '');
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

// //   useEffect(() => {
// //     if (countryParam) {
// //       setSelectedCountry(countryParam);
// //     }
// //   }, [countryParam]);

// //   const fetchData = async () => {
// //     try {
// //       setLoading(true);

// //       const { data: plansData, error: plansError } = await supabase
// //         .from('vps_plans')
// //         .select('*')
// //         .eq('is_active', true)
// //         .order('price', { ascending: true });

// //       if (plansError) throw new Error(`Failed to fetch VPS plans: ${plansError.message}`);
// //       if (!plansData) throw new Error('No VPS plans found');

// //       const managementOptionsFallback = [
// //         {
// //           type: 'unmanaged',
// //           name: 'Unmanaged',
// //           description: 'Full root access, you manage everything',
// //           features: ['Complete control', 'Root/Admin access', 'Custom configurations', 'Self-managed updates'],
// //           priceMultiplier: 1.0,
// //           badge: 'Most Popular'
// //         },
// //         {
// //           type: 'managed',
// //           name: 'Managed',
// //           description: 'We handle server management for you',
// //           features: ['OS updates & patches', 'Security monitoring', 'Basic troubleshooting', '24/7 support'],
// //           priceMultiplier: 1.5,
// //           badge: 'Hassle-Free'
// //         }
// //       ];

// //       const residentialCountriesFallback = [
// //         { code: 'US', name: 'United States', flag: '🇺🇸' },
// //         { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
// //         { code: 'DE', name: 'Germany', flag: '🇩🇪' },
// //         { code: 'CA', name: 'Canada', flag: '🇨🇦' },
// //         { code: 'AU', name: 'Australia', flag: '🇦🇺' }
// //       ];

// //       const osMetadataFallback = [
// //         { name: 'Ubuntu 22.04 LTS', icon: 'UbuntuIcon', description: 'Latest Ubuntu LTS with long-term support' },
// //         { name: 'Ubuntu 20.04 LTS', icon: 'UbuntuIcon', description: 'Stable Ubuntu LTS version' },
// //         { name: 'Debian 12', icon: 'DebianIcon', description: 'Latest stable Debian release' },
// //         { name: 'Debian 11', icon: 'DebianIcon', description: 'Stable and lightweight Debian' },
// //         { name: 'CentOS Stream 9', icon: 'CentOSIcon', description: 'Enterprise-focused Linux with continuous updates' },
// //         { name: 'Red Hat Enterprise Linux 9', icon: 'RHELIcon', description: 'Enterprise-grade Linux with robust support' },
// //         { name: 'Rocky Linux 9', icon: 'RockyIcon', description: 'CentOS alternative for enterprise use' },
// //         { name: 'Windows Server 2022', icon: 'WindowsIcon', description: 'Latest Windows Server for enterprise applications' },
// //         { name: 'Windows Server 2019', icon: 'WindowsIcon', description: 'Stable Windows Server version' },
// //         { name: 'FreeBSD 14', icon: 'FreeBSDIcon', description: 'High-performance BSD-based OS' }
// //       ];

// //       const { data: configData, error: configError } = await supabase
// //         .from('system_config')
// //         .select('management_options, residential_countries, os_metadata')
// //         .eq('config_key', 'vps_settings')
// //         .single();

// //       if (configError) {
// //         console.warn(`Config fetch failed: ${configError.message}. Using fallback data.`);
// //       }

// //       setVpsPlans(plansData);
// //       setManagementOptions(configData?.management_options || managementOptionsFallback);
// //       setResidentialCountries(configData?.residential_countries || residentialCountriesFallback);
// //       setOsMetadata(configData?.os_metadata || osMetadataFallback);
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Failed to fetch data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const filteredPlans = vpsPlans.filter(plan => 
// //     (serviceFilter === 'all' || plan.service_type === serviceFilter) &&
// //     (type === 'residential' || !type ? true : plan.service_type === type)
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
// //     if (!selectedPlan || !selectedOS) return;
// //     if (selectedPlan.service_type === 'residential' && !selectedCountry) {
// //       alert('Please select a country for residential VPS');
// //       return;
// //     }

// //     const hostname = `vps-${Math.random().toString(36).substring(2, 8)}`;
    
// //     const cartItem = {
// //       vpsPlan: selectedPlan,
// //       osTemplate: selectedOS,
// //       hostname: hostname,
// //       duration: selectedDuration,
// //       managementType: selectedManagement,
// //       productType: 'vps',
// //       location: selectedPlan.service_type === 'residential' ? {
// //         country: residentialCountries.find(c => c.code === selectedCountry)?.name || '',
// //         countryCode: selectedCountry
// //       } : undefined
// //     };

// //     try {
// //       const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
// //       const updatedCart = [...existingCart, cartItem];
// //       localStorage.setItem("cartItems", JSON.stringify(updatedCart));
      
// //       window.dispatchEvent(new CustomEvent("cart-updated", { 
// //         detail: { count: updatedCart.length } 
// //       }));

// //       setShowModal(false);
// //       setSelectedPlan(null);
// //       setSelectedOS("");
// //       setSelectedDuration(1);
// //       setSelectedManagement('unmanaged');
// //       setSelectedCountry('');
      
// //       alert(`${selectedPlan.name} (${selectedManagement}, ${selectedOS}) added to cart!`);
// //     } catch (err) {
// //       console.error("Failed to add to cart:", err);
// //       setError('Failed to add item to cart');
// //     }
// //   };

// //   const openConfigModal = (plan: VPSPlan) => {
// //     setSelectedPlan(plan);
// //     setSelectedOS(plan.os_templates[0] || "");
// //     setSelectedDuration(1);
// //     setSelectedManagement('unmanaged');
// //     setShowModal(true);
// //   };

// //   const getOSIcon = (osName: string) => {
// //     const os = osMetadata.find(meta => meta.name === osName);
// //     const icons: { [key: string]: string } = {
// //       UbuntuIcon: 'fab fa-ubuntu',
// //       DebianIcon: 'fab fa-debian',
// //       CentOSIcon: 'fab fa-centos',
// //       RHELIcon: 'fab fa-redhat',
// //       RockyIcon: 'fas fa-server',
// //       WindowsIcon: 'fab fa-windows',
// //       FreeBSDIcon: 'fab fa-freebsd'
// //     };
// //     return os ? (
// //       <i className={`${icons[os.icon] || 'fas fa-desktop'} text-lg mr-2`} />
// //     ) : null;
// //   };

// //   const getServiceInfo = () => {
// //     if (type === 'residential') {
// //       return {
// //         title: 'Residential VPS Plans',
// //         subtitle: 'Premium residential IP virtual private servers with multiple OS options',
// //         color: 'text-blue-500'
// //       };
// //     } else if (type === 'standard') {
// //       return {
// //         title: 'Standard VPS Plans',
// //         subtitle: 'High-performance datacenter virtual private servers with diverse OS support',
// //         color: 'text-blue-500'
// //       };
// //     }
// //     return {
// //       title: 'VPS Hosting Plans',
// //       subtitle: 'Choose from residential and standard VPS options with Windows, Linux, and BSD support',
// //       color: 'text-blue-500'
// //     };
// //   };

// //   const serviceInfo = getServiceInfo();
// //   const selectedCountryData = residentialCountries.find(c => c.code === selectedCountry);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
// //           <p className="text-slate-400 text-lg">Loading VPS plans...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
// //         <div className="text-center bg-blue-900/20 border border-blue-700 rounded-2xl p-8">
// //           <p className="text-blue-400 mb-2 text-xl font-bold">Error loading VPS plans</p>
// //           <p className="text-slate-400">{error}</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
// //       {/* Header */}
// //       <div className="relative bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border-b border-blue-500/20 px-4 py-12 overflow-hidden">
// //         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        
// //         <div className="max-w-7xl mx-auto relative z-10">
// //           <div className="text-center">
// //             <button
// //               onClick={() => navigate('/dashboard/vps')}
// //               className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-500/30"
// //             >
// //               <ArrowLeftIcon className="w-4 h-4" />
// //               Back to VPS Types
// //             </button>

// //             <div className="inline-flex items-center justify-center gap-3 mb-6 bg-blue-950/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-blue-500/20">
// //               <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
// //                 <HomeIcon className="h-6 w-6 text-white" />
// //               </div>
// //               <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">VPS Plans</span>
// //             </div>
            
// //             {selectedCountryData && type === 'residential' && (
// //               <div className="flex items-center justify-center gap-3 mb-6">
// //                 <span className="text-6xl">{selectedCountryData.flag}</span>
// //                 <div className="text-left">
// //                   <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
// //                     {selectedCountryData.name}
// //                   </h1>
// //                   <p className="text-blue-400 font-semibold text-lg">Residential IP Location</p>
// //                 </div>
// //               </div>
// //             )}

// //             {!selectedCountryData && (
// //               <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
// //                 {serviceInfo.title}
// //               </h1>
// //             )}
            
// //             <p className="text-xl text-slate-300 max-w-2xl mx-auto">
// //               {serviceInfo.subtitle}
// //             </p>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-4 py-12">
// //         {filteredPlans.length === 0 ? (
// //           <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-blue-500/20">
// //             <ServerIcon className="h-20 w-20 text-blue-500/50 mx-auto mb-6" />
// //             <h3 className="text-2xl font-bold text-white mb-3">No VPS plans available</h3>
// //             <p className="text-slate-400 text-lg">Check back later for available plans</p>
// //           </div>
// //         ) : (
// //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
// //             {filteredPlans.map((plan) => (
// //               <div
// //                 key={plan.id}
// //                 className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transform hover:scale-[1.02]"
// //               >
// //                 <div className="p-8 border-b border-blue-500/10">
// //                   <div className="flex items-start justify-between mb-4">
// //                     <div className="flex-1">
// //                       <div className="flex items-center gap-2 mb-3">
// //                         <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
// //                       </div>
// //                       <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
// //                         <ServerIcon className="h-3 w-3" />
// //                         {plan.service_type === 'residential' ? 'Residential' : 'Standard'}
// //                       </div>
// //                       <div className="flex items-baseline gap-2">
// //                         <span className="text-4xl font-black text-blue-400">
// //                           ${plan.price.toFixed(2)}
// //                         </span>
// //                         <span className="text-slate-400 font-semibold">/month</span>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="p-8 space-y-6">
// //                   <div className="grid grid-cols-2 gap-4">
// //                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
// //                       <div className="flex items-center gap-2 mb-2">
// //                         <CpuChipIcon className="h-5 w-5 text-blue-400" />
// //                         <span className="text-xs text-slate-400 uppercase font-semibold">CPU</span>
// //                       </div>
// //                       <span className="text-white font-bold text-lg">{plan.cpu_cores} vCPU</span>
// //                     </div>
// //                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
// //                       <div className="flex items-center gap-2 mb-2">
// //                         <CircleStackIcon className="h-5 w-5 text-green-400" />
// //                         <span className="text-xs text-slate-400 uppercase font-semibold">RAM</span>
// //                       </div>
// //                       <span className="text-white font-bold text-lg">{plan.ram_gb} GB</span>
// //                     </div>
// //                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
// //                       <div className="flex items-center gap-2 mb-2">
// //                         <ServerIcon className="h-5 w-5 text-purple-400" />
// //                         <span className="text-xs text-slate-400 uppercase font-semibold">Storage</span>
// //                       </div>
// //                       <span className="text-white font-bold text-lg">{plan.storage_gb} GB</span>
// //                     </div>
// //                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
// //                       <div className="flex items-center gap-2 mb-2">
// //                         <GlobeAltIcon className="h-5 w-5 text-orange-400" />
// //                         <span className="text-xs text-slate-400 uppercase font-semibold">Bandwidth</span>
// //                       </div>
// //                       <span className="text-white font-bold text-sm">
// //                         {plan.bandwidth_gb > 0 ? `${plan.bandwidth_gb} GB` : 'Unlimited'}
// //                       </span>
// //                     </div>
// //                   </div>

// //                   {plan.features && plan.features.length > 0 && (
// //                     <div>
// //                       <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Key Features</h4>
// //                       <div className="space-y-2">
// //                         {plan.features.slice(0, 3).map((feature, i) => (
// //                           <div key={i} className="flex items-center gap-2">
// //                             <div className="p-1 rounded-md bg-blue-500/10">
// //                               <CheckIcon className="h-3 w-3 text-blue-400 flex-shrink-0" />
// //                             </div>
// //                             <span className="text-slate-300 text-sm">{feature}</span>
// //                           </div>
// //                         ))}
// //                       </div>
// //                     </div>
// //                   )}

// //                   {plan.os_templates && plan.os_templates.length > 0 && (
// //                     <div>
// //                       <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">OS Options</h4>
// //                       <div className="flex flex-wrap gap-2">
// //                         {plan.os_templates.slice(0, 3).map((os, i) => (
// //                           <span key={i} className="bg-slate-800/70 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1">
// //                             {getOSIcon(os)}
// //                             {os.split(' ')[0]}
// //                           </span>
// //                         ))}
// //                         {plan.os_templates.length > 3 && (
// //                           <span className="text-blue-400 text-xs font-semibold px-2 py-1.5">+{plan.os_templates.length - 3} more</span>
// //                         )}
// //                       </div>
// //                     </div>
// //                   )}

// //                   <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20">
// //                     <div className="flex items-start gap-2">
// //                       <ServerIcon className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
// //                       <p className="text-xs text-slate-300 leading-relaxed">
// //                         {plan.service_type === 'residential'
// //                           ? '🏠 Residential IP addresses for authentic browsing and location-based tasks'
// //                           : '🏢 High-performance datacenter infrastructure with enterprise-grade connectivity'
// //                         }
// //                       </p>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="p-8 pt-0">
// //                   <button
// //                     onClick={() => openConfigModal(plan)}
// //                     className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 group-hover:shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
// //                   >
// //                     <ShoppingCartIcon className="h-5 w-5" />
// //                     Configure & Add to Cart
// //                     <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
// //                   </button>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {showModal && selectedPlan && (
// //         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
// //           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/30 w-full max-w-2xl shadow-2xl shadow-blue-500/20 my-8">
// //             <div className="p-8 border-b border-blue-500/20">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <h3 className="text-3xl font-black text-white mb-2">Configure Your VPS</h3>
// //                   <div className="flex items-center gap-3">
// //                     <p className="text-slate-400 text-lg">{selectedPlan.name}</p>
// //                     <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
// //                       {selectedPlan.service_type === 'residential' ? 'Residential' : 'Standard'}
// //                     </span>
// //                   </div>
// //                 </div>
// //                 <button
// //                   onClick={() => setShowModal(false)}
// //                   className="text-slate-400 hover:text-white transition-colors text-3xl font-bold leading-none hover:bg-blue-500/10 w-10 h-10 rounded-lg flex items-center justify-center"
// //                 >
// //                   ×
// //                 </button>
// //               </div>
// //             </div>

// //             <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
// //               <div className="bg-slate-800/50 rounded-2xl p-6 border border-blue-500/10">
// //                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// //                   <div>
// //                     <div className="flex items-center gap-2 mb-2">
// //                       <CpuChipIcon className="h-4 w-4 text-blue-400" />
// //                       <span className="text-xs text-slate-400 uppercase font-semibold">CPU</span>
// //                     </div>
// //                     <span className="text-white font-bold">{selectedPlan.cpu_cores} vCPU</span>
// //                   </div>
// //                   <div>
// //                     <div className="flex items-center gap-2 mb-2">
// //                       <CircleStackIcon className="h-4 w-4 text-green-400" />
// //                       <span className="text-xs text-slate-400 uppercase font-semibold">RAM</span>
// //                     </div>
// //                     <span className="text-white font-bold">{selectedPlan.ram_gb} GB</span>
// //                   </div>
// //                   <div>
// //                     <div className="flex items-center gap-2 mb-2">
// //                       <ServerIcon className="h-4 w-4 text-purple-400" />
// //                       <span className="text-xs text-slate-400 uppercase font-semibold">Storage</span>
// //                     </div>
// //                     <span className="text-white font-bold">{selectedPlan.storage_gb} GB</span>
// //                   </div>
// //                   <div>
// //                     <div className="flex items-center gap-2 mb-2">
// //                       <GlobeAltIcon className="h-4 w-4 text-orange-400" />
// //                       <span className="text-xs text-slate-400 uppercase font-semibold">Bandwidth</span>
// //                     </div>
// //                     <span className="text-white font-bold text-sm">
// //                       {selectedPlan.bandwidth_gb > 0 ? `${selectedPlan.bandwidth_gb} GB` : 'Unlimited'}
// //                     </span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {selectedPlan.service_type === 'residential' && (
// //                 <div>
// //                   <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
// //                     <MapPinIcon className="h-5 w-5 text-blue-400" />
// //                     Select Country
// //                   </label>
// //                   <div className="grid grid-cols-1 gap-3">
// //                     {residentialCountries.map((country) => (
// //                       <label 
// //                         key={country.code} 
// //                         className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
// //                           selectedCountry === country.code
// //                             ? 'border-blue-500 bg-blue-500/10'
// //                             : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
// //                         }`}
// //                       >
// //                         <input
// //                           type="radio"
// //                           name="country"
// //                           value={country.code}
// //                           checked={selectedCountry === country.code}
// //                           onChange={(e) => setSelectedCountry(e.target.value)}
// //                           className="h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500"
// //                         />
// //                         <span className="ml-4 flex items-center gap-3 text-slate-200 font-semibold text-lg">
// //                           <span className="text-3xl">{country.flag}</span>
// //                           <span>{country.name}</span>
// //                         </span>
// //                       </label>
// //                     ))}
// //                   </div>
// //                 </div>
// //               )}

// //               <div>
// //                 <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">
// //                   Management Type
// //                 </label>
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                   {managementOptions.map((option) => (
// //                     <label
// //                       key={option.type}
// //                       className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all ${
// //                         selectedManagement === option.type
// //                           ? 'border-blue-500 bg-blue-500/10'
// //                           : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
// //                       }`}
// //                     >
// //                       <input
// //                         type="radio"
// //                         name="management"
// //                         value={option.type}
// //                         checked={selectedManagement === option.type}
// //                         onChange={(e) => setSelectedManagement(e.target.value)}
// //                         className="absolute top-4 right-4 h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500"
// //                       />
// //                       <div className="flex-1 pr-8">
// //                         <div className="flex items-center gap-2 mb-3">
// //                           <span className="font-bold text-white text-lg">{option.name}</span>
// //                           <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full font-semibold">
// //                             {option.badge}
// //                           </span>
// //                         </div>
// //                         <p className="text-sm text-slate-400 mb-3">{option.description}</p>
// //                         <div className="text-xs font-semibold">
// //                           {option.priceMultiplier === 1 ? (
// //                             <span className="text-green-400">Standard Price</span>
// //                           ) : (
// //                             <span className="text-blue-400">+{((option.priceMultiplier - 1) * 100).toFixed(0)}% Premium</span>
// //                           )}
// //                         </div>
// //                       </div>
// //                     </label>
// //                   ))}
// //                 </div>
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">
// //                   Operating System
// //                 </label>
// //                 <div className="grid grid-cols-1 gap-3">
// //                   {selectedPlan.os_templates?.map((os) => {
// //                     const osMeta = osMetadata.find(meta => meta.name === os);
// //                     return (
// //                       <label 
// //                         key={os} 
// //                         className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
// //                           selectedOS === os
// //                             ? 'border-blue-500 bg-blue-500/10'
// //                             : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
// //                         }`}
// //                       >
// //                         <input
// //                           type="radio"
// //                           name="os"
// //                           value={os}
// //                           checked={selectedOS === os}
// //                           onChange={(e) => setSelectedOS(e.target.value)}
// //                           className="h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500"
// //                         />
// //                         <span className="ml-4 flex items-center gap-3 text-slate-200 font-semibold flex-1">
// //                           {getOSIcon(os)}
// //                           <span className="flex-1">{os}</span>
// //                           {osMeta && (
// //                             <span className="text-xs text-slate-500 hidden md:block">({osMeta.description})</span>
// //                           )}
// //                         </span>
// //                       </label>
// //                     );
// //                   })}
// //                 </div>
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">
// //                   Billing Period
// //                 </label>
// //                 <select
// //                   value={selectedDuration}
// //                   onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
// //                   className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-white font-semibold text-lg focus:ring-2 focus:border-blue-500 focus:ring-blue-500/30 transition-all"
// //                 >
// //                   <option value={1}>1 Month</option>
// //                   <option value={3}>3 Months (Save 5%)</option>
// //                   <option value={6}>6 Months (Save 10%)</option>
// //                   <option value={12}>12 Months (Save 15%)</option>
// //                 </select>
// //               </div>

// //               <div className="bg-gradient-to-br from-blue-950/50 to-slate-900/50 rounded-2xl p-6 border border-blue-500/30">
// //                 <div className="flex justify-between items-center mb-3">
// //                   <span className="text-slate-300 font-semibold text-lg">Total Price:</span>
// //                   <span className="text-3xl font-black text-blue-400">
// //                     ${formatPrice(selectedPlan.price, selectedDuration, selectedManagement)}
// //                   </span>
// //                 </div>
// //                 {selectedDuration > 1 && (
// //                   <div className="text-sm text-slate-400 mb-2">
// //                     Monthly rate: ${(selectedPlan.price * (selectedManagement === 'managed' ? managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier || 1.5 : 1.0)).toFixed(2)}/month
// //                   </div>
// //                 )}
// //                 {selectedManagement === 'managed' && (
// //                   <div className="text-sm text-blue-400 flex items-center gap-2">
// //                     <ShieldCheckIcon className="h-4 w-4" />
// //                     Includes +{(((managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier ?? 1.5) - 1) * 100).toFixed(0)}% for managed services
// //                   </div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="p-8 pt-0 flex gap-4">
// //               <button
// //                 onClick={() => setShowModal(false)}
// //                 className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all border border-slate-700 hover:border-slate-600"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleAddToCart}
// //                 disabled={!selectedOS || (selectedPlan.service_type === 'residential' && !selectedCountry)}
// //                 className="flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none flex items-center justify-center gap-2"
// //               >
// //                 <ShoppingCartIcon className="h-5 w-5" />
// //                 Add to Cart
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <div className="max-w-7xl mx-auto px-4 pb-16">
// //         <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 p-8 md:p-12 shadow-2xl shadow-blue-500/5">
// //           <h3 className="text-3xl md:text-4xl font-black text-white text-center mb-12">
// //             Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Our VPS?</span>
// //           </h3>
          
// //           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
// //             <div className="text-center group">
// //               <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
// //                 <BoltIcon className="w-10 h-10 text-white" />
// //               </div>
// //               <h4 className="text-xl font-bold text-white mb-3">Instant Setup</h4>
// //               <p className="text-slate-400 leading-relaxed">Your VPS is configured and ready within minutes of payment</p>
// //             </div>

// //             <div className="text-center group">
// //               <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
// //                 <ShieldCheckIcon className="w-10 h-10 text-white" />
// //               </div>
// //               <h4 className="text-xl font-bold text-white mb-3">Secure Access</h4>
// //               <p className="text-slate-400 leading-relaxed">Industry-standard encryption and security protocols</p>
// //             </div>

// //             <div className="text-center group">
// //               <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
// //                 <ClockIcon className="w-10 h-10 text-white" />
// //               </div>
// //               <h4 className="text-xl font-bold text-white mb-3">24/7 Support</h4>
// //               <p className="text-slate-400 leading-relaxed">Round-the-clock technical support</p>
// //             </div>

// //             <div className="text-center group">
// //               <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
// //                 <ServerIcon className="w-10 h-10 text-white" />
// //               </div>
// //               <h4 className="text-xl font-bold text-white mb-3">High Performance</h4>
// //               <p className="text-slate-400 leading-relaxed">Optimized servers with SSD storage</p>
// //             </div>
// //           </div>

// //           <div className="mt-12 text-center">
// //             <div className="inline-block bg-gradient-to-br from-blue-950/50 to-slate-900/50 rounded-2xl p-8 border border-blue-500/20">
// //               <h4 className="text-2xl font-black text-white mb-3">Need Help Choosing?</h4>
// //               <p className="text-slate-400 mb-6 max-w-2xl mx-auto text-lg">
// //                 Not sure which plan is right for you? Our team can help you find the perfect VPS solution for your needs.
// //               </p>
// //               <div className="flex flex-col sm:flex-row gap-4 justify-center">
// //                 <button 
// //                   onClick={() => navigate('/contact')}
// //                   className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
// //                 >
// //                   Contact Support
// //                 </button>
// //                 <button 
// //                   onClick={() => navigate('/dashboard/vps')}
// //                   className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all border border-slate-700 hover:border-blue-500/30"
// //                 >
// //                   View All Types
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// import { useState, useEffect } from "react";
// import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// import { createClient } from "@supabase/supabase-js";
// import { 
//   ServerIcon, 
//   CpuChipIcon, 
//   CircleStackIcon,
//   GlobeAltIcon,
//   ShoppingCartIcon,
//   CheckIcon,
//   ArrowRightIcon,
//   ArrowLeftIcon,
//   MapPinIcon,
//   HomeIcon,
//   BoltIcon,
//   ShieldCheckIcon,
//   ClockIcon
// } from "@heroicons/react/24/outline";

// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// );

// interface VPSPlan {
//   id: string;
//   plan_id: number;
//   name: string;
//   slug: string;
//   price: number;
//   currency_code: string;
//   cpu_cores: number;
//   ram_gb: number;
//   storage_gb: number;
//   bandwidth_gb: number;
//   os_templates: string[];
//   features: string[];
//   locations: string[];
//   service_type: 'residential' | 'standard';
//   is_active: boolean;
//   country_pricing?: { [key: string]: number };
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
//   priceMultiplier?: number;
// }

// interface OSMetadata {
//   name: string;
//   icon: string;
//   description: string;
// }

// export default function VPSPlans() {
//   const { type } = useParams<{ type: string }>();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const countryParam = searchParams.get('country');
  
//   const [vpsPlans, setVpsPlans] = useState<VPSPlan[]>([]);
//   const [managementOptions, setManagementOptions] = useState<ManagementOption[]>([]);
//   const [residentialCountries, setResidentialCountries] = useState<Country[]>([]);
//   const [osMetadata, setOsMetadata] = useState<OSMetadata[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedPlan, setSelectedPlan] = useState<VPSPlan | null>(null);
//   const [selectedOS, setSelectedOS] = useState("");
//   const [selectedDuration, setSelectedDuration] = useState(1);
//   const [selectedManagement, setSelectedManagement] = useState('unmanaged');
//   const [selectedCountry, setSelectedCountry] = useState(countryParam || '');
//   const [showModal, setShowModal] = useState(false);
//   const [serviceFilter, setServiceFilter] = useState('all');

//   useEffect(() => {
//     if (type && (type === 'residential' || type === 'standard')) {
//       setServiceFilter(type);
//     } else {
//       setServiceFilter('all');
//     }
//     fetchData();
//   }, [type]);

//   useEffect(() => {
//     if (countryParam) {
//       setSelectedCountry(countryParam);
//     }
//   }, [countryParam]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       const { data: plansData, error: plansError } = await supabase
//         .from('vps_plans')
//         .select('*')
//         .eq('is_active', true)
//         .order('price', { ascending: true });

//       if (plansError) throw new Error(`Failed to fetch VPS plans: ${plansError.message}`);
//       if (!plansData) throw new Error('No VPS plans found');

//       const managementOptionsFallback = [
//         {
//           type: 'unmanaged',
//           name: 'Unmanaged',
//           description: 'Full root access, you manage everything',
//           features: ['Complete control', 'Root/Admin access', 'Custom configurations', 'Self-managed updates'],
//           priceMultiplier: 1.0,
//           badge: 'Most Popular'
//         },
//         {
//           type: 'managed',
//           name: 'Managed',
//           description: 'We handle server management for you',
//           features: ['OS updates & patches', 'Security monitoring', 'Basic troubleshooting', '24/7 support'],
//           priceMultiplier: 1.5,
//           badge: 'Hassle-Free'
//         }
//       ];

//       const residentialCountriesFallback = [
//         { code: 'US', name: 'United States', flag: '🇺🇸', priceMultiplier: 1.0 },
//         { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', priceMultiplier: 1.1 },
//         { code: 'DE', name: 'Germany', flag: '🇩🇪', priceMultiplier: 1.05 },
//         { code: 'CA', name: 'Canada', flag: '🇨🇦', priceMultiplier: 1.15 },
//         { code: 'AU', name: 'Australia', flag: '🇦🇺', priceMultiplier: 1.2 }
//       ];

//       const osMetadataFallback = [
//         { name: 'Ubuntu 22.04 LTS', icon: 'UbuntuIcon', description: 'Latest Ubuntu LTS with long-term support' },
//         { name: 'Ubuntu 20.04 LTS', icon: 'UbuntuIcon', description: 'Stable Ubuntu LTS version' },
//         { name: 'Debian 12', icon: 'DebianIcon', description: 'Latest stable Debian release' },
//         { name: 'Debian 11', icon: 'DebianIcon', description: 'Stable and lightweight Debian' },
//         { name: 'CentOS Stream 9', icon: 'CentOSIcon', description: 'Enterprise-focused Linux with continuous updates' },
//         { name: 'Red Hat Enterprise Linux 9', icon: 'RHELIcon', description: 'Enterprise-grade Linux with robust support' },
//         { name: 'Rocky Linux 9', icon: 'RockyIcon', description: 'CentOS alternative for enterprise use' },
//         { name: 'Windows Server 2022', icon: 'WindowsIcon', description: 'Latest Windows Server for enterprise applications' },
//         { name: 'Windows Server 2019', icon: 'WindowsIcon', description: 'Stable Windows Server version' },
//         { name: 'FreeBSD 14', icon: 'FreeBSDIcon', description: 'High-performance BSD-based OS' }
//       ];

//       const { data: configData, error: configError } = await supabase
//         .from('system_config')
//         .select('management_options, residential_countries, os_metadata')
//         .eq('config_key', 'vps_settings')
//         .single();

//       if (configError) {
//         console.warn(`Config fetch failed: ${configError.message}. Using fallback data.`);
//       }

//       setVpsPlans(plansData);
//       setManagementOptions(configData?.management_options || managementOptionsFallback);
//       setResidentialCountries(configData?.residential_countries || residentialCountriesFallback);
//       setOsMetadata(configData?.os_metadata || osMetadataFallback);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCountryPrice = (plan: VPSPlan, countryCode: string) => {
//   if (!countryCode || plan.service_type !== 'residential') {
//     return plan.price;
//   }

//   // Check if plan has country-specific pricing
//   if (plan.country_pricing) {
//     // Try both country name and country code as keys
//     const countryName = residentialCountries.find(c => c.code === countryCode)?.name;
//     const possibleKeys = countryName ? [countryName, countryCode] : [countryCode];

//     for (const key of possibleKeys) {
//       if (plan.country_pricing[key] !== undefined) {
//         return Number(plan.country_pricing[key]);
//       }
//     }
//   }

//   // Fallback to country price multiplier
//   const country = residentialCountries.find(c => c.code === countryCode);
//   if (country && country.priceMultiplier) {
//     return plan.price * country.priceMultiplier;
//   }

//   return plan.price;
// };

//   const filteredPlans = vpsPlans.filter(plan => {
//   const matchesServiceFilter = serviceFilter === 'all' || plan.service_type === serviceFilter;
//   const matchesType = type === 'residential' || !type ? true : plan.service_type === type;
  
//   // For residential VPS with country parameter
//   if (plan.service_type === 'residential' && countryParam) {
//     // Get the full country name from the code
//     const countryName = residentialCountries.find(c => c.code === countryParam)?.name;
    
//     // If locations array is empty or doesn't exist, show all plans
//     if (!plan.locations || plan.locations.length === 0) {
//       return matchesServiceFilter && matchesType;
//     }
    
//     // Check if the country NAME is in the locations array
//     const supportsCountry = countryName && plan.locations.includes(countryName);
    
//     return matchesServiceFilter && matchesType && supportsCountry;
//   }
  
//   return matchesServiceFilter && matchesType;
// });
//   const formatPrice = (price: number, duration = 1, managementType = 'unmanaged', countryCode = '') => {
//     const managementMultiplier = managementOptions.find(opt => opt.type === managementType)?.priceMultiplier || 1.0;
//     let discount = 0;
//     if (duration === 3) discount = 0.05;
//     else if (duration === 6) discount = 0.10;
//     else if (duration === 12) discount = 0.15;
    
//     const totalPrice = price * duration * managementMultiplier * (1 - discount);
//     return duration > 1 ? `${totalPrice.toFixed(2)} (${duration} months)` : `${totalPrice.toFixed(2)}/mo`;
//   };

//   const handleAddToCart = async () => {
//   if (!selectedPlan || !selectedOS) return;
//   if (selectedPlan.service_type === 'residential' && !selectedCountry) {
//     alert('Please select a country for residential VPS');
//     return;
//   }

//   const hostname = `vps-${Math.random().toString(36).substring(2, 8)}`;
  
//   // Calculate effective price but DON'T modify the plan object
//   const effectiveBasePrice = selectedPlan.service_type === 'residential' 
//     ? getCountryPrice(selectedPlan, selectedCountry)
//     : selectedPlan.price;
  
//   const cartItem = {
//     vpsPlan: selectedPlan, // ✅ Keep original plan unchanged
//     osTemplate: selectedOS,
//     hostname: hostname,
//     duration: selectedDuration,
//     managementType: selectedManagement,
//     productType: 'vps',
//     location: selectedPlan.service_type === 'residential' ? {
//       country: residentialCountries.find(c => c.code === selectedCountry)?.name || '',
//       countryCode: selectedCountry
//     } : undefined,
//     effective_base_price: effectiveBasePrice // ✅ Store adjusted price separately
//   };

//   try {
//     const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
//     const updatedCart = [...existingCart, cartItem];
//     localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    
//     window.dispatchEvent(new CustomEvent("cart-updated", { 
//       detail: { count: updatedCart.length } 
//     }));

//     setShowModal(false);
//     setSelectedPlan(null);
//     setSelectedOS("");
//     setSelectedDuration(1);
//     setSelectedManagement('unmanaged');
//     setSelectedCountry(countryParam || '');
    
//     alert(`${selectedPlan.name} (${selectedManagement}, ${selectedOS}) added to cart!`);
//   } catch (err) {
//     console.error("Failed to add to cart:", err);
//     setError('Failed to add item to cart');
//   }
// };
//   const openConfigModal = (plan: VPSPlan) => {
//     setSelectedPlan(plan);
//     setSelectedOS(plan.os_templates[0] || "");
//     setSelectedDuration(1);
//     setSelectedManagement('unmanaged');
//     if (!selectedCountry && countryParam) {
//       setSelectedCountry(countryParam);
//     }
//     setShowModal(true);
//   };

//   const getOSIcon = (osName: string) => {
//     const os = osMetadata.find(meta => meta.name === osName);
//     const icons: { [key: string]: string } = {
//       UbuntuIcon: 'fab fa-ubuntu',
//       DebianIcon: 'fab fa-debian',
//       CentOSIcon: 'fab fa-centos',
//       RHELIcon: 'fab fa-redhat',
//       RockyIcon: 'fas fa-server',
//       WindowsIcon: 'fab fa-windows',
//       FreeBSDIcon: 'fab fa-freebsd'
//     };
//     return os ? (
//       <i className={`${icons[os.icon] || 'fas fa-desktop'} text-lg mr-2`} />
//     ) : null;
//   };

//   const getServiceInfo = () => {
//     if (type === 'residential') {
//       return {
//         title: 'Residential VPS Plans',
//         subtitle: 'Premium residential IP virtual private servers with multiple OS options',
//         color: 'text-blue-500'
//       };
//     } else if (type === 'standard') {
//       return {
//         title: 'Standard VPS Plans',
//         subtitle: 'High-performance datacenter virtual private servers with diverse OS support',
//         color: 'text-blue-500'
//       };
//     }
//     return {
//       title: 'VPS Hosting Plans',
//       subtitle: 'Choose from residential and standard VPS options with Windows, Linux, and BSD support',
//       color: 'text-blue-500'
//     };
//   };

//   const serviceInfo = getServiceInfo();
//   const selectedCountryData = residentialCountries.find(c => c.code === (selectedCountry || countryParam));

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-slate-400 text-lg">Loading VPS plans...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
//         <div className="text-center bg-blue-900/20 border border-blue-700 rounded-2xl p-8">
//           <p className="text-blue-400 mb-2 text-xl font-bold">Error loading VPS plans</p>
//           <p className="text-slate-400">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
//       {/* Header */}
//       <div className="relative bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border-b border-blue-500/20 px-4 py-12 overflow-hidden">
//         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        
//         <div className="max-w-7xl mx-auto relative z-10">
//           <div className="text-center">
//             <button
//               onClick={() => navigate('/dashboard/vps')}
//               className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-500/30"
//             >
//               <ArrowLeftIcon className="w-4 h-4" />
//               Back to VPS Types
//             </button>

//             <div className="inline-flex items-center justify-center gap-3 mb-6 bg-blue-950/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-blue-500/20">
//               <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
//                 <HomeIcon className="h-6 w-6 text-white" />
//               </div>
//               <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">VPS Plans</span>
//             </div>
            
//             {selectedCountryData && type === 'residential' && (
//               <div className="flex items-center justify-center gap-3 mb-6">
//                 <span className="text-6xl">{selectedCountryData.flag}</span>
//                 <div className="text-left">
//                   <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
//                     {selectedCountryData.name}
//                   </h1>
//                   <p className="text-blue-400 font-semibold text-lg">Residential IP Location</p>
//                 </div>
//               </div>
//             )}

//             {!selectedCountryData && (
//               <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
//                 {serviceInfo.title}
//               </h1>
//             )}
            
//             <p className="text-xl text-slate-300 max-w-2xl mx-auto">
//               {serviceInfo.subtitle}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-12">
//         {filteredPlans.length === 0 ? (
//           <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-blue-500/20">
//             <ServerIcon className="h-20 w-20 text-blue-500/50 mx-auto mb-6" />
//             <h3 className="text-2xl font-bold text-white mb-3">No VPS plans available</h3>
//             <p className="text-slate-400 text-lg">
//               {countryParam 
//                 ? `No plans available for ${selectedCountryData?.name || 'this location'}. Please select a different country.`
//                 : 'Check back later for available plans'
//               }
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {filteredPlans.map((plan) => {
//               const displayPrice = plan.service_type === 'residential' && (selectedCountry || countryParam)
//                 ? getCountryPrice(plan, selectedCountry || countryParam || '')
//                 : plan.price;

//               return (
//                 <div
//                   key={plan.id}
//                   className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transform hover:scale-[1.02]"
//                 >
//                   <div className="p-8 border-b border-blue-500/10">
//                     <div className="flex items-start justify-between mb-4">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2 mb-3">
//                           <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
//                         </div>
//                         <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
//                           <ServerIcon className="h-3 w-3" />
//                           {plan.service_type === 'residential' ? 'Residential' : 'Standard'}
//                         </div>
//                         <div className="flex items-baseline gap-2">
//                           <span className="text-4xl font-black text-blue-400">
//                             ${displayPrice.toFixed(2)}
//                           </span>
//                           <span className="text-slate-400 font-semibold">/month</span>
//                         </div>
//                         {plan.service_type === 'residential' && selectedCountryData && displayPrice !== plan.price && (
//                           <p className="text-xs text-slate-500 mt-2">
//                             Base price: ${plan.price.toFixed(2)}/mo
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-8 space-y-6">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                         <div className="flex items-center gap-2 mb-2">
//                           <CpuChipIcon className="h-5 w-5 text-blue-400" />
//                           <span className="text-xs text-slate-400 uppercase font-semibold">CPU</span>
//                         </div>
//                         <span className="text-white font-bold text-lg">{plan.cpu_cores} vCPU</span>
//                       </div>
//                       <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                         <div className="flex items-center gap-2 mb-2">
//                           <CircleStackIcon className="h-5 w-5 text-green-400" />
//                           <span className="text-xs text-slate-400 uppercase font-semibold">RAM</span>
//                         </div>
//                         <span className="text-white font-bold text-lg">{plan.ram_gb} GB</span>
//                       </div>
//                       <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                         <div className="flex items-center gap-2 mb-2">
//                           <ServerIcon className="h-5 w-5 text-purple-400" />
//                           <span className="text-xs text-slate-400 uppercase font-semibold">Storage</span>
//                         </div>
//                         <span className="text-white font-bold text-lg">{plan.storage_gb} GB</span>
//                       </div>
//                       <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
//                         <div className="flex items-center gap-2 mb-2">
//                           <GlobeAltIcon className="h-5 w-5 text-orange-400" />
//                           <span className="text-xs text-slate-400 uppercase font-semibold">Bandwidth</span>
//                         </div>
//                         <span className="text-white font-bold text-sm">
//                           {plan.bandwidth_gb > 0 ? `${plan.bandwidth_gb} GB` : 'Unlimited'}
//                         </span>
//                       </div>
//                     </div>

//                     {plan.features && plan.features.length > 0 && (
//                       <div>
//                         <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Key Features</h4>
//                         <div className="space-y-2">
//                           {plan.features.slice(0, 3).map((feature, i) => (
//                             <div key={i} className="flex items-center gap-2">
//                               <div className="p-1 rounded-md bg-blue-500/10">
//                                 <CheckIcon className="h-3 w-3 text-blue-400 flex-shrink-0" />
//                               </div>
//                               <span className="text-slate-300 text-sm">{feature}</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {plan.os_templates && plan.os_templates.length > 0 && (
//                       <div>
//                         <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">OS Options</h4>
//                         <div className="flex flex-wrap gap-2">
//                           {plan.os_templates.slice(0, 3).map((os, i) => (
//                             <span key={i} className="bg-slate-800/70 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1">
//                               {getOSIcon(os)}
//                               {os.split(' ')[0]}
//                             </span>
//                           ))}
//                           {plan.os_templates.length > 3 && (
//                             <span className="text-blue-400 text-xs font-semibold px-2 py-1.5">+{plan.os_templates.length - 3} more</span>
//                           )}
//                         </div>
//                       </div>
//                     )}

//                     <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20">
//                       <div className="flex items-start gap-2">
//                         <ServerIcon className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
//                         <p className="text-xs text-slate-300 leading-relaxed">
//                           {plan.service_type === 'residential'
//                             ? '🏠 Residential IP addresses for authentic browsing and location-based tasks'
//                             : '🏢 High-performance datacenter infrastructure with enterprise-grade connectivity'
//                           }
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-8 pt-0">
//                     <button
//                       onClick={() => openConfigModal(plan)}
//                       className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 group-hover:shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
//                     >
//                       <ShoppingCartIcon className="h-5 w-5" />
//                       Configure & Add to Cart
//                       <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {showModal && selectedPlan && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
//           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/30 w-full max-w-2xl shadow-2xl shadow-blue-500/20 my-8">
//             <div className="p-8 border-b border-blue-500/20">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-3xl font-black text-white mb-2">Configure Your VPS</h3>
//                   <div className="flex items-center gap-3">
//                     <p className="text-slate-400 text-lg">{selectedPlan.name}</p>
//                     <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
//                       {selectedPlan.service_type === 'residential' ? 'Residential' : 'Standard'}
//                     </span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setShowModal(false)}
//                   className="text-slate-400 hover:text-white transition-colors text-3xl font-bold leading-none hover:bg-blue-500/10 w-10 h-10 rounded-lg flex items-center justify-center"
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>

//             <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
//               <div className="bg-slate-800/50 rounded-2xl p-6 border border-blue-500/10">
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                   <div>
//                     <div className="flex items-center gap-2 mb-2">
//                       <CpuChipIcon className="h-4 w-4 text-blue-400" />
//                       <span className="text-xs text-slate-400 uppercase font-semibold">CPU</span>
//                     </div>
//                     <span className="text-white font-bold">{selectedPlan.cpu_cores} vCPU</span>
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2 mb-2">
//                       <CircleStackIcon className="h-4 w-4 text-green-400" />
//                       <span className="text-xs text-slate-400 uppercase font-semibold">RAM</span>
//                     </div>
//                     <span className="text-white font-bold">{selectedPlan.ram_gb} GB</span>
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2 mb-2">
//                       <ServerIcon className="h-4 w-4 text-purple-400" />
//                       <span className="text-xs text-slate-400 uppercase font-semibold">Storage</span>
// </div>
// <span className="text-white font-bold">{selectedPlan.storage_gb} GB</span>
// </div>
// <div>
//   <div className="flex items-center gap-2 mb-2">
//     <GlobeAltIcon className="h-4 w-4 text-orange-400" />
//     <span className="text-xs text-slate-400 uppercase font-semibold">Bandwidth</span>
//   </div>
//   <span className="text-white font-bold text-sm">
//     {selectedPlan.bandwidth_gb > 0 ? `${selectedPlan.bandwidth_gb} GB` : 'Unlimited'}
//   </span>
// </div>
// </div>
// </div>
//           {selectedPlan.service_type === 'residential' && (
//             <div>
//               <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
//                 <MapPinIcon className="h-5 w-5 text-blue-400" />
//                 Select Country
//               </label>
//               <div className="grid grid-cols-1 gap-3">
//                 {residentialCountries.map((country) => {
//                   const countryPrice = getCountryPrice(selectedPlan, country.code);
//                   const isPriceAdjusted = countryPrice !== selectedPlan.price;
                  
//                   return (
//                     <label 
//                       key={country.code} 
//                       className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
//                         selectedCountry === country.code
//                           ? 'border-blue-500 bg-blue-500/10'
//                           : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
//                       }`}
//                     >
//                       <div className="flex items-center flex-1">
//                         <input
//                           type="radio"
//                           name="country"
//                           value={country.code}
//                           checked={selectedCountry === country.code}
//                           onChange={(e) => setSelectedCountry(e.target.value)}
//                           className="h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500"
//                         />
//                         <span className="ml-4 flex items-center gap-3 text-slate-200 font-semibold text-lg">
//                           <span className="text-3xl">{country.flag}</span>
//                           <span>{country.name}</span>
//                         </span>
//                       </div>
//                       <div className="text-right ml-4">
//                         <div className="text-lg font-bold text-blue-400">
//                           ${countryPrice.toFixed(2)}/mo
//                         </div>
//                         {isPriceAdjusted && (
//                           <div className="text-xs text-slate-500">
//                             Base: ${selectedPlan.price.toFixed(2)}
//                           </div>
//                         )}
//                       </div>
//                     </label>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">
//               Management Type
//             </label>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {managementOptions.map((option) => (
//                 <label
//                   key={option.type}
//                   className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all ${
//                     selectedManagement === option.type
//                       ? 'border-blue-500 bg-blue-500/10'
//                       : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
//                   }`}
//                 >
//                   <input
//                     type="radio"
//                     name="management"
//                     value={option.type}
//                     checked={selectedManagement === option.type}
//                     onChange={(e) => setSelectedManagement(e.target.value)}
//                     className="absolute top-4 right-4 h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500"
//                   />
//                   <div className="flex-1 pr-8">
//                     <div className="flex items-center gap-2 mb-3">
//                       <span className="font-bold text-white text-lg">{option.name}</span>
//                       <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full font-semibold">
//                         {option.badge}
//                       </span>
//                     </div>
//                     <p className="text-sm text-slate-400 mb-3">{option.description}</p>
//                     <div className="text-xs font-semibold">
//                       {option.priceMultiplier === 1 ? (
//                         <span className="text-green-400">Standard Price</span>
//                       ) : (
//                         <span className="text-blue-400">+{((option.priceMultiplier - 1) * 100).toFixed(0)}% Premium</span>
//                       )}
//                     </div>
//                   </div>
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">
//               Operating System
//             </label>
//             <div className="grid grid-cols-1 gap-3">
//               {selectedPlan.os_templates?.map((os) => {
//                 const osMeta = osMetadata.find(meta => meta.name === os);
//                 return (
//                   <label 
//                     key={os} 
//                     className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
//                       selectedOS === os
//                         ? 'border-blue-500 bg-blue-500/10'
//                         : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
//                     }`}
//                   >
//                     <input
//                       type="radio"
//                       name="os"
//                       value={os}
//                       checked={selectedOS === os}
//                       onChange={(e) => setSelectedOS(e.target.value)}
//                       className="h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500"
//                     />
//                     <span className="ml-4 flex items-center gap-3 text-slate-200 font-semibold flex-1">
//                       {getOSIcon(os)}
//                       <span className="flex-1">{os}</span>
//                       {osMeta && (
//                         <span className="text-xs text-slate-500 hidden md:block">({osMeta.description})</span>
//                       )}
//                     </span>
//                   </label>
//                 );
//               })}
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wide">
//               Billing Period
//             </label>
//             <select
//               value={selectedDuration}
//               onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
//               className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-white font-semibold text-lg focus:ring-2 focus:border-blue-500 focus:ring-blue-500/30 transition-all"
//             >
//               <option value={1}>1 Month</option>
//               <option value={3}>3 Months (Save 5%)</option>
//               <option value={6}>6 Months (Save 10%)</option>
//               <option value={12}>12 Months (Save 15%)</option>
//             </select>
//           </div>

//           <div className="bg-gradient-to-br from-blue-950/50 to-slate-900/50 rounded-2xl p-6 border border-blue-500/30">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-slate-300 font-semibold text-lg">Total Price:</span>
//               <span className="text-3xl font-black text-blue-400">
//                 ${formatPrice(
//                   getCountryPrice(selectedPlan, selectedCountry), 
//                   selectedDuration, 
//                   selectedManagement,
//                   selectedCountry
//                 )}
//               </span>
//             </div>
//             {selectedDuration > 1 && (
//               <div className="text-sm text-slate-400 mb-2">
//                 Monthly rate: ${(getCountryPrice(selectedPlan, selectedCountry) * (selectedManagement === 'managed' ? managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier || 1.5 : 1.0)).toFixed(2)}/month
//               </div>
//             )}
//             {selectedManagement === 'managed' && (
//               <div className="text-sm text-blue-400 flex items-center gap-2 mb-2">
//                 <ShieldCheckIcon className="h-4 w-4" />
//                 Includes +{(((managementOptions.find(opt => opt.type === 'managed')?.priceMultiplier ?? 1.5) - 1) * 100).toFixed(0)}% for managed services
//               </div>
//             )}
//             {selectedPlan.service_type === 'residential' && selectedCountry && (
//               <div className="text-sm text-slate-400 flex items-center gap-2">
//                 <MapPinIcon className="h-4 w-4" />
//                 {selectedCountryData?.name} location pricing applied
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="p-8 pt-0 flex gap-4">
//           <button
//             onClick={() => setShowModal(false)}
//             className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all border border-slate-700 hover:border-slate-600"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleAddToCart}
//             disabled={!selectedOS || (selectedPlan.service_type === 'residential' && !selectedCountry)}
//             className="flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none flex items-center justify-center gap-2"
//           >
//             <ShoppingCartIcon className="h-5 w-5" />
//             Add to Cart
//           </button>
//         </div>
//       </div>
//     </div>
//   )}

//   <div className="max-w-7xl mx-auto px-4 pb-16">
//     <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 p-8 md:p-12 shadow-2xl shadow-blue-500/5">
//       <h3 className="text-3xl md:text-4xl font-black text-white text-center mb-12">
//         Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Our VPS?</span>
//       </h3>
      
//       <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//         <div className="text-center group">
//           <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
//             <BoltIcon className="w-10 h-10 text-white" />
//           </div>
//           <h4 className="text-xl font-bold text-white mb-3">Instant Setup</h4>
//           <p className="text-slate-400 leading-relaxed">Your VPS is configured and ready within minutes of payment</p>
//         </div>

//         <div className="text-center group">
//           <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
//             <ShieldCheckIcon className="w-10 h-10 text-white" />
//           </div>
//           <h4 className="text-xl font-bold text-white mb-3">Secure Access</h4>
//           <p className="text-slate-400 leading-relaxed">Industry-standard encryption and security protocols</p>
//         </div>

//         <div className="text-center group">
//           <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
//             <ClockIcon className="w-10 h-10 text-white" />
//           </div>
//           <h4 className="text-xl font-bold text-white mb-3">24/7 Support</h4>
//           <p className="text-slate-400 leading-relaxed">Round-the-clock technical support</p>
//         </div>

//         <div className="text-center group">
//           <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
//             <ServerIcon className="w-10 h-10 text-white" />
//           </div>
//           <h4 className="text-xl font-bold text-white mb-3">High Performance</h4>
//           <p className="text-slate-400 leading-relaxed">Optimized servers with SSD storage</p>
//         </div>
//       </div>

//       <div className="mt-12 text-center">
//         <div className="inline-block bg-gradient-to-br from-blue-950/50 to-slate-900/50 rounded-2xl p-8 border border-blue-500/20">
//           <h4 className="text-2xl font-black text-white mb-3">Need Help Choosing?</h4>
//           <p className="text-slate-400 mb-6 max-w-2xl mx-auto text-lg">
//             Not sure which plan is right for you? Our team can help you find the perfect VPS solution for your needs.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button 
//               onClick={() => navigate('/contact')}
//               className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
//             >
//               Contact Support
//             </button>
//             <button 
//               onClick={() => navigate('/dashboard/vps')}
//               className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all border border-slate-700 hover:border-blue-500/30"
//             >
//               View All Types
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </div>
// );
// }