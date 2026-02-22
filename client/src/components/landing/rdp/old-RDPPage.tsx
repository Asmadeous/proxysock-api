// // RDPPage.jsx - Dedicated landing page for RDP services

// import { useState} from "react"
// import { Link } from "react-router-dom"
// import {
//   ComputerDesktopIcon,
//   ArrowRightIcon,
//   BoltIcon,
//   ShieldCheckIcon,
//   ClockIcon,
//   ServerIcon,
// } from "@heroicons/react/24/outline"
// import { StarIcon } from "@heroicons/react/24/solid"
// import heroBg from "../assets/images/hero-bg.webp"
// import { motion } from "framer-motion"
// import Navbar from "../components/Navbar"
// import { useAuth } from "../context/AuthContext"

// export default function RDPPage() {
//   const { isAuthenticated, isLoading } = useAuth()
//   const [rdpSubTab, setRdpSubTab] = useState("standard")

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

//       {/* Hero Section - Optimized for RDP */}
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
//               <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
//                 Windows Server 2022, Ubuntu & Fedora
//               </span>
//               <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
//                 Full Admin Access
//               </span>
//               <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
//                 Instant Setup
//               </span>
//             </div>

//             <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
//               Windows and Linux RDP Hosting
//               <span className="block text-red-500 mt-2">Starting at $18/month</span>
//             </h1>
//             <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
//               High-performance Remote Desktop servers with full admin access.
//               Perfect for automation, trading, and running 24/7 applications on Windows Server 2022, Ubuntu, or Fedora.
//             </p>

//             <div className="mt-10">
//               <Link
//                 to={isAuthenticated ? "/dashboard/rdp" : "/register"}
//                 className="px-8 py-3 text-lg bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 inline-flex items-center font-medium shadow-lg hover:shadow-red-600/20"
//               >
//                 Get Your RDP Server
//                 <ArrowRightIcon className="h-5 w-5 ml-2" />
//               </Link>
//               <p className="mt-4 text-gray-400 text-sm">
//                 Setup in 5 minutes • Windows Server 2022, Ubuntu, Fedora • Cancel anytime
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
//       </div>

//       {/* RDP Plans Section - Your existing design */}
//       <div className="bg-gray-800/50 py-20 relative overflow-hidden">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-8">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Choose Your RDP Plan</h2>
//             <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
//               All plans include unlimited bandwidth, instant activation, and 24/7 support
//             </p>
//           </div>

//           {/* Sub-tabs for RDP */}
//           <div className="flex justify-center space-x-4 mb-8">
//             <button
//               onClick={() => setRdpSubTab("standard")}
//               className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
//                 rdpSubTab === "standard"
//                   ? "bg-blue-600 text-white"
//                   : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//               }`}
//             >
//               Datacenter RDP
//             </button>
//             <button
//               onClick={() => setRdpSubTab("residential")}
//               className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
//                 rdpSubTab === "residential"
//                   ? "bg-green-600 text-white"
//                   : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//               }`}
//             >
//               Residential RDP
//             </button>
//           </div>

