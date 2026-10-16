"use client";
import { useState, useEffect, useCallback } from "react";

import { Helmet } from "react-helmet-async";

import { isFixedQuantity, isOrderableCartItem, normalizeEsimQuantity } from "@/utils/cart/esimQuantity";
import { getEffectiveBasePrice } from "@/utils/cart/getEffectiveBasePrice";
import { useCalculateOrderItems } from "@/components/dashboard/Cart/hook/useCalculateOrderTotalSync";

import { RenderCartItemDetails } from "@/components/dashboard/Cart/RenderCartItemDetails";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/store/themeStore";
import "./dashboard-home.css";
import "./cart.css";

import { ShoppingCart, ArrowRight, ArrowUpRight, Trash2 } from "lucide-react";
import api from "../../services/api";


import { CartItem } from "../../types";

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState(false);
  const dark = useThemeStore(state => state.dark);
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
    setBalanceError(false);
    try {
      const { data } = await api.get('/web/api/billing/balance');
      const balance = Number(data.available_balance);
      if (data.available_balance == null || !Number.isFinite(balance)) throw new Error('Balance unavailable');
      setUserBalance(balance);
    } catch (err) {
      setBalanceError(true);
      setUserBalance(null);
    } finally {
      setIsLoadingBalanceFetch(false);
    }
  };

  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (!Array.isArray(parsedCart)) throw new Error('Invalid cart data');
        const cartWithDefaults = parsedCart
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
                (item.productType === "usa-esim" && item.usaEsimPlan && isOrderableCartItem(item)) ||
                (item.productType === "vpn" && item.vpnPlan)
              );
            })
            .map(normalizeCartItem);
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
    setError(null);
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
    if (!item || !Number.isInteger(quantity) || isFixedQuantity(item)) return;
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

  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const subtotal = cartItems.reduce((sum, item) => sum + Math.round(calculateItemTotalSync(item) * 100), 0) / 100;
  const services = [
    ['Proxies', '/dashboard/proxies'], ['VPN', '/dashboard/vpn'], ['eSIM', '/dashboard/esim'],
    ['VPS hosting', '/dashboard/vps'], ['RDP Access', '/dashboard/rdp'],
  ];

  return (
    <div className={`dashboard-overview cart-page ${dark ? 'overview-dark' : ''}`}>
      <Helmet><title>My Cart | ProxySock</title></Helmet>
      <header className="overview-heading">
        <div><span className="overview-eyebrow">Your workspace</span><h1>My cart</h1><p>Review your services and configuration before checkout.</p></div>
        <Link className="overview-button" to="/dashboard">Browse services <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </header>

      {error ? <div className="overview-error" role="alert"><div><strong>We couldn’t load your saved cart.</strong><p>Clear the saved cart to start again.</p></div><button type="button" onClick={clearCart}>Clear saved cart</button></div>
        : cartItems.length === 0 ? <section className="cart-empty" aria-labelledby="cart-empty-title">
          <ShoppingCart size={28} strokeWidth={1.4} aria-hidden="true" /><h2 id="cart-empty-title">Your cart is empty</h2><p>Choose a service to get started.</p>
          <nav aria-label="Browse services" className="cart-service-links">{services.map(([name, href]) => <Link key={href} to={href}>{name}<ArrowRight size={14} aria-hidden="true" /></Link>)}</nav>
        </section> : <div className="cart-layout">
          <section className="cart-items" aria-labelledby="cart-items-title">
            <div className="overview-section-heading"><h2 id="cart-items-title">Items <span className="cart-item-count">{cartItems.length}</span></h2><button type="button" className="cart-clear" onClick={clearCart}><Trash2 size={14} aria-hidden="true" />Clear cart</button></div>
            <div className="cart-item-list">{cartItems.map((item, index) => <div key={index} className="cart-item">
              <RenderCartItemDetails item={item} index={index} cartItems={cartItems} removeItem={removeItem} updateItemAutoRenew={updateItemAutoRenew} exchangeRate={exchangeRate} updateESIMQuantity={updateESIMQuantity} />
            </div>)}</div>
          </section>
          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Order summary</h2>
            <dl className="cart-summary-details"><div><dt>Items</dt><dd>{cartItems.length}</dd></div><div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div></dl>
            <div className="cart-summary-total"><span>Estimated total</span><strong>{money(subtotal)}</strong></div>
            <p className="cart-summary-note">USD · Final pricing is confirmed at checkout.</p>
            <Link className="cart-checkout" to="/dashboard/checkout">Proceed to checkout <ArrowRight size={15} aria-hidden="true" /></Link>
            <p className="cart-summary-note">Review your payment method on the next page.</p>
            <div className="cart-wallet" aria-busy={isLoadingBalanceFetch}><span>Wallet balance</span>{isLoadingBalanceFetch ? <p role="status">Loading balance…</p> : balanceError ? <div role="alert"><p>Balance unavailable.</p><button type="button" onClick={fetchUserBalance}>Retry balance</button></div> : <strong>{money(userBalance ?? 0)}</strong>}</div>
            <Link className="cart-support" to="/dashboard/support">Get support <ArrowUpRight size={14} aria-hidden="true" /></Link>
          </aside>
        </div>}
    </div>
  );
}
