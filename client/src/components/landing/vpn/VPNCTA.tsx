import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface VPNCTAProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

export const VPNCTA = ({ trackConversion }: VPNCTAProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 py-16 mt-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-manrope-bold font-bold text-primary-foreground mb-4"
        >
          Get Your Secure VPN Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl text-primary-foreground/90 mb-8"
        >
          Military-grade encryption • Global coverage • Anonymous browsing •
          Join thousands of privacy-conscious users
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            to={isAuthenticated ? "/dashboard/vpn" : "/register"}
            onClick={() =>
              trackConversion?.(
                "final_cta_conversion",
                "conversion",
                "/dashboard/vpn"
              )
            }
            className="inline-flex items-center px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors duration-200 font-manrope-semibold font-medium text-lg shadow-lg"
          >
            Start with VPN Protection
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
          <p className="mt-4 text-primary-foreground/80 text-sm">
            Starting at $15 USD • Instant setup • 50+ locations • Cancel anytime
          </p>
        </motion.div>
      </div>
    </div>
  );
};
