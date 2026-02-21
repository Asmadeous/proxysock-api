// // import { useState, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { createClient } from "@supabase/supabase-js";
// // import { 
// //   ServerIcon,
// //   HomeIcon,
// //   BuildingOfficeIcon,
// //   ArrowRightIcon,
// //   CheckIcon,
// //   GlobeAltIcon,
// //   CpuChipIcon,
// //   CloudArrowUpIcon,
// //   LifebuoyIcon,
// //   ComputerDesktopIcon,
// //   UsersIcon
// // } from "@heroicons/react/24/outline";

// // const supabase = createClient(
// //   import.meta.env.VITE_SUPABASE_URL,
// //   import.meta.env.VITE_SUPABASE_ANON_KEY
// // );

// // interface VPSType {
// //   id: string;
// //   name: string;
// //   description: string;
// //   pricing: string;
// //   badge: string;
// //   features: string[];
// //   use_cases: string[];
// //   color: string;
// //   borderColor: string;
// //   shadowColor: string;
// //   buttonColor: string;
// // }

// // export default function VPSTypes() {
// //   const navigate = useNavigate();
// //   const [hoveredType, setHoveredType] = useState<string | null>(null);
// //   const [vpsTypes, setVpsTypes] = useState<VPSType[]>([]);
// //   const [comparisonFeatures, setComparisonFeatures] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   useEffect(() => {
// //     fetchData();
// //   }, []);

// //   const fetchData = async () => {
// //     try {
// //       setLoading(true);

// //       // Fetch vps_plans to derive types
// //       const { data: plansData, error: plansError } = await supabase
// //         .from('vps_plans')
// //         .select('service_type, price')
// //         .eq('is_active', true);

// //       if (plansError) throw new Error(`Failed to fetch plans: ${plansError.message}`);

// //       // Log plans for debugging
// //       console.log('Fetched Plans for Types:', plansData);

// //       const residentialPlans = plansData.filter(p => p.service_type === 'residential');
// //       const standardPlans = plansData.filter(p => p.service_type === 'standard');

// //       const vpsTypesData: VPSType[] = [
// //         {
// //           id: 'residential',
// //           name: 'Residential VPS',
// //           description: 'VPS with residential IP addresses for authentic browsing and location-based tasks, supporting multiple OS',
// //           pricing: residentialPlans.length > 0 
// //             ? `Starting from $${Math.min(...residentialPlans.map(p => p.price)).toFixed(2)}/month`
// //             : 'Contact support for pricing',
// //           badge: 'Premium',
// //           features: [
// //             'Residential IP addresses',
// //             'Authentic geo-location',
// //             'High trust score websites',
// //             'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD',
// //             'Bypass geo-restrictions',
// //             'Social media management',
// //             'E-commerce operations',
// //             'Priority support'
// //           ],
// //           use_cases: [
// //             'Social Media Management',
// //             'E-commerce Operations',
// //             'Market Research',
// //             'Geo-restricted Content',
// //             'Ad Verification',
// //             'Price Monitoring'
// //           ],
// //           color: 'from-green-600 to-emerald-600',
// //           borderColor: 'border-green-500/30 hover:border-green-500/50',
// //           shadowColor: 'hover:shadow-green-500/10',
// //           buttonColor: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
// //         },
// //         {
// //           id: 'standard',
// //           name: 'Standard VPS',
// //           description: 'High-performance datacenter VPS with enterprise-grade infrastructure, supporting multiple OS',
// //           pricing: standardPlans.length > 0 
// //             ? `Starting from $${Math.min(...standardPlans.map(p => p.price)).toFixed(2)}/month`
// //             : 'Contact support for pricing',
// //           badge: 'Best Value',
// //           features: [
// //             'High-speed datacenter IPs',
// //             'Enterprise infrastructure',
// //             'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD',
// //             'Unlimited bandwidth (residential) or high limits',
// //             'Low latency connections',
// //             '24/7 uptime monitoring',
// //             'DDoS protection',
// //             'Full root access'
// //           ],
// //           use_cases: [
// //             'Business Applications',
// //             'Development & Testing',
// //             'Data Processing',
// //             'Remote Work',
// //             'Server Management',
// //             'Automated Tasks'
// //           ],
// //           color: 'from-blue-600 to-blue-600',
// //           borderColor: 'border-blue-500/30 hover:border-blue-500/50',
// //           shadowColor: 'hover:shadow-blue-500/10',
// //           buttonColor: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
// //         }
// //       ].filter(type => 
// //         type.id === 'residential' ? residentialPlans.length > 0 : standardPlans.length > 0
// //       );

