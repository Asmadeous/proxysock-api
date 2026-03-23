import { useState, useEffect } from "react";
import api from '../../../services/api';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Phone,
  MessageSquare,
  Wifi,
  Globe,
  Check,
} from "lucide-react";

interface ESIMPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

// Arrays removed. Will be fetched from API.

const getCarrierLogo = (provider: string) => {
  if (provider.toLowerCase() === "lyca") return "/at&t.png";
  if (provider.toLowerCase() === "colt") return "/t-mobile.png";
  return "";
};

export const ESIMPlansSection = ({ trackConversion }: ESIMPlansSectionProps) => {
  const [activeTab, setActiveTab] = useState("usa");
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
          if (!isGlobal) {
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
              region: 'USA',
              coverage: 'Nationwide US Coverage',
              icon: Globe,
              color: 'primary'
            }));
          }

          // Group Global Plans by Location
          const groups: Record<string, any> = {};
          products.forEach((p: any) => {
            const locName = p.metadata?.location_name || 'Global';
            const price = (p.price || 0) * 100;

            if (!groups[locName] || price < groups[locName].price) {
              groups[locName] = {
                id: p.id.toString(),
                name: locName,
                price: price,
                currency_code: p.currency || 'USD',
                data_amount: p.data_gb ? `${p.data_gb} GB` : "High-speed Data",
                duration: p.duration_days || 7,
                duration_unit: "days",
                coverage: p.metadata?.location_name || 'Global coverage',
                region: 'Global',
                icon: Globe,
                startsFrom: true
              };
            }
          });

          return Object.values(groups);
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
                        <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                          {plan.name}
                        </h3>
                      </div>

                      <p className="text-muted-foreground text-sm mb-4">
                        {plan.coverage}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                            Pricing
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-muted-foreground font-medium">Starts from</span>
                            <span className="text-2xl font-black text-primary">
                              {formatPrice(plan.price)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Valid for {plan.duration} {plan.duration_unit}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Unlimited Incoming SMS</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          <span>4G/5G High-speed Data</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Instant QR Delivery</span>
                        </div>
                      </div>

                      <Link
                        to="/dashboard/esim"
                        onClick={() =>
                          trackConversion?.(
                            "esim_plan_purchase",
                            "conversion",
                            "/dashboard/esim"
                          )
                        }
                        className="w-full block text-center px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm font-black uppercase tracking-widest"
                      >
                        Explore Plans
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )
        }
      </div>
    </div>
  );
};
