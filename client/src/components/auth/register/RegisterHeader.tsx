import { motion } from "framer-motion";

export default function RegisterHeader() {
  return (
    <div className="text-center mb-2">
      {/* Animated badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium text-primary/80 font-inter tracking-wide uppercase">
          Free Account
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-3xl lg:text-4xl font-bold text-foreground mb-3 font-manrope tracking-tight"
      >
        Create Account
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-muted-foreground text-base font-inter"
      >
        Start your free trial today
      </motion.p>
    </div>
  );
}
