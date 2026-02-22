import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ServerIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

interface VPSPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

const vpsPlans = [
  {
    name: "Basic",
    price: "$35",
    cadPrice: "$23",
    vcpu: "1 vCPU",
    ram: "2GB RAM",
    storage: "40GB SSD Storage",
    bandwidth: "Unlimited Bandwidth",
    features: [
      "Real Residential IP",
      "Full Root Access",
      "99.9% Uptime",
      "24/7 Support",
    ],
  },
  {
    name: "Standard",
    price: "$50",
    cadPrice: "$38",
    vcpu: "2 vCPU",
    ram: "4GB RAM",
    storage: "80GB SSD Storage",
    bandwidth: "Unlimited Bandwidth",
    features: [
      "Real Residential IP",
      "Full Root Access",
      "DDoS Protection",
      "Priority Support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$65",
    cadPrice: "$53",
    vcpu: "3 vCPU",
    ram: "6GB RAM",
    storage: "120GB NVMe SSD",
    bandwidth: "Unlimited Bandwidth",
    features: [
      "Real Residential IP",
      "NVMe SSD Storage",
      "DDoS Protection",
      "Priority Support",
    ],
  },
  {
    name: "Ultra",
    price: "$100",
    cadPrice: "$88",
    vcpu: "4 vCPU",
    ram: "8GB RAM",
    storage: "160GB NVMe SSD",
    bandwidth: "Unlimited Bandwidth",
    features: [
      "Real Residential IP",
      "High Performance",
      "DDoS Protection",
      "24/7 Premium Support",
    ],
  },
];

export const VPSPlansSection = ({ trackConversion }: VPSPlansSectionProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative bg-background py-16">
      <div className="absolute inset-0 z-0 opacity-20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Choose Your Residential VPS Plan
          </h2>
          <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
            All plans include real residential IPs, unlimited bandwidth, and
            instant deployment
          </p>
        </div>

        {/* Location Pricing Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-8"
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <GlobeAltIcon className="h-5 w-5 text-primary" />
            <p className="text-primary text-center text-sm font-manrope-semibold">
              🌍 Available in 5 Locations: USA • UK • Germany • Canada •
              Australia
            </p>
            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-manrope-bold">
              🇨🇦 Cheapest in Canada!
            </span>
          </div>
        </motion.div>

        {/* VPS Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vpsPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-card/80 backdrop-blur-xl rounded-lg p-6 border ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border"
              } relative`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-manrope-bold">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                  {plan.name}
                </h3>
                <ServerIcon className="h-8 w-8 text-primary" />
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-manrope-bold font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    /month USD
                  </span>
                </div>
                <div className="bg-primary/20 border border-primary/50 rounded px-2 py-1 inline-block">
                  <span className="text-primary text-xs font-manrope-semibold">
                    🇨🇦 {plan.cadPrice} CAD/mo
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-foreground">
                  <span className="font-manrope-semibold">{plan.vcpu}</span>
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="font-manrope-semibold">{plan.ram}</span>
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="font-manrope-semibold">{plan.storage}</span>
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="font-manrope-semibold">
                    {plan.bandwidth}
                  </span>
                </div>
              </div>

              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>

              <Link
                to={isAuthenticated ? "/dashboard/vps" : "/register"}
                onClick={() =>
                  trackConversion?.(
                    "vps_plan_purchase",
                    "conversion",
                    "/dashboard/vps"
                  )
                }
                className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
              >
                Deploy Now →
              </Link>
            </motion.div>
          ))}
        </div>

        {/* OS Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">
            Available Operating Systems:
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              "Ubuntu Server",
              "Debian",
              "Rocky Linux",
              "AlmaLinux",
              "Windows Server 2022",
            ].map((os) => (
              <span
                key={os}
                className="bg-muted/50 text-muted-foreground px-3 py-1 rounded text-xs font-manrope-semibold"
              >
                {os}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
