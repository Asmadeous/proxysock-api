<<<<<<< HEAD
import { useState } from "react";
=======
import { useState, useEffect } from "react";
import api from '../../../services/api';
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Phone,
  MessageSquare,
  Wifi,
  Globe,
<<<<<<< HEAD
  MapPin,
  Signal,
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
} from "lucide-react";

interface ESIMPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

<<<<<<< HEAD
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
      "US Phone Number Included",
      "Unlimited Voice Calls",
      "Unlimited SMS & MMS",
      "10 GB High-Speed Data",
      "4G/5G Network Access",
      "Instant Activation",
    ],
    phone_number_included: true,
  },
  {
    id: "lyca-usa-1",
    provider: "lyca",
    name: "Lyca USA Essential",
    price: 2999,
    currency_code: "USD",
    voice_minutes: "Unlimited",
    sms_included: true,
    data_amount: "8 GB",
    duration: 30,
    duration_unit: "days",
    features: [
      "US Phone Number Included",
      "Unlimited Voice Calls",
      "Unlimited SMS & MMS",
      "8 GB High-Speed Data",
      "4G/5G Network Access",
      "No Contract Required",
    ],
    phone_number_included: true,
  },
];

const globalPlans = [
  {
    id: "global-1",
    name: "Global Starter",
    region: "Global",
    price: 999,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "primary",
  },
  {
    id: "global-2",
    name: "Global Traveler",
    region: "Global",
    price: 2499,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "primary",
  },
  {
    id: "global-3",
    name: "Global Explorer",
    region: "Global",
    price: 3999,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "primary",
  },
  {
    id: "global-4",
    name: "Global Pro",
    region: "Global",
    price: 6999,
    data_amount: "10GB",
    duration: 30,
    duration_unit: "days",
    coverage: "200+ countries worldwide. Perfect for world travelers.",
    icon: Globe,
    color: "primary",
  },
  {
    id: "europe-1",
    name: "Europe Essential",
    region: "Europe",
    price: 699,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "primary",
  },
  {
    id: "europe-2",
    name: "Europe Plus",
    region: "Europe",
    price: 1599,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "primary",
  },
  {
    id: "europe-3",
    name: "Europe Pro",
    region: "Europe",
    price: 2499,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "primary",
  },
  {
    id: "europe-4",
    name: "Europe Unlimited",
    region: "Europe",
    price: 3999,
    data_amount: "10GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Coverage in 40+ European countries including UK, France, Germany, Italy.",
    icon: MapPin,
    color: "primary",
  },
  {
    id: "usa-data-1",
    name: "USA Starter",
    region: "USA Data",
    price: 899,
    data_amount: "1GB",
    duration: 7,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "primary",
  },
  {
    id: "usa-data-2",
    name: "USA Plus",
    region: "USA Data",
    price: 1999,
    data_amount: "3GB",
    duration: 15,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "primary",
  },
  {
    id: "usa-data-3",
    name: "USA Pro",
    region: "USA Data",
    price: 2999,
    data_amount: "5GB",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "primary",
  },
  {
    id: "usa-data-4",
    name: "USA Unlimited",
    region: "USA Data",
    price: 4999,
    data_amount: "Unlimited",
    duration: 30,
    duration_unit: "days",
    coverage:
      "Nationwide coverage across the United States with T-Mobile network.",
    icon: Signal,
    color: "primary",
  },
];
=======
// Arrays removed. Will be fetched from API.
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

const getCarrierLogo = (provider: string) => {
  if (provider.toLowerCase() === "lyca") return "/at&t.png";
  if (provider.toLowerCase() === "colt") return "/t-mobile.png";
  return "";
};

export const ESIMPlansSection = ({ trackConversion }: ESIMPlansSectionProps) => {
  const [activeTab, setActiveTab] = useState("usa");
<<<<<<< HEAD
=======
  const [usaPlans, setUsaPlans] = useState<any[]>([]);
  const [globalPlans, setGlobalPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const [usaRes, globalRes] = await Promise.all([
          api.get('/web/api/products?product_type=usa_esim'),
          api.get('/web/api/products?product_type=esim')
        ]);

        const formatPlans = (products: any[], isGlobal: boolean) => {
          return products.map((p: any) => ({
            id: p.id.toString(),
            provider: p.provider_type === 'colt' ? 'colt' : 'lyca',
            name: p.name,
            price: (p.price || 0) * 100, // Frontend expects cents
            currency_code: p.currency || 'USD',
            voice_minutes: p.calling_minutes === null ? "Unlimited" : (p.calling_minutes ? `${p.calling_minutes} Min` : "0 Min"),
            sms_included: p.sms_quota === null || (p.sms_quota && p.sms_quota > 0),
            data_amount: p.data_gb ? `${p.data_gb} GB` : "Unlimited Data",
            duration: p.duration_days || 30,
            duration_unit: "days",
            features: p.features || ['4G/5G Coverage', 'Instant QR Activation'],
            phone_number_included: p.esim_type === 'voice_data_sms',
            region: isGlobal ? 'Global' : 'USA',
            coverage: isGlobal ? '200+ countries worldwide' : 'Nationwide US Coverage',
            icon: Globe,
            color: 'primary'
          }));
        };

        setUsaPlans(formatPlans(usaRes.data.products || [], false));
        setGlobalPlans(formatPlans(globalRes.data.products || [], true));
      } catch (err) {
        console.error("Failed to load eSIM plans:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

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
<<<<<<< HEAD
            className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${
              activeTab === "usa"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
            }`}
=======
            className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${activeTab === "usa"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
              }`}
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          >
            <Phone className="h-5 w-5" />
            USA eSIM
            <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">
              Voice + Data
            </span>
          </button>

          <button
            onClick={() => setActiveTab("global")}
<<<<<<< HEAD
            className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${
              activeTab === "global"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
            }`}
=======
            className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 ${activeTab === "global"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
              }`}
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          >
            <Globe className="h-5 w-5" />
            Global eSIM
            <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">
              Data Only
            </span>
          </button>
        </div>

        {/* USA eSIM Plans */}
<<<<<<< HEAD
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
=======
        {
          activeTab === "usa" && (
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
                {isLoading ? (
                  <div className="col-span-full py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : usaPlans.map((plan) => {
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
                        {plan.features.map((feature: string, idx: number) => (
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
          )
        }

        {/* Global eSIM Plans */}
        {
          activeTab === "global" && (
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
                {isLoading ? (
                  <div className="col-span-full py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : globalPlans.map((plan) => {
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                        <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                          {plan.name}
                        </h3>
                      </div>
<<<<<<< HEAD
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
=======
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
          )
        }
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      </div>
    </div>
  );
};
