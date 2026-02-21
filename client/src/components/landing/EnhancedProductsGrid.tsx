import { CheckCircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";
import backgroundNode from "../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../assets/images/backgroundNodeRed.webp";

interface TrackViewContentData {
  productId: string;
  productName: string;
  category: string;
  value: number;
}

interface EnhancedProductsGridProps {
  trackConversion: (
    eventName: string,
    eventType: string,
    pagePath: string,
  ) => void;
  trackViewContent?: (data: TrackViewContentData) => void;
}

export const EnhancedProductsGrid = ({
  trackConversion,
  trackViewContent,
}: EnhancedProductsGridProps) => {
  const { dark } = useThemeStore();
  return (
    <section
      className="relative bg-background py-24 overflow-hidden pb-36"
      aria-labelledby="services-heading"
    >
      <div
        className="absolute inset-0 z-0 opacity-20 -rotate-[23deg] mt-30"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "end",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            id="services-heading"
<<<<<<< HEAD
            className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-manrope-bold"
=======
            className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 font-manrope-bold"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          >
            Choose Your Digital Infrastructure Solution
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-inter-regular">
            Professional-grade services designed for businesses, developers, and
            digital marketers. All plans include unlimited bandwidth, instant
            activation, and 24/7 expert support.
          </p>
        </div>
<<<<<<< HEAD
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
=======
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          {/* Proxy Services Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-all duration-300"
          >
            <div className="text-left">
              <h3 className="text-2xl font-manrope-bold font-bold text-primary-foreground mb-3">
                Proxy Services
              </h3>
              <p className="text-primary-foreground/90 mb-6 text-sm leading-relaxed font-inter-regular">
                High-speed datacenter, residential, and ISP proxies for web
                scraping, automation, and anonymous browsing.
              </p>
              <div className="text-primary-foreground mb-6 space-y-2 text-sm font-inter-regular">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>50,000+ Premium IPs</span>
                </div>
                <div className="flex items-center font-inter-regular">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>120+ Countries Available</span>
                </div>
                <div className="flex items-center font-inter-regular">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Starting at $2.99/proxy</span>
                </div>
              </div>
              <Link
                to="/proxies"
                onClick={() => {
                  trackConversion(
                    "proxy_plans_navigation",
                    "product_interest",
                    "/proxies",
                  );
                  trackViewContent?.({
                    productId: "proxy-services",
                    productName: "Proxy Services",
                    category: "proxy",
                    value: 2.99,
                  });
                }}
                className="w-full block text-center px-6 py-3 font-manrope-semibold bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-all duration-200 font-semibold"
              >
                View plans
              </Link>
            </div>
          </motion.div>

          {/* RDP Hosting Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-all duration-300"
          >
            <div className="text-left">
              <h3 className="text-2xl font-manrope-bold font-bold text-primary-foreground mb-3">
                RDP Hosting
              </h3>
              <p className="text-primary-foreground/90 mb-6 text-sm leading-relaxed">
                Windows Remote Desktop servers with full admin access for 24/7
                operations and automation.
              </p>
              <div className="text-primary-foreground mb-6 space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Windows Server 2022 + Linux</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Starting at $28 CAD/month</span>
                </div>
              </div>
              <Link
                to="/rdp"
                onClick={() => {
                  trackConversion(
                    "rdp_plans_navigation",
                    "product_interest",
                    "/rdp",
                  );
                  trackViewContent?.({
                    productId: "rdp-hosting",
                    productName: "RDP Hosting",
                    category: "rdp",
                    value: 18.0,
                  });
                }}
                className="w-full block text-center px-6 py-3 bg-white text-red-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-semibold"
              >
                View plans
              </Link>
            </div>
          </motion.div>

          {/* VPS Hosting Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-all duration-300"
          >
            <div className="text-left">
              <h3 className="text-2xl font-manrope-bold font-bold text-primary-foreground mb-3">
                VPS Hosting
              </h3>
              <p className="text-primary-foreground/90 mb-6 text-sm leading-relaxed">
                Residential Linux and Windows VPS with root access, lower
                detection rates for automation.
              </p>
              <div className="text-primary-foreground mb-6 space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Ubuntu, Debian, Rocky</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Full Root Access</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Starting at $23 CAD/month</span>
                </div>
              </div>
              <Link
                to="/vps"
                onClick={() => {
                  trackConversion(
                    "vps_plans_navigation",
                    "product_interest",
                    "/vps",
                  );
                  trackViewContent?.({
                    productId: "vps-hosting",
                    productName: "VPS Hosting",
                    category: "vps",
                    value: 8.0,
                  });
                }}
                className="w-full block text-center px-6 py-3 bg-white text-red-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-semibold"
              >
                View plans
              </Link>
            </div>
          </motion.div>

          {/* eSIM Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-all duration-300"
          >
            <div className="text-left">
              <h3 className="text-2xl font-manrope-bold font-bold text-primary-foreground mb-3">
                eSIM Cards
              </h3>
              <p className="text-primary-foreground/90 mb-6 text-sm leading-relaxed">
                International eSIM cards for global connectivity. Digital SIM
                activation via QR code - no physical SIM needed.
              </p>
              <div className="text-primary-foreground mb-6 space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>200+ Countries Available</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Instant QR Code Delivery</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Plans from $6.99</span>
                </div>
              </div>
              <Link
                to="/esim"
                onClick={() => {
                  trackConversion(
                    "esim_plans_navigation",
                    "product_interest",
                    "/esim",
                  );
                  trackViewContent?.({
                    productId: "esim-cards",
                    productName: "eSIM Cards",
                    category: "esim",
                    value: 6.99,
                  });
                }}
                className="w-full block text-center px-6 py-3 bg-white text-red-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-semibold"
              >
                View plans
              </Link>
            </div>
          </motion.div>

          {/* VPN Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-all duration-300"
          >
            <div className="text-left">
              <h3 className="text-2xl font-manrope-bold font-bold text-primary-foreground mb-3">
                Residential VPN
              </h3>
              <p className="text-primary-foreground/90 mb-6 text-sm leading-relaxed">
                Military-grade encryption with real residential IPs. Access global content securely and anonymously.
              </p>
              <div className="text-primary-foreground mb-6 space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Real Residential IPs</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>USA Coverage</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Starting at $2.50/day</span>
                </div>
              </div>
              <Link
                to="/vpn"
                onClick={() => {
                  trackConversion(
                    "vpn_plans_navigation",
                    "product_interest",
                    "/vpn",
                  );
                  trackViewContent?.({
                    productId: "vpn-residential",
                    productName: "Residential VPN",
                    category: "vpn",
                    value: 2.50,
                  });
                }}
                className="w-full block text-center px-6 py-3 bg-white text-red-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-semibold"
              >
                View plans
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

