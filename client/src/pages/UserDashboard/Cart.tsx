"use client";
import { useState, useEffect, useCallback } from "react";

import { Helmet } from "react-helmet-async";

import { getMinimumQuantity, normalizeEsimQuantity } from "@/utils/cart/esimQuantity";
import { getEffectiveBasePrice } from "@/utils/cart/getEffectiveBasePrice";
import { useCalculateOrderItems } from "@/components/dashboard/Cart/hook/useCalculateOrderTotalSync";

import { RenderCartItemDetails } from "@/components/dashboard/Cart/RenderCartItemDetails";
import { useNavigate } from "react-router-dom";

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


import { CartItem } from "../../types";

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalanceFetch, setIsLoadingBalanceFetch] = useState(true);
  const exchangeRate = null;
  const navigate = useNavigate();

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
      protocol: (productType === "proxy" || productType === "global-isp" || productType === "residential") ? item.protocol || "http" : undefined,
      quantity: (productType === "esim" || productType === "usa-esim") ? normalizeEsimQuantity(item) : (item.quantity),
      plan: (productType === "proxy" || productType === "residential" || productType === "global-isp") ? (item.plan ?? null) : null,
      esimPackage: productType === "esim" ? (item.esimPackage ?? null) : null,
      vpsPlan: productType === "vps" ? (item.vpsPlan ?? null) : null,
      rdpPlan: productType === "rdp" ? (item.rdpPlan ?? null) : null,
      vpnPlan: productType === "vpn" ? (item.vpnPlan ?? null) : null,
      period: (productType === "proxy" || productType === "global-isp" || productType === "residential") ? item.period || 1 : undefined,
      locations: (productType === "proxy" || productType === "vpn" || productType === "global-isp") ? (item.locations || { city: null, isp: null }) : undefined,
      duration: (productType === "vps" || productType === "rdp") ? item.duration || 1 : undefined,
      managementType: (productType === "vps" || productType === "rdp") ? item.managementType || "unmanaged" : undefined,
      hostname: item.hostname || (productType === "vps" ? `vps-${Math.random().toString(36).substring(2, 8)}` : (productType === "rdp" ? `rdp-${Math.random().toString(36).substring(2, 8)}` : undefined)),
      osTemplate: item.osTemplate || (productType === "vps" ? "ubuntu-20.04" : (productType === "rdp" ? "windows-2019" : undefined)),
      rdpUsername: productType === "rdp" ? item.rdpUsername || "Administrator" : undefined,
      effective_base_price: effectiveBasePrice,
      locationId: item.locationId || item.locations?.city?.id || item.locations?.isp?.id,
      // Preserve residential rotating config if present
      residentalRotatingConfig: productType === "residential" ? item.residentalRotatingConfig : undefined,
    };

    // Recalculate when quantity changes or the stored total is missing/invalid.
    if (updatedItem.quantity !== item.quantity || updatedItem.totalPrice === undefined || updatedItem.totalPrice === null || isNaN(Number(updatedItem.totalPrice))) {
      updatedItem.totalPrice = calculateItemTotalSync({ ...updatedItem, totalPrice: undefined });
    }

    return updatedItem;
  }, [calculateItemTotalSync]);

  const fetchUserBalance = async () => {
    setIsLoadingBalanceFetch(true);
    try {
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
              const validTypes = ["proxy", "esim", "vps", "rdp", "usa-esim", "vpn", "residential", "global-isp"];
              if (!validTypes.includes(item.productType)) return false;

              return (
                (item.productType === "proxy" && item.plan) ||
                (item.productType === "global-isp" && item.plan) ||
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
        localStorage.setItem("cartItems", JSON.stringify(cartWithDefaults));
        setCartItems(cartWithDefaults);
        globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: cartWithDefaults.length } }));
      } catch (e) {
        console.error("Error parsing cart data:", e);
        setError("Failed to load cart items. Please clear your cart and try again.");
      }
    }
    fetchUserBalance();
  }, []);

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
    const item = cartItems[index];
    if (!item || !Number.isInteger(quantity)) return;
    const minimum = getMinimumQuantity(item);
    if (minimum > 1 && quantity < minimum) return;
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const updatedCart = cartItems.map((item, i) =>
      i === index ? { ...item, quantity, totalPrice: calculateItemTotalSync({ ...item, quantity, totalPrice: undefined }) } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: updatedCart.length } }));
  };

  const updateItemAutoRenew = (index: number, auto_renew: boolean) => {
    const updatedCart = cartItems.map((item, i) =>
      i === index ? { ...item, auto_renew } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Helmet>
        <title>Shopping Cart</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground mt-1">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>
        {!isLoadingBalanceFetch && (
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
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
              <Button asChild variant="outline">
                <a href="/dashboard/proxies">Browse Proxies</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/dashboard/vps">Browse VPS</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/dashboard/rdp">Browse RDP</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/dashboard/esim">Browse eSIMs</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/dashboard/vpn">Browse VPN</a>
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
                    updateItemAutoRenew={updateItemAutoRenew}
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
              onClick={() => navigate("/dashboard/checkout")}
              className="w-full sm:w-auto gap-2 shadow-lg"
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
