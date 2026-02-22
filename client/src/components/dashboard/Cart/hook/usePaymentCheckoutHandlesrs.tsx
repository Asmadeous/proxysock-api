import { useCalculateOrderItems } from "./useCalculateOrderTotalSync";
import { CartItem } from "@/pages/Cart";
import React from "react";
import railsApi from "@/lib/railsApi";

interface UsePaymentCheckoutHandlersProps {
  // states
  cartItems: CartItem[];
  userBalance: number;
  clientIP: string | null;
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
  // functions
  clearCart: () => void;
  // constants
  usaEsimInCart: boolean;
}

export const usePaymentCheckoutHandlers = ({
  // states
  cartItems,
  userBalance,
  clientIP,
  exchangeRate,
  // State setters
  setIsLoadingBalance,
  setIsAnyPaymentProcessing,
  setError,
  storeOrderDataForSuccess,
  setUserBalance,
  // functions
  clearCart,
  // constants
  usaEsimInCart,
}: UsePaymentCheckoutHandlersProps) => {
  const {
    calculateOrderTotalSync,
  } = useCalculateOrderItems({ cartItems, exchangeRate });

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
    } finally {
      setIsLoadingBalance(false);
      setIsAnyPaymentProcessing(false);
    }
  };

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
    handlePlisioCheckout,
    handlePayvraCheckout,
    handlePaystackCheckout,
  };
};
