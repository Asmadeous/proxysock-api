import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useThemeStore } from "../../../store/themeStore";
import backgroundNode from "../../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../../assets/images/backgroundNodeRed.webp";

interface VPNHeroSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

export const VPNHeroSection = ({ trackConversion }: VPNHeroSectionProps) => {
  const { isAuthenticated } = useAuth();
  const { dark } = useThemeStore();

  return (
    <div className="relative h-[90vh] mx-auto flex items-center justify-center bg-background">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center gap-4 mb-6 flex-wrap"
          >
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              Military-Grade Encryption
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              50+ Global Locations
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              No-Logs Policy
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              🇺🇸 Starting at $15 USD/mo
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-manrope-bold font-bold text-foreground mb-6"
          >
            Residential VPN Services <br />
            <span className="text-primary">From $15 USD/month</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base sm:text-lg font-inter-regular text-muted-foreground"
          >
            Protect your online privacy with military-grade encryption, bypass
            geo-restrictions, and access content securely from anywhere in the world.
            Fast, reliable, and anonymous VPN service.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            <Link
              to={isAuthenticated ? "/dashboard/vpn" : "/register"}
              onClick={() =>
                trackConversion?.(
                  "vpn_purchase_lead",
                  "conversion",
                  "/dashboard/vpn"
                )
              }
              className="px-8 py-4 text-lg bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 inline-flex items-center font-manrope-semibold font-medium shadow-lg"
            >
              Get Your VPN Now
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
            <p className="mt-4 text-muted-foreground text-sm">
              Setup in 2 minutes • Global servers • Cancel anytime
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex justify-center"
          >
            <div className="bg-card border border-border rounded-full px-6 py-3 inline-flex items-center justify-center gap-8 text-sm flex-wrap">
              <span className="text-foreground">99.9% Uptime Guarantee</span>
              <span className="text-foreground">Ultra-Fast Speeds</span>
              <span className="text-foreground">Zero-Logs Policy</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
