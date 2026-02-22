import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useThemeStore } from "../../../store/themeStore";
import backgroundNode from "../../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../../assets/images/backgroundNodeRed.webp";

interface RDPHeroSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

export const RDPHeroSection = ({ trackConversion }: RDPHeroSectionProps) => {
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
              Residential IP
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              Windows Server 2022, Ubuntu & Fedora
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              Full Admin Access
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              🇨🇦 Starting CAD $28/mo
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight font-manrope-bold"
          >
            Residential RDP Hosting
            <br />
            <span className="text-primary">From $28 CAD/month</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base sm:text-lg font-inter-regular text-muted-foreground"
          >
            High-performance Remote Desktop servers with real residential IPs
            and full admin access. Perfect for automation, trading, and running
            24/7 applications. Best prices in Canada!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            <Link
              to={isAuthenticated ? "/dashboard/rdp" : "/register"}
              onClick={() =>
                trackConversion?.(
                  "rdp_purchase_lead",
                  "conversion",
                  "/dashboard/rdp"
                )
              }
              className="px-8 py-4 text-lg bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 inline-flex items-center font-manrope-semibold font-medium shadow-lg"
            >
              Get Your RDP Server
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
            <p className="mt-4 text-muted-foreground text-sm">
              Setup in 5 minutes • Residential IPs • Cancel anytime
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
              <span className="text-foreground">Instant 5-Minute Setup</span>
              <span className="text-foreground">Real Residential IPs</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
