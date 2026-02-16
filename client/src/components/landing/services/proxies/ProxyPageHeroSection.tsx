import { motion } from "framer-motion";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useThemeStore } from "../../../../store/themeStore";

export const ProxyPageHeroSection = () => {
  const { dark } = useThemeStore();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br ">
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-start">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl md:text-7xl font-manrope-bold font-bold text-foreground tracking-tight"
        >
          Buy Premium Proxies Online
          <br />
          <span className="text-foreground/90">
            Fast, Secure & Reliable Proxy Services
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-3xl text-xl text-muted-foreground font-inter-regular"
        >
          Purchase high-speed datacenter, residential, ISP, and static
          residential proxies with unlimited bandwidth and global coverage.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <Link
            to={isAuthenticated ? "/dashboard/proxies" : "/login"}
            className="px-10 py-4 text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors duration-200 font-semibold text-lg inline-block"
          >
            {isAuthenticated ? "Buy Premium Proxies" : "Sign In"}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
