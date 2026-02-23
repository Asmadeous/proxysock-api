// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ComputerDesktopIcon,
//   HomeIcon,
//   BuildingOfficeIcon,
//   ArrowRightIcon,
//   CheckIcon,
//   GlobeAltIcon,
//   ShieldCheckIcon,
//   CpuChipIcon,
//   UsersIcon,
//   ClockIcon,
//   MapPinIcon
// } from "@heroicons/react/24/outline";

//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// );

// interface RDPType {
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
// }

// export default function RDPTypes() {
//   const navigate = useNavigate();
//   const [hoveredType, setHoveredType] = useState<string | null>(null);
//   const [rdpTypes, setRdpTypes] = useState<RDPType[]>([]);
//   const [comparisonFeatures, setComparisonFeatures] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       // Fetch rdp_types or derive from rdp_plans
//         .from('rdp_types')
//         .select('*')
//         .eq('is_active', true);

//       let rdpTypesData: RDPType[] = [];
//       if (typesError) {
//         // Fallback: Derive types from rdp_plans
//           .from('rdp_plans')
//           .select('service_type, price')
//           .eq('is_active', true);

//         if (plansError) throw new Error(`Failed to fetch plans: ${plansError.message}`);

//         const residentialPlans = plansData.filter(p => p.service_type === 'residential');
//         const standardPlans = plansData.filter(p => p.service_type === 'standard');

//         rdpTypesData = [
//           {
//             id: 'residential',
//             name: 'Residential RDP',
//             description: 'RDP with residential IP addresses for authentic browsing and location-based tasks, supporting Windows and Linux OS',
//             pricing: residentialPlans.length > 0
//               ? `Starting from $${Math.min(...residentialPlans.map(p => p.price)).toFixed(2)}/month`
//               : 'Contact support for pricing',
//             badge: 'Most Popular',
//             features: [
//               'Real residential IP addresses',
//               'Authentic geo-location',
//               'High trust score websites',
//               'Windows, Ubuntu, Debian, CentOS, Fedora',
//               'Bypass geo-restrictions',
//               'Social media management',
//               'E-commerce operations',
//               'Market research'
//             ],
//             use_cases: [
//               'Social Media Management',
//               'E-commerce Operations',
//               'Market Research',
//               'Geo-restricted Content',
//               'Ad Verification',
//               'Price Monitoring'
//             ],
//             color: 'from-green-600 to-emerald-600',
//             borderColor: 'border-green-500/30 hover:border-green-500/50',
//             shadowColor: 'hover:shadow-green-500/10',
//             buttonColor: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
//           },
//           {
//             id: 'standard',
//             name: 'Standard RDP',
//             description: 'High-performance datacenter RDP with enterprise-grade infrastructure, supporting Windows and Linux OS',
//             pricing: standardPlans.length > 0
//               ? `Starting from $${Math.min(...standardPlans.map(p => p.price)).toFixed(2)}/month`
//               : 'Contact support for pricing',
//             badge: 'Best Value',
//             features: [
//               'High-speed datacenter IPs',
//               'Enterprise infrastructure',
//               'Windows, Ubuntu, Debian, CentOS, Fedora, Rocky',
//               'Unlimited bandwidth',
//               'Low latency connections',
//               '24/7 uptime monitoring',
//               'DDoS protection',
//               'Full administrator access'
//             ],
//             use_cases: [
//               'Business Applications',
//               'Development & Testing',
//               'Data Processing',
//               'Remote Work',
//               'Server Management',
//               'Automated Tasks'
//             ],
//             color: 'from-blue-600 to-blue-600',
//             borderColor: 'border-blue-500/30 hover:border-blue-500/50',
//             shadowColor: 'hover:shadow-blue-500/10',
//             buttonColor: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
//           }
//         ];
//       } else {
//         rdpTypesData = typesData || [];
//       }

