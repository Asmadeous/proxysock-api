<<<<<<< HEAD
import { CartItem } from "@/pages/Cart";
=======
import { CartItem } from "@/pages/UserDashboard/Cart";
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
import { useCalculateOrderItems } from "./hook/useCalculateOrderTotalSync";
import { formatDataVolume, formatDuration } from "@/utils/cart/formatData";
import {
  X,
  Shield,
  Server,
  Smartphone,
  Monitor,
  Home,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ItemDetailsProps {
  item: CartItem;
  index: number;
  removeItem: (index: number) => void;
  calculateItemTotalSync: (item: CartItem) => number;
  exchangeRate: number | null;
  updateESIMQuantity?: (index: number, quantity: number) => void;
}

const ProxyItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
}: ItemDetailsProps) => {
  if (!item.plan) return null;
  const selectedCity = item.locations?.city;
  const selectedIsp = item.locations?.isp;
  return (
    <Card className="border-t-4 border-t-primary hover:border-primary/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-2">
              <Shield className="w-3 h-3 mr-1" />
              Proxy {item.plan.is_owned && "· Premium"}
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.plan.display_name ||
                item.plan.name ||
                "Unknown Proxy Plan"}
            </h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">
              {selectedCity
                ? `${selectedCity.name}, ${selectedCity.state}`
                : selectedIsp?.name || "Any"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period</span>
            <span className="font-medium">
              {item.period}{" "}
              {item.plan.billing_type === "usage_gb" ? "GB" : "month"}
              {(item.period || 1) > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol</span>
            <span className="font-medium">
              {item.protocol?.toUpperCase() || "HTTP"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EsimItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
  updateESIMQuantity,
}: ItemDetailsProps) => {
  if (!item.esimPackage) return null;
  return (
    <Card className="border-t-4 border-t-emerald-500 hover:border-emerald-500/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30">
              <Smartphone className="w-3 h-3 mr-1" />
              eSIM
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.esimPackage.name || "Unknown eSIM Plan"}
            </h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">
              {item.esimPackage.location_name || "Global"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">
              {formatDataVolume(item.esimPackage.volume)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {formatDuration(
                item.esimPackage.duration,
                item.esimPackage.duration_unit,
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  updateESIMQuantity?.(index, (item.quantity || 1) - 1)
                }
                variant="outline"
                size="icon"
                className="w-8 h-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {item.quantity || 1}
              </span>
              <Button
                onClick={() =>
                  updateESIMQuantity?.(index, (item.quantity || 1) + 1)
                }
                variant="outline"
                size="icon"
                className="w-8 h-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ResidentialItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
}: ItemDetailsProps) => {
  if (!item.plan) return null;
  return (
    <Card className="border-t-4 border-t-emerald-500 hover:border-emerald-500/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30">
              <Home className="w-3 h-3 mr-1" />
              Residential Rotating
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.plan.display_name ||
                item.plan.name ||
                "Residential Rotating Proxy"}
            </h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage</span>
            <span className="font-medium">Global Residential Pool</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data Amount</span>
            <span className="font-medium">{item.period || 1} GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol</span>
            <span className="font-medium">
              {item.protocol?.toUpperCase() || "HTTP"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const VpsItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
}: ItemDetailsProps) => {
  if (!item.vpsPlan) return null;
  return (
    <Card className="border-t-4 border-t-blue-500 hover:border-blue-500/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30">
              <Server className="w-3 h-3 mr-1" />
              VPS
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.vpsPlan.name || "Unknown VPS Plan"}
            </h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-muted rounded-xl">
          <div className="text-center">
            <p className="text-lg font-bold">{item.vpsPlan.cpu_cores}</p>
            <p className="text-xs text-muted-foreground">vCPU</p>
          </div>
          <div className="text-center border-x">
            <p className="text-lg font-bold">{item.vpsPlan.ram_gb}</p>
            <p className="text-xs text-muted-foreground">GB RAM</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{item.vpsPlan.storage_gb}</p>
            <p className="text-xs text-muted-foreground">GB SSD</p>
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {item.duration || 1} month
              {(item.duration || 1) > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Management</span>
            <span
              className={`capitalize font-medium ${item.managementType === "managed" ? "text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {item.managementType || "Unmanaged"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">
              {item.location ? `${item.location.country}` : "Any"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RdpItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
}: ItemDetailsProps) => {
  if (!item.rdpPlan) return null;
  return (
    <Card className="border-t-4 border-t-primary hover:border-primary/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-2">
              <Monitor className="w-3 h-3 mr-1" />
              RDP
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.rdpPlan.name || "Unknown RDP Plan"}
            </h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-muted rounded-xl">
          <div className="text-center">
            <p className="text-lg font-bold">{item.rdpPlan.cpu_cores}</p>
            <p className="text-xs text-muted-foreground">vCPU</p>
          </div>
          <div className="text-center border-x">
            <p className="text-lg font-bold">{item.rdpPlan.ram_gb}</p>
            <p className="text-xs text-muted-foreground">GB RAM</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{item.rdpPlan.storage_gb}</p>
            <p className="text-xs text-muted-foreground">GB SSD</p>
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {item.duration || 1} month
              {(item.duration || 1) > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Management</span>
            <span
              className={`capitalize font-medium ${item.managementType === "managed" ? "text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {item.managementType || "Unmanaged"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">
              {item.location ? `${item.location.country}` : "Any"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const UsaEsimItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
  updateESIMQuantity,
}: ItemDetailsProps) => {
  if (!item.usaEsimPlan) return null;
  return (
    <Card className="border-t-4 border-t-emerald-500 hover:border-emerald-500/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30">
              <Smartphone className="w-3 h-3 mr-1" />
              USA eSIM · {item.usaEsimPlan.provider.toUpperCase()}
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.usaEsimPlan.name}
            </h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Voice</span>
            <span className="font-medium">{item.usaEsimPlan.voice_minutes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SMS/MMS</span>
            <span className="font-medium">
              {item.usaEsimPlan.sms_included ? "Unlimited" : "Not Included"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">{item.usaEsimPlan.data_amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {item.usaEsimPlan.duration} {item.usaEsimPlan.duration_unit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  updateESIMQuantity?.(index, (item.quantity || 1) - 1)
                }
                variant="outline"
                size="icon"
                className="w-8 h-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {item.quantity || 1}
              </span>
              <Button
                onClick={() =>
                  updateESIMQuantity?.(index, (item.quantity || 1) + 1)
                }
                variant="outline"
                size="icon"
                className="w-8 h-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const VpnItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
}: ItemDetailsProps) => {
  if (!item.vpnPlan) return null;
  const vpnCity = item.locations?.city;
  const vpnIsp = item.locations?.isp;

  const getLocationText = () => {
    if (vpnCity) return `${vpnCity.name}, ${vpnCity.state}`;
    if (item.vpnPlan?.locations && item.vpnPlan.locations.length > 0) {
      return item.vpnPlan.locations.join(", ");
    }
    return null;
  };

  const locationText = getLocationText();

  return (
    <Card className="border-t-4 border-t-yellow-500 hover:border-yellow-500/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Residential VPN
            </Badge>
            <h3 className="text-lg font-bold truncate"> {item.vpnPlan.name}</h3>
          </div>
          <Button
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2.5 text-sm">
          {vpnIsp && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">{vpnIsp.name}</span>
            </div>
          )}
          {locationText && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{locationText}</span>
            </div>
          )}
          {item.vpnPlan.features && item.vpnPlan.features.length > 0 && (
            <div className="mt-3 space-y-1">
              {item.vpnPlan.features.map((feature) => (
                <div key={feature} className="flex items-start">
                  <Check className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateItemTotalSync(item).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">USD</span>
            </div>
          </div>
          {exchangeRate && (
            <p className="text-right text-xs text-muted-foreground mt-1">
              ≈ ₦{(calculateItemTotalSync(item) * exchangeRate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const RenderCartItemDetails = ({
  item,
  index,
  cartItems,
  removeItem,
  exchangeRate,
  updateESIMQuantity,
}: {
  item: CartItem;
  index: number;
  cartItems: CartItem[];
  removeItem: (index: number) => void;
  exchangeRate: number | null;
  updateESIMQuantity: (index: number, quantity: number) => void;
}) => {
  const { calculateItemTotalSync } = useCalculateOrderItems({
    cartItems,
    exchangeRate,
  });

  const commonProps = {
    item,
    index,
    removeItem,
    calculateItemTotalSync,
    exchangeRate,
  };

  switch (item.productType) {
    case "proxy":
      return <ProxyItemDetails {...commonProps} />;
    case "esim":
      return <EsimItemDetails {...commonProps} updateESIMQuantity={updateESIMQuantity} />;
    case "residential":
      return <ResidentialItemDetails {...commonProps} />;
    case "vps":
      return <VpsItemDetails {...commonProps} />;
    case "rdp":
      return <RdpItemDetails {...commonProps} />;
    case "usa-esim":
      return <UsaEsimItemDetails {...commonProps} updateESIMQuantity={updateESIMQuantity} />;
    case "vpn":
      return <VpnItemDetails {...commonProps} />;
    default:
      return null;
  }
};