//           {/* Standard RDP Content */}
//           {rdpSubTab === "standard" && (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {/* RDP Plans */}
//               {[
//                 {
//                   os: "Windows Server 2022",
//                   icon: ServerIcon,
//                   color: "purple",
//                   plans: [
//                     { name: "Basic", price: "$25", specs: "2 vCPU • 4GB RAM • 60GB SSD" },
//                     { name: "Standard", price: "$45", specs: "3 vCPU • 8GB RAM • 120GB SSD" },
//                     { name: "Pro", price: "$75", specs: "4 vCPU • 16GB RAM • 240GB SSD" },
//                   ]
//                 },
//                 {
//                   os: "Ubuntu",
//                   icon: ComputerDesktopIcon,
//                   color: "orange",
//                   plans: [
//                     { name: "Basic", price: "$18", specs: "1 vCPU • 2GB RAM • 40GB SSD" },
//                     { name: "Standard", price: "$32", specs: "2 vCPU • 4GB RAM • 60GB SSD" },
//                     { name: "Pro", price: "$55", specs: "3 vCPU • 8GB RAM • 160GB SSD" },
//                   ]
//                 },
//                 {
//                   os: "Fedora",
//                   icon: ComputerDesktopIcon,
//                   color: "blue",
//                   plans: [
//                     { name: "Basic", price: "$18", specs: "1 vCPU • 2GB RAM • 40GB SSD" },
//                     { name: "Standard", price: "$32", specs: "2 vCPU • 4GB RAM • 60GB SSD" },
//                     { name: "Pro", price: "$55", specs: "3 vCPU • 8GB RAM • 160GB SSD" },
//                   ]
//                 },
//               ].map((rdp, index) => (
//                 <motion.div
//                   key={index}
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true }}
//                   transition={{ duration: 0.5, delay: index * 0.1 }}
//                   className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//                 >
//                   <div className="flex items-center mb-4">
//                     <rdp.icon className={`h-8 w-8 text-${rdp.color}-500 mr-3`} />
//                     <h3 className="text-xl font-bold text-white">{rdp.os}</h3>
//                   </div>
//                   <div className="space-y-3 mb-4">
//                     {rdp.plans.map((plan, i) => (
//                       <div key={i} className="bg-gray-800/50 p-3 rounded">
//                         <p className="text-sm text-gray-300">
//                           {plan.name}: <span className="text-red-500 font-bold">{plan.price}/mo</span>
//                         </p>
//                         <p className="text-xs text-gray-400">{plan.specs}</p>
//                       </div>
//                     ))}
//                   </div>
//                   <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                     <li>✓ Datacenter IP</li>
//                     <li>✓ Unlimited Bandwidth</li>
//                     <li>✓ Full Admin Access</li>
//                     <li>✓ Instant Activation</li>
//                   </ul>
//                   <Link
//                     to={isAuthenticated ? "/dashboard/rdp" : "/register"}
//                     className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
//                   >
//                     Configure & Buy →
//                   </Link>
//                 </motion.div>
//               ))}
//             </div>
//           )}

//           {/* Residential RDP Content */}
//           {rdpSubTab === "residential" && (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {[
//                 {
//                   os: "Windows Server 2022",
//                   location: "USA • UK • Canada • Germany",
//                   plans: [
//                     { name: "Basic", price: "$55", specs: "1 vCPU • 2GB RAM • 40GB SSD" },
//                     { name: "Standard", price: "$95", specs: "2 vCPU • 4GB RAM • 60GB SSD" },
//                     { name: "Premium", price: "$150", specs: "3 vCPU • 8GB RAM • 160GB SSD" },
//                   ]
//                 },
//                 {
//                   os: "Ubuntu",
//                   location: "USA • UK • Canada • Germany",
//                   plans: [
//                     { name: "Basic", price: "$55", specs: "1 vCPU • 2GB RAM • 40GB SSD" },
//                     { name: "Standard", price: "$95", specs: "2 vCPU • 4GB RAM • 60GB SSD" },
//                     { name: "Premium", price: "$150", specs: "3 vCPU • 8GB RAM • 160GB SSD" },
//                   ]
//                 },
//                 {
//                   os: "Fedora",
//                   location: "USA • UK • Canada • Germany",
//                   plans: [
//                     { name: "Basic", price: "$55", specs: "1 vCPU • 2GB RAM • 40GB SSD" },
//                     { name: "Standard", price: "$95", specs: "2 vCPU • 4GB RAM • 60GB SSD" },
//                     { name: "Premium", price: "$150", specs: "3 vCPU • 8GB RAM • 160GB SSD" },
//                   ]
//                 },
//               ].map((rdp, index) => (
//                 <motion.div
//                   key={index}
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true }}
//                   transition={{ duration: 0.5, delay: index * 0.1 }}
//                   className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
//                 >
//                   <div className="flex items-center mb-4">
//                     <ComputerDesktopIcon className="h-8 w-8 text-green-500 mr-3" />
//                     <div>
//                       <h3 className="text-lg font-bold text-white">{rdp.os}</h3>
//                       <p className="text-xs text-green-400">{rdp.location}</p>
//                     </div>
//                   </div>
//                   <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mb-3">
//                     RESIDENTIAL IP
//                   </span>
//                   <div className="space-y-3 mb-4">
//                     {rdp.plans.map((plan, i) => (
//                       <div key={i} className="bg-gray-800/50 p-3 rounded">
//                         <p className="text-sm text-gray-300">
//                           {plan.name}: <span className="text-red-500 font-bold">{plan.price}/mo</span>
//                         </p>
//                         <p className="text-xs text-gray-400">{plan.specs}</p>
//                       </div>
//                     ))}
//                   </div>
//                   <ul className="text-xs text-gray-400 space-y-1 mb-4">
//                     <li>✓ Real Residential IP</li>
//                     <li>✓ Low Detection Rate</li>
//                     <li>✓ Premium Support</li>
//                   </ul>
//                   <Link
//                     to={isAuthenticated ? "/dashboard/rdp" : "/register"}
//                     className="w-full block text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
//                   >
//                     Configure & Buy →
//                   </Link>
//                 </motion.div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Features Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Why Choose Our RDP Hosting</h2>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//             {[
//               { title: "Instant Setup", icon: BoltIcon, description: "Server ready in 5 minutes" },
//               { title: "Full Admin Access", icon: ShieldCheckIcon, description: "Complete control over your server" },
//               { title: "99.9% Uptime", icon: ClockIcon, description: "Enterprise-grade reliability" },
//               { title: "24/7 Support", icon: ComputerDesktopIcon, description: "Expert help anytime" },
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