//       // Fetch comparison features
//       const comparisonFeaturesFallback = [
//         { feature: 'IP Type', residential: 'Residential IPs', standard: 'Datacenter IPs', icon: 'GlobeAltIcon' },
//         { feature: 'Speed', residential: 'Good (20-100 Mbps)', standard: 'Excellent (100+ Mbps)', icon: 'CpuChipIcon' },
//         { feature: 'Trust Score', residential: 'Very High', standard: 'High', icon: 'ShieldCheckIcon' },
//         { feature: 'Concurrent Users', residential: '1-5 Users', standard: '1-10 Users', icon: 'UsersIcon' },
//         { feature: 'Session Duration', residential: 'Unlimited', standard: 'Unlimited', icon: 'ClockIcon' },
//         { feature: 'Operating Systems', residential: 'Windows, Ubuntu, Debian, CentOS, Fedora', standard: 'Windows, Ubuntu, Debian, CentOS, Fedora, Rocky', icon: 'ComputerDesktopIcon' }
//       ];

//         .from('system_config')
//         .select('rdp_comparison_features')
//         .eq('config_key', 'rdp_settings')
//         .single();

//       if (configError) {
//         console.warn(`Config fetch failed: ${configError.message}. Using fallback data.`);
//           component: 'rdp-types',
//           action: 'fetch_config',
//           level: 'warning',
//           message: `Failed to fetch system_config: ${configError.message}. Using fallback data.`,
//           created_at: new Date().toISOString(),
//         });
//       }