// //       // Fetch comparison features
// //       const comparisonFeaturesFallback = [
// //         { feature: 'IP Type', residential: 'Residential IPs', standard: 'Datacenter IPs', icon: 'GlobeAltIcon' },
// //         { feature: 'Speed', residential: 'Good (20-100 Mbps)', standard: 'Excellent (100+ Mbps)', icon: 'CpuChipIcon' },
// //         { feature: 'Bandwidth', residential: 'Unlimited', standard: '1-4 TB', icon: 'CloudArrowUpIcon' },
// //         { feature: 'Use Cases', residential: 'Social Media, E-commerce', standard: 'Hosting, Development', icon: 'UsersIcon' },
// //         { feature: 'Support', residential: 'Priority', standard: 'Standard', icon: 'LifebuoyIcon' },
// //         { feature: 'Operating Systems', residential: 'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD', standard: 'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD', icon: 'ComputerDesktopIcon' }
// //       ];

// //       const { data: configData, error: configError } = await supabase
// //         .from('system_config')
// //         .select('vps_comparison_features')
// //         .eq('config_key', 'vps_settings')
// //         .single();

// //       if (configError) {
// //         console.warn(`Config fetch failed: ${configError.message}. Using fallback data.`);
// //         await supabase.from('system_logs').insert({
// //           component: 'vps-types',
// //           action: 'fetch_config',
// //           level: 'warning',
// //           message: `Failed to fetch system_config: ${configError.message}. Using fallback data.`,
// //           created_at: new Date().toISOString(),
// //         });
// //       }

