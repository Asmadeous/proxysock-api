import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { useThemeStore } from "../../store/themeStore";
import backgroundNode from "../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../assets/images/backgroundNodeRed.webp";

export const EnhancedStatsSection = () => {
  const { dark } = useThemeStore();
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className="relative bg-background py-16 sm:py-20 overflow-hidden pt-24 sm:pt-36"
      aria-labelledby="stats-heading"
    >
      <div
        className="absolute inset-0 z-0 rotate-[23deg] opacity-20"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="stats-heading" className="sr-only">
          ProxySock Statistics
        </h2>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left Section */}
          <div className="text-left">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight font-manrope-bold">
              Trusted Infrastructure
              <br />
              at Global Scale
            </h2>
            <div className="inline-block bg-primary text-primary-foreground px-4 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-manrope-semibold">
              Optimized Canada Network
            </div>
          </div>

          {/* Right Section - Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Active Customers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="text-5xl md:text-6xl font-manrope-extrabold text-foreground mb-2">
                {inView ? (
                  <CountUp
                    end={15000}
                    duration={2.5}
                    separator=","
                    suffix="+"
                  />
                ) : (
                  "15,000+"
                )}
              </div>
              <p className="text-muted-foreground text-sm font-inter-regular">
                Active Customers
              </p>
            </motion.div>

            {/* IPs in Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-5xl md:text-6xl font-manrope-extrabold text-foreground mb-2">
                {inView ? (
                  <CountUp
                    end={50000}
                    duration={2.5}
                    separator=","
                    suffix="+"
                  />
                ) : (
                  "50,000+"
                )}
              </div>
              <p className="text-muted-foreground text-sm font-inter-regular">
                IPs in Global Network
              </p>
            </motion.div>

            {/* Uptime SLA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-5xl md:text-6xl font-manrope-extrabold text-foreground mb-2">
                {inView ? (
                  <>
                    <CountUp
                      end={99.9}
                      duration={2.5}
                      decimals={1}
                      decimal="."
                      suffix="%"
                    />
                  </>
                ) : (
                  "99.9%"
                )}
              </div>
              <p className="text-muted-foreground text-sm font-inter-regular">
                Uptime SLA
              </p>
            </motion.div>

            {/* Expert Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-5xl md:text-6xl font-manrope-extrabold text-foreground mb-2">
                24/7
              </div>
              <p className="text-muted-foreground text-sm font-inter-regular">
                Expert Support
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