//       setRdpTypes(rdpTypesData);
//       setComparisonFeatures(configData?.rdp_comparison_features || comparisonFeaturesFallback);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//         component: 'rdp-types',
//         action: 'fetch_data',
//         level: 'error',
//         message: err instanceof Error ? err.message : 'Unknown error fetching data',
//         created_at: new Date().toISOString(),
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getIconComponent = (iconName: string) => {
//     const icons: { [key: string]: any } = {
//       GlobeAltIcon,
//       CpuChipIcon,
//       ShieldCheckIcon,
//       UsersIcon,
//       ClockIcon,
//       MapPinIcon,
//       HomeIcon,
//       BuildingOfficeIcon,
//       ComputerDesktopIcon
//     };
//     return icons[iconName] || GlobeAltIcon;
//   };

//   const handleNavigate = (type: string) => {
//     navigate(`/dashboard/rdp-plans/${type}`);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-slate-400">Loading RDP types...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-center bg-red-900/20 border border-red-700 rounded-xl p-6">
//           <p className="text-red-400 mb-2">Error loading RDP types</p>
//           <p className="text-slate-400 text-sm">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//       <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 px-4 py-8">
//         <div className="max-w-7xl mx-auto text-center">
//           <div className="flex items-center justify-center gap-3 mb-4">
//             <ComputerDesktopIcon className="h-10 w-10 text-blue-500" />
//             <h1 className="text-4xl md:text-5xl font-bold text-white">Choose Your RDP Type</h1>
//           </div>
//           <p className="text-xl text-slate-300 max-w-3xl mx-auto">
//             Select between residential RDP with authentic IPs or standard RDP with high-performance datacenter infrastructure, both with Windows and Linux support
//           </p>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
//           {rdpTypes.map((type) => {
//             const IconComponent = getIconComponent(type.id === 'residential' ? 'HomeIcon' : 'BuildingOfficeIcon');
//             return (
//               <div
//                 key={type.id}
//                 onMouseEnter={() => setHoveredType(type.id)}
//                 onMouseLeave={() => setHoveredType(null)}
//                 className={`relative bg-slate-800 rounded-2xl border transition-all duration-300 overflow-hidden ${type.borderColor} ${type.shadowColor} hover:shadow-2xl transform hover:scale-[1.02]`}
//               >
//                 {type.badge && (
//                   <div className="absolute top-4 right-4 z-10">
//                     <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
//                       type.id === 'residential'
//                         ? 'bg-gradient-to-r from-green-500 to-emerald-500'
//                         : 'bg-gradient-to-r from-blue-500 to-blue-600'
//                     }`}>
//                       {type.badge}
//                     </span>
//                   </div>
//                 )}

//                 <div className="p-8 border-b border-slate-700">
//                   <div className="flex items-center gap-4 mb-4">
//                     <div className={`p-3 rounded-xl bg-gradient-to-r ${type.color} bg-opacity-10`}>
//                       <IconComponent className={`h-8 w-8 ${
//                         type.id === 'residential' ? 'text-green-500' : 'text-blue-500'
//                       }`} />
//                     </div>
//                     <div>
//                       <h2 className="text-2xl font-bold text-white">{type.name}</h2>
//                       <p className="text-slate-400 font-semibold">{type.pricing}</p>
//                     </div>
//                   </div>
//                   <p className="text-slate-300 leading-relaxed">{type.description}</p>
//                 </div>

//                 <div className="p-8">
//                   <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
//                     {type.features.map((feature, i) => (
//                       <div key={i} className="flex items-center gap-2">
//                         <CheckIcon className={`h-4 w-4 flex-shrink-0 ${
//                           type.id === 'residential' ? 'text-green-400' : 'text-blue-400'
//                         }`} />
//                         <span className="text-slate-300 text-sm">{feature}</span>
//                       </div>
//                     ))}
//                   </div>

//                   <h4 className="text-md font-semibold text-white mb-3">Perfect For</h4>
//                   <div className="flex flex-wrap gap-2 mb-6">
//                     {type.use_cases.map((useCase, i) => (
//                       <span
//                         key={i}
//                         className={`px-3 py-1 rounded-full text-xs font-medium ${
//                           type.id === 'residential'
//                             ? 'bg-green-500/10 text-green-300 border border-green-500/20'
//                             : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
//                         }`}
//                       >
//                         {useCase}
//                       </span>
//                     ))}
//                   </div>

//                   <button
//                     onClick={() => handleNavigate(type.id)}
//                     className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 ${type.buttonColor}`}
//                   >
//                     Browse {type.name} Plans
//                     <ArrowRightIcon className={`h-5 w-5 transition-transform ${
//                       hoveredType === type.id ? 'translate-x-1' : ''
//                     }`} />
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
//           <div className="p-6 border-b border-slate-700">
//             <h2 className="text-2xl font-bold text-white mb-2">Feature Comparison</h2>
//             <p className="text-slate-400">Compare the key differences between our RDP types</p>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-700/50">
//                 <tr>
//                   <th className="text-left py-4 px-6 text-slate-300 font-semibold">Feature</th>
//                   <th className="text-center py-4 px-6 text-green-300 font-semibold">Residential RDP</th>
//                   <th className="text-center py-4 px-6 text-blue-300 font-semibold">Standard RDP</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-700">
//                 {comparisonFeatures.map((item, index) => {
//                   const IconComponent = getIconComponent(item.icon);
//                   return (
//                     <tr key={index} className="hover:bg-slate-700/30 transition-colors">
//                       <td className="py-4 px-6">
//                         <div className="flex items-center gap-3">
//                           <IconComponent className="h-5 w-5 text-slate-400" />
//                           <span className="text-white font-medium">{item.feature}</span>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6 text-center text-slate-300">{item.residential}</td>
//                       <td className="py-4 px-6 text-center text-slate-300">{item.standard}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div className="mt-12 bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
//           <h2 className="text-2xl font-bold text-white text-center mb-8">Why Choose Our RDP Services?</h2>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <div className="text-center">
//               <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                 </svg>
//               </div>
//               <h4 className="text-lg font-semibold text-white mb-2">Instant Setup</h4>
//               <p className="text-slate-400 text-sm">Get your RDP server ready in minutes, not hours</p>
//             </div>

//             <div className="text-center">
//               <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <ShieldCheckIcon className="w-8 h-8 text-white" />
//               </div>
//               <h4 className="text-lg font-semibold text-white mb-2">Enterprise Security</h4>
//               <p className="text-slate-400 text-sm">Bank-grade encryption and security protocols</p>
//             </div>

//             <div className="text-center">
//               <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
//                 </svg>
//               </div>
//               <h4 className="text-lg font-semibold text-white mb-2">24/7 Support</h4>
//               <p className="text-slate-400 text-sm">Expert technical support whenever you need it</p>
//             </div>

//             <div className="text-center">
//               <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                 </svg>
//               </div>
//               <h4 className="text-lg font-semibold text-white mb-2">99.9% Uptime</h4>
//               <p className="text-slate-400 text-sm">Reliable performance with guaranteed availability</p>
//             </div>
//           </div>
//         </div>

//         <div className="text-center mt-12">
//           <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
//           <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
//             Not sure which RDP type is right for you? Our team can help you select the perfect solution based on your specific needs.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               onClick={() => navigate('/contact')}
//               className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//             >
//               Contact Support
//             </button>
//             <button
//               onClick={() => navigate('/dashboard/rdp-plans')}
//               className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all"
//             >
//               View All Plans
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