// //       setVpsTypes(vpsTypesData);
// //       setComparisonFeatures(configData?.vps_comparison_features || comparisonFeaturesFallback);
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Failed to fetch data');
// //       await supabase.from('system_logs').insert({
// //         component: 'vps-types',
// //         action: 'fetch_data',
// //         level: 'error',
// //         message: err instanceof Error ? err.message : 'Unknown error fetching data',
// //         created_at: new Date().toISOString(),
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const getIconComponent = (iconName: string) => {
// //     const icons: { [key: string]: any } = {
// //       GlobeAltIcon,
// //       CpuChipIcon,
// //       CloudArrowUpIcon,
// //       UsersIcon,
// //       LifebuoyIcon,
// //       ComputerDesktopIcon,
// //       HomeIcon,
// //       BuildingOfficeIcon
// //     };
// //     return icons[iconName] || GlobeAltIcon;
// //   };

// //   const handleNavigate = (type: string) => {
// //     navigate(`/dashboard/vps-plans/${type}`);
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
// //           <p className="text-slate-400">Loading VPS types...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
// //         <div className="text-center bg-red-900/20 border border-red-700 rounded-xl p-6">
// //           <p className="text-red-400 mb-2">Error loading VPS types</p>
// //           <p className="text-slate-400 text-sm">{error}</p>
// //           <button
// //             onClick={() => navigate('/contact')}
// //             className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
// //           >
// //             Contact Support
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
// //       <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 px-4 py-8">
// //         <div className="max-w-7xl mx-auto text-center">
// //           <div className="flex items-center justify-center gap-3 mb-4">
// //             <ServerIcon className="h-10 w-10 text-blue-500" />
// //             <h1 className="text-4xl md:text-5xl font-bold text-white">Choose Your VPS Type</h1>
// //           </div>
// //           <p className="text-xl text-slate-300 max-w-3xl mx-auto">
// //             Select between residential VPS with authentic IPs or standard VPS with high-performance datacenter infrastructure, both with Windows, Linux, and BSD support
// //           </p>
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-4 py-8">
// //         {vpsTypes.length === 0 ? (
// //           <div className="text-center py-12">
// //             <ServerIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
// //             <h3 className="text-xl font-semibold text-white mb-2">No VPS types available</h3>
// //             <p className="text-slate-400 mb-4">
// //               No VPS plans are currently available. Please contact support for assistance.
// //             </p>
// //             <button
// //               onClick={() => navigate('/contact')}
// //               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
// //             >
// //               Contact Support
// //             </button>
// //           </div>
// //         ) : (
// //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
// //             {vpsTypes.map((type) => {
// //               const IconComponent = getIconComponent(type.id === 'residential' ? 'HomeIcon' : 'BuildingOfficeIcon');
// //               return (
// //                 <div
// //                   key={type.id}
// //                   onMouseEnter={() => setHoveredType(type.id)}
// //                   onMouseLeave={() => setHoveredType(null)}
// //                   className={`relative bg-slate-800 rounded-2xl border transition-all duration-300 overflow-hidden ${type.borderColor} ${type.shadowColor} hover:shadow-2xl transform hover:scale-[1.02]`}
// //                 >
// //                   {type.badge && (
// //                     <div className="absolute top-4 right-4 z-10">
// //                       <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
// //                         type.id === 'residential' 
// //                           ? 'bg-gradient-to-r from-green-500 to-emerald-500'
// //                           : 'bg-gradient-to-r from-blue-500 to-blue-600'
// //                       }`}>
// //                         {type.badge}
// //                       </span>
// //                     </div>
// //                   )}

// //                   <div className="p-8 border-b border-slate-700">
// //                     <div className="flex items-center gap-4 mb-4">
// //                       <div className={`p-3 rounded-xl bg-gradient-to-r ${type.color} bg-opacity-10`}>
// //                         <IconComponent className={`h-8 w-8 ${
// //                           type.id === 'residential' ? 'text-green-500' : 'text-blue-500'
// //                         }`} />
// //                       </div>
// //                       <div>
// //                         <h2 className="text-2xl font-bold text-white">{type.name}</h2>
// //                         <p className="text-slate-400 font-semibold">{type.pricing}</p>
// //                       </div>
// //                     </div>
// //                     <p className="text-slate-300 leading-relaxed">{type.description}</p>
// //                   </div>

// //                   <div className="p-8">
// //                     <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
// //                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
// //                       {type.features.map((feature, i) => (
// //                         <div key={i} className="flex items-center gap-2">
// //                           <CheckIcon className={`h-4 w-4 flex-shrink-0 ${
// //                             type.id === 'residential' ? 'text-green-400' : 'text-blue-400'
// //                           }`} />
// //                           <span className="text-slate-300 text-sm">{feature}</span>
// //                         </div>
// //                       ))}
// //                     </div>

// //                     <h4 className="text-md font-semibold text-white mb-3">Perfect For</h4>
// //                     <div className="flex flex-wrap gap-2 mb-6">
// //                       {type.use_cases.map((useCase, i) => (
// //                         <span
// //                           key={i}
// //                           className={`px-3 py-1 rounded-full text-xs font-medium ${
// //                             type.id === 'residential'
// //                               ? 'bg-green-500/10 text-green-300 border border-green-500/20'
// //                               : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
// //                           }`}
// //                         >
// //                           {useCase}
// //                         </span>
// //                       ))}
// //                     </div>

// //                     <button
// //                       onClick={() => handleNavigate(type.id)}
// //                       className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 ${type.buttonColor}`}
// //                     >
// //                       Browse {type.name} Plans
// //                       <ArrowRightIcon className={`h-5 w-5 transition-transform ${
// //                         hoveredType === type.id ? 'translate-x-1' : ''
// //                       }`} />
// //                     </button>
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         )}

