<<<<<<< HEAD
import { useCalculateOrderItems } from "./useCalculateOrderTotalSync";
import { CartItem } from "@/pages/Cart";
import React from "react";
import railsApi from "@/lib/railsApi";
=======

import { useCalculateOrderItems } from "./useCalculateOrderTotalSync";
import { CartItem } from "@/pages/UserDashboard/Cart";
import React from "react";
import api from "@/services/api";
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

interface UsePaymentCheckoutHandlersProps {
  // states
  cartItems: CartItem[];
  userBalance: number;
<<<<<<< HEAD
  clientIP: string | null;
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
=======
  setIsLoadingPlisio: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingPayvra: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingPaystack: React.Dispatch<React.SetStateAction<boolean>>;
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  // functions
  clearCart: () => void;
  // constants
  usaEsimInCart: boolean;
}

export const usePaymentCheckoutHandlers = ({
<<<<<<< HEAD
  // states
  cartItems,
  userBalance,
  clientIP,
  exchangeRate,
  // State setters
=======
  cartItems,
  userBalance,
  exchangeRate,
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  setIsLoadingBalance,
  setIsAnyPaymentProcessing,
  setError,
  storeOrderDataForSuccess,
  setUserBalance,
<<<<<<< HEAD
  // functions
  clearCart,
  // constants
=======
  setIsLoadingPlisio,
  setIsLoadingPayvra,
  setIsLoadingPaystack,
  clearCart,
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  usaEsimInCart,
}: UsePaymentCheckoutHandlersProps) => {
  const {
    calculateOrderTotalSync,
  } = useCalculateOrderItems({ cartItems, exchangeRate });

<<<<<<< HEAD
=======
  const getProductId = (item: CartItem): string | number | undefined => {
    switch (item.productType) {
      case "proxy":
      case "residential": return item.plan?.id;
      case "vps": return item.vpsPlan?.id;
      case "rdp": return item.rdpPlan?.id;
      case "esim": return item.esimPackage?.id;
      case "usa-esim": return item.usaEsimPlan?.id;
      case "vpn": return item.vpnPlan?.id;
      default: return undefined;
    }
  };

  const getQuantity = (item: CartItem): number => {
    return item.quantity || item.period || item.duration || 1;
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
      case "residential":
        meta.country_code = item.locationId || (item.locations?.city as any)?.country_id || (item.locations?.isp as any)?.country_code || (item.plan as any)?.country_code;
        meta.protocol = item.protocol;
        meta.isp = item.locations?.isp?.name;
        meta.city = item.locations?.city?.name;
        meta.duration_days = (item.period || 1) * 30;
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
        meta.duration_days = (item.period || 1) * 30;
        break;
    }

    return meta;
  };

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  const handleBalancePayment = async () => {
    setIsLoadingBalance(true);
    setIsAnyPaymentProcessing(true);
    setError(null);
    try {
      if (!cartItems.length) throw new Error("Your cart is empty");
<<<<<<< HEAD

=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      const totalUsd = calculateOrderTotalSync();
      if (userBalance < totalUsd) {
        throw new Error(
          `Insufficient balance. You have $${userBalance.toFixed(2)}, but need $${totalUsd.toFixed(2)}`,
        );
      }

<<<<<<< HEAD
      // Rails API call
      const { data } = await railsApi.post('/cart/checkout', {
        payment_method: 'balance',
        client_ip: clientIP || "unknown",
        origin: window.location.origin
      });

      const orderId = data.order_id || storeOrderDataForSuccess(cartItems, totalUsd, "balance");

      clearCart();
      setUserBalance(userBalance - totalUsd);

      // Redirect to success page
      window.location.href = `${window.location.origin}/payments/success?payment=balance&type=mixed&amount=${totalUsd.toFixed(2)}&order_id=${orderId}`;

    } catch (err: any) {
      console.error("Balance payment error:", err);
      const errorMessage = err.response?.data?.error || err.message || "An error occurred";
      setError(errorMessage);
=======
      let newBalance = userBalance;

      // Process each item in the cart through the standard Rails Orders API
      for (const item of cartItems) {
        const payload = {
          product_id: getProductId(item),
          quantity: getQuantity(item),
          payment_method: 'wallet',
          metadata: buildMetadata(item)
        };
        const { data } = await api.post("/web/api/orders", payload);
        if (data && data.order && data.order.amount) {
          newBalance -= data.order.amount;
        }
      }

      const orderId = storeOrderDataForSuccess(cartItems, totalUsd, "balance");
      clearCart();
      setUserBalance(newBalance);
      globalThis.location.href = `${globalThis.location?.origin}/payments/success?payment=balance&type=mixed&amount=${totalUsd.toFixed(2)}&order_id=${orderId}`;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "An error occurred";
      setError(msg);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    } finally {
      setIsLoadingBalance(false);
      setIsAnyPaymentProcessing(false);
    }
  };

<<<<<<< HEAD
  const handlePlisioCheckout = async () => {
    if (usaEsimInCart) {
      setError("Only Balance payment is accepted for USA eSIM purchases.");
      return;
    }
    setError("Crypto payment (Plisio) is temporarily disabled during system upgrade. Please use Balance.");
    /*
    setIsLoadingPlisio(true);
    setIsAnyPaymentProcessing(true);
    setError(null);
    try {
       // ... stubbed implementation
    } catch (err: any) {
       setError(err.message);
    } finally {
       setIsLoadingPlisio(false);
       setIsAnyPaymentProcessing(false);
    }
    */
  };

  const handlePayvraCheckout = async () => {
    if (usaEsimInCart) {
      setError("Only Balance payment is accepted for USA eSIM purchases.");
      return;
    }
    setError("Crypto payment (Payvra) is temporarily disabled during system upgrade. Please use Balance.");
  };

  const handlePaystackCheckout = async () => {
    if (usaEsimInCart) {
      setError("Only Balance payment is accepted for USA eSIM purchases.");
      return;
    }
    setError("Card payment (Paystack) is temporarily disabled during system upgrade. Please use Balance.");
  };

  return {
    handleBalancePayment,
    // handleShopifyCheckout,
=======
  const handleDepositGateway = async (gatewayName: string, setLoadingState: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (usaEsimInCart) {
      setError(
        "Only Balance payment is accepted for USA eSIM purchases. Other methods will soon be functional.",
      );
      return;
    }
    setLoadingState(true);
    setIsAnyPaymentProcessing(true);
    setError(null);
    try {
      const totalUsd = calculateOrderTotalSync();
      storeOrderDataForSuccess(cartItems, totalUsd, gatewayName);
      if (!cartItems.length) throw new Error("Your cart is empty");

      const payload = {
        amount: totalUsd,
        gateway: gatewayName,
        currency: "USD"
      };

      const { data } = await api.post("/web/api/wallet/deposit", payload);

      if (!data?.payment_url) {
        throw new Error("Invalid response: missing payment URL");
      }
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

  return {
    handleBalancePayment,
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    handlePlisioCheckout,
    handlePayvraCheckout,
    handlePaystackCheckout,
  };
};
