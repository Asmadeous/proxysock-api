import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { useThemeStore } from "../../../store/themeStore";
import backgroundNode from "../../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../../assets/images/backgroundNodeRed.webp";

interface ESIMHeroSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

export const ESIMHeroSection = ({ trackConversion }: ESIMHeroSectionProps) => {

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
              200+ Countries
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              5G/4G LTE
            </span>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-manrope-semibold">
              Instant Activation
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight font-manrope-bold"
          >
            International eSIM Cards
            <br />
            <span className="text-primary">Global Connectivity Anywhere</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base sm:text-lg font-inter-regular text-muted-foreground"
          >
            Stay connected worldwide with our digital eSIM cards. No physical SIM needed,
            instant activation via QR code, and coverage in 200+ countries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            <Link
              to="/dashboard/esim"
              onClick={() =>
                trackConversion?.(
                  "esim_purchase_lead",
                  "conversion",
                  "/dashboard/esim"
                )
              }
              className="px-8 py-4 text-lg bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 inline-flex items-center font-manrope-semibold font-medium shadow-lg"
            >
              Get Your eSIM Now
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
            <p className="mt-4 text-muted-foreground text-sm">
              Instant delivery • No roaming fees • Cancel anytime
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex justify-center"
          >
            <div className="bg-card border border-border rounded-full px-6 py-3 inline-flex items-center justify-center gap-8 text-sm flex-wrap">
              <span className="text-foreground">
                99.9% Uptime Guarantee
              </span>
              <span className="text-foreground">
                24/7 Customer Support
              </span>
              <span className="text-foreground">
                Multi-Network Coverage
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