// //         <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
// //           <div className="p-6 border-b border-slate-700">
// //             <h2 className="text-2xl font-bold text-white mb-2">Feature Comparison</h2>
// //             <p className="text-slate-400">Compare the key differences between our VPS types</p>
// //           </div>

// //           <div className="overflow-x-auto">
// //             <table className="w-full">
// //               <thead className="bg-slate-700/50">
// //                 <tr>
// //                   <th className="text-left py-4 px-6 text-slate-300 font-semibold">Feature</th>
// //                   <th className="text-center py-4 px-6 text-green-300 font-semibold">Residential VPS</th>
// //                   <th className="text-center py-4 px-6 text-blue-300 font-semibold">Standard VPS</th>
// //                 </tr>
// //               </thead>
// //               <tbody className="divide-y divide-slate-700">
// //                 {comparisonFeatures.map((item, index) => {
// //                   const IconComponent = getIconComponent(item.icon);
// //                   return (
// //                     <tr key={index} className="hover:bg-slate-700/30 transition-colors">
// //                       <td className="py-4 px-6">
// //                         <div className="flex items-center gap-3">
// //                           <IconComponent className="h-5 w-5 text-slate-400" />
// //                           <span className="text-white font-medium">{item.feature}</span>
// //                         </div>
// //                       </td>
// //                       <td className="py-4 px-6 text-center text-slate-300">{item.residential}</td>
// //                       <td className="py-4 px-6 text-center text-slate-300">{item.standard}</td>
// //                     </tr>
// //                   );
// //                 })}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>

// //         <div className="mt-12 text-center">
// //           <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
// //           <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
// //             Not sure which VPS type is right for you? Our team can help you select the perfect solution.
// //           </p>
// //           <div className="flex flex-col sm:flex-row gap-4 justify-center">
// //             <button 
// //               onClick={() => navigate('/contact')}
// //               className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
// //             >
// //               Contact Support
// //             </button>
// //             <button 
// //               onClick={() => navigate('/dashboard/vps-plans')}
// //               className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all"
// //             >
// //               View All Plans
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { createClient } from "@supabase/supabase-js";
// import { 
//   ServerIcon,
//   HomeIcon,
//   BuildingOfficeIcon,
//   ArrowRightIcon,
//   CheckIcon,
//   ShieldCheckIcon,
//   MapPinIcon,
//   BoltIcon,
//   ClockIcon,
//   GlobeAltIcon
// } from "@heroicons/react/24/outline";

// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// );

// interface VPSType {
//   id: string;
//   name: string;
//   description: string;
//   pricing: string;
//   badge: string;
//   features: string[];
//   use_cases: string[];
//   color: string;
//   borderColor: string;
//   shadowColor: string;
//   buttonColor: string;
//   icon: string;
// }

// export default function VPSTypes() {
//   const navigate = useNavigate();
//   const [hoveredType, setHoveredType] = useState<string | null>(null);
//   const [selectedType, setSelectedType] = useState<string | null>(null);
//   const [vpsTypes, setVpsTypes] = useState<VPSType[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [minPrice, setMinPrice] = useState<number>(0);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       // Fetch vps_plans to derive types and minimum price
//       const { data: plansData, error: plansError } = await supabase
//         .from('vps_plans')
//         .select('service_type, price')
//         .eq('is_active', true);

//       if (plansError) throw new Error(`Failed to fetch plans: ${plansError.message}`);

//       const calculatedMinPrice = plansData && plansData.length > 0 
//         ? Math.min(...plansData.map(p => p.price))
//         : 9.99;

//       setMinPrice(calculatedMinPrice);

//       const residentialPlans = plansData.filter(p => p.service_type === 'residential');
//       const standardPlans = plansData.filter(p => p.service_type === 'standard');

