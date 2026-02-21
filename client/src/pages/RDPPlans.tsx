import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
<<<<<<< HEAD
import railsApi from "@/lib/railsApi";
=======

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
import {
  Cpu,
  HardDrive,
  Users,
  Clock,
  ShoppingCart,
  Check,
  ArrowRight,
  ArrowLeft,
  Home,
  MapPin,
  Zap,
  Shield,
  Star,
  Sparkles,
  Flame,
} from "lucide-react";
import { conversionTracker } from "@/utils/redditPixel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
<<<<<<< HEAD
=======


>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

<<<<<<< HEAD
=======
import { toast } from "sonner";
import api from "../services/api";

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
interface RDPPlan {
  id: string;
  plan_id: number;
  name: string;
  slug: string;
  price: number;
  currency_code: string;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  concurrent_users: number;
  session_duration_hours: number;
  os_templates: string[];
  features: string[];
  locations: string[];
  is_active: boolean;
  country_pricing?: Record<string, number>;
}

interface ManagementOption {
  type: string;
  name: string;
  description: string;
  features: string[];
  priceMultiplier: number;
  badge: string;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface OSMetadata {
  name: string;
  icon: string;
  description: string;
}

export default function RDPPlans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const countryParam = searchParams.get("country") || "";

<<<<<<< HEAD
  const [rdpPlans, setRdpPlans] = useState<RDPPlan[]>([]);
  const [managementOptions, setManagementOptions] = useState<
    ManagementOption[]
  >([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [osMetadata, setOsMetadata] = useState<OSMetadata[]>([]);
  const [loading, setLoading] = useState(true);
=======
  const [plans, setPlans] = useState<RDPPlan[]>([]);
  const [managementOptions, setManagementOptions] = useState<ManagementOption[]>([]);
  const [locations, setLocations] = useState<Country[]>([]);
  const [osOptions, setOsOptions] = useState<OSMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RDPPlan | null>(null);
  const [selectedOS, setSelectedOS] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedManagement, setSelectedManagement] = useState("unmanaged");
  const [selectedCountry, setSelectedCountry] = useState(countryParam);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (countryParam) {
      setSelectedCountry(countryParam);
    }
  }, [countryParam]);

  const fetchData = async () => {
<<<<<<< HEAD
    try {
      setLoading(true);
=======
    setIsLoading(true);
    try {
      const { data } = await api.get('/web/api/products?product_type=rdp');

      const products = data.products || [];
      const mappedPlans: RDPPlan[] = products.map((p: any) => ({
        id: p.id.toString(),
        plan_id: p.id,
        name: p.name,
        slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
        price: p.price || 0,
        currency_code: p.currency || 'USD',
        cpu_cores: p.cpu_cores || 4,
        ram_gb: p.ram_gb || 4,
        storage_gb: p.storage_gb || 60,
        concurrent_users: p.concurrent_users || 1,
        session_duration_hours: p.session_duration_hours || -1,
        os_templates: p.os_templates || ['Windows Server 2022', 'Windows 11 Pro', 'Ubuntu Desktop 22.04'],
        features: p.features || ['Full Admin Access', 'SSD Storage', 'Premium Bandwidth'],
        locations: p.locations || ['US', 'DE', 'GB'],
        is_active: p.active !== false,
      }));
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

      const managementOptionsFallback = [
        {
          type: "unmanaged",
          name: "Unmanaged",
          description: "Full administrator access, you manage everything",
          features: [
            "Complete control",
            "Admin access",
            "Custom software installs",
            "Self-managed updates",
          ],
          priceMultiplier: 1.0,
          badge: "Most Popular",
        },
        {
          type: "managed",
          name: "Managed",
          description: "We handle RDP server management for you",
          features: [
            "OS updates & patches",
            "Security monitoring",
            "Software installations",
            "24/7 support",
          ],
          priceMultiplier: 1.4,
          badge: "Hassle-Free",
        },
      ];

<<<<<<< HEAD
      const countriesFallback = [
=======
      const datacenterCountriesFallback = [
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
        { code: "US", name: "United States", flag: "🇺🇸" },
        { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
        { code: "DE", name: "Germany", flag: "🇩🇪" },
        { code: "CA", name: "Canada", flag: "🇨🇦" },
        { code: "AU", name: "Australia", flag: "🇦🇺" },
      ];

<<<<<<< HEAD
      const osMetadataFallback = [
=======
      const osOptionsFallback = [
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
        {
          name: "Windows Server 2022",
          icon: "WindowsIcon",
          description: "Enterprise-grade Windows server OS",
        },
        {
          name: "Windows 11 Pro",
          icon: "WindowsIcon",
          description: "Modern Windows desktop experience",
        },
        {
          name: "Windows 10 Pro",
          icon: "WindowsIcon",
          description: "Stable Windows desktop OS",
        },
        {
          name: "Ubuntu Desktop 22.04",
          icon: "UbuntuIcon",
          description: "User-friendly Linux with LTS support",
        },
        {
          name: "Debian 11",
          icon: "DebianIcon",
          description: "Stable and lightweight Linux distribution",
        },
        {
          name: "CentOS Stream 9",
          icon: "CentOSIcon",
          description: "Enterprise-focused Linux with continuous updates",
        },
        {
          name: "Fedora 39",
          icon: "FedoraIcon",
          description: "Cutting-edge Linux for developers",
        },
        {
          name: "Rocky Linux 9",
          icon: "RockyIcon",
          description: "Enterprise-grade Linux, CentOS alternative",
        },
      ];

<<<<<<< HEAD
      // Fetch from Rails API
      const { data } = await railsApi.get('/products');
      const products = data.products || [];

      // Filter for RDP products
      const rdpProducts = products.filter((p: any) =>
        (p.category && p.category.toLowerCase().includes('rdp')) ||
        (p.name && p.name.toLowerCase().includes('rdp'))
      );

      const mappedPlans: RDPPlan[] = rdpProducts.map((p: any) => {
        const desc = p.description || "";
        const cpuMatch = desc.match(/(\d+)\s*v?CPU/i);
        const ramMatch = desc.match(/(\d+)\s*GB RAM/i);
        const storageMatch = desc.match(/(\d+)\s*GB (SSD|Storage)/i);
        const usersMatch = desc.match(/(\d+)\s*Users?/i);

        return {
          id: p.id.toString(),
          plan_id: p.id,
          name: p.name,
          slug: p.id.toString(),
          price: parseFloat(p.price) || 0,
          currency_code: p.currency || 'USD',
          cpu_cores: cpuMatch ? parseInt(cpuMatch[1]) : 2,
          ram_gb: ramMatch ? parseInt(ramMatch[1]) : 4,
          storage_gb: storageMatch ? parseInt(storageMatch[1]) : 50,
          concurrent_users: usersMatch ? parseInt(usersMatch[1]) : 1,
          session_duration_hours: 0,
          os_templates: ["Windows 11 Pro", "Windows Server 2022", "Ubuntu Desktop 22.04"],
          features: ["Admin Access", "Private IP", "SSD Storage"],
          locations: countriesFallback.map(c => c.name),
          is_active: true
        };
      });

      if (mappedPlans.length === 0) {
        console.warn("No RDP plans found from API, using empty list.");
      }

      setRdpPlans(mappedPlans);
      setManagementOptions(managementOptionsFallback);
      setCountries(countriesFallback);
      setOsMetadata(osMetadataFallback);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
=======
      setPlans(mappedPlans.filter(plan => plan.is_active));

      // Use fallbacks for configs since Rails doesn't use system_config
      setManagementOptions(managementOptionsFallback);
      setLocations(datacenterCountriesFallback);
      setOsOptions(osOptionsFallback);

    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load RDP plans. Please try again later.");
      // Fallback data
      setPlans([]);
      setManagementOptions([
        {
          type: "unmanaged",
          name: "Unmanaged",
          description: "Full administrator access, you manage everything",
          features: [
            "Complete control",
            "Admin access",
            "Custom software installs",
            "Self-managed updates",
          ],
          priceMultiplier: 1.0,
          badge: "Most Popular",
        },
        {
          type: "managed",
          name: "Managed",
          description: "We handle RDP server management for you",
          features: [
            "OS updates & patches",
            "Security monitoring",
            "Software installations",
            "24/7 support",
          ],
          priceMultiplier: 1.4,
          badge: "Hassle-Free",
        },
      ]);
      setLocations([
        { code: "US", name: "United States", flag: "🇺🇸" },
        { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
        { code: "DE", name: "Germany", flag: "🇩🇪" },
        { code: "CA", name: "Canada", flag: "🇨🇦" },
        { code: "AU", name: "Australia", flag: "🇦🇺" },
      ]);
      setOsOptions([
        {
          name: "Windows Server 2022",
          icon: "WindowsIcon",
          description: "Enterprise-grade Windows server OS",
        },
        {
          name: "Windows 11 Pro",
          icon: "WindowsIcon",
          description: "Modern Windows desktop experience",
        }
      ]);
    } finally {
      setIsLoading(false);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    }
  };

  const getEffectivePrice = (plan: RDPPlan): number => {
    if (!selectedCountry || !plan.country_pricing) return plan.price;

<<<<<<< HEAD
    const countryName = countries.find((c) => c.code === selectedCountry)?.name;
=======
    const countryName = locations.find((c) => c.code === selectedCountry)?.name;
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    const possibleKeys = countryName
      ? [countryName, selectedCountry]
      : [selectedCountry];

    for (const key of possibleKeys) {
      if (plan.country_pricing[key] !== undefined) {
        return Number(plan.country_pricing[key]);
      }
    }

    return plan.price;
  };

  const getBestPlanForOS = (osTemplate: string): number | null => {
<<<<<<< HEAD
    const plansWithOS = rdpPlans.filter((plan) =>
=======
    const plansWithOS = plans.filter((plan) =>
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      plan.os_templates.some((template) =>
        template.toLowerCase().includes(osTemplate.toLowerCase()),
      ),
    );

    if (plansWithOS.length === 0) return null;

    if (osTemplate.toLowerCase().includes("windows-server")) {
      const premium = plansWithOS.find((p) =>
        p.name.toLowerCase().includes("premium"),
      );
      return premium?.plan_id || null;
    }

    if (osTemplate.toLowerCase().includes("ubuntu")) {
      const standard = plansWithOS.find((p) =>
        p.name.toLowerCase().includes("standard"),
      );
      return standard?.plan_id || null;
    }

    if (osTemplate.toLowerCase().includes("fedora")) {
      const ultra = plansWithOS.find((p) =>
        p.name.toLowerCase().includes("ultra"),
      );
      return ultra?.plan_id || null;
    }

    return null;
  };

  const getPlanBadge = (plan: RDPPlan, osTemplate?: string) => {
    if (osTemplate) {
      const bestPlanId = getBestPlanForOS(osTemplate);
      if (bestPlanId === plan.plan_id) {
        return {
          text: "Recommended",
          variant: "default" as const,
          icon: <Star className="h-3 w-3" />,
        };
      }
    }

    switch (plan.plan_id) {
      case 3001:
        return {
          text: "Best Value",
          variant: "success" as const,
          icon: <Zap className="h-3 w-3" />,
        };
      case 3002:
        return {
          text: "Most Popular",
          variant: "default" as const,
          icon: <Flame className="h-3 w-3" />,
        };
      case 3003:
        return {
          text: "Best Choice",
          variant: "default" as const,
          icon: <Star className="h-3 w-3" />,
        };
      case 3004:
        return {
          text: "Maximum Power",
          variant: "warning" as const,
          icon: <Sparkles className="h-3 w-3" />,
        };
      default:
        return {
          text: "Available",
          variant: "secondary" as const,
          icon: <Check className="h-3 w-3" />,
        };
    }
  };

  const calculateTotal = (): number => {
    if (!selectedPlan) return 0;

    const base = getEffectivePrice(selectedPlan);
    const multiplier =
      managementOptions.find((o) => o.type === selectedManagement)
        ?.priceMultiplier || 1;
    const discount =
      selectedDuration === 3
        ? 0.05
        : selectedDuration === 6
          ? 0.1
          : selectedDuration === 12
            ? 0.15
            : 0;

    return Number(
      (base * selectedDuration * multiplier * (1 - discount)).toFixed(2),
    );
  };

  const getMonthlyRate = (): string => {
    if (!selectedPlan) return "0.00";
    return (calculateTotal() / selectedDuration).toFixed(2);
  };

  const handleAddToCart = async () => {
    if (!selectedPlan || !selectedOS || !selectedCountry) {
      alert("Please select a country");
      return;
    }

    const hostname = `rdp-${Math.random().toString(36).substring(2, 8)}`;

    const cartItem = {
      rdpPlan: selectedPlan,
      osTemplate: selectedOS,
      hostname,
      rdpUsername: hostname,
      duration: selectedDuration,
      managementType: selectedManagement,
      productType: "rdp",
      location: {
<<<<<<< HEAD
        country: countries.find((c) => c.code === selectedCountry)?.name || "",
=======
        country: locations.find((c) => c.code === selectedCountry)?.name || "",
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
        countryCode: selectedCountry,
      },
      effective_base_price: getEffectivePrice(selectedPlan),
      total_amount: calculateTotal(),
    };

    // Track AddToCart
    conversionTracker.trackAddToCart({
      productId: selectedPlan.slug,
      productName: selectedPlan.name,
      category: "rdp",
      value: calculateTotal(),
      currency: "USD"
    });

    try {
      const existing = JSON.parse(localStorage.getItem("cartItems") || "[]");
      localStorage.setItem(
        "cartItems",
        JSON.stringify([...existing, cartItem]),
      );
      globalThis.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { count: existing.length + 1 },
        }),
      );

      setShowModal(false);
      setSelectedPlan(null);
      setSelectedOS("");
      setSelectedDuration(1);
      setSelectedManagement("unmanaged");

      alert("Added to cart!");
    } catch (err) {
      setError("Failed to add to cart");
    }
  };

  const openConfigModal = (plan: RDPPlan) => {
    setSelectedPlan(plan);
    setSelectedOS(plan.os_templates[0] || "");
    setShowModal(true);

    // Track ViewContent
    conversionTracker.trackViewContent({
      productId: plan.slug,
      productName: plan.name,
      category: "rdp",
      value: plan.price,
      currency: "USD"
    });
  };

  const getOSIcon = (osName: string) => {
<<<<<<< HEAD
    const os = osMetadata.find((o) => o.name === osName);
=======
    const os = osOptions.find((o) => o.name === osName);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    const icons: Record<string, string> = {
      WindowsIcon: "fab fa-windows",
      UbuntuIcon: "fab fa-ubuntu",
      DebianIcon: "fab fa-debian",
      CentOSIcon: "fab fa-centos",
      FedoraIcon: "fab fa-fedora",
      RockyIcon: "fas fa-server",
    };
    return os ? (
      <i className={`${icons[os.icon] || "fas fa-desktop"} text-base mr-2`} />
    ) : null;
  };

<<<<<<< HEAD
  const selectedCountryData = countries.find((c) => c.code === selectedCountry);

  if (loading) {
=======
  const selectedCountryData = locations.find((c) => c.code === selectedCountry);

  if (isLoading) {
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    return (
      <div className="space-y-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-40" />

        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Country Selector Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Specs Skeleton */}
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>

                {/* Features Skeleton */}
                <div className="space-y-2 pt-4 border-t">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>

                {/* Button Skeleton */}
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-semibold mb-2">Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

<<<<<<< HEAD
=======
  // Filter plans based on selected country
  const filteredPlans = selectedCountry
    ? plans.filter((plan) => {
      // Find the full country name from the selected code
      const countryName = locations.find((c) => c.code === selectedCountry)?.name;
      // Check if plan supports either the code or the name
      return plan.locations?.includes(selectedCountry) ||
        (countryName && plan.locations?.includes(countryName));
    })
    : plans;

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/rdp")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Country Selection
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
<<<<<<< HEAD
              Residential RDP Plans
            </h1>
            <Badge variant="default" className="mt-1">
              Premium Remote Desktop
=======
              {countryParam ? `${locations.find(c => c.code === countryParam)?.name || countryParam} RDP Plans` : 'Residential RDP Plans'}
            </h1>
            <Badge variant="default" className="mt-1">
              High Performance
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            </Badge>
          </div>
        </div>

<<<<<<< HEAD
        {selectedCountryData && (
          <div className="flex items-center gap-3 mt-4">
            <span className="text-5xl">{selectedCountryData.flag}</span>
            <div>
              <h2 className="text-2xl font-semibold">
                {selectedCountryData.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Residential IP Location
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rdpPlans.map((plan) => {
=======
        <p className="text-muted-foreground mt-2">Premium residential IP remote desktop access</p>
      </div>

      {selectedCountryData && (
        <div className="flex items-center gap-3 mt-4">
          <span className="text-5xl">{selectedCountryData.flag}</span>
          <div>
            <h2 className="text-2xl font-semibold">
              {selectedCountryData.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Residential IP Location
            </p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          const price = getEffectivePrice(plan);
          const badge = getPlanBadge(plan);

          return (
            <Card
              key={plan.id}
              className="hover:shadow-lg transition-all duration-200 hover:border-primary/50"
            >
              <CardHeader className="border-b">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge
                    variant={badge.variant}
                    className="gap-1 flex-shrink-0"
                  >
                    {badge.icon} {badge.text}
                  </Badge>
                </div>
                <Badge variant="secondary" className="w-fit gap-1">
                  <Home className="h-3 w-3" /> Residential
                </Badge>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-1 mb-1">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        CPU
                      </span>
                    </div>
                    <span className="font-bold text-sm">
                      {plan.cpu_cores} vCPU
                    </span>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-1 mb-1">
                      <HardDrive className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        RAM
                      </span>
                    </div>
                    <span className="font-bold text-sm">{plan.ram_gb} GB</span>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        Users
                      </span>
                    </div>
                    <span className="font-bold text-sm">
                      {plan.concurrent_users}
                    </span>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground uppercase font-medium">
                        Session
                      </span>
                    </div>
                    <span className="font-bold text-xs">
                      {plan.session_duration_hours > 0
                        ? `${plan.session_duration_hours}h`
                        : "∞"}
                    </span>
                  </div>
                </div>

                {plan.features?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 uppercase">
                      Key Features
                    </h4>
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-primary" />
                          <span className="text-xs">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.os_templates?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 uppercase">
                      OS Options
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {plan.os_templates.slice(0, 2).map((os, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs gap-1"
                        >
                          {getOSIcon(os)}
                          {os.split(" ")[0]}
                        </Badge>
                      ))}
                      {plan.os_templates.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{plan.os_templates.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => openConfigModal(plan)}
                  className="w-full gap-2"
                >
                  <ShoppingCart className="h-4 w-4" /> Configure{" "}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">
              Configure Your RDP
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {selectedPlan?.name}
              </span>
              <Badge variant="default">Residential</Badge>
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6 py-4">
              {/* Plan Specs */}
              <Card className="bg-muted/50 border-border">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                        <Cpu className="h-4 w-4" />
                        <span className="text-xs uppercase">CPU</span>
                      </div>
                      <span className="font-bold text-foreground">
<<<<<<< HEAD
                        {selectedPlan.cpu_cores} vCPU
=======
                        {selectedPlan?.cpu_cores} vCPU
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-xs uppercase">RAM</span>
                      </div>
                      <span className="font-bold text-foreground">
<<<<<<< HEAD
                        {selectedPlan.ram_gb} GB
=======
                        {selectedPlan?.ram_gb} GB
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-xs uppercase">Users</span>
                      </div>
                      <span className="font-bold text-foreground">
<<<<<<< HEAD
                        {selectedPlan.concurrent_users}
=======
                        {selectedPlan?.concurrent_users}
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs uppercase">Session</span>
                      </div>
                      <span className="font-bold text-foreground text-sm">
<<<<<<< HEAD
                        {selectedPlan.session_duration_hours > 0
=======
                        {selectedPlan && selectedPlan.session_duration_hours > 0
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                          ? `${selectedPlan.session_duration_hours}h`
                          : "Unlimited"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Country Selection */}
              <div>
                <Label className="flex items-center gap-2 mb-3 text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Select Country
                </Label>
                <RadioGroup
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <div className="space-y-2">
<<<<<<< HEAD
                    {countries.map((c) => (
=======
                    {locations.map((c) => (
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                      <Label
                        key={c.code}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedCountry === c.code
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <RadioGroupItem
                          value={c.code}
                          id={c.code}
                          className="mr-3"
                        />
                        <span className="text-2xl mr-3">{c.flag}</span>
                        <span className="font-medium text-foreground">
                          {c.name}
                        </span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Management Type */}
              <div>
                <Label className="mb-3 block text-foreground">
                  Management Type
                </Label>
                <RadioGroup
                  value={selectedManagement}
                  onValueChange={setSelectedManagement}
                >
                  <div className="grid md:grid-cols-2 gap-3">
                    {managementOptions.map((option) => (
                      <Label
                        key={option.type}
                        className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-colors relative ${selectedManagement === option.type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <RadioGroupItem
                          value={option.type}
                          id={option.type}
                          className="absolute top-4 right-4"
                        />
                        <div className="pr-8">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground">
                              {option.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {option.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {option.description}
                          </p>
                          <div className="text-xs font-medium">
                            {option.priceMultiplier === 1 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Standard Price
                              </span>
                            ) : (
                              <span className="text-primary">
                                +
                                {((option.priceMultiplier - 1) * 100).toFixed(
                                  0,
                                )}
                                % Premium
                              </span>
                            )}
                          </div>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Operating System */}
              <div>
                <Label className="mb-3 block text-foreground">
                  Operating System
                </Label>
                <RadioGroup value={selectedOS} onValueChange={setSelectedOS}>
                  <div className="space-y-2">
<<<<<<< HEAD
                    {selectedPlan.os_templates.map((os) => {
=======
                    {selectedPlan?.os_templates.map((os) => {
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                      const osBadge = getPlanBadge(selectedPlan, os);
                      const isRecommended = osBadge.text === "Recommended";

                      return (
                        <Label
                          key={os}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedOS === os
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            } ${isRecommended ? "ring-2 ring-primary/50" : ""}`}
                        >
                          <RadioGroupItem value={os} id={os} className="mr-3" />
                          <span className="flex items-center gap-2 flex-1">
                            {getOSIcon(os)}
                            <span className="flex-1 text-foreground">{os}</span>
                            {isRecommended && (
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" /> Best for this OS
                              </Badge>
                            )}
                          </span>
                        </Label>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              {/* Billing Period */}
              <div>
                <Label
                  htmlFor="duration"
                  className="mb-3 block text-foreground"
                >
                  Billing Period
                </Label>
                <Select
                  value={selectedDuration.toString()}
                  onValueChange={(v) => setSelectedDuration(Number.parseInt(v))}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months (Save 5%)</SelectItem>
                    <SelectItem value="6">6 Months (Save 10%)</SelectItem>
                    <SelectItem value="12">12 Months (Save 15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Price */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-foreground">
                      Total Price:
                    </span>
                    <span className="text-3xl font-bold text-primary">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  {selectedDuration > 1 && (
                    <div className="text-sm text-muted-foreground">
                      Effective monthly: ${getMonthlyRate()}/mo
                    </div>
                  )}
                  {selectedManagement === "managed" && (
                    <div className="text-sm text-primary flex items-center gap-2 mt-2">
                      <Shield className="h-4 w-4" /> Includes +40% for managed
                      services
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedOS || !selectedCountry}
                  className="flex-1 gap-2"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
