import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { Link } from "react-router-dom";

export const ProxyType = () => {
  return (
    <section className="relative bg-background py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-manrope-bold font-bold text-foreground mb-4">
            Choose Your Proxy Type
          </h2>
          <p className="text-lg font-inter-regular text-muted-foreground max-w-3xl mx-auto">
            Buy proxies tailored for web scraping, social media automation, SEO
            tools, and secure browsing. Select from datacenter, residential,
            ISP, or static residential proxies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Datacenter Proxies */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-3 font-manrope-bold font-bold text-xl text-foreground">
              Buy Datacenter Proxies
            </h3>
            <p className="mb-6 text-muted-foreground text-sm font-inter-regular">
              Buy datacenter proxies for high-volume tasks like web scraping and
              data mining.
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {[
                "High-speed performance",
                "99.9% Uptime guarantee",
                "Multiple locations",
                "Dedicated IPs",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard/proxies"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center font-medium text-sm"
            >
              Buy Now
            </Link>
          </motion.div>

          {/* ISP Proxies */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-3 font-manrope-bold font-bold text-xl text-foreground">
              Buy ISP Proxies
            </h3>
            <p className="mb-6 text-muted-foreground text-sm font-inter-regular">
              Buy ISP proxies with authentic residential IPs for SEO and
              e-commerce.
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {[
                "Real ISP IP addresses",
                "Low detection rate",
                "Stable connection",
                "Premium support",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard/buy-proxies"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center font-medium text-sm"
            >
              Buy Now
            </Link>
          </motion.div>

          {/* Static Residential Proxies */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-3 font-manrope-bold font-bold text-xl text-foreground">
              Buy Static Residential Proxies
            </h3>
            <p className="mb-6 text-muted-foreground text-sm font-inter-regular">
              Buy static residential proxies for long-term projects with stable
              connections.
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {[
                "Real residential IPs",
                "Static IP allocation",
                "Unlimited bandwidth",
                "Global coverage",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard/buy-proxies"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center font-medium text-sm"
            >
              Buy Now
            </Link>
          </motion.div>

          {/* Residential Proxies */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-3 font-manrope-bold font-bold text-xl text-foreground">
              Buy Residential Proxies
            </h3>
            <p className="mb-6 text-muted-foreground text-sm font-inter-regular">
              Buy rotating residential proxies for anonymous browsing and global
              access.
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {[
                "Rotating IPs",
                "Worldwide locations",
                "HTTPS/SOCKS5 support",
                "Geo-targeting",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard/buy-proxies"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center font-medium text-sm"
            >
              Buy Now
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