//       const vpsTypesData: VPSType[] = [
//         {
//           id: 'residential',
//           name: 'Residential VPS',
//           description: 'VPS with residential IP addresses for authentic browsing and location-based tasks, supporting multiple OS',
//           pricing: residentialPlans.length > 0 
//             ? `Starting from $${Math.min(...residentialPlans.map(p => p.price)).toFixed(2)}/month`
//             : 'Contact support for pricing',
//           badge: 'Premium',
//           features: [
//             'Residential IP addresses',
//             'Authentic geo-location',
//             'High trust score websites',
//             'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD',
//             'Bypass geo-restrictions',
//             'Social media management',
//             'E-commerce operations',
//             'Priority support'
//           ],
//           use_cases: [
//             'Social Media Management',
//             'E-commerce Operations',
//             'Market Research',
//             'Geo-restricted Content',
//             'Ad Verification',
//             'Price Monitoring'
//           ],
//           color: 'from-blue-600 to-cyan-600',
//           borderColor: 'border-blue-500/20',
//           shadowColor: 'shadow-blue-500/10',
//           buttonColor: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
//           icon: 'home'
//         },
//         {
//           id: 'standard',
//           name: 'Standard VPS',
//           description: 'High-performance datacenter VPS with enterprise-grade infrastructure, supporting multiple OS',
//           pricing: standardPlans.length > 0 
//             ? `Starting from $${Math.min(...standardPlans.map(p => p.price)).toFixed(2)}/month`
//             : 'Contact support for pricing',
//           badge: 'Best Value',
//           features: [
//             'High-speed datacenter IPs',
//             'Enterprise infrastructure',
//             'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD',
//             'Unlimited bandwidth (residential) or high limits',
//             'Low latency connections',
//             '24/7 uptime monitoring',
//             'DDoS protection',
//             'Full root access'
//           ],
//           use_cases: [
//             'Business Applications',
//             'Development & Testing',
//             'Data Processing',
//             'Remote Work',
//             'Server Management',
//             'Automated Tasks'
//           ],
//           color: 'from-blue-600 to-blue-600',
//           borderColor: 'border-blue-500/20',
//           shadowColor: 'shadow-blue-500/10',
//           buttonColor: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
//           icon: 'building'
//         }
//       ].filter(type => 
//         type.id === 'residential' ? residentialPlans.length > 0 : standardPlans.length > 0
//       );

