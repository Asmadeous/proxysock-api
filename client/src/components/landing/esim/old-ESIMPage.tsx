// // ESIMPage.jsx - Dedicated landing page for eSIM services
// // Product is now LIVE - all links point to /dashboard/esim-packages

// import { Link } from "react-router-dom"
// import {
//   DevicePhoneMobileIcon,
//   GlobeAltIcon,
//   CheckIcon,
//   ArrowRightIcon,
//   BoltIcon,
//   WifiIcon,
//   MapPinIcon,
//   SignalIcon,
// } from "@heroicons/react/24/outline"
// import heroBg from "../assets/images/hero-bg.webp"
// import { motion } from "framer-motion"
// import Navbar from "../components/Navbar"
// import { useAuth } from "../context/AuthContext"

// export default function ESIMPage() {
//   const {  isLoading } = useAuth()
//   // const navigate = useNavigate()

//   // useEffect(() => {
//   //   // Meta tags for eSIM page
//   //   document.title = "International eSIM Cards - Global Mobile Data | ProxySock"

//   //   // Add conversion tracking
//   //   if (window.gtag) {
//   //     window.gtag('config', 'AW-XXXXXXXXX')
//   //   }

//   //   if (window.fbq) {
//   //     window.fbq('track', 'PageView')
//   //     window.fbq('track', 'ViewContent', {
//   //       content_name: 'eSIM Services',
//   //       content_category: 'eSIM',
//   //     })
//   //   }
//   // }, [])

//   // const handlePurchaseClick = () => {
//   //   navigate('/dashboard/esim-packages')
//   // }

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
//       <Navbar />

//       {/* Hero Section - Optimized for eSIM */}
//       <div className="relative min-h-[600px] flex items-center justify-center">
//         <div
//           className="absolute inset-0 z-0"
//           style={{
//             backgroundImage: `url(${heroBg})`,
//             backgroundSize: "cover",
//             backgroundPosition: "center",
//             backgroundRepeat: "no-repeat",
//           }}
//         >
//           <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/40 backdrop-blur-[1px]"></div>
//         </div>

//         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
//           <div className="text-center">
//             {/* Trust Badges */}
//             <div className="flex justify-center gap-4 mb-6">
//               <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
//                 200+ Countries
//               </span>
//               <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
//                 5G/4G LTE
//               </span>
//               <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
//                 Instant Activation
//               </span>
//             </div>

//             <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
//               International eSIM Cards
//               <span className="block text-red-500 mt-2">Global Connectivity Anywhere</span>
//             </h1>
//             <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
//               Stay connected worldwide with our digital eSIM cards. No physical SIM needed,
//               instant activation via QR code, and coverage in 200+ countries.
//             </p>

//             <div className="mt-10">
//               <Link
//                 to="/dashboard/esim"
//                 className="px-8 py-3 text-lg bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 inline-flex items-center font-medium shadow-lg hover:shadow-red-600/20"
//               >
//                 Get Your eSIM Now
//                 <ArrowRightIcon className="h-5 w-5 ml-2" />
//               </Link>
//               <p className="mt-4 text-gray-400 text-sm">
//                 Instant delivery • No roaming fees • Cancel anytime
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
//       </div>

