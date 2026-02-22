import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Phone,
  MessageSquare,
  Wifi,
  Globe,
  MapPin,
  Signal,
} from "lucide-react";

interface ESIMPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

const usaPlans = [
  {
    id: "colt-usa-1",
    provider: "colt",
    name: "Colt USA Premium",
    price: 2999,
    currency_code: "USD",
    voice_minutes: "Unlimited",
    sms_included: true,
    data_amount: "10 GB",
    duration: 30,
    duration_unit: "days",
    features: [
      "Keep your number active",
      "No roaming charges",
      "5G/4G LTE Network",
      "Instant activation via QR",
    ],
  },
  {
    id: "lyca-usa-1",
    provider: "lyca",
    name: "Lyca USA Basic",
    price: 1599,
    currency_code: "USD",
    voice_minutes: "500 mins",
    sms_included: true,
    data_amount: "3 GB",
    duration: 30,
    duration_unit: "days",
    features: [
      "Free Int'l Texts",
      "No contracts",
      "4G LTE Network",
      "Bring your own phone",
    ],
  },
];

const globalPlans = [
  {
    id: "global-1",
    provider: "tmobile",
    name: "Global Explorer",
    region: "Global",
    coverage: "200+ Countries",
    data_amount: "5 GB",
    duration: 30,
    duration_unit: "days",
    price: 3599,
    currency_code: "USD",
    icon: Globe,
  },
  {
    id: "eu-1",
    provider: "orange",
    name: "Euro Connect",
    region: "Europe",
    coverage: "40+ Countries",
    data_amount: "10 GB",
    duration: 30,
    duration_unit: "days",
    price: 2499,
    currency_code: "USD",
    icon: MapPin,
  },
  {
    id: "usa-data-1",
    provider: "tmobile",
    name: "USA Data Pro",
    region: "USA Data",
    coverage: "USA Nationwide",
    data_amount: "Unlimited",
    duration: 15,
    duration_unit: "days",
    price: 4599,
    currency_code: "USD",
    icon: Signal,
  },
];

const getCarrierLogo = (provider: string) => {
  if (provider.toLowerCase() === "lyca") return "/at&t.png";
  if (provider.toLowerCase() === "colt") return "/t-mobile.png";
  return "";
};

export const ESIMPlansSection = ({ trackConversion }: ESIMPlansSectionProps) => {
  const [activeTab, setActiveTab] = useState("usa");

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  return (
    <div className="relative bg-background py-16">
      <div className="absolute inset-0 z-0 opacity-20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab("usa")}
            className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${activeTab === "usa"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
              }`}
          >
            <Phone className="h-5 w-5" />
            USA eSIM
            <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">
              Voice + Data
            </span>
          </button>

          <button
            onClick={() => setActiveTab("global")}
            className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${activeTab === "global"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
              }`}
          >
            <Globe className="h-5 w-5" />
            Global eSIM
            <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">
              Data Only
            </span>
          </button>
        </div>

        {/* USA eSIM Plans */}
        {activeTab === "usa" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
                USA eSIM with Phone Number
              </h2>
              <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
                Complete mobile service with voice calling, unlimited texting,
                and high-speed data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {usaPlans.map((plan) => {
                const carrierLogo = getCarrierLogo(plan.provider);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-primary/20 hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                          {plan.name}
                        </h3>
                      </div>
                      {carrierLogo && (
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                          <span className="text-xs text-muted-foreground font-semibold uppercase">
                            Sponsored by
                          </span>
                          <img
                            src={carrierLogo}
                            alt="Carrier"
                            className="h-5 w-auto"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded uppercase font-manrope-semibold">
                        {plan.provider}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4">
                      Real US phone number with voice, text, and data
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-sm text-foreground">
                          <span className="text-primary font-manrope-bold">
                            {formatPrice(plan.price)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid for {plan.duration} {plan.duration_unit}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-muted/50 p-3 rounded text-center">
                        <Phone className="h-5 w-5 text-primary mx-auto mb-1" />
                        <span className="text-foreground font-manrope-bold text-xs block">
                          {plan.voice_minutes}
                        </span>
                        <span className="text-xs text-muted-foreground">Voice</span>
                      </div>
                      <div className="bg-muted/50 p-3 rounded text-center">
                        <MessageSquare className="h-5 w-5 text-primary mx-auto mb-1" />
                        <span className="text-foreground font-manrope-bold text-xs block">
                          Unlimited
                        </span>
                        <span className="text-xs text-muted-foreground">SMS</span>
                      </div>
                      <div className="bg-muted/50 p-3 rounded text-center">
                        <Wifi className="h-5 w-5 text-primary mx-auto mb-1" />
                        <span className="text-foreground font-manrope-bold text-xs block">
                          {plan.data_amount}
                        </span>
                        <span className="text-xs text-muted-foreground">Data</span>
                      </div>
                    </div>

                    <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>✓ {feature}</li>
                      ))}
                    </ul>

                    <Link
                      to="/dashboard/esim"
                      onClick={() =>
                        trackConversion?.(
                          "esim_plan_purchase",
                          "conversion",
                          "/dashboard/esim"
                        )
                      }
                      className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
                    >
                      Buy Now
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Global eSIM Plans */}
        {activeTab === "global" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
                Global & Regional eSIM Plans
              </h2>
              <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
                Choose from our flexible data plans for travelers and digital
                nomads
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {globalPlans.map((plan) => {
                const IconComponent = plan.icon;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <IconComponent className="h-8 w-8 text-primary mr-3" />
                      <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                        {plan.name}
                      </h3>
                    </div>
                    {plan.region === "Global" && (
                      <div className="mb-2">
                        <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded font-manrope-semibold">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.coverage}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-sm text-foreground">
                          {plan.data_amount}:{" "}
                          <span className="text-primary font-manrope-bold">
                            {formatPrice(plan.price)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid for {plan.duration} {plan.duration_unit}
                        </p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                      <li>
                        ✓{" "}
                        {plan.region === "Global"
                          ? "200+ countries coverage"
                          : plan.region === "Europe"
                            ? "40+ European countries"
                            : plan.region === "USA Data"
                              ? "T-Mobile 5G network"
                              : plan.region === "Asia Pacific"
                                ? "30+ Asian countries"
                                : plan.region === "Latin America"
                                  ? "20+ Latin countries"
                                  : "Gulf countries included"}
                      </li>
                      <li>✓ 5G/4G LTE speeds</li>
                      <li>✓ Instant QR activation</li>
                      <li>✓ Keep your number</li>
                    </ul>
                    <Link
                      to="/dashboard/esim"
                      onClick={() =>
                        trackConversion?.(
                          "esim_plan_purchase",
                          "conversion",
                          "/dashboard/esim"
                        )
                      }
                      className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
                    >
                      Buy Now
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
