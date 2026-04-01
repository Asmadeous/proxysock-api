import { useEffect, useState } from "react";
import {
  Check,
  ShoppingCart,
  X,
  Shield,
  Globe,
  Zap,
  Info,
  MapPin,
  Package,
  Loader2,
} from "lucide-react";
import {
  fetchVPNCategory,
  VPNCategory,
  VPNPlan,
} from "../../services/myProxyService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ISP {
  id: number;
  name: string;
  slug: string;
  locations?: Record<string, { name: string; cities?: City[] }>;
}

interface City {
  id: number;
  name: string;
  state: string;
  ips_available: number;
}

interface CartItem {
  product: string;
  productType: "proxy" | "vpn";
  categorySlug: string;
  categoryName?: string;
  vpnPlan: VPNPlan | null;
  locations: {
    isp: ISP | null;
    city: City | null;
  };
  locationsString: string;
  locationId?: number;
  period: number;
  protocol: "http" | "socks5";
  totalPrice?: number;
}

const VPNPlanCardSkeleton = () => (
  <Card className="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="mb-3">
        <Skeleton className="h-4 w-20 mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-18" />
        </div>
      </div>

      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

interface VPNPlansProps {
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}

export default function BuyVPN({ isDirectBuy, onDirectBuy }: VPNPlansProps = {}) {
  const [vpnCategory, setVpnCategory] = useState<VPNCategory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedIsp, setSelectedIsp] = useState<ISP | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);

  useEffect(() => {
    const loadVPNCategory = async () => {
      try {
        setLoading(true);
        const categoryData = await fetchVPNCategory();
        if (!categoryData) {
          setError("VPN service is currently unavailable.");
          return;
        }
        setVpnCategory(categoryData);
      } catch (err) {
        console.error("Error loading VPN category:", err);
        setError("Failed to load VPN plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadVPNCategory();
  }, []);

  const togglePlanSelection = (planId: string) => {
    if (selectedPlan === planId) {
      setSelectedPlan(null);
      setSelectedIsp(null);
      setSelectedCountry("");
      setSelectedCity(null);
      return;
    }
    setSelectedPlan(planId);
    setSelectedIsp(null);
    setSelectedCountry("");
    setSelectedCity(null);
  };

  const handleAddToCart = () => {
    const plan = vpnCategory?.vpn_plans?.find((p) => p.id === selectedPlan);

    if (!selectedPlan || !plan || !vpnCategory) {
      setError("Please select a VPN plan.");
      return;
    }

    if (!selectedCity) {
      setError("Please select a city location.");
      return;
    }

    const durationMatch = plan.name.match(/(\d+)\s*day/i);
    const durationDays = durationMatch ? Number.parseInt(durationMatch[1]) : 30;

    const locationsString = `${selectedIsp?.name || "Provider"} - ${selectedCity.name}, ${selectedCity.state} (${selectedCountry})`;

    if (isDirectBuy && onDirectBuy) {
        setIsProvisioning(true);
        onDirectBuy(plan.plan_id, 1, {
            period: durationDays,
            locationId: selectedCity.id,
            locationsString
        }).then(() => {
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
            setError(null);
            setSelectedPlan(null);
            setSelectedIsp(null);
            setSelectedCountry("");
            setSelectedCity(null);
        }).catch((err) => {
            setError(err.response?.data?.error || "Failed to provision item.");
        }).finally(() => {
            setIsProvisioning(false);
        });
        return;
    }

    const newCartItem: CartItem = {
      product: String(plan.plan_id),
      productType: "vpn",
      categorySlug: vpnCategory.slug,
      categoryName: vpnCategory.name,
      vpnPlan: plan,
      locations: {
        isp: selectedIsp,
        city: selectedCity,
      },
      locationsString,
      locationId: selectedCity.id,
      period: durationDays,
      protocol: "http",
      totalPrice: Number(plan.price),
    };

    try {
      const existingCart = JSON.parse(
        localStorage.getItem("cartItems") || "[]",
      );
      const updatedCart = [...existingCart, newCartItem];
      localStorage.setItem("cartItems", JSON.stringify(updatedCart));
      globalThis.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { count: updatedCart.length },
        }),
      );

      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      setError(null);
      setSelectedPlan(null);
      setSelectedIsp(null);
      setSelectedCountry("");
      setSelectedCity(null);
    } catch (err) {
      setError("Failed to add item to cart. Please try again.");
    }
  };

  const renderVPNPlans = () => {
    if (error && !vpnCategory) {
      return (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      );
    }

    if (!vpnCategory?.vpn_plans || vpnCategory.vpn_plans.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Plans Available</h3>
            <p className="text-sm text-muted-foreground">
              No VPN plans available at the moment
            </p>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <VPNPlanCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {vpnCategory.vpn_plans.map((plan) => (
          <Card
            key={plan.plan_id}
            className={`cursor-pointer transition-all duration-200 ${selectedPlan === plan.id
                ? "border-primary shadow-lg bg-primary/5"
                : "hover:border-primary/50 hover:shadow-md"
              }`}
            onClick={() => togglePlanSelection(plan.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                {selectedPlan === plan.id && (
                  <div className="p-2 bg-primary rounded-full ml-4">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {plan.bandwidth_gb > 0 && (
                  <Badge variant="warning" className="gap-1">
                    <Zap className="w-3 h-3" />
                    {plan.bandwidth_gb} GB Bandwidth
                  </Badge>
                )}
                {plan.bandwidth_gb === 0 && (
                  <Badge variant="success" className="gap-1">
                    <Zap className="w-3 h-3" />
                    Unlimited Bandwidth
                  </Badge>
                )}
                {plan.locations && plan.locations.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    {plan.locations.length}{" "}
                    {plan.locations.length === 1 ? "Country" : "Countries"}
                  </Badge>
                )}
              </div>

              {plan.isp && plan.isp.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Providers:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plan.isp.map((isp) => (
                      <div
                        key={isp.id}
                        className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 border"
                      >
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{isp.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.locations && plan.locations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Available Countries:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plan.locations.map((location, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-blue-500/10 rounded-md px-3 py-1.5 border border-blue-500/20"
                      >
                        <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {location}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-2xl font-bold text-primary">
                  ${Number(plan.price).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const selectedPlanData = vpnCategory?.vpn_plans?.find(
    (p) => p.id === selectedPlan,
  );

  const hasAvailableLocations =
    selectedPlanData?.isp?.some(
      (isp: ISP) =>
        isp.locations &&
        Object.values(isp.locations).some(
          (loc: any) =>
            loc.cities && loc.cities.some((c: City) => c.ips_available > 0),
        ),
    ) ?? false;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          {/* <div className="p-2 bg-amber-500/10 rounded-lg">
            <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div> */}
          <h1 className="text-3xl font-semibold text-foreground">
            VPN Services
          </h1>
        </div>
        <p className="text-muted-foreground">
          Secure, fast, and reliable VPN connections worldwide
        </p>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-600">Added to Cart!</h3>
              <p className="text-sm text-muted-foreground">
                Your VPN plan has been added to cart.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plans Section */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Available VPN Plans</h2>
          {renderVPNPlans()}
        </div>

        {/* Configuration Section */}
        <div className="lg:col-span-1">
          {selectedPlan && selectedPlanData ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>

              {/* Selected Plan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selected Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">{selectedPlanData.name}</span>
                  </div>
                  {(selectedPlanData.bandwidth_gb > 0 ||
                    selectedPlanData.bandwidth_gb === 0) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bandwidth:</span>
                        <span className="font-medium">
                          {selectedPlanData.bandwidth_gb > 0
                            ? `${selectedPlanData.bandwidth_gb} GB`
                            : "Unlimited"}
                        </span>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Location Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Select City Location
                  </CardTitle>
                  <CardDescription>
                    Choose your VPN server location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasAvailableLocations ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedPlanData.isp!.map((isp: ISP) => (
                        <div
                          key={isp.id}
                          className={`p-4 rounded-lg border-2 transition-all ${selectedIsp?.id === isp.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <span className="font-semibold">{isp.name}</span>
                          </div>
                          {isp.locations &&
                            Object.entries(isp.locations).map(
                              ([code, loc]: [string, any]) => {
                                if (!loc.cities || loc.cities.length === 0)
                                  return null;
                                const availableCities = loc.cities
                                  .filter((c: City) => c.ips_available > 0)
                                  .sort((a: City, b: City) =>
                                    a.name.localeCompare(b.name),
                                  );
                                if (availableCities.length === 0) return null;

                                return (
                                  <div key={code} className="mb-3 last:mb-0">
                                    <div className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      {loc.name}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {availableCities.map((city: City) => (
                                        <button
                                          key={city.id}
                                          onClick={() => {
                                            setSelectedIsp(isp);
                                            setSelectedCountry(loc.name);
                                            setSelectedCity(city);
                                          }}
                                          className={`p-3 rounded-lg text-left transition-all border-2 flex items-center justify-between ${selectedCity?.id === city.id &&
                                              selectedIsp?.id === isp.id
                                              ? "border-primary bg-primary text-primary-foreground"
                                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <div>
                                              <div className="font-medium text-sm">
                                                {city.name}
                                              </div>
                                              <div className="text-xs opacity-70">
                                                {city.state}
                                              </div>
                                            </div>
                                          </div>
                                          {selectedCity?.id === city.id &&
                                            selectedIsp?.id === isp.id && (
                                              <Check className="w-4 h-4" />
                                            )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Info className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium mb-2">No Locations Available</p>
                      <p className="text-sm text-muted-foreground">
                        No city locations are currently available for this plan.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Location Summary */}
              {selectedCity && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Selected Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{selectedIsp?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Country:</span>
                      <span className="font-medium">{selectedCountry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span className="font-medium">
                        {selectedCity.name}, {selectedCity.state}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add to Cart */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Price:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${Number(selectedPlanData.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    One-time payment
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedCity || isProvisioning}
                    className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    {isProvisioning ? <Loader2 className="w-5 h-5 animate-spin" /> : isDirectBuy ? <Zap className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    {isProvisioning ? "Provisioning..." : isDirectBuy ? "Instantly Provision" : "Add to Cart"}
                  </button>
                  {error && (
                    <Card className="border-l-4 border-l-destructive bg-destructive/5">
                      <CardContent className="py-3">
                        <p className="text-sm text-destructive">{error}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Info className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Select a VPN Plan</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Choose a VPN plan to view details and add to cart
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Information Section */}
      {vpnCategory?.information && vpnCategory.information.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>About Our VPN Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vpnCategory.information.map((info, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground">{info}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