//       {/* Use Cases */}
//       <div className="bg-gray-800 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Perfect For</h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               {
//                 title: "Forex & Crypto Trading",
//                 description: "Run MetaTrader, trading bots, and automated strategies 24/7 with ultra-low latency.",
//               },
//               {
//                 title: "SEO & Marketing Tools",
//                 description: "Host GSA, Scrapebox, and other SEO tools that need to run continuously.",
//               },
//               {
//                 title: "Bot Development",
//                 description: "Perfect environment for Discord bots, game bots, and automation scripts.",
//               },
//             ].map((useCase, index) => (
//               <div key={index} className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800">
//                 <h3 className="text-xl font-bold text-white mb-3">{useCase.title}</h3>
//                 <p className="text-gray-300">{useCase.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Testimonials */}
//       <div className="bg-gray-900 py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">What Our Customers Say</h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {[
//               {
//                 name: "David Lee",
//                 role: "Forex Trader",
//                 content: "Running MT4 on their RDP for 8 months now. Zero downtime, excellent speeds.",
//                 rating: 5,
//               },
//               {
//                 name: "Emma Wilson",
//                 role: "SEO Specialist",
//                 content: "Perfect for my SEO tools. The residential RDP option is a game-changer.",
//                 rating: 5,
//               },
//               {
//                 name: "James Brown",
//                 role: "Developer",
//                 content: "Great for hosting bots 24/7. Support team helped me set everything up quickly.",
//                 rating: 5,
//               },
//             ].map((testimonial, index) => (
//               <div key={index} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl">
//                 <div className="flex mb-3">
//                   {[...Array(testimonial.rating)].map((_, i) => (
//                     <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
//                   ))}
//                 </div>
//                 <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
//                 <div className="border-t border-gray-700 pt-4">
//                   <p className="text-white font-semibold">{testimonial.name}</p>
//                   <p className="text-gray-400 text-sm">{testimonial.role}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* FAQ Section */}
//       <div className="bg-gray-800 py-20">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//           <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
//             RDP Hosting FAQ
//           </h2>

//           <div className="space-y-6">
//             {[
//               {
//                 q: "How quickly can I access my RDP?",
//                 a: "Your RDP server will be ready within 5 minutes of payment. You'll receive login credentials via email."
//               },
//               {
//                 q: "Can I install any software?",
//                 a: "Yes! You have full admin access and can install any compatible software on Windows Server 2022, Ubuntu, or Fedora."
//               },
//               {
//                 q: "What's the difference between datacenter and residential RDP?",
//                 a: "Datacenter RDP uses server IPs and is faster/cheaper. Residential RDP uses home internet IPs for better trust scores."
//               },
//               {
//                 q: "Is there a bandwidth limit?",
//                 a: "No, all plans include unlimited bandwidth at no extra cost."
//               },
//             ].map((faq, index) => (
//               <div key={index} className="bg-gray-900/50 rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
//                 <p className="text-gray-300">{faq.a}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Final CTA */}
//       <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <h2 className="text-3xl font-bold text-white mb-4">
//             Get Your RDP Today
//           </h2>
//           <p className="text-xl text-white/90 mb-8">
//             Join thousands of traders, marketers, and developers using our RDP hosting for Windows Server 2022, Ubuntu, and Fedora
//           </p>
//           <Link
//             to={isAuthenticated ? "/dashboard/rdp" : "/register"}
//             className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors duration-200 text-lg font-medium"
//           >
//             Start with RDP Hosting
//             <ArrowRightIcon className="h-5 w-5 ml-2" />
//           </Link>
//           <p className="mt-4 text-white/80 text-sm">
//             Instant setup • Full admin access • Cancel anytime
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

// RDPPage.jsx - Updated for all residential plans