//       {/* eSIM Plans Section */}
//       <div className="bg-gray-800/50 py-20 relative overflow-hidden">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Global & Regional eSIM Plans</h2>
//             <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
//               Choose from our flexible data plans for travelers and digital nomads
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {/* Global eSIM */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//             >
//               <div className="flex items-center mb-4">
//                 <GlobeAltIcon className="h-8 w-8 text-purple-500 mr-3" />
//                 <h3 className="text-xl font-bold text-white">Global eSIM</h3>
//               </div>
//               <div className="mb-2">
//                 <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded">MOST POPULAR</span>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Works in 200+ countries worldwide. Perfect for world travelers.
//               </p>
//               <div className="space-y-2 mb-4">
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">1GB: <span className="text-red-500 font-bold">$9.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 7 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">3GB: <span className="text-red-500 font-bold">$24.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 15 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">5GB: <span className="text-red-500 font-bold">$39.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">10GB: <span className="text-red-500 font-bold">$69.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//               </div>
//               <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                 <li>✓ 200+ countries coverage</li>
//                 <li>✓ 5G/4G LTE speeds</li>
//                 <li>✓ Instant QR activation</li>
//                 <li>✓ Keep your number</li>
//               </ul>
//               <Link
//                 to="/dashboard/esim-packages"
//                 className="w-full block text-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
//               >
//                 Buy Now
//               </Link>
//             </motion.div>

//             {/* Europe eSIM */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.1 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//             >
//               <div className="flex items-center mb-4">
//                 <MapPinIcon className="h-8 w-8 text-blue-500 mr-3" />
//                 <h3 className="text-xl font-bold text-white">Europe eSIM</h3>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Coverage in 40+ European countries including UK, France, Germany, Italy.
//               </p>
//               <div className="space-y-2 mb-4">
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">1GB: <span className="text-red-500 font-bold">$6.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 7 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">3GB: <span className="text-red-500 font-bold">$15.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 15 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">5GB: <span className="text-red-500 font-bold">$24.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">10GB: <span className="text-red-500 font-bold">$39.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//               </div>
//               <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                 <li>✓ 40+ European countries</li>
//                 <li>✓ EU roaming included</li>
//                 <li>✓ High-speed data</li>
//                 <li>✓ No fair use policy</li>
//               </ul>
//               <Link
//                 to="/dashboard/esim-packages"
//                 className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
//               >
//                 Buy Now
//               </Link>
//             </motion.div>

//             {/* USA eSIM */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//             >
//               <div className="flex items-center mb-4">
//                 <SignalIcon className="h-8 w-8 text-red-500 mr-3" />
//                 <h3 className="text-xl font-bold text-white">USA eSIM</h3>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Nationwide coverage across the United States with T-Mobile network.
//               </p>
//               <div className="space-y-2 mb-4">
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">1GB: <span className="text-red-500 font-bold">$8.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 7 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">3GB: <span className="text-red-500 font-bold">$19.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 15 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">5GB: <span className="text-red-500 font-bold">$29.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">Unlimited: <span className="text-red-500 font-bold">$49.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//               </div>
//               <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                 <li>✓ T-Mobile 5G network</li>
//                 <li>✓ Nationwide coverage</li>
//                 <li>✓ Hotspot included</li>
//                 <li>✓ Mexico & Canada roaming</li>
//               </ul>
//               <Link
//                 to="/dashboard/esim-packages"
//                 className="w-full block text-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
//               >
//                 Buy Now
//               </Link>
//             </motion.div>

//             {/* Asia eSIM */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.3 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//             >
//               <div className="flex items-center mb-4">
//                 <GlobeAltIcon className="h-8 w-8 text-green-500 mr-3" />
//                 <h3 className="text-xl font-bold text-white">Asia Pacific</h3>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Coverage in 30+ Asian countries including Japan, Singapore, Thailand.
//               </p>
//               <div className="space-y-2 mb-4">
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">1GB: <span className="text-red-500 font-bold">$7.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 7 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">3GB: <span className="text-red-500 font-bold">$18.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 15 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">5GB: <span className="text-red-500 font-bold">$27.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">10GB: <span className="text-red-500 font-bold">$44.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//               </div>
//               <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                 <li>✓ 30+ Asian countries</li>
//                 <li>✓ China coverage included</li>
//                 <li>✓ 4G LTE speeds</li>
//                 <li>✓ Popular in Japan & Korea</li>
//               </ul>
//               <Link
//                 to="/dashboard/esim-packages"
//                 className="w-full block text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
//               >
//                 Buy Now
//               </Link>
//             </motion.div>

//             {/* Latin America eSIM */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.4 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//             >
//               <div className="flex items-center mb-4">
//                 <MapPinIcon className="h-8 w-8 text-yellow-500 mr-3" />
//                 <h3 className="text-xl font-bold text-white">Latin America</h3>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Coverage in Mexico, Brazil, Argentina, Chile, and more.
//               </p>
//               <div className="space-y-2 mb-4">
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">1GB: <span className="text-red-500 font-bold">$9.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 7 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">3GB: <span className="text-red-500 font-bold">$22.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 15 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">5GB: <span className="text-red-500 font-bold">$34.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">10GB: <span className="text-red-500 font-bold">$54.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//               </div>
//               <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                 <li>✓ 20+ Latin countries</li>
//                 <li>✓ Major cities covered</li>
//                 <li>✓ 4G LTE speeds</li>
//                 <li>✓ WhatsApp unlimited</li>
//               </ul>
//               <Link
//                 to="/dashboard/esim-packages"
//                 className="w-full block text-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
//               >
//                 Buy Now
//               </Link>
//             </motion.div>

//             {/* Middle East & Africa eSIM */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.5 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//             >
//               <div className="flex items-center mb-4">
//                 <GlobeAltIcon className="h-8 w-8 text-orange-500 mr-3" />
//                 <h3 className="text-xl font-bold text-white">Middle East & Africa</h3>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Coverage in UAE, Saudi Arabia, Egypt, South Africa, Kenya.
//               </p>
//               <div className="space-y-2 mb-4">
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">1GB: <span className="text-red-500 font-bold">$11.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 7 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">3GB: <span className="text-red-500 font-bold">$28.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 15 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">5GB: <span className="text-red-500 font-bold">$42.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//                 <div className="bg-gray-800/50 p-2 rounded">
//                   <p className="text-sm text-gray-300">10GB: <span className="text-red-500 font-bold">$64.99</span></p>
//                   <p className="text-xs text-gray-400">Valid for 30 days</p>
//                 </div>
//               </div>
//               <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                 <li>✓ Gulf countries included</li>
//                 <li>✓ Major African cities</li>
//                 <li>✓ 4G coverage</li>
//                 <li>✓ Business travel ready</li>
//               </ul>
//               <Link
//                 to="/dashboard/esim-packages"
//                 className="w-full block text-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
//               >
//                 Buy Now
//               </Link>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* How It Works Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">How eSIM Works</h2>
//             <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
//               Get connected in 3 simple steps
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5 }}
//               className="text-center"
//             >
//               <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
//                 <span className="text-2xl font-bold text-red-500">1</span>
//               </div>
//               <h3 className="text-xl font-bold text-white mb-3">Choose Your Plan</h3>
//               <p className="text-gray-300">
//                 Select the destination and data package that fits your travel needs.
//               </p>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.1 }}
//               className="text-center"
//             >
//               <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
//                 <span className="text-2xl font-bold text-red-500">2</span>
//               </div>
//               <h3 className="text-xl font-bold text-white mb-3">Scan QR Code</h3>
//               <p className="text-gray-300">
//                 Receive your eSIM QR code instantly via email and scan it with your phone.
//               </p>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//               className="text-center"
//             >
//               <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
//                 <span className="text-2xl font-bold text-red-500">3</span>
//               </div>
//               <h3 className="text-xl font-bold text-white mb-3">Start Using Data</h3>
//               <p className="text-gray-300">
//                 Your eSIM activates automatically. Start using data immediately upon arrival.
//               </p>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* Compatible Devices */}
//       <div className="bg-gray-800 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Compatible Devices</h2>
//             <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
//               Check if your device supports eSIM technology
//             </p>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//             {[
//               { brand: "Apple", models: ["iPhone 15/14/13/12", "iPhone 11/XS/XR", "iPad Pro/Air", "Apple Watch"] },
//               { brand: "Samsung", models: ["Galaxy S24/S23/S22", "Galaxy Z Fold/Flip", "Galaxy Note 20", "Galaxy Watch"] },
//               { brand: "Google", models: ["Pixel 8/7/6", "Pixel 5/4/3", "Pixel Fold", "Pixel Watch"] },
//               { brand: "Others", models: ["Huawei P40/P50", "Oppo Find X3/X5", "Motorola Razr", "Surface Duo"] },
//             ].map((device, index) => (
//               <div key={index} className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-4 border border-gray-800">
//                 <h3 className="text-lg font-bold text-white mb-3">{device.brand}</h3>
//                 <ul className="text-xs text-gray-400 space-y-1">
//                   {device.models.map((model, i) => (
//                     <li key={i}>✓ {model}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Benefits Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Why Choose Our eSIM</h2>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//             {[
//               { title: "No Physical SIM", icon: DevicePhoneMobileIcon, description: "100% digital" },
//               { title: "Instant Delivery", icon: BoltIcon, description: "Get QR code in seconds" },
//               { title: "Keep Your Number", icon: WifiIcon, description: "Use both SIMs" },
//               { title: "Global Coverage", icon: GlobeAltIcon, description: "200+ countries" },
//             ].map((feature, index) => (
//               <div key={index} className="text-center">
//                 <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-lg mb-3">
//                   <feature.icon className="h-6 w-6 text-red-500" />
//                 </div>
//                 <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
//                 <p className="text-gray-400 text-sm">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Business eSIM Section */}
//       <div className="bg-gray-800 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Business eSIM Solutions</h2>
//             <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
//               Enterprise solutions for companies with traveling employees
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-8 border border-gray-800"
//             >
//               <h3 className="text-xl font-bold text-white mb-3">Bulk Purchases</h3>
//               <p className="text-gray-300 mb-4">
//                 Buy eSIMs in bulk for your entire team with volume discounts.
//               </p>
//               <ul className="space-y-2 text-sm text-gray-300">
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   10+ eSIMs: 10% discount
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   50+ eSIMs: 20% discount
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   100+ eSIMs: 30% discount
//                 </li>
//               </ul>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.1 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-8 border border-gray-800"
//             >
//               <h3 className="text-xl font-bold text-white mb-3">Centralized Management</h3>
//               <p className="text-gray-300 mb-4">
//                 Manage all your company eSIMs from a single dashboard.
//               </p>
//               <ul className="space-y-2 text-sm text-gray-300">
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   Track usage in real-time
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   Set data limits per user
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   Instant top-ups available
//                 </li>
//               </ul>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//               className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-8 border border-gray-800"
//             >
//               <h3 className="text-xl font-bold text-white mb-3">Priority Support</h3>
//               <p className="text-gray-300 mb-4">
//                 Get dedicated support for your business account.
//               </p>
//               <ul className="space-y-2 text-sm text-gray-300">
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   Dedicated account manager
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   24/7 priority support
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
//                   Custom data packages
//                 </li>
//               </ul>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* FAQ Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//           <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
//             eSIM Frequently Asked Questions
//           </h2>

