import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ServerIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { conversionTracker } from "../../utils/redditPixel";
import backgroundNode from "../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "../../store/themeStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LocationsHeroSection } from "@/components/landing/locations/LocationsHeroSection";
import { ProxiesContent } from "@/components/landing/locations/ProxiesContent";
import { RDPContent } from "@/components/landing/locations/RDPContent";
import { VPSContent } from "@/components/landing/locations/VPSContent";
import { EsimContent } from "@/components/landing/locations/EsimContent";

type ProductType = "proxies" | "rdp" | "vps" | "esim" | "vpn";

interface City {
  name: string;
  code: string;
  latency: string;
  status: "optimal" | "good" | "maintenance";
  uptime: string;
  specs?: string[];
}

interface Country {
  country: string;
  flag: string;
  cities: City[];
  providers?: string[];
}

interface Region {
  name: string;
  icon: JSX.Element;
  countries: Country[];
}

export default function Locations() {
  const { dark } = useThemeStore();
  const [activeProduct, setActiveProduct] = useState<ProductType>("proxies");
  const [searchTerm] = useState("");

  const trackLocationInteraction = async (action: string, details: string) => {
    try {
      await conversionTracker.trackSearch(`location_${action}`, details);
      console.log(`✅ Location interaction tracked: ${action} - ${details}`);
    } catch (error) {
      console.error("❌ Failed to track location interaction:", error);
    }
  };

  const handleProductChange = (product: ProductType) => {
    setActiveProduct(product);
    trackLocationInteraction("product_switch", product);
  };

  const handleCityClick = (city: string, country: string) => {
    trackLocationInteraction("city_click", `${city}_${country}`);
  };

  const infrastructureLocations: Region[] = [
    {
      name: "North America",
      icon: <GlobeAltIcon className="h-6 w-6" />,
      countries: [
        {
          country: "United States",
          flag: "🇺🇸",
          cities: [
            {
              name: "New York",
              code: "NYC",
              latency: "1ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "DDoS Protection"],
            },
            {
              name: "Los Angeles",
              code: "LAX",
              latency: "2ms",
              status: "optimal",
              uptime: "99.98%",
              specs: ["1Gbps", "IPv4/IPv6", "DDoS Protection"],
            },
            {
              name: "Chicago",
              code: "CHI",
              latency: "1ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Premium Network"],
            },
            {
              name: "Dallas",
              code: "DFW",
              latency: "2ms",
              status: "optimal",
              uptime: "99.97%",
              specs: ["1Gbps", "IPv4/IPv6", "DDoS Protection"],
            },
            {
              name: "Miami",
              code: "MIA",
              latency: "3ms",
              status: "optimal",
              uptime: "99.96%",
              specs: ["1Gbps", "IPv4/IPv6", "Latin America Gateway"],
            },
            {
              name: "Seattle",
              code: "SEA",
              latency: "2ms",
              status: "optimal",
              uptime: "99.98%",
              specs: ["1Gbps", "IPv4/IPv6", "Asia Pacific Route"],
            },
            {
              name: "Washington DC",
              code: "IAD",
              latency: "1ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Government Grade"],
            },
            {
              name: "Ashburn",
              code: "ASH",
              latency: "1ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Data Center Hub"],
            },
          ],
          providers: ["AT&T", "Verizon", "Comcast", "Spectrum", "Frontier"],
        },
        {
          country: "Canada",
          flag: "🇨🇦",
          cities: [
            {
              name: "Toronto",
              code: "YYZ",
              latency: "3ms",
              status: "optimal",
              uptime: "99.97%",
              specs: ["1Gbps", "IPv4/IPv6", "Financial District"],
            },
            {
              name: "Vancouver",
              code: "YVR",
              latency: "4ms",
              status: "optimal",
              uptime: "99.96%",
              specs: ["1Gbps", "IPv4/IPv6", "Asia Pacific Gateway"],
            },
          ],
        },
      ],
    },
    {
      name: "Europe",
      icon: <BuildingOffice2Icon className="h-6 w-6" />,
      countries: [
        {
          country: "United Kingdom",
          flag: "🇬🇧",
          cities: [
            {
              name: "London",
              code: "LHR",
              latency: "2ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Financial Hub"],
            },
            {
              name: "Manchester",
              code: "MAN",
              latency: "3ms",
              status: "optimal",
              uptime: "99.97%",
              specs: ["1Gbps", "IPv4/IPv6", "Northern England"],
            },
          ],
          providers: ["Virgin Media", "BT", "Sky"],
        },
        {
          country: "Germany",
          flag: "🇩🇪",
          cities: [
            {
              name: "Frankfurt",
              code: "FRA",
              latency: "2ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Financial Center"],
            },
            {
              name: "Berlin",
              code: "BER",
              latency: "3ms",
              status: "optimal",
              uptime: "99.98%",
              specs: ["1Gbps", "IPv4/IPv6", "Tech Hub"],
            },
          ],
        },
        {
          country: "Netherlands",
          flag: "🇳🇱",
          cities: [
            {
              name: "Amsterdam",
              code: "AMS",
              latency: "2ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Europe Gateway"],
            },
          ],
        },
        {
          country: "France",
          flag: "🇫🇷",
          cities: [
            {
              name: "Paris",
              code: "CDG",
              latency: "3ms",
              status: "optimal",
              uptime: "99.98%",
              specs: ["1Gbps", "IPv4/IPv6", "Fashion & Finance"],
            },
          ],
        },
      ],
    },
    {
      name: "Asia Pacific",
      icon: <GlobeAltIcon className="h-6 w-6" />,
      countries: [
        {
          country: "Japan",
          flag: "🇯🇵",
          cities: [
            {
              name: "Tokyo",
              code: "NRT",
              latency: "3ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "Financial District"],
            },
            {
              name: "Osaka",
              code: "KIX",
              latency: "4ms",
              status: "optimal",
              uptime: "99.97%",
              specs: ["1Gbps", "IPv4/IPv6", "Manufacturing Hub"],
            },
          ],
        },
        {
          country: "Singapore",
          flag: "🇸🇬",
          cities: [
            {
              name: "Singapore",
              code: "SIN",
              latency: "3ms",
              status: "optimal",
              uptime: "99.99%",
              specs: ["1Gbps", "IPv4/IPv6", "APAC Gateway"],
            },
          ],
        },
        {
          country: "Australia",
          flag: "🇦🇺",
          cities: [
            {
              name: "Sydney",
              code: "SYD",
              latency: "4ms",
              status: "optimal",
              uptime: "99.98%",
              specs: ["1Gbps", "IPv4/IPv6", "Financial Center"],
            },
            {
              name: "Melbourne",
              code: "MEL",
              latency: "5ms",
              status: "optimal",
              uptime: "99.96%",
              specs: ["1Gbps", "IPv4/IPv6", "Cultural Hub"],
            },
          ],
        },
      ],
    },
  ];

  const esimRegions = [
    {
      name: "North America",
      icon: <GlobeAltIcon className="h-6 w-6" />,
      countries: 23,
      totalPlans: 156,
      highlights: ["United States", "Canada", "Mexico", "Costa Rica", "Panama"],
      networks: ["Verizon", "AT&T", "T-Mobile", "Rogers", "Bell", "Telus"],
      features: [
        "5G Available",
        "Multi-carrier",
        "Instant activation",
        "eSIM+",
        "Data-only plans",
      ],
      popularPlans: [
        {
          name: "USA Unlimited",
          data: "Unlimited",
          period: "30 days",
          price: "$45",
        },
        {
          name: "North America",
          data: "20GB",
          period: "30 days",
          price: "$35",
        },
        { name: "USA/Canada", data: "10GB", period: "15 days", price: "$25" },
      ],
    },
    {
      name: "Europe",
      icon: <BuildingOffice2Icon className="h-6 w-6" />,
      countries: 47,
      totalPlans: 234,
      highlights: [
        "All EU Countries",
        "United Kingdom",
        "Switzerland",
        "Norway",
        "Iceland",
      ],
      networks: [
        "Vodafone",
        "Orange",
        "T-Mobile",
        "Three",
        "O2",
        "Deutsche Telekom",
      ],
      features: [
        "Regional plans",
        "EU roaming",
        "High-speed 5G",
        "Multi-country",
        "Data+Voice",
      ],
      popularPlans: [
        {
          name: "Europe Unlimited",
          data: "Unlimited",
          period: "30 days",
          price: "$35",
        },
        { name: "EU + UK", data: "15GB", period: "30 days", price: "$25" },
        {
          name: "Europe Traveler",
          data: "5GB",
          period: "7 days",
          price: "$15",
        },
      ],
    },
    {
      name: "Asia Pacific",
      icon: <GlobeAltIcon className="h-6 w-6" />,
      countries: 35,
      totalPlans: 189,
      highlights: [
        "Japan",
        "South Korea",
        "Australia",
        "Singapore",
        "Thailand",
        "Hong Kong",
      ],
      networks: [
        "NTT Docomo",
        "SoftBank",
        "SK Telecom",
        "Singtel",
        "Telstra",
        "AIS",
      ],
      features: [
        "Premium networks",
        "5G coverage",
        "Multi-country plans",
        "Business rates",
        "High-speed",
      ],
      popularPlans: [
        { name: "Asia Pacific", data: "20GB", period: "30 days", price: "$40" },
        {
          name: "Japan + Korea",
          data: "10GB",
          period: "15 days",
          price: "$30",
        },
        { name: "ASEAN", data: "8GB", period: "14 days", price: "$22" },
      ],
    },
    {
      name: "Middle East & Africa",
      icon: <GlobeAltIcon className="h-6 w-6" />,
      countries: 28,
      totalPlans: 98,
      highlights: [
        "UAE",
        "Saudi Arabia",
        "South Africa",
        "Israel",
        "Egypt",
        "Qatar",
      ],
      networks: ["Etisalat", "du", "STC", "Vodacom", "MTN", "Partner"],
      features: [
        "Growing 5G",
        "Business plans",
        "Regional coverage",
        "Premium support",
      ],
      popularPlans: [
        { name: "Gulf States", data: "15GB", period: "30 days", price: "$35" },
        { name: "Middle East", data: "8GB", period: "14 days", price: "$25" },
        { name: "Africa", data: "5GB", period: "7 days", price: "$20" },
      ],
    },
    {
      name: "Latin America",
      icon: <GlobeAltIcon className="h-6 w-6" />,
      countries: 17,
      totalPlans: 67,
      highlights: [
        "Brazil",
        "Argentina",
        "Chile",
        "Colombia",
        "Peru",
        "Mexico",
      ],
      networks: ["Claro", "Movistar", "Vivo", "TIM", "Entel"],
      features: [
        "Expanding network",
        "Local partnerships",
        "Competitive rates",
        "Growing 5G",
      ],
      popularPlans: [
        {
          name: "Latin America",
          data: "12GB",
          period: "30 days",
          price: "$30",
        },
        { name: "Brazil", data: "8GB", period: "15 days", price: "$20" },
        { name: "South America", data: "6GB", period: "7 days", price: "$18" },
      ],
    },
  ];

  useEffect(() => {
    document.title =
      "Global Locations - ProxySock | Server Locations for Proxies, VPN, RDP, VPS & eSIM Coverage";
  }, []);

  const filteredInfrastructure = infrastructureLocations
    .map((region) => ({
      ...region,
      countries: region.countries
        .map((country) => ({
          ...country,
          cities: country.cities.filter(
            (city) =>
              city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              city.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              country.country.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((country) => country.cities.length > 0),
    }))
    .filter((region) => region.countries.length > 0);

  const filteredESIM = esimRegions.filter(
    (region) =>
      region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.highlights.some((country) =>
        country.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className=" min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.10] pointer-events-none"
          style={{
            backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative z-10">
          <LocationsHeroSection />
        </div>
      </div>

      {/* Tabs Section */}
      <div className="relative py-16">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs
            value={activeProduct}
            onValueChange={(value) => handleProductChange(value as ProductType)}
            className="w-full"
          >
            <div className="flex flex-col items-start mb-8">
              <TabsList className="bg-muted p-1 h-auto rounded-full">
                <TabsTrigger
                  value="proxies"
                  className="data-[state=active]:bg-primary rounded-full px-6 py-3"
                >
                  <WifiIcon className="h-4 w-4 mr-2" />
                  Proxies
                </TabsTrigger>
                <TabsTrigger
                  value="rdp"
                  className="data-[state=active]:bg-primary rounded-full px-6 py-3"
                >
                  <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                  RDP
                </TabsTrigger>
                <TabsTrigger
                  value="vps"
                  className="data-[state=active]:bg-primary rounded-full px-6 py-3"
                >
                  <ServerIcon className="h-4 w-4 mr-2" />
                  VPS
                </TabsTrigger>
                <TabsTrigger
                  value="esim"
                  className="data-[state=active]:bg-primary rounded-full px-6 py-3"
                >
                  <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                  eSIM
                </TabsTrigger>
                <TabsTrigger
                  value="vpn"
                  className="data-[state=active]:bg-primary rounded-full px-6 py-3"
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  VPN
                </TabsTrigger>
              </TabsList>

              {/* Search Bar */}
              {/* <div className="w-full max-w-md mt-8">
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-full text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div> */}
            </div>

            {/* Proxies Content */}
            <TabsContent value="proxies" className="mt-8">
              <ProxiesContent
                filteredInfrastructure={filteredInfrastructure}
                handleCityClick={handleCityClick}
              />
            </TabsContent>

            {/* RDP and VPS Content - Similar structure */}
            <TabsContent value="rdp" className="mt-8">
              <RDPContent
                filteredInfrastructure={filteredInfrastructure}
                handleCityClick={handleCityClick}
              />
            </TabsContent>

            <TabsContent value="vps" className="mt-8">
              <VPSContent
                filteredInfrastructure={filteredInfrastructure}
                handleCityClick={handleCityClick}
              />
            </TabsContent>

            {/* eSIM Content */}
            <TabsContent value="esim" className="mt-8">
              <EsimContent filteredESIM={filteredESIM} />
            </TabsContent>

            {/* VPN Content */}
            <TabsContent value="vpn" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* VPN Hero Banner */}
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl p-8 border border-primary/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <ShieldCheckIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-manrope-bold font-bold text-foreground">
                        🇺🇸 USA Residential VPN
                      </h3>
                      <p className="text-muted-foreground">
                        Premium residential IP addresses from real US households
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-card/50 rounded-xl p-4 border border-border">
                      <div className="text-lg font-semibold text-foreground mb-2">Location</div>
                      <div className="text-2xl font-bold text-primary">United States</div>
                      <div className="text-sm text-muted-foreground mt-1">Multiple US cities covered</div>
                    </div>
                    <div className="bg-card/50 rounded-xl p-4 border border-border">
                      <div className="text-lg font-semibold text-foreground mb-2">IP Type</div>
                      <div className="text-2xl font-bold text-primary">Residential</div>
                      <div className="text-sm text-muted-foreground mt-1">Real ISP-assigned IPs</div>
                    </div>
                    <div className="bg-card/50 rounded-xl p-4 border border-border">
                      <div className="text-lg font-semibold text-foreground mb-2">Protocol</div>
                      <div className="text-2xl font-bold text-primary">WireGuard</div>
                      <div className="text-sm text-muted-foreground mt-1">Fast & secure encryption</div>
                    </div>
                  </div>
                </div>

                {/* VPN Features */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Why USA Residential VPN?</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">Bypass geo-restrictions for US-only content</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">Appear as a real US residential user</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">Access streaming services (Netflix, Hulu, etc.)</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">Shop on US-only e-commerce sites</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">Undetectable by anti-VPN systems</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Technical Specifications</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center">
                        <span className="text-muted-foreground">Connection Speed</span>
                        <span className="text-foreground font-semibold">Up to 1Gbps</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-muted-foreground">Encryption</span>
                        <span className="text-foreground font-semibold">ChaCha20</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-muted-foreground">Uptime SLA</span>
                        <span className="text-foreground font-semibold">99.9%</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-muted-foreground">Platforms</span>
                        <span className="text-foreground font-semibold">Windows, macOS, iOS, Android</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-muted-foreground">Kill Switch</span>
                        <span className="text-foreground font-semibold">Included</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center py-8">
                  <a
                    href="/vpn"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg transition-all"
                  >
                    <ShieldCheckIcon className="h-5 w-5" />
                    Get USA Residential VPN
                  </a>
                  <p className="text-muted-foreground mt-4">Starting from $9.99/month</p>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Global Performance Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-manrope-bold font-bold text-foreground text-center mb-8">
              Global Performance Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-manrope-bold font-bold text-foreground mb-2">
                  99.9%
                </div>
                <div className="font-inter-regular text-muted-foreground">
                  Uptime SLA
                </div>
              </div>
              <div>
                <div className="text-4xl font-manrope-bold font-bold text-foreground mb-2">
                  &lt;5ms
                </div>
                <div className="font-inter-regular text-muted-foreground">
                  Average Latency
                </div>
              </div>
              <div>
                <div className="text-4xl font-manrope-bold font-bold text-foreground mb-2">
                  1Gbps
                </div>
                <div className="font-inter-regular text-muted-foreground">
                  Network Speed
                </div>
              </div>
              <div>
                <div className="text-4xl font-manrope-bold font-bold text-foreground mb-2">
                  24/7
                </div>
                <div className="font-inter-regular text-muted-foreground">
                  Monitoring
                </div>
              </div>
            </div>
          </motion.div>

          {process.env.NODE_ENV === "development" && (
            <div className="text-center mt-8">
              <div className="bg-card border border-border text-green-400 px-4 py-2 rounded-lg text-sm inline-block">
                🎯 Reddit Ads Location Tracking: Active • Product:{" "}
                {activeProduct} • Search: "{searchTerm}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
