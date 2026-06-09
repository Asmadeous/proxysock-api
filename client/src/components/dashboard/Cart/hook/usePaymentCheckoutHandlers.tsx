
import { useCalculateOrderItems } from "./useCalculateOrderTotalSync";
import { CartItem } from "@/types";
import React from "react";
import api from "@/services/api";

interface UsePaymentCheckoutHandlersProps {
  // states
  cartItems: CartItem[];
  userBalance: number;
  exchangeRate: number | null;
  // State setters
  setIsLoadingBalance: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAnyPaymentProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  storeOrderDataForSuccess: (
    cartItems: CartItem[],
    amount: number,
    paymentMethod: string,
  ) => string;
  setUserBalance: React.Dispatch<React.SetStateAction<number>>;
  setIsLoadingPlisio: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingPayvra: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingPaystack: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingHundredpay: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingFastspring: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingHeleket?: React.Dispatch<React.SetStateAction<boolean>>;
  // functions
  clearCart: () => void;
  // constants
  onSuccess?: (orderId: string) => void;
  promoCode?: string;
}

export const usePaymentCheckoutHandlers = ({
  cartItems,
  userBalance,
  exchangeRate,
  setIsLoadingBalance,
  setIsAnyPaymentProcessing,
  setError,
  storeOrderDataForSuccess,
  setUserBalance,
  setIsLoadingPlisio,
  setIsLoadingPayvra,
  setIsLoadingPaystack,
  setIsLoadingHundredpay,
  setIsLoadingFastspring,
  setIsLoadingHeleket,
  clearCart,
  onSuccess,
  promoCode,
}: UsePaymentCheckoutHandlersProps) => {
  const {
    calculateOrderTotalSync,
  } = useCalculateOrderItems({ cartItems, exchangeRate });

  const getProductId = (item: CartItem): string | number | undefined => {
    switch (item.productType) {
      case "proxy":
      case "residential":
      case "global-isp": return item.plan?.id;
      case "vps": return item.vpsPlan?.id;
      case "rdp": return item.rdpPlan?.id;
      case "esim": return item.esimPackage?.id;
      case "usa-esim": return item.usaEsimPlan?.id;
      case "vpn": return item.vpnPlan?.id;
      default: return undefined;
    }
  };

  const getQuantity = (item: CartItem): number => {
    // Only return explicit quantity (number of instances like eSIMs), 
    // otherwise default to 1 instance. Period/duration are handled in metadata.
    return item.quantity || 1;
  };

  const buildMetadata = (item: CartItem) => {
    const meta: Record<string, any> = {};

    switch (item.productType) {
      case "vps":
      case "rdp":
        meta.os_template = item.osTemplate;
        meta.hostname = item.hostname;
        meta.duration_days = (item.duration || 1) * 30; // Assuming duration is in months
        meta.management_type = item.managementType;
        if (item.productType === "vps") {
          meta.cpu_cores = item.vpsPlan?.cpu_cores;
          meta.ram_gb = item.vpsPlan?.ram_gb;
          meta.storage_gb = item.vpsPlan?.storage_gb;
          meta.country_code = item.location?.countryCode;
        } else {
          meta.cpu_cores = item.rdpPlan?.cpu_cores;
          meta.ram_gb = item.rdpPlan?.ram_gb;
          meta.storage_gb = item.rdpPlan?.storage_gb;
          meta.country_code = item.location?.countryCode;
        }
        break;
      case "proxy":
      case "global-isp":
        meta.country_code = item.locationId || (item.locations?.city as any)?.country_id || (item.locations?.isp as any)?.country_code || (item.plan as any)?.country_code;
        meta.protocol = item.protocol;
        meta.isp = item.locations?.isp?.name;
        meta.city = item.locations?.city?.name;
        meta.duration_days = (Number(item.period) || 1) * 30;
        // Pass numeric location/city ID for the MyProxyApi 'locations' param
        meta.locationId = item.locationId || (item.locations?.city as any)?.id || (item.locations?.isp as any)?.id;
        // Global ISP specific fields
        if ((item as any).globalTarget?.id) meta.target_id = (item as any).globalTarget.id;
        if ((item as any).globalTargetSectionId) meta.target_section_id = (item as any).globalTargetSectionId;
        if ((item as any).globalCountry?.id) meta.selected_country_id = (item as any).globalCountry.id;
        break;
      case "residential":
        // period = GB amount (NOT multiplied by 30)
        meta.protocol = item.protocol;
        meta.duration_days = Number(item.period) || 1; // GB amount passed as the period for residential
        // Detect resi v2 flag from the plan
        if (item.plan?.resi) meta.resi = item.plan.resi;
        // Pass the full residential rotating config so the backend reads residentalRotatingConfig
        if (item.residentalRotatingConfig) {
          meta.residentalRotatingConfig = item.residentalRotatingConfig;
        }
        break;
      case "esim":
      case "usa-esim":
        meta.country_code = item.productType === "usa-esim" ? "US" : "global";
        meta.package_code = item.productType === "usa-esim" ? item.usaEsimPlan?.id : item.esimPackage?.id;
        meta.data_gb = item.productType === "usa-esim" ? parseInt((item.usaEsimPlan?.data_amount || "0").replace(/\D/g, '')) : (item.esimPackage?.volume || 0);
        break;
      case "vpn":
        meta.country_code = (item.locations?.isp as any)?.country_code || (item.locations?.city as any)?.country_id || "US";
        meta.protocol = item.protocol || "wireguard";
        meta.duration_days = (Number(item.period) || 1) * 30;
        break;
    }

    return meta;
  };

  const buildCartPayload = () => {
    return cartItems.map(item => ({
      product_id: getProductId(item),
      quantity: getQuantity(item),
      metadata: {
        ...buildMetadata(item),
        auto_renew: !!item.auto_renew,
        ...(item.period ? { period: item.period } : {}),
        ...(item.locationId ? { locationId: item.locationId } : {}),
        ...(item.locationsString ? { locationsString: item.locationsString } : {}),
        ...(item.protocol ? { protocol: item.protocol } : {})
      }
    }));
  };

  const handleBalancePayment = async () => {
    setIsLoadingBalance(true);
    setIsAnyPaymentProcessing(true);
    setError(null);
    try {
      if (!cartItems.length) throw new Error("Your cart is empty");
      const totalUsd = calculateOrderTotalSync();
      if (userBalance < totalUsd) {
        throw new Error(
          `Insufficient balance. You have $${userBalance.toFixed(2)}, but need $${totalUsd.toFixed(2)}`,
        );
      }

      const customerEmail = localStorage.getItem("enterprise_customer_email");
      const payload = {
        items: buildCartPayload(),
        payment_method: 'wallet',
        ...(promoCode ? { promo_code: promoCode } : {}),
        ...(customerEmail ? { customer_email: customerEmail } : {}),
      };

      const { data: checkoutData } = await api.post("/web/api/orders/checkout_cart", payload);

      const orderId = storeOrderDataForSuccess(cartItems, totalUsd, "balance");
      clearCart();

      // Update balance from response if available, otherwise fallback to local calculation
      if (checkoutData?.available_balance !== undefined) {
        setUserBalance(Number(checkoutData.available_balance));
      } else {
        setUserBalance(prev => prev - totalUsd);
      }

      if (onSuccess) {
        onSuccess(orderId);
      } else {
        globalThis.location.href = `${globalThis.location?.origin}/payments/success?payment=balance&type=mixed&amount=${totalUsd.toFixed(2)}&order_id=${orderId}`;
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "An error occurred";
      setError(msg);
    } finally {
      setIsLoadingBalance(false);
      setIsAnyPaymentProcessing(false);
    }
  };

  const handleDepositGateway = async (gatewayName: string, setLoadingState: React.Dispatch<React.SetStateAction<boolean>>) => {

    setLoadingState(true);
    setIsAnyPaymentProcessing(true);
    setError(null);
    try {
      if (!cartItems.length) throw new Error("Your cart is empty");
      const totalUsd = calculateOrderTotalSync();

      const customerEmail = localStorage.getItem("enterprise_customer_email");
      const payload = {
        items: buildCartPayload(),
        payment_method: 'gateway',
        gateway: gatewayName,
        ...(promoCode ? { promo_code: promoCode } : {}),
        ...(customerEmail ? { customer_email: customerEmail } : {}),
      };

      const { data } = await api.post("/web/api/orders/checkout_cart", payload);

      if (!data?.payment_url) {
        throw new Error("Invalid response: missing payment URL");
      }

      storeOrderDataForSuccess(cartItems, totalUsd, gatewayName);

      // Do not clear the cart yet! Let them complete payment.
      // The success page will clear the cart when they return.
      globalThis.location.href = data.payment_url;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "An error occurred";
      setError(msg);
    } finally {
      setLoadingState(false);
      setIsAnyPaymentProcessing(false);
    }
  };

  const handlePlisioCheckout = () => handleDepositGateway('plisio', setIsLoadingPlisio);
  const handlePayvraCheckout = () => handleDepositGateway('payvra', setIsLoadingPayvra);
  const handlePaystackCheckout = () => handleDepositGateway('paystack', setIsLoadingPaystack);
  const handleHundredpayCheckout = () => handleDepositGateway('hundredpay', setIsLoadingHundredpay);
  const handleFastSpringCheckout = () => handleDepositGateway('fastspring', setIsLoadingFastspring);
  const handleHeleketCheckout = () => setIsLoadingHeleket && handleDepositGateway('heleket', setIsLoadingHeleket);

  return {
    handleBalancePayment,
    handlePlisioCheckout,
    handlePayvraCheckout,
    handlePaystackCheckout,
    handleHundredpayCheckout,
    handleFastSpringCheckout,
    handleHeleketCheckout,
  };
};