//           <div className="space-y-6">
//             {[
//               {
//                 q: "What is an eSIM?",
//                 a: "An eSIM is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It's built into newer smartphones and can store multiple profiles."
//               },
//               {
//                 q: "How do I know if my phone supports eSIM?",
//                 a: "Most phones from 2018 onwards support eSIM. Check Settings > Cellular/Mobile Data for 'Add eSIM' option, or dial *#06# to see if you have an EID number."
//               },
//               {
//                 q: "Can I use eSIM and physical SIM at the same time?",
//                 a: "Yes! Most eSIM-compatible phones support dual SIM functionality, allowing you to use your regular SIM for calls/texts and eSIM for data."
//               },
//               {
//                 q: "When should I activate my eSIM?",
//                 a: "You can install the eSIM anytime after purchase, but we recommend activating it just before or upon arrival at your destination to maximize validity period."
//               },
//               {
//                 q: "What happens if I run out of data?",
//                 a: "You can easily top up your eSIM through our app or website. Simply purchase additional data and it will be added to your existing eSIM."
//               },
//             ].map((faq, index) => (
//               <div key={index} className="bg-gray-800/50 rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
//                 <p className="text-gray-300">{faq.a}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Final CTA */}
//       <div className="bg-gradient-to-r from-purple-600 to-purple-700 py-16">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <h2 className="text-3xl font-bold text-white mb-4">
//             Ready to Stay Connected Worldwide?
//           </h2>
//           <p className="text-xl text-white/90 mb-8">
//             Get instant access to our global eSIM network
//           </p>
//           <Link
//             to="/dashboard/esim-packages"
//             className="inline-flex items-center px-8 py-3 bg-white text-purple-600 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium text-lg"
//           >
//             Browse eSIM Plans
//             <ArrowRightIcon className="h-5 w-5 ml-2" />
//           </Link>
//           <p className="mt-4 text-white/80 text-sm">
//             No contracts • Instant activation • 24/7 support
//           </p>
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="bg-gray-900 border-t border-gray-800">
//         <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8">
//           <div className="text-center">
//             <p className="text-gray-400 text-sm">© {new Date().getFullYear()} ProxySock. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  MessageSquare,
  Wifi,
  ArrowRight,
  Globe,
  Zap,
  MapPin,
  Signal,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const usaPlans = [
  {
    id: "colt-usa-1",
    provider: "colt",
    name: "Colt USA Premium",
    price: 2999,
    currency_code: "USD",
    voice_minutes: "Unlimited",
    sms_included: true,
    data_amount: "10 GB",
    duration: 30,
    duration_unit: "days",
    features: [
      "US Phone Number Included",
      "Unlimited Voice Calls",
      "Unlimited SMS & MMS",
      "10 GB High-Speed Data",
      "4G/5G Network Access",
      "Instant Activation",
    ],
    phone_number_included: true,
  },
  {
    id: "lyca-usa-1",
    provider: "lyca",
    name: "Lyca USA Essential",
    price: 2999,
    currency_code: "USD",
    voice_minutes: "Unlimited",
    sms_included: true,
    data_amount: "8 GB",
    duration: 30,
    duration_unit: "days",
    features: [
      "US Phone Number Included",
      "Unlimited Voice Calls",
      "Unlimited SMS & MMS",
      "8 GB High-Speed Data",
      "4G/5G Network Access",
      "No Contract Required",
    ],
    phone_number_included: true,
  },
];

