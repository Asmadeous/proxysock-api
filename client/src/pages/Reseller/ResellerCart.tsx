"use client";
import { useState, useEffect, useCallback } from "react";

import { Helmet } from "react-helmet-async";
import type { ProxyPlan, City, ISP } from "../../types";
import { getEffectiveBasePrice } from "@/utils/cart/getEffectiveBasePrice";
import { useCalculateOrderItems } from "@/components/dashboard/Cart/hook/useCalculateOrderTotalSync";
import {
  ESIMPackage,
  RDPPlan,
  USAESIMPlan,
  VPNPlan,
  VPSPlan,
} from "@/components/dashboard/Cart/types";
import { RenderCartItemDetails } from "@/components/dashboard/Cart/RenderCartItemDetails";

import {
  ShoppingCart,
  Wallet,
  AlertCircle,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "../../services/api";


export interface CartItem {
  plan?: ProxyPlan | null;
  locations?: { isp: ISP | null; city: City | null };
  period?: number;
  protocol?: "http" | "socks5";
  locationsString?: string;
  esimPackage?: ESIMPackage | null;
  quantity?: number;
  vpsPlan?: VPSPlan | null;
  rdpPlan?: RDPPlan | null;
  osTemplate?: string;
  hostname?: string;
  rdpUsername?: string;
  duration?: number;
  managementType?: "unmanaged" | "managed";
  location?: { country: string; countryCode: string };
  productType:
  | "proxy"
  | "esim"
  | "vps"
  | "rdp"
  | "usa-esim"
  | "vpn"
  | "residential";
  totalPrice?: number;
  effective_base_price?: number;
  usaEsimPlan?: USAESIMPlan | null;
  vpnPlan?: VPNPlan | null;
  locationId?: number;
}

export interface ResellerCartProps {
  onCheckout: () => void;
  onBrowse: (category: string) => void;
}

export default function ResellerCart({ onCheckout, onBrowse }: ResellerCartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalanceFetch, setIsLoadingBalanceFetch] = useState(true);
  const exchangeRate = null;

  const { calculateItemTotalSync } = useCalculateOrderItems({ cartItems, exchangeRate: null });

  const normalizeCartItem = useCallback((item: CartItem): CartItem => {
    const productType = item.productType;
    let effectiveBasePrice = item.effective_base_price;

    if (productType === "vps" || productType === "rdp") {
      effectiveBasePrice = getEffectiveBasePrice({ ...item, productType });
    }

    const updatedItem: CartItem = {
      ...item,
      productType,
      protocol: productType === "proxy" ? item.protocol || "http" : undefined,
      quantity: (productType === "esim" || productType === "usa-esim") ? item.quantity || 1 : undefined,
      plan: (productType === "proxy" || productType === "residential") ? (item.plan ?? null) : null,
      esimPackage: productType === "esim" ? (item.esimPackage ?? null) : null,
      vpsPlan: productType === "vps" ? (item.vpsPlan ?? null) : null,
      rdpPlan: productType === "rdp" ? (item.rdpPlan ?? null) : null,
      vpnPlan: productType === "vpn" ? (item.vpnPlan ?? null) : null,
      period: productType === "proxy" ? item.period || 1 : undefined,
      locations: (productType === "proxy" || productType === "vpn") ? (item.locations || { city: null, isp: null }) : undefined,
      duration: (productType === "vps" || productType === "rdp") ? item.duration || 1 : undefined,
      managementType: (productType === "vps" || productType === "rdp") ? item.managementType || "unmanaged" : undefined,
      hostname: item.hostname || (productType === "vps" ? `vps-${Math.random().toString(36).substring(2, 8)}` : (productType === "rdp" ? `rdp-${Math.random().toString(36).substring(2, 8)}` : undefined)),
      osTemplate: item.osTemplate || (productType === "vps" ? "ubuntu-20.04" : (productType === "rdp" ? "windows-2019" : undefined)),
      rdpUsername: productType === "rdp" ? item.rdpUsername || "Administrator" : undefined,
      effective_base_price: effectiveBasePrice,
      totalPrice: undefined,
      locationId: item.locationId || item.locations?.city?.id,
    };

    updatedItem.totalPrice = calculateItemTotalSync(updatedItem);
    return updatedItem;
  }, [calculateItemTotalSync]);

  const fetchUserBalance = async () => {
    setIsLoadingBalanceFetch(true);
    try {
      // Both users and resellers use this endpoint now
      const { data } = await api.get('/web/api/billing/balance');
      setUserBalance(data.available_balance || 0);
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setIsLoadingBalanceFetch(false);
    }
  };

  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        const cartWithDefaults = Array.isArray(parsedCart)
          ? parsedCart
            .filter((item: CartItem) => {
              const validTypes = ["proxy", "esim", "vps", "rdp", "usa-esim", "vpn", "residential"];
              if (!validTypes.includes(item.productType)) return false;

              return (
                (item.productType === "proxy" && item.plan) ||
                (item.productType === "residential" && item.plan) ||
                (item.productType === "esim" && item.esimPackage) ||
                (item.productType === "vps" && item.vpsPlan) ||
                (item.productType === "rdp" && item.rdpPlan) ||
                (item.productType === "usa-esim" && item.usaEsimPlan) ||
                (item.productType === "vpn" && item.vpnPlan)
              );
            })
            .map(normalizeCartItem)
          : [];
        setCartItems(cartWithDefaults);
        globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: cartWithDefaults.length } }));
      } catch (e) {
        console.error("Error parsing cart data:", e);
        setError("Failed to load cart items. Please clear your cart and try again.");
      }
    }
    fetchUserBalance();
  }, [normalizeCartItem]);

  const clearCart = () => {
    localStorage.removeItem("cartItems");
    setCartItems([]);
    globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 0 } }));
  };

  const removeItem = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: updatedCart.length } }));
  };

  const updateESIMQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const updatedCart = cartItems.map((item, i) =>
      i === index ? { ...item, quantity, totalPrice: calculateItemTotalSync({ ...item, quantity }) } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: updatedCart.length } }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Helmet>
        <title>Shopping Cart | Reseller</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Reseller Cart</h1>
              <p className="text-muted-foreground mt-1">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>
        {!isLoadingBalanceFetch && (
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 rounded-full border border-blue-500/20">
              <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Balance: ${userBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {cartItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground text-center max-w-md mx-auto mb-8">
              Looks like you haven't added any proxies or services yet.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => onBrowse('proxies')} variant="outline">
                Browse Proxies
              </Button>
              <Button onClick={() => onBrowse('products')} variant="outline">
                Browse All Products
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 bg-muted/20">
            <CardTitle className="text-lg font-medium">Items</CardTitle>
            <Button
              onClick={clearCart}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6">
              {cartItems.map((item, index) => (
                <div key={index} className="pb-6 border-b last:border-0 last:pb-0">
                  <RenderCartItemDetails
                    item={item}
                    index={index}
                    cartItems={cartItems}
                    removeItem={removeItem}
                    exchangeRate={exchangeRate}
                    updateESIMQuantity={updateESIMQuantity}
                  />
                </div>
              ))}
            </div>
          </CardContent>
          <div className="border-t p-6 bg-muted/10 flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Subtotal is calculated at checkout
            </div>
            <Button
              size="lg"
              onClick={onCheckout}
              className="w-full sm:w-auto gap-2 shadow-lg bg-blue-600 hover:bg-blue-700"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
