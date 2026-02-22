import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useThemeStore } from "../../store/themeStore";
import backgroundNode from "../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../assets/images/backgroundNodeRed.webp";


interface HeroSectionProps {
  trackConversion: (
    eventName: string,
    eventType: string,
    pagePath: string,
  ) => void;
}

export const HeroSection = ({ trackConversion }: HeroSectionProps) => {
  const { isAuthenticated } = useAuth();
  const { dark } = useThemeStore();

  return (
    <div className="relative h-[100vh] mx-auto flex items-center justify-between lg:px-32 bg-background">
      <div
        className="absolute inset-0 z-0 opacity-20 mt-20"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "end",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-full px-4 sm:px-6 lg:px-4 py-32">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight font-manrope-bold"
          >
            Premium Digital
            <br />
            Infrastructure for
            <br />
            <span className="text-primary">Modern Businesses</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 max-w-2xl text-base sm:text-lg font-inter-regular text-foreground"
          >
            High-performance{" "}
            <strong className="text-primary">residential VPNs</strong>
            <span className="text-primary font-manrope-bold">
              proxy services
            </span>{" "}
            font-manrope-bold , Windows{" "}
            <span className="text-primary  font-manrope-bold">RDP hosting</span>
            , enterprise{" "}
            <span className="text-primary  font-manrope-bold">VPS servers</span>{" "}
            and global{" "}
            <span className="text-primary font-manrope-bold">
              eSIM solutions
            </span>
            . Trusted by 15,000+ business worldwide with 99.9% uptime guarantee.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row justify-start gap-4"
          >
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() =>
                  trackConversion(
                    "dashboard_navigation",
                    "navigation",
                    "/dashboard",
                  )
                }
                className="px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 flex items-center justify-center font-manrope-semibold font-medium"
              >
                Access Dashboard
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
            ) : (
              <Link
                to="/register"
                onClick={() =>
                  trackConversion(
                    "signup_intent_lead",
                    "conversion",
                    "/register",
                  )
                }
                className="px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 flex items-center justify-center font-manrope-semibold font-medium"
              >
                Start Now From $2.99/proxy
              </Link>
            )}
            <Link
              to="/HowToConnect"
              onClick={() =>
                trackConversion(
                  "documentation_navigation",
                  "education",
                  "/HowToConnect",
                )
              }
              className="px-10 py-4 text-lg bg-transparent border border-foreground text-foreground rounded-full hover:bg-foreground hover:text-background transition-all duration-200 flex items-center justify-center font-manrope-semibold font-medium"
            >
              View Documentation
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 sm:mt-16 lg:mt-20 flex justify-center"
          >
            <div className="bg-primary border border-primary/20 rounded-full px-4 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-4 sm:gap-8 lg:gap-12 text-xs sm:text-sm flex-wrap max-w-full">
              <span className="text-primary-foreground">
                Instant activation
              </span>
              <span className="text-primary-foreground">
                30 day money back guarantee
              </span>
              <span className="text-primary-foreground">
                Enterprise grade security
              </span>
              <span className="text-primary-foreground">
                4.95 ratings from 2500+ reviews
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
