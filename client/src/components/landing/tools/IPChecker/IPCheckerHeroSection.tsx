import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface IPCheckerHeroSectionProps {
  result?: any;
}

export const IPCheckerHeroSection = ({ result }: IPCheckerHeroSectionProps) => {
  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mb-8">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-primary text-sm font-medium">
          {result ? "Analysis Complete" : "Advanced Threat Intelligence"}
        </span>
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-6xl font-manrope-bold text-foreground mb-6 tracking-tight"
      >
        {result ? "Your IP Analysis" : "IP Address"}
        <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent block mt-2">
          {result ? "Results" : "Intelligence"}
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed"
      >
        {result
          ? `Complete security analysis for ${result.ip} with comprehensive threat detection and network intelligence`
          : "Comprehensive threat detection, geolocation analysis, and network intelligence for enterprise-grade security and fraud prevention"}
      </motion.p>
    </div>
  );
};
