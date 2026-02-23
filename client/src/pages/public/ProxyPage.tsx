"use client";

import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GlobeAltIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { ProxyPageHeroSection } from "@/components/landing/services/proxies/ProxyPageHeroSection";
import { ProxyType } from "@/components/landing/services/proxies/ProxyType";
import { SecurePaymentsSection } from "@/components/landing/PaymentMethods";

const CompanyLogos = [
  {
    name: "AT&T",
    url: "https://www.proxystore.net/landing/images/isp/ATT_ISP_Proxies.png",
  },
  {
    name: "Windstream",
    url: "https://www.proxystore.net/landing/images/isp/Windstream_ISP_Proxies.png",
  },
  {
    name: "Cogent",
    url: "https://www.proxystore.net/landing/images/isp/Cogent_ISP_Proxies.png",
  },
  {
    name: "Virgin Media",
    url: "https://www.proxystore.net/landing/images/isp/Virgin_Media_ISP_Proxies.png",
  },
  {
    name: "Verizon",
    url: "https://www.proxystore.net/landing/images/isp/Verizon_ISP_Proxies.png",
  },
  {
    name: "Sprint",
    url: "https://www.proxystore.net/landing/images/isp/Sprint_ISP_Proxies.png",
  },
];

const features = [
  {
    title: "Instant Activation",
    icon: BoltIcon,
    description: "Start using your proxies immediately after purchase.",
  },
  {
    title: "High-Speed Connections",
    icon: ChartBarIcon,
    description: "Enjoy 1GB speeds for seamless performance.",
  },
  {
    title: "24/7 Support",
    icon: ClockIcon,
    description: "Round-the-clock assistance for any issues.",
  },
  {
    title: "Global Proxy Network",
    icon: GlobeAltIcon,
    description: "Access proxy servers in multiple countries worldwide.",
  },
  {
    title: "Enterprise-Grade Security",
    icon: ShieldCheckIcon,
    description: "Secure your connections with top-tier encryption.",
  },
  {
    title: "Easy API Integration",
    icon: CogIcon,
    description: "Seamless setup with comprehensive API documentation.",
  },
];

export default function ProxyPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    document.title =
      "Buy Proxies Online - Premium Datacenter, Residential & ISP Proxies | ProxySock";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Commented Out */}
      {/* <Navbar /> */}

      {/* Hero Section */}
      <ProxyPageHeroSection />
      {/* <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900 pt-20">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url(${backgroundNode})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl md:text-7xl font-manrope-bold font-bold text-foreground tracking-tight"
          >
            Buy Premium Proxies Online
            <br />
            <span className="text-white/90">
              Fast, Secure & Reliable Proxy Services
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-3xl mx-auto text-xl font-inter-regular text-muted-foreground"
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
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="px-10 py-4 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors duration-200 font-manrope-semibold font-semibold text-lg inline-block"
            >
              {isAuthenticated ? "Buy Premium Proxies" : "Sign In"}
            </Link>
          </motion.div>
        </div>
      </div> */}

      {/* Proxy Types Section */}
      <ProxyType />

      {/* Logo Cloud */}
      <section className="relative overflow-hidden py-20 bg-background">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-manrope-bold font-bold text-3xl text-foreground lg:text-4xl">
              Buy Proxies from Trusted Mobile ISP Providers
            </h2>
            <p className="font-inter-regular text-muted-foreground text-lg max-w-3xl mx-auto">
              Purchase proxies from top-tier mobile ISP providers for authentic
              residential connections and minimal detection rates.
            </p>
          </motion.div>

          <div
            className="relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
            }}
          >
            <motion.div
              animate={{
                x: [0, -200 * CompanyLogos.length],
              }}
              className="flex gap-12"
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 25,
                  ease: "linear",
                },
              }}
            >
              {[...CompanyLogos, ...CompanyLogos, ...CompanyLogos].map(
                (logo, index) => (
                  <div
                    key={`${logo.name}-${index}`}
                    className="flex shrink-0 items-center justify-center p-6"
                  >
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ),
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Buy Proxies */}
      <div className="relative bg-background py-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-manrope-bold font-bold text-foreground mb-4">
              Why Buy Proxies from ProxySock?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-colors duration-300"
              >
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-manrope-semibold font-semibold text-primary-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-primary-foreground/90 text-sm font-inter-regular">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Other Services CTA */}
      <div className="relative bg-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-manrope-bold font-bold text-primary-foreground mb-6">
            Explore More Services from ProxySock
          </h2>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              to="/esim"
              className="px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors font-semibold"
            >
              eSIM Cards
            </Link>
            <Link
              to="/rdp"
              className="px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors font-semibold"
            >
              RDP Hosting
            </Link>
            <Link
              to="/vps"
              className="px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors font-semibold"
            >
              VPS Hosting
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <SecurePaymentsSection />

      {/* Testimonials - Commented Out */}
      {/* <div className="bg-gray-800 py-24">...</div> */}

      {/* Footer - Commented Out */}
      {/* <footer className="bg-gray-900">...</footer> */}
    </div>
  );
}
