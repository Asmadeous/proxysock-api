import { useState, useMemo, useEffect, memo } from "react";
import {
  Search,
  Wifi,
  Clock,
  Smartphone,
  ShoppingCart,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowLeft,
} from "lucide-react";
import {
  useESIMPackages,
  formatPrice,
  useESIMCountries,
  formatDataVolume,
  formatDuration,
  type ESIMPackage,
  type PackageScope,
} from "../hooks/useESIMPackages";
import { useDebounce } from "use-debounce";
import { ErrorBoundary } from "react-error-boundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem {
  esimPackage?: ESIMPackage | null;
  quantity?: number;
  productType: "esim";
}

const ITEMS_PER_PAGE = 12;

const FallbackComponent = ({ error }: { error: Error }) => (
  <Card className="border-l-4 border-l-destructive bg-destructive/5">
    <CardContent className="flex items-center gap-3 py-6">
      <X className="w-5 h-5 text-destructive" />
      <p className="text-destructive font-medium">Error: {error.message}</p>
    </CardContent>
  </Card>
);

const ESIMCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
    <CardHeader className="border-b">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-9 w-24" />
      </div>
    </CardHeader>

    <CardContent className="pt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

function ESIMPackagesPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [smsSupport, setSmsSupport] = useState(false);
  const [dataType, setDataType] = useState<number | undefined>(undefined);
  const [packageScope, setPackageScope] = useState<PackageScope | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const filters = useMemo(
    () => ({
      locationCode:
        selectedLocation == "all" ? "" : selectedLocation || undefined,
      search: debouncedSearchTerm || undefined,
      minPrice: priceRange.min ? Number.parseInt(priceRange.min) * 10000 : undefined,
      maxPrice: priceRange.max ? Number.parseInt(priceRange.max) * 10000 : undefined,
      smsSupport,
      dataType: dataType == 0 ? undefined : dataType,
      scope: packageScope === "" || "all" ? undefined : packageScope,
    }),
    [
      debouncedSearchTerm,
      selectedLocation,
      priceRange,
      smsSupport,
      dataType,
      packageScope,
    ],
  );

  const { packages, loading, error } = useESIMPackages(filters);
  const { countries: countryList } = useESIMCountries();

  const totalPages = Math.ceil(packages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPackages = packages.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (typeof globalThis === "undefined") return;

    const loadCartFromStorage = () => {
      try {
        const storedCart = localStorage.getItem("cartItems");
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            const esimItems = parsedCart.filter(
              (item) => item.productType === "esim",
            );
            setCartItems(esimItems);
          }
        }
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
    };

    loadCartFromStorage();

    const handleCartUpdate = () => loadCartFromStorage();
    globalThis.addEventListener("cart-updated", handleCartUpdate);
    return () => globalThis.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  const addToCart = (pkg: ESIMPackage) => {
    const storedCart = localStorage.getItem("cartItems");
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const existingItemIndex = currentCart.findIndex(
      (item: { productType: string; esimPackage: { id: string } }) =>
        item.productType === "esim" && item.esimPackage?.id === pkg.id,
    );

    if (existingItemIndex >= 0) {
      currentCart[existingItemIndex].quantity =
        (currentCart[existingItemIndex].quantity || 0) + 1;
    } else {
      currentCart.push({ esimPackage: pkg, quantity: 1, productType: "esim" });
    }

    localStorage.setItem("cartItems", JSON.stringify(currentCart));
    setCartItems(
      currentCart.filter(
        (item: { productType: string }) => item.productType === "esim",
      ),
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);

    const totalItems = currentCart.reduce(
      (total: any, item: { quantity: any }) => total + (item.quantity || 1),
      0,
    );
    globalThis.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { count: totalItems } }),
    );
  };

  const removeFromCart = (packageId: string) => {
    const storedCart = localStorage.getItem("cartItems");
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const updatedCart = currentCart.filter(
      (item: { productType: string; esimPackage: { id: string } }) =>
        !(item.productType === "esim" && item.esimPackage?.id === packageId),
    );

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    setCartItems(
      updatedCart.filter(
        (item: { productType: string }) => item.productType === "esim",
      ),
    );

    const totalItems = updatedCart.reduce(
      (total: any, item: { quantity: any }) => total + (item.quantity || 1),
      0,
    );
    globalThis.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { count: totalItems } }),
    );
  };

  const updateQuantity = (packageId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(packageId);
      return;
    }

    const storedCart = localStorage.getItem("cartItems");
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const updatedCart = currentCart.map(
      (item: { productType: string; esimPackage: { id: string } }) =>
        item.productType === "esim" && item.esimPackage?.id === packageId
          ? { ...item, quantity }
          : item,
    );

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    setCartItems(
      updatedCart.filter(
        (item: { productType: string }) => item.productType === "esim",
      ),
    );

    const totalItems = updatedCart.reduce(
      (total: any, item: { quantity: any }) => total + (item.quantity || 1),
      0,
    );
    globalThis.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { count: totalItems } }),
    );
  };

  const getCartItemForPackage = (pkg: ESIMPackage) => {
    return cartItems.find((item) => item.esimPackage?.id === pkg.id);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    globalThis.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    buttons.push(
      <Button
        key="prev"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </Button>,
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          onClick={() => goToPage(i)}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
        >
          {i}
        </Button>,
      );
    }

    buttons.push(
      <Button
        key="next"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>,
    );

    return buttons;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header - Static */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => globalThis.history.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-3xl font-semibold text-foreground">
              Buy eSIM Plans
            </h1>
          </div>
          <p className="text-muted-foreground">
            Premium global eSIM data connectivity with instant activation
            worldwide
          </p>
        </div>

        {/* Filters Section - Static */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Search & Filter
            </CardTitle>
            <CardDescription>
              Find the perfect eSIM plan for your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label htmlFor="search">Search Plans</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by country, plan name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger id="location" className="mt-1.5">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="!GL">Global</SelectItem>
                    <SelectItem value="!RG">Regional</SelectItem>
                    {countryList.map((country) => (
                      <SelectItem
                        key={country.location_code}
                        value={country.location_code}
                      >
                        {country.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coverage Type */}
              <div>
                <Label htmlFor="coverage">Coverage Type</Label>
                <Select
                  value={packageScope}
                  onValueChange={(value) =>
                    setPackageScope(value as "" | PackageScope)
                  }
                >
                  <SelectTrigger id="coverage" className="mt-1.5">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="global">Global Coverage</SelectItem>
                    <SelectItem value="regional">Multi-Country</SelectItem>
                    <SelectItem value="country">🇺🇳 Single Country</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Price */}
              <div>
                <Label htmlFor="min-price">Min Price (USD)</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                  }
                  className="mt-1.5"
                />
              </div>

              {/* Max Price */}
              <div>
                <Label htmlFor="max-price">Max Price (USD)</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                  }
                  className="mt-1.5"
                />
              </div>

              {/* Data Type */}
              <div>
                <Label htmlFor="data-type">Data Type</Label>
                <Select
                  value={dataType?.toString() || ""}
                  onValueChange={(value) =>
                    setDataType(value ? Number.parseInt(value) : undefined)
                  }
                >
                  <SelectTrigger id="data-type" className="mt-1.5">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Types</SelectItem>
                    <SelectItem value="1">Fixed Amount</SelectItem>
                    <SelectItem value="2">Daily Reset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SMS Support */}
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms-support"
                    checked={smsSupport}
                    onCheckedChange={(checked) =>
                      setSmsSupport(checked as boolean)
                    }
                  />
                  <Label htmlFor="sms-support" className="cursor-pointer">
                    SMS Support
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
            <ESIMCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-semibold mb-2">
            Error loading eSIM plans
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => globalThis.history.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-3xl font-semibold text-foreground">
            Buy eSIM Plans
          </h1>
        </div>
        <p className="text-muted-foreground">
          Premium global eSIM data connectivity with instant activation
          worldwide
        </p>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-600">Added to Cart!</h3>
              <p className="text-sm text-muted-foreground">
                Your eSIM plan has been added to cart.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessAlert(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find the perfect eSIM plan for your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search Plans</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by country, plan name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger id="location" className="mt-1.5">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="!GL">Global</SelectItem>
                  <SelectItem value="!RG">Regional</SelectItem>
                  {countryList.map((country) => (
                    <SelectItem
                      key={country.location_code}
                      value={country.location_code}
                    >
                      {country.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coverage Type */}
            <div>
              <Label htmlFor="coverage">Coverage Type</Label>
              <Select
                value={packageScope}
                onValueChange={(value) =>
                  setPackageScope(value as "" | PackageScope)
                }
              >
                <SelectTrigger id="coverage" className="mt-1.5">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="global">Global Coverage</SelectItem>
                  <SelectItem value="regional">Multi-Country</SelectItem>
                  <SelectItem value="country">🇺🇳 Single Country</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Price */}
            <div>
              <Label htmlFor="min-price">Min Price (USD)</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>

            {/* Max Price */}
            <div>
              <Label htmlFor="max-price">Max Price (USD)</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>

            {/* Data Type */}
            <div>
              <Label htmlFor="data-type">Data Type</Label>
              <Select
                value={dataType?.toString() || ""}
                onValueChange={(value) =>
                  setDataType(value ? Number.parseInt(value) : undefined)
                }
              >
                <SelectTrigger id="data-type" className="mt-1.5">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  <SelectItem value="1">Fixed Amount</SelectItem>
                  <SelectItem value="2">Daily Reset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SMS Support */}
            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-support"
                  checked={smsSupport}
                  onCheckedChange={(checked) =>
                    setSmsSupport(checked as boolean)
                  }
                />
                <Label htmlFor="sms-support" className="cursor-pointer">
                  SMS Support
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No eSIM plans available</h3>
            <p className="text-sm text-muted-foreground">
              Adjust your filters to find available plans
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPackages.map((pkg) => {
              const cartItem = getCartItemForPackage(pkg);
              const inCart = !!cartItem;

              return (
                <Card
                  key={pkg.id}
                  className="hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                >
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {pkg.location_name || "Global eSIM"}
                        </CardTitle>
                        <Badge variant="default" className="gap-1">
                          <Smartphone className="h-3 w-3" />
                          Data Plan
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(pkg.price, pkg.currency_code)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <Wifi className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">
                            Data
                          </span>
                        </div>
                        <span className="font-bold">
                          {formatDataVolume(pkg.volume)}
                        </span>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">
                            Valid
                          </span>
                        </div>
                        <span className="font-bold">
                          {formatDuration(pkg.duration, pkg.duration_unit)}
                        </span>
                      </div>
                    </div>

                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-2">
                          <Smartphone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Global eSIM data connectivity with instant
                            activation in 170+ countries
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {inCart ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg border border-primary/30">
                          <Button
                            onClick={() =>
                              updateQuantity(
                                pkg.id,
                                (cartItem?.quantity || 1) - 1,
                              )
                            }
                            variant="default"
                            size="sm"
                            className="h-9 w-9 p-0"
                          >
                            −
                          </Button>
                          <div className="flex-1 text-center">
                            <span className="text-lg font-bold">
                              {cartItem?.quantity || 0}
                            </span>
                            <div className="text-primary text-xs font-medium">
                              in cart
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              updateQuantity(
                                pkg.id,
                                (cartItem?.quantity || 0) + 1,
                              )
                            }
                            variant="default"
                            size="sm"
                            className="h-9 w-9 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          onClick={() => removeFromCart(pkg.id)}
                          variant="destructive"
                          className="w-full"
                        >
                          Remove from Cart
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(pkg)}
                        className="w-full gap-2"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {renderPaginationButtons()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(function ESIMPackagesPage() {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <ESIMPackagesPageContent />
    </ErrorBoundary>
  );
});
