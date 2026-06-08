import { motion } from "framer-motion";
import logo from "../../../assets/images/favicon.svg";

export default function LoginHeader() {
  return (
    <div className="text-center mb-2">
      {/* Mobile-only icon */}
      <div className="md:hidden flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/15 to-red-600/10 rounded-2xl mb-5 mx-auto border border-red-500/20 backdrop-blur-sm">
        <img src={logo} alt="ProxySock" className="h-8 w-8" />
      </div>

      {/* Animated greeting badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-primary/80 font-inter tracking-wide uppercase">
          Secure Login
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-3xl lg:text-4xl font-bold text-foreground mb-3 font-manrope tracking-tight"
      >
        Welcome Back
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-muted-foreground text-base font-inter"
      >
        Sign in to access your dashboard
      </motion.p>
    </div>
  );
}