const globalPlans = [
  {
    id: "global-1",
    name: "Global Starter",
    region: "Global",
    price: 999,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "green",
  },
  {
    id: "global-2",
    name: "Global Traveler",
    region: "Global",
    price: 2499,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "green",
  },
  {
    id: "global-3",
    name: "Global Explorer",
    region: "Global",
    price: 3999,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "green",
  },
  {
    id: "global-4",
    name: "Global Pro",
    region: "Global",
    price: 6999,
    data_amount: "10GB",
    duration: 30,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "green",
  },
  {
    id: "europe-1",
    name: "Europe Essential",
    region: "Europe",
    price: 699,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "green",
  },
  {
    id: "europe-2",
    name: "Europe Plus",
    region: "Europe",
    price: 1599,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "green",
  },
  {
    id: "europe-3",
    name: "Europe Pro",
    region: "Europe",
    price: 2499,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "green",
  },
  {
    id: "europe-4",
    name: "Europe Unlimited",
    region: "Europe",
    price: 3999,
    data_amount: "10GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "green",
  },
  {
    id: "usa-data-1",
    name: "USA Starter",
    region: "USA Data",
    price: 899,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "green",
  },
  {
    id: "usa-data-2",
    name: "USA Plus",
    region: "USA Data",
    price: 1999,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "green",
  },
  {
    id: "usa-data-3",
    name: "USA Pro",
    region: "USA Data",
    price: 2999,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "green",
  },
  {
    id: "usa-data-4",
    name: "USA Unlimited",
    region: "USA Data",
    price: 4999,
    data_amount: "Unlimited",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "green",
  },
  {
    id: "asia-1",
    name: "Asia Starter",
    region: "Asia Pacific",
    price: 799,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage:
      "Coverage in 30+ Asian countries including Japan, Singapore, Thailand.",
    icon: Globe,
    color: "green",
  },
  {
    id: "asia-2",
    name: "Asia Explorer",
    region: "Asia Pacific",
    price: 1899,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage:
      "Coverage in 30+ Asian countries including Japan, Singapore, Thailand.",
    icon: Globe,
    color: "green",
  },
  {
    id: "asia-3",
    name: "Asia Pro",
    region: "Asia Pacific",
    price: 2799,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Coverage in 30+ Asian countries including Japan, Singapore, Thailand.",
    icon: Globe,
    color: "green",
  },
  {
    id: "asia-4",
    name: "Asia Ultimate",
    region: "Asia Pacific",
    price: 4499,
    data_amount: "10GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Coverage in 30+ Asian countries including Japan, Singapore, Thailand.",
    icon: Globe,
    color: "green",
  },
  {
    id: "latam-1",
    name: "Latin America",
    region: "Latin America",
    price: 999,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage: "Coverage in Mexico, Brazil, Argentina, Chile, and more.",
    icon: MapPin,
    color: "green",
  },
  {
    id: "latam-2",
    name: "Latin America Plus",
    region: "Latin America",
    price: 2299,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage: "Coverage in Mexico, Brazil, Argentina, Chile, and more.",
    icon: MapPin,
    color: "green",
  },
  {
    id: "mea-1",
    name: "Middle East & Africa",
    region: "Middle East & Africa",
    price: 1199,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage: "Coverage in UAE, Saudi Arabia, Egypt, South Africa, Kenya.",
    icon: Globe,
    color: "green",
  },
  {
    id: "mea-2",
    name: "MEA Plus",
    region: "Middle East & Africa",
    price: 2899,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage: "Coverage in UAE, Saudi Arabia, Egypt, South Africa, Kenya.",
    icon: Globe,
    color: "green",
  },
];

