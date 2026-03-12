import { useEffect, useState } from "react";
import {
  fetchProductCategories,
  fetchProxiesByCategorySlug,
  fetchMobileProxiesByLocation,
} from "../../services/myProxyService";
import {
  CartItem,
  Category,
  City,
  ISP,
  ProxyPlan,
} from "@/types/index";
import { getCategoryIcon } from "@/components/dashboard/Purchase-Products/buy-proxies/getCategoryIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Info, ShoppingCart, X } from "lucide-react";
import { getCategoryColor } from "@/components/dashboard/Purchase-Products/buy-proxies/getCategoryColor";
import { renderProxyPlans } from "@/components/dashboard/Purchase-Products/buy-proxies/RenderProxyPlans";
import { renderISPOptionsWithCountries } from "@/components/dashboard/Purchase-Products/buy-proxies/RenderISPOptionsWithCountries";
import { conversionTracker } from "@/utils/redditPixel";

export default function BuyProxies() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategoryData, setSelectedCategoryData] =
    useState<Category | null>(null);
  const [selectedLocationCategory, setSelectedLocationCategory] =
    useState<string>("");
  const [mobileProxyPlans, setMobileProxyPlans] = useState<ProxyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | number | null>(null);
  const [selectedISP, setSelectedISP] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [period, setPeriod] = useState<number>(1);
  const [protocol, setProtocol] = useState<"http" | "socks5">("http");
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [showMobileLocationCards, setShowMobileLocationCards] =
    useState<boolean>(false);
  const [showMobilePlans, setShowMobilePlans] = useState<boolean>(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await fetchProductCategories();
        if (!categoriesData || categoriesData.length === 0) {
          setError("No proxy categories available.");
          return;
        }
        setCategories(categoriesData);
        setSelectedCategory(categoriesData[0].slug);
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Failed to load proxy categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadCategoryData = async () => {
      if (!selectedCategory) return;
      try {
        setLoading(true);
        const categoryData = await fetchProxiesByCategorySlug(selectedCategory);
        if (!categoryData) {
          setError(`No data found for ${selectedCategory}.`);
          setSelectedCategoryData(null);
          return;
        }
        setSelectedCategoryData(categoryData);
        setSelectedPlan(null);
        setSelectedISP(null);
        setSelectedCity(null);
        setTotalPrice(null);
        setSelectedLocationCategory("");
        setMobileProxyPlans([]);
        setShowMobileLocationCards(selectedCategory === "mobile");
        setShowMobilePlans(false);
        setPeriod(1); // Reset period when changing categories
      } catch (err) {
        console.error("Error loading category data:", err);
        setError(
          `Failed to load ${selectedCategory} proxies. Please try again.`,
        );
        setSelectedCategoryData(null);
      } finally {
        setLoading(false);
      }
    };
    loadCategoryData();
  }, [selectedCategory]);

  useEffect(() => {
    const loadMobileProxyPlans = async () => {
      if (!selectedLocationCategory || selectedCategory !== "mobile") return;
      try {
        setLoading(true);
        const plans = await fetchMobileProxiesByLocation(
          selectedLocationCategory as "usa" | "premium",
        );
        if (!plans || plans.length === 0) {
          setError(`No ${selectedLocationCategory} mobile proxies available.`);
          return;
        }
        setMobileProxyPlans(plans);
        setShowMobilePlans(true);
        setSelectedPlan(null);
        setSelectedISP(null);
        setSelectedCity(null);
        setTotalPrice(null);
      } catch (err) {
        console.error("Error loading mobile proxy plans:", err);
        setError(
          `Failed to load ${selectedLocationCategory} mobile proxies. Please try again.`,
        );
      } finally {
        setLoading(false);
      }
    };
    loadMobileProxyPlans();
  }, [selectedLocationCategory, selectedCategory]);

  // Price calculation effect - $1 USA markup removed
  useEffect(() => {
    if (!selectedPlan) {
      setTotalPrice(null);
      return;
    }

    let plan: ProxyPlan | undefined;
    if (selectedCategory === "mobile" && showMobilePlans) {
      plan = mobileProxyPlans.find((p) => p.id === selectedPlan);
    } else if (selectedCategoryData?.proxy_plans) {
      plan = selectedCategoryData.proxy_plans.find(
        (p) => p.id === selectedPlan,
      );
    }

    if (!plan) {
      setError("Selected plan not found.");
      setTotalPrice(null);
      return;
    }

    const basePrice = Number(plan.price) || 0;
    const basePriceFromBase = Number(plan.base_price) || 0;
    const gbMin = Number(plan.gb_min) || 0;
    const gbMax = Number(plan.gb_max) || 0;

    if (
      (selectedCategory === "residential" || selectedCategory === "residential-rotating") &&
      plan.billing_type === "usage_gb"
    ) {
      if (gbMin <= 0 || gbMax <= 0 || gbMax < gbMin) {
        setError("Invalid GB range for this plan.");
        setTotalPrice(null);
        return;
      }
      // FORCE period to be within range - auto-correct if needed
      if (period < gbMin) {
        setPeriod(gbMin);
        return;
      }
      if (period > gbMax) {
        setPeriod(gbMax);
        return;
      }
      // Strict validation: period must be within the plan's GB range
      if (period < gbMin || period > gbMax) {
        const requirementText =
          gbMin === gbMax
            ? `exactly ${gbMin}`
            : `between ${gbMin} and ${gbMax}`;
        setError(
          `This plan requires ${requirementText} GB. Please adjust the amount or select a different plan.`,
        );
        setTotalPrice(null);
        return;
      }
      const pricePerGb = Number(plan.price) || 0;
      const finalPrice = period * pricePerGb;
      setTotalPrice(finalPrice);
    } else if (
      (selectedCategory === "residential" || selectedCategory === "residential-rotating") &&
      gbMin > 0 &&
      gbMax > 0
    ) {
      // Handle residential plans without explicit billing_type but with GB ranges
      if (gbMax < gbMin) {
        setError("Invalid GB range for this plan.");
        setTotalPrice(null);
        return;
      }
      if (period < gbMin) {
        setPeriod(gbMin);
        return;
      }
      if (period > gbMax) {
        setPeriod(gbMax);
        return;
      }
      if (period < gbMin || period > gbMax) {
        const requirementText =
          gbMin === gbMax
            ? `exactly ${gbMin}`
            : `between ${gbMin} and ${gbMax}`;
        setError(`This plan requires ${requirementText} GB.`);
        setTotalPrice(null);
        return;
      }
      const pricePerGb = Number(plan.price) || 0;
      const finalPrice = period * pricePerGb;
      setTotalPrice(finalPrice);
    } else if (plan.is_owned) {
      if (plan.billing_type === "usage_gb") {
        // Premium mobile per-GB pricing: base price + (GB * price_per_gb)
        // If price_per_gb is undefined, we assume basePrice is the price per GB.
        const pricePerGb = Number((plan as any).price_per_gb) || basePrice || 1;
        const baseCost = basePriceFromBase || 0;
        const perGBCost = period * pricePerGb;
        const finalPrice = baseCost + perGBCost;
        setTotalPrice(finalPrice);
      } else {
        // Time based (daily, weekly, monthly)
        const unitPrice = basePriceFromBase || basePrice;
        const finalPrice = unitPrice * period;
        setTotalPrice(finalPrice);
      }
    } else {
      if (selectedCategory === "mobile") {
        const planName = String(plan.name);
        if (
          planName.toLowerCase().includes("daily") ||
          planName.toLowerCase().includes("per day")
        ) {
          const finalPrice = period * basePrice; // Removed USA markup
          setTotalPrice(finalPrice);
        } else {
          const match = planName.match(/(\d+)\s*Days?/i);
          const fixedDuration =
            plan.duration_days || (match ? Number.parseInt(match[1]) : null);
          if (fixedDuration) {
            if (period !== fixedDuration) {
              setPeriod(fixedDuration);
            }
          }
          const finalPrice = basePrice; // Removed USA markup
          setTotalPrice(finalPrice);
        }
      } else {
        const finalPrice = period * basePrice; // Removed USA markup
        setTotalPrice(finalPrice);
      }
    }

    console.log(
      `Price calculation - Plan: ${plan.name}, Base: ${basePrice}, ISP: ${plan.isp?.find((isp) => isp.id === selectedISP)?.name || "None"}, City: ${plan.isp?.find((isp) => isp.id === selectedISP)?.locations
        ? Object.values(
          plan.isp.find((isp) => isp.id === selectedISP)?.locations ?? {},
        )
          .flatMap((loc) => loc.cities || [])
          .find((city) => city.id === selectedCity)?.name || "None"
        : "None"
      }, Category: ${selectedCategory}, Final: ${totalPrice}`,
    );
    setError(null);
  }, [
    selectedPlan,
    period,
    selectedISP,
    selectedCity,
    selectedCategoryData,
    selectedCategory,
    mobileProxyPlans,
    showMobilePlans,
  ]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedLocationCategory("");
    setShowMobileLocationCards(slug === "mobile");
    setShowMobilePlans(false);
  };

  const handleLocationCategorySelection = (locationSlug: string) => {
    setSelectedLocationCategory(locationSlug);
    setShowMobileLocationCards(false);
  };

  const handleBackToLocationCards = () => {
    setShowMobileLocationCards(true);
    setShowMobilePlans(false);
    setSelectedLocationCategory("");
    setSelectedPlan(null);
    setSelectedISP(null);
    setSelectedCity(null);
    setTotalPrice(null);
  };

  const togglePlanSelection = (planId: string | number) => {
    // If clicking the same plan, deselect it
    if (selectedPlan === planId) {
      setSelectedPlan(null);
      setPeriod(1);
      return;
    }

    // Find the plan being selected
    let plan: ProxyPlan | undefined;
    if (selectedCategory === "mobile" && showMobilePlans) {
      plan = mobileProxyPlans.find((p) => p.id === planId);
    } else if (selectedCategoryData?.proxy_plans) {
      plan = selectedCategoryData.proxy_plans.find((p) => p.id === planId);
    }

    // Set the period to the plan's minimum GB FIRST
    if (plan) {
      const minGB = Number(plan.gb_min);
      if (minGB > 0) {
        setPeriod(minGB);
      } else {
        setPeriod(1);
      }
    }

    // Then set the selected plan
    setSelectedPlan(planId);

    // Track ViewContent
    if (plan) {
      conversionTracker.trackViewContent({
        productId: String(plan.id),
        productName: plan.name,
        category: (selectedCategory === "residential" || selectedCategory === "residential-rotating") ? "residential-proxy" : "proxy",
        value: Number(plan.price) || 0,
        currency: "USD"
      });
    }
  };

  const handleISPSelection = (ispId: number) => {
    console.log("ISP selected:", ispId);
    setSelectedISP(ispId);
    setSelectedCity(null);
  };

  const handleCitySelection = (cityId: number) => setSelectedCity(cityId);

  const handleAddToCart = () => {
    let plan: ProxyPlan | undefined;
    if (selectedCategory === "mobile" && showMobilePlans) {
      plan = mobileProxyPlans.find((p) => p.id === selectedPlan);
    } else if (selectedCategoryData?.proxy_plans) {
      plan = selectedCategoryData.proxy_plans.find(
        (p) => p.id === selectedPlan,
      );
    }
    if (!selectedPlan || !plan) {
      setError("Please select a proxy plan");
      return;
    }
    if (period < 1) {
      setError("Period must be at least 1");
      return;
    }
    if (!["http", "socks5"].includes(protocol)) {
      setError("Invalid protocol selected");
      return;
    }

    const isStaticIP = [
      "datacenter",
      "isp",
      "premium-isp",
      "static-residential",
      "global-isp",
    ].includes(selectedCategory);
    const isMobileIP = selectedCategory === "mobile";
    const isResidentialRotating =
      selectedCategory === "residential" ||
      selectedCategory === "residential-rotating";

    // CRITICAL: Validate GB range for residential plans BEFORE proceeding
    if (isResidentialRotating) {
      const gbMin = Number(plan.gb_min) || 0;
      const gbMax = Number(plan.gb_max) || 0;

      if (gbMin <= 0 || gbMax <= 0 || gbMax < gbMin) {
        setError("Invalid GB range for this plan.");
        return;
      }

      if (period < gbMin || period > gbMax) {
        const requirementText =
          gbMin === gbMax
            ? `exactly ${gbMin}`
            : `between ${gbMin} and ${gbMax}`;
        setError(
          `Cannot add to cart: This plan requires ${requirementText} GB. Current selection: ${period} GB. Please adjust or select a different plan.`,
        );
        return;
      }
    }

    let locationsString = "";
    let ispDetails: ISP | null = null;
    let cityDetails: City | null = null;
    if (isStaticIP || isMobileIP) {
      ispDetails = plan.isp?.find((isp) => isp.id === selectedISP) || null;
      if (!ispDetails && (isStaticIP || isMobileIP)) {
        setError(
          `Please select an ISP for ${isStaticIP ? "Static" : "Mobile"} IPs`,
        );
        return;
      }
      if (isStaticIP) {
        const locs = ispDetails?.locations;
        if (locs) {
          cityDetails =
            Object.values(locs)
              .flatMap((loc) => loc.cities || [])
              .find((city) => city.id === selectedCity) || null;
        }
        if (!cityDetails) {
          setError("Please select a city for Static IPs");
          return;
        }
        locationsString = `${cityDetails.name}, ${cityDetails.state}`;
      } else if (isMobileIP) {
        locationsString = ispDetails?.name || "";
      }
    } else if (isResidentialRotating) {
      locationsString = "Global Residential Pool";
    }
    if (totalPrice === null) {
      setError("Unable to calculate total price");
      return;
    }
    const cartPlan: ProxyPlan = {
      ...plan,
      id: plan.is_owned ? plan.billing_id || plan.id : plan.id,
      is_owned: plan.is_owned || false,
      billing_id: plan.is_owned
        ? plan.billing_id || String(plan.id)
        : undefined,
      source_table: plan.source_table || "proxy_plans",
    };
    const newCartItem: CartItem = {
      product: String(selectedPlan),
      productType: (selectedCategory === "residential" || selectedCategory === "residential-rotating") ? "residential" : "proxy",
      plan: cartPlan,
      locations: { isp: ispDetails, city: cityDetails },
      locationsString,
      locationId: cityDetails?.id ?? ispDetails?.id ?? undefined,
      period,
      protocol,
      totalPrice,
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
      setSelectedISP(null);
      setSelectedCity(null);
      setPeriod(1);

      // Track AddToCart
      if (plan) {
        conversionTracker.trackAddToCart({
          productId: String(plan.id),
          productName: plan.name,
          category: (selectedCategory === "residential" || selectedCategory === "residential-rotating") ? "residential-proxy" : "proxy",
          value: totalPrice,
          currency: "USD"
        });
      }
    } catch (err) {
      setError("Failed to add item to cart. Please try again.");
    }
  };
  // Update these render methods in your BuyProxies component
  // Replace the existing methods with these updated versions

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground mb-1 break-words">
          Buy Proxies
        </h1>
        <p className="text-muted-foreground">
          Choose from our premium proxy services
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
                Your proxy plan has been added to cart.
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

      {/* Category Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${selectedCategory === category.slug
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                }`}
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-3 ${getCategoryColor(category.slug)}`}
              >
                {getCategoryIcon(category.slug)}
              </div>
              <div className="font-semibold text-foreground mb-1">
                {category.name}
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                {category.slug}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plans Section */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {selectedCategory === "mobile" && showMobileLocationCards
              ? "Choose Location"
              : selectedCategory === "mobile" && showMobilePlans
                ? `${selectedLocationCategory.charAt(0).toUpperCase() + selectedLocationCategory.slice(1)} Mobile Proxies`
                : "Available Plans"}
          </h2>
          {renderProxyPlans({
            loading,
            error,
            selectedCategory,
            showMobileLocationCards,
            selectedCategoryData,
            handleLocationCategorySelection,
            showMobilePlans,
            mobileProxyPlans,
            handleBackToLocationCards,
            selectedLocationCategory,
            selectedPlan,
            togglePlanSelection,
          })}
        </div>

        {/* Configuration Section */}
        <div className="lg:col-span-1">
          {selectedPlan &&
            (showMobilePlans || selectedCategory !== "mobile") ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Configuration</h2>
              {renderISPOptionsWithCountries({
                selectedCategory,
                showMobilePlans,
                mobileProxyPlans,
                selectedPlan,
                selectedCategoryData,
                setPeriod,
                period,
                protocol,
                setProtocol,
                handleISPSelection,
                handleCitySelection,
                selectedCity,
                selectedISP,
              })}

              {/* Add to Cart Card */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Price:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${totalPrice !== null ? totalPrice.toFixed(2) : "..."}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(selectedCategory === "residential" || selectedCategory === "residential-rotating") &&
                      selectedCategoryData?.proxy_plans?.find(
                        (p) => p.id === selectedPlan,
                      )?.billing_type === "usage_gb"
                      ? `${period} GB`
                      : selectedCategory === "mobile" &&
                        mobileProxyPlans.find((p) => p.id === selectedPlan)
                          ?.billing_type === "usage_gb"
                        ? `${period} GB`
                        : `${period} ${selectedCategory === "mobile" ? "days" : "months"}`}{" "}
                    • {protocol.toUpperCase()}
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      !selectedPlan || totalPrice === null || error !== null
                    }
                    className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
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
                <h3 className="font-semibold mb-2">
                  {selectedCategory === "mobile" && showMobileLocationCards
                    ? "Select a Location"
                    : "Select a Plan"}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {selectedCategory === "mobile" && showMobileLocationCards
                    ? "Choose a location category to view available mobile proxy plans"
                    : "Choose a proxy plan to configure your purchase"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Information Section */}
      {selectedCategoryData?.information &&
        selectedCategoryData.information.length > 0 &&
        !showMobileLocationCards && (
          <Card>
            <CardHeader>
              <CardTitle>About {selectedCategoryData.name} Proxies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedCategoryData.information.map((info, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
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
