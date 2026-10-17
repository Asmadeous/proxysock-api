import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from "lucide-react";
import StatusLayout from "@/components/public/StatusLayout";
import { useEffect, useState } from 'react';
import { conversionTracker } from '../../utils/redditPixel';

interface PaymentSuccessProps {
  clearCart: () => void;
}

interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity?: number;
}

interface OrderData {
  orderId: string;
  paymentMethod: string;
  timestamp: string;
  items: OrderItem[];
  totalValue: number;
  currency: string;
}

export default function PaymentSuccess({ clearCart }: PaymentSuccessProps) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  // Get data from query params with fallbacks
  const paymentMethodFromQuery = queryParams.get('payment') || 'Unknown Method';
  const amountFromQuery = Number.parseFloat(queryParams.get('amount') ?? '0');
  const orderIdFromQuery = queryParams.get('order_id') || `order_${Date.now()}`;
  const currencyFromQuery = queryParams.get('currency') || 'USD';
  const typeFromQuery = queryParams.get('type') || 'order';

  const isDeposit = typeFromQuery === 'deposit';

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'Africa/Nairobi',
    hour12: true,
  });

  useEffect(() => {
    if (isDeposit) {
      setOrderData(null);
      return;
    }
    // Load order data from localStorage
    const storedOrderData = localStorage.getItem('lastOrder');
    if (storedOrderData) {
      try {
        const parsedOrderData: OrderData = JSON.parse(storedOrderData);
        setOrderData(parsedOrderData);
        console.log('✅ Loaded order data from localStorage:', parsedOrderData);
      } catch (error) {
        console.error('❌ Failed to parse order data:', error);
      }
    }
  }, [isDeposit]);

  useEffect(() => {
    // A wallet deposit is not an order and must preserve the shopping cart.
    if (isDeposit) return;

    // Track Reddit Ads purchase conversion
    const trackPurchaseConversion = async () => {
      const finalAmount = orderData?.totalValue || amountFromQuery;
      const finalOrderId = orderData?.orderId || orderIdFromQuery;
      const finalCurrency = orderData?.currency || currencyFromQuery;
      const orderItems = orderData?.items || [];

      if (finalAmount > 0) {
        try {
          // Determine primary product category
          const categories = orderItems.map(item => item.category);
          const primaryCategory = categories.length === 1
            ? categories[0]
            : categories.length > 1
              ? 'mixed'
              : 'proxy';

          await conversionTracker.trackPurchase({
            orderId: finalOrderId,
            value: finalAmount,
            currency: finalCurrency,
            category: primaryCategory,
            items: orderItems.length > 0 ? orderItems : [{
              id: `product_${Date.now()}`,
              name: 'ProxySock Service',
              category: 'proxy',
              price: finalAmount
            }]
          });

          console.log('✅ Reddit purchase conversion tracked:', {
            orderId: finalOrderId,
            value: finalAmount,
            currency: finalCurrency,
            category: primaryCategory,
            itemCount: orderItems.length || 1,
            items: orderItems
          });

          // Clean up stored order data after successful tracking
          localStorage.removeItem('lastOrder');
        } catch (error) {
          console.error('❌ Failed to track Reddit purchase conversion:', error);
        }
      }
    };

    // Only track once order data is loaded or after a short delay
    const timer = setTimeout(() => {
      trackPurchaseConversion();
      // We can clear the frontend cart here because the backend has already
      // captured the CheckoutSession and will provision the items via webhook.
      clearCart();
    }, 500);

    return () => clearTimeout(timer);
  }, [clearCart, orderData, amountFromQuery, orderIdFromQuery, currencyFromQuery, isDeposit]);

  // Use order data if available, otherwise fall back to query params
  const paymentOrder = isDeposit ? null : orderData;
  const displayOrderId = paymentOrder?.orderId || orderIdFromQuery;
  const displayAmount = paymentOrder?.totalValue || amountFromQuery;
  const displayCurrency = paymentOrder?.currency || currencyFromQuery;
  const displayPaymentMethod = paymentOrder?.paymentMethod || paymentMethodFromQuery;
  const orderItems = paymentOrder?.items || [];

  // Determine product type display
  const getProductTypeDisplay = () => {
    // Check if we have items from localStorage
    if (orderItems.length > 0) {
      if (orderItems.length === 1) return orderItems[0].category.toUpperCase();

      const uniqueCategories = [...new Set(orderItems.map(item => item.category))];
      if (uniqueCategories.length === 1) return uniqueCategories[0].toUpperCase();

      return `MIXED (${uniqueCategories.map(c => c.toUpperCase()).join(', ')})`;
    }

    // Fallback to query parameters
    const productTypeFromQuery = queryParams.get('product_type');
    if (productTypeFromQuery) return productTypeFromQuery.toUpperCase();

    // Last resort fallback based on transaction type
    if (isDeposit) return 'WALLET DEPOSIT';
    return typeFromQuery.toUpperCase();
  };

  return <StatusLayout label="Payment update" mark="✓">
    <Helmet><title>Payment Successful | ProxySock</title><meta name="robots" content="noindex" /></Helmet>
    <p className="proxy-eyebrow">Your next step is ready</p><h1>{isDeposit ? 'Deposit successful.' : 'Payment successful.'}</h1>
    <p>{isDeposit ? 'Thank you. Review your balance and deposit details in your account.' : 'Thank you for your payment. Your order is being processed; follow its progress in your account.'}</p>
    <dl className="status-details">
      {!isDeposit && <div><dt>Order ID</dt><dd>{displayOrderId}</dd></div>}
      <div><dt>{isDeposit ? 'Amount deposited' : 'Amount paid'}</dt><dd>${displayAmount.toFixed(2)} {displayCurrency}</dd></div>
      <div><dt>Payment method</dt><dd>{displayPaymentMethod}</dd></div>
      {!isDeposit && <div><dt>Service type</dt><dd>{getProductTypeDisplay()}</dd></div>}
      <div><dt>Date & time</dt><dd>{formattedDate}</dd></div>
    </dl>
    {orderItems.length > 0 && <div className="status-items"><h2>Order items</h2><ul>{orderItems.map((item,index) => <li key={index}><span>{item.name}{item.quantity && item.quantity > 1 ? ` (×${item.quantity})` : ''}</span><span>${item.price.toFixed(2)}</span></li>)}</ul></div>}
    <div className="status-actions"><Link to="/dashboard" className="proxy-button proxy-button-dark">Go to dashboard <ArrowUpRight size={16} aria-hidden="true" /></Link><Link to={isDeposit ? '/dashboard/transactions' : '/dashboard/orders'} className="proxy-button">{isDeposit ? 'View transaction history' : 'View order history'}</Link></div>
    <Link to="/contact" className="status-support">Questions about this payment? Contact support</Link>
  </StatusLayout>;
}
