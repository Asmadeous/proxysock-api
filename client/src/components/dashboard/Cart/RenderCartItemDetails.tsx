import { CartItem } from "@/types/index";
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
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getLocationDisplayName } from "@/hooks/useESIMPackages";
import { useState } from "react";

interface ItemDetailsProps {
  item: CartItem;
  index: number;
  removeItem: (index: number) => void;
  calculateItemTotalSync: (item: CartItem) => number;
  exchangeRate: number | null;
  updateESIMQuantity?: (index: number, quantity: number) => void;
  updateItemAutoRenew?: (index: number, auto_renew: boolean) => void;
}

const AutoRenewToggle = ({ item, index, updateItemAutoRenew }: { item: CartItem, index: number, updateItemAutoRenew?: (index: number, auto_renew: boolean) => void }) => {
    const [showWarning, setShowWarning] = useState(false);

    const handleToggle = (checked: boolean) => {
        if (checked) {
            setShowWarning(true);
        } else {
            updateItemAutoRenew?.(index, false);
        }
    };

    const confirmEnable = () => {
        updateItemAutoRenew?.(index, true);
        setShowWarning(false);
    };

    return (
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`auto-renew-${index}`}
                    checked={!!item.auto_renew}
                    onCheckedChange={(checked) => handleToggle(checked as boolean)}
                />
                <Label
                    htmlFor={`auto-renew-${index}`}
                    className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${item.auto_renew ? "text-primary animate-spin-slow" : "text-muted-foreground"}`} />
                    Auto-Renew Subscription
                </Label>
            </div>

            <Dialog open={showWarning} onOpenChange={setShowWarning}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enable Auto-Renewal?</DialogTitle>
                        <DialogDescription className="pt-2">
                            <p className="font-semibold text-foreground mb-2">Notice: You are about to enable a subscription for this service.</p>
                            By enabling auto-renew, this product will be automatically renewed using your default payment method (Wallet Balance or Saved Card) upon expiry. You can cancel this at any time from your dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowWarning(false)}>Cancel</Button>
                        <Button onClick={confirmEnable}>I Understand, Enable</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const ProxyItemDetails = ({
  item,
  index,
  removeItem,
  calculateItemTotalSync,
  exchangeRate,
  updateItemAutoRenew,
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
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Location</span>
            <div className="flex items-center gap-2 justify-end min-w-0 flex-1">
              <span className="font-medium truncate text-right">
                {item.globalCountry ? (
                  item.globalCountry.name
                ) : selectedCity ? (
                  `${selectedCity.name}, ${selectedCity.state}`
                ) : (
                  selectedIsp?.name || "Any"
                )}
              </span>
              {item.globalCountry && (
                <img
                  src={`https://flagcdn.com/16x12/${item.globalCountry.code?.toLowerCase()}.png`}
                  alt={item.globalCountry.name}
                  className="w-4 h-3 rounded-sm shrink-0"
                />
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Period</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {((item.productType === "proxy" || item.productType === "global-isp") && item.plan?.global_isp_config)
                ? `${Number(item.quantity) || 0} x ${item.plan.name} (${item.period || "Fixed"})`
                : item.period}{" "}
              {item.plan?.billing_type === "usage_gb" ? "GB" : item.plan?.global_isp_config ? "" : "month"}
              {(!item.plan?.global_isp_config && (Number(item.period) || 1) > 1) ? "s" : ""}
            </span>
          </div>
          {item.globalTarget && (
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Usage Target</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">{item.globalTarget.name}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Protocol</span>
            <span className="font-medium truncate text-right">
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
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
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Location</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {getLocationDisplayName(item.esimPackage.location_code, item.esimPackage.location_name)}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Data</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {formatDataVolume(item.esimPackage.volume || item.esimPackage.volume_bytes || 0)}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Duration</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {formatDuration(
                item.esimPackage.duration || item.esimPackage.duration_days || 0,
                item.esimPackage.duration_unit || "days",
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
}: ItemDetailsProps) => {
  if (!item.plan) return null;
  const cfg = item.residentalRotatingConfig;
  const rotationLabel = (v?: string) => {
    const map: Record<string, string> = {
      '0': 'Always Rotate',
      '3': 'Sticky 3 min',
      '30': 'Sticky 30 min',
      '60': 'Sticky 1 hr',
      '1440': 'Sticky 24 hr',
    };
    return v ? (map[v] ?? v) : 'Always Rotate';
  };
  const regionLabel = (v?: string) => {
    const map: Record<string, string> = {
      'ip-na.myproxyapi.com': 'North America',
      'ip-eu.myproxyapi.com': 'Europe',
      'ip-asia.myproxyapi.com': 'Asia',
    };
    return v ? (map[v] ?? v) : 'North America';
  };
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
          {/* Coverage / Country */}
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Coverage</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {cfg?.country ? cfg.country : 'Global Residential Pool'}
            </span>
          </div>
          {/* ISP (only when set) */}
          {cfg?.isp && (
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">ISP</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">{cfg.isp}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Data Amount</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">{item.period || 1} GB</span>
          </div>
          {/* V2-specific fields */}
          {cfg && (
            <>
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-muted-foreground shrink-0">Rotation</span>
                <span className="font-medium truncate text-right flex-1 min-w-0">{rotationLabel(cfg.rotationStrategy)}</span>
              </div>
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-muted-foreground shrink-0">Region</span>
                <span className="font-medium truncate text-right flex-1 min-w-0">{regionLabel(cfg.proxyRegion)}</span>
              </div>
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-muted-foreground shrink-0">Credentials</span>
                <span className="font-medium truncate text-right flex-1 min-w-0">{cfg.quantity ?? 1}</span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Protocol</span>
            <span className="font-medium truncate text-right">
              {(cfg?.protocol ?? item.protocol)?.toUpperCase() || "HTTP"}
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
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
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Duration</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {item.duration || 1} month
              {(item.duration || 1) > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Management</span>
            <span
              className={`capitalize font-medium truncate text-right flex-1 min-w-0 ${item.managementType === "managed" ? "text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {item.managementType || "Unmanaged"}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Location</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
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
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Duration</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {item.duration || 1} month
              {(item.duration || 1) > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Management</span>
            <span
              className={`capitalize font-medium truncate text-right flex-1 min-w-0 ${item.managementType === "managed" ? "text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {item.managementType || "Unmanaged"}
            </span>
          </div>
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Location</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
}: ItemDetailsProps) => {
  if (!item.usaEsimPlan) return null;
  const device = item.deviceDetails;
  return (
    <Card className="border-t-4 border-t-emerald-500 hover:border-emerald-500/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30">
              <Smartphone className="w-3 h-3 mr-1" />
              {item.usaEsimPlan.country === 'GB' ? 'UK' : 'USA'} line · {item.usaEsimPlan.provider}
            </Badge>
            <h3 className="text-lg font-bold truncate">
              {item.usaEsimPlan.name}
            </h3>
          </div>
          <Button
            aria-label={`Remove ${item.usaEsimPlan.name} from cart`}
            onClick={() => removeItem(index)}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2.5 text-sm">
          {item.usaEsimPlan.data_amount && (
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Data</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">{item.usaEsimPlan.data_amount}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Duration</span>
            <span className="font-medium truncate text-right flex-1 min-w-0">
              {item.usaEsimPlan.duration} {item.usaEsimPlan.duration_unit}
            </span>
          </div>
          {item.usaEsimPlan.requires_imei !== false && (
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Phone IMEI</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">
                {device?.imei ? `ending ${device.imei.slice(-4)}` : "Missing"}
              </span>
            </div>
          )}
          {device?.address && (
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">911 address</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">
                {device.address.city}, {device.address.state}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4 items-center min-w-0">
            <span className="text-muted-foreground shrink-0">Quantity</span>
            <span className="font-medium">1 line</span>
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
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
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Provider</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">{vpnIsp.name}</span>
            </div>
          )}
          {locationText && (
            <div className="flex justify-between gap-4 items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Location</span>
              <span className="font-medium truncate text-right flex-1 min-w-0">{locationText}</span>
            </div>
          )}
          {item.vpnPlan.features && item.vpnPlan.features.length > 0 && (
            <div className="mt-3 space-y-1">
              {item.vpnPlan.features.map((feature: string) => (
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
        <AutoRenewToggle item={item} index={index} updateItemAutoRenew={updateItemAutoRenew} />
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
  updateItemAutoRenew,
}: {
  item: CartItem;
  index: number;
  cartItems: CartItem[];
  removeItem: (index: number) => void;
  exchangeRate: number | null;
  updateESIMQuantity: (index: number, quantity: number) => void;
  updateItemAutoRenew: (index: number, auto_renew: boolean) => void;
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
    updateItemAutoRenew,
  };

  switch (item.productType) {
    case "proxy":
    case "global-isp":
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