const getCarrierLogo = (provider: string) => {
  if (provider.toLowerCase() === "lyca") return "/at&t.png";
  if (provider.toLowerCase() === "colt") return "/t-mobile.png";
  return "";
};

export default function ESIMPage() {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("usa");

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-b from-green-900/20 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <div className="flex justify-center gap-4 mb-6">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                200+ Countries
              </span>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                5G/4G LTE
              </span>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                Instant Activation
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
              International eSIM Cards
              <span className="block text-green-500 mt-2">
                Global Connectivity Anywhere
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Stay connected worldwide with our digital eSIM cards. No physical
              SIM needed, instant activation via QR code, and coverage in 200+
              countries.
            </p>

            <div className="mt-10">
              <Link
                to="/dashboard/esim"
                className="px-8 py-3 text-lg bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 inline-flex items-center font-medium shadow-lg hover:shadow-green-600/20"
              >
                Get Your eSIM Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <p className="mt-4 text-gray-400 text-sm">
                Instant delivery • No roaming fees • Cancel anytime
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab("usa")}
              className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${
                activeTab === "usa"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700"
              }`}
            >
              <Phone className="h-5 w-5" />
              USA eSIM
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                Voice + Data
              </span>
            </button>

            <button
              onClick={() => setActiveTab("global")}
              className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${
                activeTab === "global"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700"
              }`}
            >
              <Globe className="h-5 w-5" />
              Global eSIM
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                Data Only
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* USA eSIM Plans Section */}
      {activeTab === "usa" && (
        <div className="bg-gray-800/50 py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                USA eSIM with Phone Number
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
                Complete mobile service with voice calling, unlimited texting,
                and high-speed data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {usaPlans.map((plan) => {
                const carrierLogo = getCarrierLogo(plan.provider);

                return (
                  <div
                    key={plan.id}
                    className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-8 w-8 text-green-500" />
                        <h3 className="text-xl font-bold text-white">
                          {plan.name}
                        </h3>
                      </div>
                      {carrierLogo && (
                        <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                          <span className="text-xs text-gray-400 font-semibold uppercase">
                            Sponsored by
                          </span>
                          <img
                            src={carrierLogo}
                            alt="Carrier"
                            className="h-5 w-auto"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded uppercase">
                        {plan.provider}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                      Real US phone number with voice, text, and data
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="bg-gray-800/50 p-2 rounded">
                        <p className="text-sm text-gray-300">
                          <span className="text-green-500 font-bold">
                            {formatPrice(plan.price)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Valid for {plan.duration} {plan.duration_unit}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-gray-800/50 p-3 rounded text-center">
                        <Phone className="h-5 w-5 text-green-400 mx-auto mb-1" />
                        <span className="text-white font-bold text-xs block">
                          {plan.voice_minutes}
                        </span>
                        <span className="text-xs text-gray-400">Voice</span>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded text-center">
                        <MessageSquare className="h-5 w-5 text-green-400 mx-auto mb-1" />
                        <span className="text-white font-bold text-xs block">
                          Unlimited
                        </span>
                        <span className="text-xs text-gray-400">SMS</span>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded text-center">
                        <Wifi className="h-5 w-5 text-green-400 mx-auto mb-1" />
                        <span className="text-white font-bold text-xs block">
                          {plan.data_amount}
                        </span>
                        <span className="text-xs text-gray-400">Data</span>
                      </div>
                    </div>

                    <ul className="text-xs text-gray-400 space-y-1 mb-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>✓ {feature}</li>
                      ))}
                    </ul>

                    <Link
                      to="/dashboard/esim"
                      className="w-full block text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Buy Now
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global eSIM Plans Section */}
      {activeTab === "global" && (
        <div className="bg-gray-800/50 py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Global & Regional eSIM Plans
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
                Choose from our flexible data plans for travelers and digital
                nomads
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {globalPlans.map((plan) => {
                const IconComponent = plan.icon;

                return (
                  <div
                    key={plan.id}
                    className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800 hover:border-green-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <IconComponent
                        className={`h-8 w-8 text-${plan.color}-500 mr-3`}
                      />
                      <h3 className="text-xl font-bold text-white">
                        {plan.name}
                      </h3>
                    </div>
                    {plan.region === "Global" && (
                      <div className="mb-2">
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    <p className="text-gray-400 text-sm mb-4">
                      {plan.coverage}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="bg-gray-800/50 p-2 rounded">
                        <p className="text-sm text-gray-300">
                          {plan.data_amount}:{" "}
                          <span className="text-green-500 font-bold">
                            {formatPrice(plan.price)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Valid for {plan.duration} {plan.duration_unit}
                        </p>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-400 space-y-1 mb-4">
                      <li>
                        ✓{" "}
                        {plan.region === "Global"
                          ? "200+ countries coverage"
                          : plan.region === "Europe"
                          ? "40+ European countries"
                          : plan.region === "USA Data"
                          ? "T-Mobile 5G network"
                          : plan.region === "Asia Pacific"
                          ? "30+ Asian countries"
                          : plan.region === "Latin America"
                          ? "20+ Latin countries"
                          : "Gulf countries included"}
                      </li>
                      <li>✓ 5G/4G LTE speeds</li>
                      <li>✓ Instant QR activation</li>
                      <li>✓ Keep your number</li>
                    </ul>
                    <Link
                      to="/dashboard/esim"
                      className={`w-full block text-center px-4 py-2 bg-${plan.color}-600 text-white rounded-md hover:bg-${plan.color}-700 transition-colors text-sm`}
                    >
                      Buy Now
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              How eSIM Works
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              Get connected in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <span className="text-2xl font-bold text-green-500">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Choose Your Plan
              </h3>
              <p className="text-gray-300">
                Select the destination and data package that fits your travel
                needs.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <span className="text-2xl font-bold text-green-500">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Scan QR Code
              </h3>
              <p className="text-gray-300">
                Receive your eSIM QR code instantly via email and scan it with
                your phone.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <span className="text-2xl font-bold text-green-500">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Start Using Data
              </h3>
              <p className="text-gray-300">
                Your eSIM activates automatically. Start using data immediately
                upon arrival.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compatible Devices */}
      <div className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Compatible Devices
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              Check if your device supports eSIM technology
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                brand: "Apple",
                models: [
                  "iPhone 15/14/13/12",
                  "iPhone 11/XS/XR",
                  "iPad Pro/Air",
                  "Apple Watch",
                ],
              },
              {
                brand: "Samsung",
                models: [
                  "Galaxy S24/S23/S22",
                  "Galaxy Z Fold/Flip",
                  "Galaxy Note 20",
                  "Galaxy Watch",
                ],
              },
              {
                brand: "Google",
                models: [
                  "Pixel 8/7/6",
                  "Pixel 5/4/3",
                  "Pixel Fold",
                  "Pixel Watch",
                ],
              },
              {
                brand: "Others",
                models: [
                  "Huawei P40/P50",
                  "Oppo Find X3/X5",
                  "Motorola Razr",
                  "Surface Duo",
                ],
              },
            ].map((device, index) => (
              <div
                key={index}
                className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-4 border border-gray-800"
              >
                <h3 className="text-lg font-bold text-white mb-3">
                  {device.brand}
                </h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  {device.models.map((model, i) => (
                    <li key={i}>✓ {model}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Why Choose Our eSIM
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: "No Physical SIM",
                icon: Smartphone,
                description: "100% digital",
              },
              {
                title: "Instant Delivery",
                icon: Zap,
                description: "Get QR code in seconds",
              },
              {
                title: "Keep Your Number",
                icon: Wifi,
                description: "Use both SIMs",
              },
              {
                title: "Global Coverage",
                icon: Globe,
                description: "200+ countries",
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-3">
                    <IconComponent className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
            eSIM Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "What is an eSIM?",
                a: "An eSIM is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It's built into newer smartphones and can store multiple profiles.",
              },
              {
                q: "How do I know if my phone supports eSIM?",
                a: "Most phones from 2018 onwards support eSIM. Check Settings > Cellular/Mobile Data for 'Add eSIM' option, or dial *#06# to see if you have an EID number.",
              },
              {
                q: "Can I use eSIM and physical SIM at the same time?",
                a: "Yes! Most eSIM-compatible phones support dual SIM functionality, allowing you to use your regular SIM for calls/texts and eSIM for data.",
              },
              {
                q: "When should I activate my eSIM?",
                a: "You can install the eSIM anytime after purchase, but we recommend activating it just before or upon arrival at your destination to maximize validity period.",
              },
              {
                q: "What happens if I run out of data?",
                a: "You can easily top up your eSIM through our app or website. Simply purchase additional data and it will be added to your existing eSIM.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-lg p-6 border border-green-500/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-slate-300 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Stay Connected Worldwide?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get instant access to our global eSIM network
          </p>
          <Link
            to="/dashboard/esim"
            className="inline-flex items-center px-8 py-3 bg-white text-green-600 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium text-lg"
          >
            Browse eSIM Plans
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
          <p className="mt-4 text-white/80 text-sm">
            No contracts • Instant activation • 24/7 support
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-green-500/20">
        <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8">
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
