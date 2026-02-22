import {
  SHOPIFY_TRANSACTION_FEE_FIXED,
  SHOPIFY_TRANSACTION_FEE_PERCENT,
} from "@/constants/cart";
import { CartItem } from "@/pages/Cart";

export const useCalculateOrderItems = ({
  cartItems,
  exchangeRate,
}: {
  cartItems: CartItem[];
  exchangeRate: number | null;
}) => {
  const convertToNGN = (price: number, currencyCode = "USD"): number => {
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
  };

  const calculateVPSItemTotal = (item: CartItem): number => {
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
  };

  const calculateRDPItemTotal = (item: CartItem): number => {
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
  };

  const calculateProxyItemTotal = (item: CartItem): number => {
    if (!item.plan) return 0;
    const plan = item.plan;
    const period = item.period || 1;
    if (plan.is_owned) {
      const basePrice = Number(plan.base_price) || 0;
      if (plan.billing_type === "daily") {
        const pricePerDay = Number(plan.price_per_day) || 0;
        return basePrice + period * pricePerDay;
      } else if (plan.billing_type === "weekly") {
        const pricePerDay = Number(plan.price_per_day) || 0;
        const weeks = Math.ceil(period / 7);
        return basePrice + weeks * pricePerDay * 7;
      } else if (plan.billing_type === "monthly") {
        const monthlyPrice = Number(plan.price) || 0;
        return basePrice + period * monthlyPrice;
      } else if (plan.billing_type === "usage_gb") {
        const pricePerGb = Number(plan.price_per_gb) || 0;
        const gbIncluded = Number(plan.gb_included) || 0;
        const gbPurchased = Number(period) || 1;
        const billableGb = Math.max(0, gbPurchased - gbIncluded);
        return basePrice + billableGb * pricePerGb;
      } else {
        return basePrice || Number(plan.price) || 0;
      }
    } else {
      const planPrice = Number(plan.price) || 0;
      return planPrice * period;
    }
  };

  const calculateItemTotalSync = (item: CartItem): number => {
    if (item.totalPrice !== undefined) return item.totalPrice;
    if (item.productType === "esim" && item.esimPackage) {
      return (item.esimPackage.price / 10000) * (item.quantity || 1);
    } else if (item.productType === "proxy" && item.plan) {
      return calculateProxyItemTotal(item);
    } else if (item.productType === "residential" && item.plan) {
      return (item.period || 1) * Number(item.plan.price);
    } else if (item.productType === "vps" && item.vpsPlan) {
      return calculateVPSItemTotal(item);
    } else if (item.productType === "rdp" && item.rdpPlan) {
      return calculateRDPItemTotal(item);
    } else if (item.productType === "usa-esim" && item.usaEsimPlan) {
      return (item.usaEsimPlan.price / 100) * (item.quantity || 1);
    } else if (item.productType === "vpn" && item.vpnPlan) {
      return Number(item.vpnPlan.price) || 0;
    }
    return 0;
  };

  const calculateOrderTotalSync = (): number => {
    return cartItems.reduce(
      (sum, item) => sum + calculateItemTotalSync(item),
      0,
    );
  };

  const calculateShopifyTransactionFee = (subtotal: number): number => {
    return (
      subtotal * SHOPIFY_TRANSACTION_FEE_PERCENT + SHOPIFY_TRANSACTION_FEE_FIXED
    );
  };

  const calculateOrderTotalWithShopifyFees = (): number => {
    const subtotal = calculateOrderTotalSync();
    const transactionFee = calculateShopifyTransactionFee(subtotal);
    return subtotal + transactionFee;
  };

  return {
    convertToNGN,
    calculateVPSItemTotal,
    calculateRDPItemTotal,
    calculateProxyItemTotal,
    calculateItemTotalSync,
    calculateOrderTotalSync,
    calculateShopifyTransactionFee,
    calculateOrderTotalWithShopifyFees,
  };
};