// import { useState} from "react"
import { Link } from "react-router-dom";
import {
  ComputerDesktopIcon,
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  // ServerIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import heroBg from "../assets/images/hero-bg.webp";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function RDPPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section - Optimized for RDP */}
      <div className="relative min-h-[600px] flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/40 backdrop-blur-[1px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            {/* Trust Badges */}
            <div className="flex justify-center gap-4 mb-6 flex-wrap">
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                Residential IP
              </span>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                Windows Server 2022, Ubuntu & Fedora
              </span>
              <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                Full Admin Access
              </span>
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                🇨🇦 Starting CAD $28/mo
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
              Residential RDP Hosting
              <span className="block text-red-500 mt-2">
                From $28 CAD/month
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              High-performance Remote Desktop servers with real residential IPs
              and full admin access. Perfect for automation, trading, and
              running 24/7 applications. Best prices in Canada!
            </p>

            <div className="mt-10">
              <Link
                to={isAuthenticated ? "/dashboard/rdp" : "/register"}
                className="px-8 py-3 text-lg bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 inline-flex items-center font-medium shadow-lg hover:shadow-red-600/20"
              >
                Get Your RDP Server
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
              <p className="mt-4 text-gray-400 text-sm">
                Setup in 5 minutes • Residential IPs • Cancel anytime
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>

      {/* RDP Plans Section */}
      <div className="bg-gray-800/50 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Choose Your Residential RDP Plan
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              All plans include real residential IPs, unlimited bandwidth,
              instant activation, and 24/7 support
            </p>
          </div>

          {/* Location Pricing Banner */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <GlobeAltIcon className="h-5 w-5 text-red-400" />
              <p className="text-red-400 text-center text-sm font-medium">
                🌍 Available in 5 Locations: USA • UK • Germany • Canada •
                Australia
              </p>
              <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                🇨🇦 Cheapest in Canada!
              </span>
            </div>
          </div>

          {/* RDP Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Basic Residential RDP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Basic</h3>
                <ComputerDesktopIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-red-500">$40</span>
                  <span className="text-gray-400 text-sm">/month USD</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/50 rounded px-2 py-1 inline-block">
                  <span className="text-orange-400 text-xs font-semibold">
                    🇨🇦 $28 CAD/mo
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">1 vCPU</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">2GB RAM</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">40GB SSD Storage</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">1 Concurrent User</span>
                </div>
              </div>
              <ul className="text-xs text-gray-400 space-y-1 mb-4">
                <li>✓ Real Residential IP</li>
                <li>✓ Full Admin Access</li>
                <li>✓ Multi-OS Support</li>
                <li>✓ 24/7 Support</li>
              </ul>
              <Link
                to={isAuthenticated ? "/dashboard/rdp" : "/register"}
                className="w-full block text-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Configure & Buy →
              </Link>
            </motion.div>

            {/* Standard Residential RDP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border-2 border-red-500 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                  POPULAR
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Standard</h3>
                <ComputerDesktopIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-red-500">$95</span>
                  <span className="text-gray-400 text-sm">/month USD</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/50 rounded px-2 py-1 inline-block">
                  <span className="text-orange-400 text-xs font-semibold">
                    🇨🇦 $83 CAD/mo
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">2 vCPU</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">4GB RAM</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">80GB SSD Storage</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">1 Concurrent User</span>
                </div>
              </div>
              <ul className="text-xs text-gray-400 space-y-1 mb-4">
                <li>✓ Real Residential IP</li>
                <li>✓ DDoS Protection</li>
                <li>✓ Priority Support</li>
                <li>✓ Multi-OS Support</li>
              </ul>
              <Link
                to={isAuthenticated ? "/dashboard/rdp" : "/register"}
                className="w-full block text-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Configure & Buy →
              </Link>
            </motion.div>

            {/* Premium Residential RDP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Premium</h3>
                <ComputerDesktopIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-red-500">$150</span>
                  <span className="text-gray-400 text-sm">/month USD</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/50 rounded px-2 py-1 inline-block">
                  <span className="text-orange-400 text-xs font-semibold">
                    🇨🇦 $138 CAD/mo
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">3 vCPU</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">6GB RAM</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">120GB SSD Storage</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">1 Concurrent User</span>
                </div>
              </div>
              <ul className="text-xs text-gray-400 space-y-1 mb-4">
                <li>✓ Real Residential IP</li>
                <li>✓ Backup Service</li>
                <li>✓ DDoS Protection</li>
                <li>✓ Priority Support</li>
              </ul>
              <Link
                to={isAuthenticated ? "/dashboard/rdp" : "/register"}
                className="w-full block text-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Configure & Buy →
              </Link>
            </motion.div>

            {/* Ultra Residential RDP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Ultra</h3>
                <ComputerDesktopIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-red-500">$220</span>
                  <span className="text-gray-400 text-sm">/month USD</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/50 rounded px-2 py-1 inline-block">
                  <span className="text-orange-400 text-xs font-semibold">
                    🇨🇦 $208 CAD/mo
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">4 vCPU</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">8GB RAM</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">160GB SSD Storage</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="font-semibold">1 Concurrent User</span>
                </div>
              </div>
              <ul className="text-xs text-gray-400 space-y-1 mb-4">
                <li>✓ Real Residential IP</li>
                <li>✓ High Performance</li>
                <li>✓ Backup Service</li>
                <li>✓ Premium Support</li>
              </ul>
              <Link
                to={isAuthenticated ? "/dashboard/rdp" : "/register"}
                className="w-full block text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Configure & Buy →
              </Link>
            </motion.div>
          </div>

          {/* OS Options */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm mb-4">
              Available Operating Systems:
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {["Windows Server 2022", "Ubuntu Desktop", "Fedora Desktop"].map(
                (os) => (
                  <span
                    key={os}
                    className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded text-xs"
                  >
                    {os}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Why Choose Residential RDP
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: "Instant Setup",
                icon: BoltIcon,
                description: "Server ready in 5 minutes",
              },
              {
                title: "Real Residential IPs",
                icon: GlobeAltIcon,
                description: "Low detection rates",
              },
              {
                title: "Full Admin Access",
                icon: ShieldCheckIcon,
                description: "Complete control over your server",
              },
              {
                title: "24/7 Support",
                icon: ClockIcon,
                description: "Expert help anytime",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-lg mb-3">
                  <feature.icon className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-white font-semibold mb-1">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Perfect For
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Forex & Crypto Trading",
                description:
                  "Run MetaTrader, trading bots, and automated strategies 24/7 with ultra-low latency and residential IPs.",
              },
              {
                title: "SEO & Marketing Tools",
                description:
                  "Host GSA, Scrapebox, and other SEO tools with residential IPs for better success rates.",
              },
              {
                title: "Bot Development & Automation",
                description:
                  "Perfect environment for Discord bots, game bots, and automation scripts with trusted IPs.",
              },
            ].map((useCase, index) => (
              <div
                key={index}
                className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-gray-800"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-300">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "David Lee",
                role: "Forex Trader",
                content:
                  "Running MT4 on their residential RDP for 8 months now. Zero downtime, excellent speeds, no detection issues.",
                rating: 5,
              },
              {
                name: "Emma Wilson",
                role: "SEO Specialist",
                content:
                  "The residential IPs make all the difference for my SEO tools. Best pricing I've found, especially in Canada!",
                rating: 5,
              },
              {
                name: "James Brown",
                role: "Developer",
                content:
                  "Great for hosting bots 24/7 with residential IPs. Support team helped me set everything up quickly.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl"
              >
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
            Residential RDP FAQ
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "How quickly can I access my RDP?",
                a: "Your RDP server will be ready within 5 minutes of payment. You'll receive login credentials via email.",
              },
              {
                q: "What makes an RDP 'residential'?",
                a: "Residential RDP uses real home internet IPs from ISPs instead of datacenter IPs, providing better trust scores and lower detection rates for automation and trading applications.",
              },
              {
                q: "Why are Canada prices cheaper?",
                a: "We offer special pricing for our Canadian datacenter to provide the best value. All features and performance remain the same across all locations.",
              },
              {
                q: "Can I install any software?",
                a: "Yes! You have full admin access and can install any compatible software on Windows Server 2022, Ubuntu Desktop, or Fedora Desktop.",
              },
              {
                q: "Is there a bandwidth limit?",
                a: "No, all plans include unlimited bandwidth at no extra cost.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get Your Residential RDP Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Best prices in Canada • Real residential IPs • Join thousands of
            traders, marketers, and developers
          </p>
          <Link
            to={isAuthenticated ? "/dashboard/rdp" : "/register"}
            className="inline-flex items-center px-8 py-3 bg-white text-red-600 rounded-md hover:bg-gray-100 transition-colors duration-200 text-lg font-medium"
          >
            Start with RDP Hosting
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
          <p className="mt-4 text-white/80 text-sm">
            Starting at $28 CAD • Instant setup • Full admin access • Cancel
            anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
