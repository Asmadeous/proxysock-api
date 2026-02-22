import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

interface ESIMCTAProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

export const ESIMCTA = ({ trackConversion }: ESIMCTAProps) => {
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
          Ready to Stay Connected Worldwide?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl text-primary-foreground/90 mb-8"
        >
          Get instant access to our global eSIM network
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            to="/dashboard/esim"
            onClick={() =>
              trackConversion?.(
                "final_cta_conversion",
                "conversion",
                "/dashboard/esim"
              )
            }
            className="inline-flex items-center px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors duration-200 font-manrope-semibold font-medium text-lg shadow-lg"
          >
            Browse eSIM Plans
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
          <p className="mt-4 text-primary-foreground/80 text-sm">
            No contracts • Instant activation • 24/7 support
          </p>
        </motion.div>
      </div>
    </div>
  );
};