//       setVpsTypes(vpsTypesData);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//       await supabase.from('system_logs').insert({
//         component: 'vps-types',
//         action: 'fetch_data',
//         level: 'error',
//         message: err instanceof Error ? err.message : 'Unknown error fetching data',
//         created_at: new Date().toISOString(),
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTypeClick = (typeId: string) => {
//     setSelectedType(typeId);
//     navigate(`/dashboard/vps-plans/${typeId}`);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-slate-400 text-lg">Loading VPS services...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
//         <div className="text-center bg-blue-900/20 border border-blue-700 rounded-2xl p-8">
//           <p className="text-blue-400 mb-2 text-xl font-bold">Error loading VPS services</p>
//           <p className="text-slate-400">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   const vpsFeatures = [
//     'Multiple operating systems support',
//     'Enterprise-grade infrastructure',
//     'Full root access',
//     'DDoS protection included',
//     'Free DNS management',
//     'Instant provisioning',
//     '24/7 technical support',
//     'Scalable resources'
//   ];

//   const useCases = [
//     'Web Hosting',
//     'Application Development',
//     'Database Management',
//     'Remote Work',
//     'Game Servers',
//     'Business Operations'
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
//       {/* Header */}
//       <div className="relative bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border-b border-blue-500/20 px-4 py-16 overflow-hidden">
//         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        
//         <div className="max-w-7xl mx-auto text-center relative z-10">
//           <div className="inline-flex items-center justify-center gap-3 mb-6 bg-blue-950/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-blue-500/20">
//             <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
//               <ServerIcon className="h-6 w-6 text-white" />
//             </div>
//             <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">High-Performance VPS</span>
//           </div>
          
//           <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
//             Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">VPS Type</span>
//           </h1>
          
//           <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-4 leading-relaxed">
//             Select between residential VPS with authentic IPs or standard VPS with high-performance datacenter infrastructure
//           </p>
          
//           <p className="text-slate-400 max-w-2xl mx-auto mb-8">
//             Both supporting Windows, Linux, and BSD operating systems with enterprise-grade security
//           </p>
          
//           <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30">
//             <BoltIcon className="h-5 w-5" />
//             Starting from ${minPrice.toFixed(2)}/month
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-16">
//         {/* Service Overview */}
//         <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 overflow-hidden mb-16 shadow-2xl shadow-blue-500/5">
//           <div className="p-8 md:p-12 border-b border-blue-500/10">
//             <div className="flex items-center gap-4 mb-8">
//               <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
//                 <ServerIcon className="h-10 w-10 text-blue-400" />
//               </div>
//               <div>
//                 <h2 className="text-3xl font-bold text-white mb-2">Enterprise VPS Solutions</h2>
//                 <p className="text-slate-400 text-lg">Powerful, scalable, and reliable virtual servers</p>
//               </div>
//             </div>

//             <div className="grid md:grid-cols-2 gap-10">
//               <div>
//                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
//                   <CheckIcon className="h-5 w-5 text-blue-400" />
//                   Key Features
//                 </h3>
//                 <div className="grid grid-cols-1 gap-4">
//                   {vpsFeatures.map((feature, i) => (
//                     <div key={i} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all">
//                       <div className="p-1.5 rounded-lg bg-blue-500/10">
//                         <CheckIcon className="h-4 w-4 flex-shrink-0 text-blue-400" />
//                       </div>
//                       <span className="text-slate-300">{feature}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
//                   <GlobeAltIcon className="h-5 w-5 text-blue-400" />
//                   Perfect For
//                 </h4>
//                 <div className="flex flex-wrap gap-3">
//                   {useCases.map((useCase, i) => (
//                     <span
//                       key={i}
//                       className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-300 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105 cursor-default"
//                     >
//                       {useCase}
//                     </span>
//                   ))}
//                 </div>

//                 <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20">
//                   <div className="flex items-start gap-3">
//                     <div className="p-2 rounded-lg bg-blue-500/20 mt-1">
//                       <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
//                     </div>
//                     <div>
//                       <h5 className="font-bold text-white mb-2">Enterprise Security</h5>
//                       <p className="text-sm text-slate-400 leading-relaxed">
//                         Bank-grade encryption, DDoS protection, and 24/7 monitoring to keep your VPS secure
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* VPS Type Selection */}
//         <div className="mb-16">
//           <div className="text-center mb-12">
//             <div className="inline-flex items-center gap-2 bg-blue-950/30 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/20 mb-4">
//               <ServerIcon className="h-4 w-4 text-blue-400" />
//               <span className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Select VPS Type</span>
//             </div>
//             <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Choose Your VPS</h2>
//             <p className="text-slate-400 text-lg">Pick the VPS type that fits your needs</p>
//           </div>

