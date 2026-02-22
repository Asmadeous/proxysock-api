
import { motion } from "framer-motion";

export default function WelcomeSection() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="hidden lg:flex flex-col justify-center max-w-md"
    >
      {/* Simple Welcome Message */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          Welcome Back
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Sign in to your account to continue
        </p>
      </div>

      {/* Security Badge */}
      <div className="mt-8 flex items-center justify-center lg:justify-start space-x-3">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-300 font-medium">
          Secure & Encrypted Connection
        </span>
      </div>
    </motion.div>
  );
}
