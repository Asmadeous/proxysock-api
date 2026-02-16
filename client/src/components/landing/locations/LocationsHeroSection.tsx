import { motion } from "framer-motion";

export const LocationsHeroSection = () => {
  // const { dark } = useThemeStore(); - Removed as unused in this component, parent handles background

  return (
    <div className="relative min-h-[500px] flex items-center justify-center pt-16">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl font-manrope-bold font-bold text-foreground mb-6 leading-tight">
              Global Infrastructure Locations
            </h1>
            <p className="text-lg font-inter-regular text-muted-foreground leading-relaxed">
              Explore our worldwide network of high-performance servers and
              coverage areas. From premium data centers to global eSIM
              connectivity, we've got the infrastructure you need.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-8"
          >
            <div className="text-left">
              <div className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-2">
                15,000+
              </div>
              <p className="font-inter-regular text-muted-foreground text-sm">
                Active Customers
              </p>
            </div>
            <div className="text-left">
              <div className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-2">
                50,000+
              </div>
              <p className="font-inter-regular text-muted-foreground text-sm">
                IPs in Network
              </p>
            </div>
            <div className="text-left">
              <div className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-2">
                99.9%
              </div>
              <p className="font-inter-regular text-muted-foreground text-sm">
                Uptime SLA
              </p>
            </div>
            <div className="text-left">
              <div className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-2">
                24/7
              </div>
              <p className="font-inter-regular text-muted-foreground text-sm">
                Expert Support
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