//           {vpsTypes.length === 0 ? (
//             <div className="text-center py-16">
//               <ServerIcon className="h-20 w-20 text-blue-500/50 mx-auto mb-6" />
//               <h3 className="text-2xl font-bold text-white mb-3">No VPS types available</h3>
//               <p className="text-slate-400 mb-6 text-lg">
//                 No VPS plans are currently available. Please contact support for assistance.
//               </p>
//               <button
//                 onClick={() => navigate('/contact')}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
//               >
//                 Contact Support
//               </button>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               {vpsTypes.map((type) => (
//                 <button
//                   key={type.id}
//                   onMouseEnter={() => setHoveredType(type.id)}
//                   onMouseLeave={() => setHoveredType(null)}
//                   onClick={() => handleTypeClick(type.id)}
//                   className={`relative group bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border transition-all duration-500 p-10 text-left transform hover:scale-105 shadow-xl ${
//                     selectedType === type.id
//                       ? 'border-blue-500 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-500/50'
//                       : 'border-blue-500/20 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10'
//                   }`}
//                 >
//                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
//                   <div className="relative z-10">
//                     <div className="flex items-start justify-between mb-6">
//                       <div>
//                         <div className={`text-5xl mb-4 transition-all duration-500 ${
//                           hoveredType === type.id ? 'scale-110' : 'scale-100'
//                         }`}>
//                           {type.icon === 'home' ? '🏠' : '🏢'}
//                         </div>
//                         <h3 className="text-2xl font-bold text-white mb-2">{type.name}</h3>
//                         <p className="text-slate-400 text-sm leading-relaxed mb-4">{type.description}</p>
//                       </div>
//                       {type.badge && (
//                         <div>
//                           <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
//                             type.id === 'residential' 
//                               ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
//                               : 'bg-gradient-to-r from-blue-500 to-blue-600'
//                           }`}>
//                             {type.badge}
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     <div className="mb-6 text-blue-300 font-semibold text-lg">{type.pricing}</div>

//                     <div className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
//                       hoveredType === type.id
//                         ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50'
//                         : 'bg-slate-800 text-slate-300 shadow-slate-900/50'
//                     }`}>
//                       Browse Plans
//                       <ArrowRightIcon className={`h-4 w-4 transition-transform duration-300 ${
//                         hoveredType === type.id ? 'translate-x-1' : ''
//                       }`} />
//                     </div>
//                   </div>

//                   {hoveredType === type.id && (
//                     <div className="absolute top-6 right-6 z-20">
//                       <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
//                         Available
//                       </div>
//                     </div>
//                   )}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Why Choose Section */}
//         <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 p-8 md:p-12 shadow-2xl shadow-blue-500/5">
//           <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">
//             Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Our VPS?</span>
//           </h2>
          
//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//             <div className="text-center group">
//               <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
//                 <BoltIcon className="w-10 h-10 text-white" />
//               </div>
//               <h4 className="text-xl font-bold text-white mb-3">Lightning Fast</h4>
//               <p className="text-slate-400 leading-relaxed">Enterprise-grade infrastructure with high performance</p>
//             </div>

//             <div className="text-center group">
//               <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
//                 <ServerIcon className="w-10 h-10 text-white" />
//               </div>
//               <h4 className="text-xl font-bold text-white mb-3">Full Control</h4>
//               <p className="text-slate-400 leading-relaxed">Root access with complete server management</p>
//             </div>

//             <div className="text-center group">
//               <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
//                 <ClockIcon className="w-10 h-10 text-white" />
//               </div>
//               <h4 className="text-xl font-bold text-white mb-3">24/7 Support</h4>
//               <p className="text-slate-400 leading-relaxed">Expert technical support whenever you need it</p>
//             </div>

//             <div className="text-center group">
//               <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
//                 <ShieldCheckIcon className="w-10 h-10 text-white" />
//               </div>
//               <h4 className="text-xl font-bold text-white mb-3">99.9% Uptime</h4>
//               <p className="text-slate-400 leading-relaxed">Reliable performance with guaranteed availability</p>
//             </div>
//           </div>
//         </div>

//         {/* CTA Section */}
//         <div className="text-center mt-16">
//           <div className="inline-block bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/20 p-10 shadow-2xl shadow-blue-500/5">
//             <h2 className="text-3xl font-black text-white mb-4">Need Help Choosing?</h2>
//             <p className="text-slate-400 mb-8 max-w-2xl mx-auto text-lg">
//               Not sure which VPS type or plan is right for you? Our team is ready to help you select the perfect solution.
//             </p>
//             <button 
//               onClick={() => navigate('/contact')}
//               className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
//             >
//               Contact Support
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }