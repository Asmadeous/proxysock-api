import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ComputerDesktopIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface RDPPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

const rdpPlans = [
  {
    name: "Basic",
    price: "$40",
    cadPrice: "$28",
    vcpu: "1 vCPU",
    ram: "2GB RAM",
    storage: "40GB SSD Storage",
    users: "1 Concurrent User",
    features: [
      "Real Residential IP",
      "Full Admin Access",
      "Multi-OS Support",
      "24/7 Support",
    ],
  },
  {
    name: "Standard",
    price: "$95",
    cadPrice: "$83",
    vcpu: "2 vCPU",
    ram: "4GB RAM",
    storage: "80GB SSD Storage",
    users: "1 Concurrent User",
    features: [
      "Real Residential IP",
      "DDoS Protection",
      "Priority Support",
      "Multi-OS Support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$150",
    cadPrice: "$138",
    vcpu: "3 vCPU",
    ram: "6GB RAM",
    storage: "120GB SSD Storage",
    users: "1 Concurrent User",
    features: [
      "Real Residential IP",
      "Backup Service",
      "DDoS Protection",
      "Priority Support",
    ],
  },
  {
    name: "Ultra",
    price: "$220",
    cadPrice: "$208",
    vcpu: "4 vCPU",
    ram: "8GB RAM",
    storage: "160GB SSD Storage",
    users: "1 Concurrent User",
    features: [
      "Real Residential IP",
      "High Performance",
      "Backup Service",
      "Premium Support",
    ],
  },
];

export const RDPPlansSection = ({ trackConversion }: RDPPlansSectionProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative bg-background py-16">
      <div className="absolute inset-0 z-0 opacity-20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Choose Your Residential RDP Plan
          </h2>
          <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
            All plans include real residential IPs, unlimited bandwidth, instant
            activation, and 24/7 support
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

        {/* RDP Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rdpPlans.map((plan, index) => (
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
                <ComputerDesktopIcon className="h-8 w-8 text-primary" />
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
                  <span className="font-manrope-semibold">{plan.users}</span>
                </div>
              </div>

              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>

              <Link
                to={isAuthenticated ? "/dashboard/rdp" : "/register"}
                onClick={() =>
                  trackConversion?.(
                    "rdp_plan_purchase",
                    "conversion",
                    "/dashboard/rdp"
                  )
                }
                className={`w-full block text-center px-4 py-2 rounded-md transition-colors text-sm font-manrope-semibold ${
                  plan.name === "Ultra"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Configure & Buy →
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
            {["Windows Server 2022", "Ubuntu Desktop", "Fedora Desktop"].map(
              (os) => (
                <span
                  key={os}
                  className="bg-muted/50 text-muted-foreground px-3 py-1 rounded text-xs font-manrope-semibold"
                >
                  {os}
                </span>
              )
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
