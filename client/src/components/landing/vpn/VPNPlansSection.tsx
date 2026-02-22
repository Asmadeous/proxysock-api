import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheckIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface VPNPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

const vpnPlans = [
  {
    name: "Basic",
    price: "$15",
    cadPrice: "$9.99",
    speed: "100 Mbps",
    locations: "10 Locations",
    devices: "2 Devices",
    features: [
      "Military-Grade Encryption",
      "No-Logs Policy",
      "Kill Switch",
      "24/7 Support",
    ],
  },
  {
    name: "Pro",
    price: "$25",
    cadPrice: "$19.99",
    speed: "500 Mbps",
    locations: "30 Locations",
    devices: "5 Devices",
    features: [
      "Ultra-Fast Speeds",
      "Streaming Optimized",
      "Dedicated IP",
      "Priority Support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$35",
    cadPrice: "$29.99",
    speed: "1 Gbps",
    locations: "50+ Locations",
    devices: "10 Devices",
    features: [
      "Maximum Speed",
      "All Server Locations",
      "Advanced Features",
      "Premium Support",
    ],
  },
  {
    name: "Ultimate",
    price: "$55",
    cadPrice: "$49.99",
    speed: "Unlimited",
    locations: "50+ Locations",
    devices: "Unlimited",
    features: [
      "Unlimited Bandwidth",
      "All Premium Features",
      "Business Support",
      "Custom Setup",
    ],
  },
];

export const VPNPlansSection = ({ trackConversion }: VPNPlansSectionProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative bg-background py-16">
      <div className="absolute inset-0 z-0 opacity-20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Choose Your VPN Plan
          </h2>
          <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
            All plans include military-grade encryption, global server coverage,
            instant activation, and 24/7 support
          </p>
        </div>

        {/* Global Coverage Banner */}
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
              🌍 50+ Server Locations Worldwide: USA • UK • Germany • Canada •
              Australia • Japan • Singapore • More
            </p>
            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-manrope-bold">
              🇨🇦 Best Prices in Canada!
            </span>
          </div>
        </motion.div>

        {/* VPN Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vpnPlans.map((plan, index) => (
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
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                  {plan.name}
                </h3>
                <ShieldCheckIcon className="h-8 w-8 text-primary" />
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
                  <span className="font-manrope-semibold">Speed: {plan.speed}</span>
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="font-manrope-semibold">Locations: {plan.locations}</span>
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="font-manrope-semibold">Devices: {plan.devices}</span>
                </div>
              </div>

              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>

              <Link
                to={isAuthenticated ? "/dashboard/vpn" : "/register"}
                onClick={() =>
                  trackConversion?.(
                    "vpn_plan_purchase",
                    "conversion",
                    "/dashboard/vpn"
                  )
                }
                className={`w-full block text-center px-4 py-2 rounded-md transition-colors text-sm font-manrope-semibold ${
                  plan.name === "Ultimate"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Get Started →
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Protocol Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">
            Supported Protocols:
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {["OpenVPN", "WireGuard", "IKEv2", "SSTP"].map(
              (protocol) => (
                <span
                  key={protocol}
                  className="bg-muted/50 text-muted-foreground px-3 py-1 rounded text-xs font-manrope-semibold"
                >
                  {protocol}
                </span>
              )
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
