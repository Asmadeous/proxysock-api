export const HowToConnectVPNContent = () => {
  return <></>;
};

// const VPNContent = () => (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//       className="space-y-12"
//     >
//       <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
//         <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center">
//           <ShieldCheckIcon className="h-8 w-8 text-yellow-500 mr-4" />
//           Residential VPN Setup
//         </h2>
//         <p className="text-gray-300 text-lg">Secure your connection with military-grade encryption and real residential IPs.</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Desktop Setup */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.6 }}
//           className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 hover:border-yellow-500/30 transition-all duration-300"
//         >
//           <div className="flex items-center mb-8">
//             <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mr-4">
//               <ComputerDesktopIcon className="h-8 w-8 text-yellow-500" />
//             </div>
//             <div>
//               <h3 className="text-2xl font-bold text-white">Desktop Setup</h3>
//               <p className="text-gray-400 text-sm">Windows & macOS</p>
//             </div>
//           </div>

//           <div className="space-y-6 text-gray-300">
//             <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
//               <h4 className="font-semibold text-white mb-4">Installation Steps:</h4>
//               <ol className="space-y-3 text-sm">
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">1</span>
//                   <span>Download the ProxySock VPN client from your dashboard</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">2</span>
//                   <span>Run the installer and follow the setup wizard</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">3</span>
//                   <span>Launch the application and sign in with your credentials</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">4</span>
//                   <span>Select a location and click <strong>Connect</strong></span>
//                 </li>
//               </ol>
//             </div>
//           </div>
//         </motion.div>

//         {/* Mobile Setup */}
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//           className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 hover:border-yellow-500/30 transition-all duration-300"
//         >
//           <div className="flex items-center mb-8">
//             <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mr-4">
//               <DevicePhoneMobileIcon className="h-8 w-8 text-yellow-500" />
//             </div>
//             <div>
//               <h3 className="text-2xl font-bold text-white">Mobile Setup</h3>
//               <p className="text-gray-400 text-sm">iOS & Android</p>
//             </div>
//           </div>

//           <div className="space-y-6 text-gray-300">
//             <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
//               <h4 className="font-semibold text-white mb-4">App Installation:</h4>
//               <ol className="space-y-3 text-sm">
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">1</span>
//                   <span>Install "ProxySock VPN" from App Store or Play Store</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">2</span>
//                   <span>Open the app and allow necessary permissions</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">3</span>
//                   <span>Login with your ProxySock account</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 font-bold">4</span>
//                   <span>Tap the power button to connect instantly</span>
//                 </li>
//               </ol>
//             </div>
//           </div>
//         </motion.div>

//         {/* Features & Tips */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.6, delay: 0.3 }}
//           className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 hover:border-yellow-500/30 transition-all duration-300 lg:col-span-2"
//         >
//           <div className="flex items-center mb-8">
//             <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mr-4">
//               <SparklesIcon className="h-8 w-8 text-yellow-500" />
//             </div>
//             <div>
//               <h3 className="text-2xl font-bold text-white">Features & Tips</h3>
//               <p className="text-gray-400 text-sm">Getting the most out of your VPN</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             <div className="space-y-4">
//               <h4 className="font-semibold text-white">Security Features</h4>
//               <ul className="space-y-3 text-gray-300 text-sm">
//                 <li className="flex items-center">
//                   <CheckCircleIcon className="h-4 w-4 text-yellow-500 mr-2" />
//                   AES-256 Military-grade Encryption
//                 </li>
//                 <li className="flex items-center">
//                   <CheckCircleIcon className="h-4 w-4 text-yellow-500 mr-2" />
//                   Automatic Kill Switch
//                 </li>
//                 <li className="flex items-center">
//                   <CheckCircleIcon className="h-4 w-4 text-yellow-500 mr-2" />
//                   DNS Leak Protection
//                 </li>
//                 <li className="flex items-center">
//                   <CheckCircleIcon className="h-4 w-4 text-yellow-500 mr-2" />
//                   Split Tunneling Support
//                 </li>
//               </ul>
//             </div>

//             <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
//               <h4 className="font-semibold text-white mb-2 flex items-center">
//                 <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
//                 Pro Tips
//               </h4>
//               <ul className="space-y-2 text-sm text-gray-300">
//                 <li>• Use "Closest Location" for best speeds</li>
//                 <li>• Enable "Auto-connect" on unsecured WiFi</li>
//                 <li>• Regularly rotate IPs for maximum privacy</li>
//               </ul>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
