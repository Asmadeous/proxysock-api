import { useCallback, useMemo } from "react";
import { CartItem } from "@/types";

export const useCalculateOrderItems = ({
  cartItems,
  exchangeRate,
}: {
  cartItems: CartItem[];
  exchangeRate: number | null;
}) => {
  const convertToNGN = useCallback((price: number, currencyCode = "USD"): number => {
    const upperCode = currencyCode.toUpperCase();
    if (upperCode === "NGN") {
      return price;
    } else if (upperCode === "USD") {
      if (!exchangeRate) {
        return price;
      }
      return price * exchangeRate;
    } else {
      return price;
    }
  }, [exchangeRate]);

  const calculateVPSItemTotal = useCallback((item: CartItem): number => {
    if (!item.vpsPlan) return 0;
    const basePrice = item.effective_base_price ?? item.vpsPlan.price;
    const managementMultiplier = item.managementType === "managed" ? 1.5 : 1;
    let discount = 0;
    if (item.duration === 3) discount = 0.05;
    else if (item.duration === 6) discount = 0.1;
    else if (item.duration === 12) discount = 0.15;
    const total =
      basePrice * (item.duration || 1) * managementMultiplier * (1 - discount);
    return total;
  }, []);

  const calculateRDPItemTotal = useCallback((item: CartItem): number => {
    if (!item.rdpPlan) return 0;
    const basePrice = item.effective_base_price ?? item.rdpPlan.price;
    const managementMultiplier = item.managementType === "managed" ? 1.4 : 1.0;
    let discount = 0;
    if (item.duration === 3) discount = 0.05;
    else if (item.duration === 6) discount = 0.1;
    else if (item.duration === 12) discount = 0.15;
    const total =
      basePrice * (item.duration || 1) * managementMultiplier * (1 - discount);
    return total;
  }, []);

  const calculateProxyItemTotal = useCallback((item: CartItem): number => {
    if (!item.plan) return 0;
    const plan = item.plan;
    const period = Number(item.period) || 1;
    const quantity = Number(item.quantity) || 1;

    if (plan.global_isp_config) {
      // Global ISP pricing is strictly quantity * unitPrice
      return (Number(plan.price) || 0) * quantity;
    }

    if (plan.is_owned) {
      const basePrice = Number((plan as any).base_price) || 0;
      const effectivePrice = Number(plan.price) || 0;

      if (plan.billing_type === "daily") {
        const pricePerDay = Number((plan as any).price_per_day) || effectivePrice;
        return basePrice + period * pricePerDay;
      } else if (plan.billing_type === "weekly") {
        const pricePerWeek = Number((plan as any).price_per_week) || effectivePrice;
        return basePrice + period * pricePerWeek;
      } else if (plan.billing_type === "monthly") {
        const monthlyPrice = Number((plan as any).price_per_month) || effectivePrice;
        return basePrice + period * monthlyPrice;
      } else if (plan.billing_type === "usage_gb") {
        const pricePerGb = Number((plan as any).price_per_gb) || effectivePrice;
        const gbIncluded = Number((plan as any).gb_included) || 0;
        const gbPurchased = Number(period) || 1;
        const billableGb = Math.max(0, gbPurchased - gbIncluded);
        return basePrice + billableGb * pricePerGb;
      } else {
        return basePrice + (effectivePrice * period) || Number(plan.price) || 0;
      }
    } else {
      const planPrice = Number(plan.price) || 0;
      return planPrice * period;
    }
  }, []);

  const calculateItemTotalSync = useCallback((item: CartItem): number => {
    // Priority 1: Respect pre-calculated totalPrice if it's a valid number
    if (item.totalPrice !== undefined && item.totalPrice !== null && !isNaN(Number(item.totalPrice))) {
      return Number(item.totalPrice);
    }

    let calculatedTotal = 0;
    if (item.productType === "esim" && item.esimPackage) {
      calculatedTotal = item.esimPackage.price * (item.quantity || 1);
    } else if ((item.productType === "proxy" || item.productType === "global-isp") && item.plan) {
      calculatedTotal = calculateProxyItemTotal(item);
    } else if (item.productType === "residential" && item.plan) {
      calculatedTotal = (Number(item.period) || 1) * (Number(item.plan.price) || 0);
    } else if (item.productType === "vps" && item.vpsPlan) {
      calculatedTotal = calculateVPSItemTotal(item);
    } else if (item.productType === "rdp" && item.rdpPlan) {
      calculatedTotal = calculateRDPItemTotal(item);
    } else if (item.productType === "usa-esim" && item.usaEsimPlan) {
      calculatedTotal = item.usaEsimPlan.price * (item.quantity || 1);
    } else if (item.productType === "vpn" && item.vpnPlan) {
      calculatedTotal = Number(item.vpnPlan.price) || 0;
    }

    // Final safety: ensure we return a finite number
    return isFinite(calculatedTotal) ? calculatedTotal : 0;
  }, [calculateProxyItemTotal, calculateRDPItemTotal, calculateVPSItemTotal]);

  const calculateOrderTotalSync = useCallback(() => {
    return cartItems.reduce(
      (sum, item) => sum + calculateItemTotalSync(item),
      0,
    );
  }, [cartItems, calculateItemTotalSync]);

  return useMemo(() => ({
    convertToNGN,
    calculateVPSItemTotal,
    calculateRDPItemTotal,
    calculateProxyItemTotal,
    calculateItemTotalSync,
    calculateOrderTotalSync,
  }), [
    convertToNGN,
    calculateVPSItemTotal,
    calculateRDPItemTotal,
    calculateProxyItemTotal,
    calculateItemTotalSync,
    calculateOrderTotalSync,
  ]);
};
