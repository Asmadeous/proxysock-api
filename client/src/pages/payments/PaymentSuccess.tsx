// import { Helmet } from 'react-helmet-async';
// import { Link, useLocation } from 'react-router-dom';
// import { CheckCircleIcon } from '@heroicons/react/24/solid';
// import { useEffect } from 'react';
// import { conversionTracker } from '../../utils/redditPixel'; // ✅ Import Reddit tracking

// interface PaymentSuccessProps {
//   clearCart: () => void;
// }

// export default function PaymentSuccess({ clearCart }: PaymentSuccessProps) {
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const paymentMethod = queryParams.get('payment') || 'Unknown Method';
//   const amount = Number.parseFloat(queryParams.get('amount') ?? '0');

//   // ✅ Get additional order data for Reddit tracking
//   const orderId = queryParams.get('order_id') || `order_${Date.now()}`;
//   const currency = queryParams.get('currency') || 'USD';
//   const productType = queryParams.get('product_type') || 'proxy'; // proxy, rdp, vps, esim

//   const currentDate = new Date();
//   const formattedDate = currentDate.toLocaleString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: 'numeric',
//     minute: 'numeric',
//     timeZone: 'Africa/Nairobi',
//     hour12: true,
//   });

//   useEffect(() => {
//     // ✅ FIXED: Track Reddit Ads purchase conversion with correct parameters
//     const trackPurchaseConversion = async () => {
//       if (amount > 0) {
//         try {
//           // Get stored order items from localStorage if available
//           const storedOrderData = localStorage.getItem('lastOrder');
//           const orderItems = storedOrderData ? JSON.parse(storedOrderData) : [];

//           // ✅ FIXED: Use correct parameter names matching Reddit pixel tracker
//           await conversionTracker.trackPurchase({
//             orderId: orderId,
//             value: amount,           // ✅ FIXED: 'value' not 'total'
//             currency: currency,
//             category: productType,   // ✅ FIXED: 'category' at root level
//             items: orderItems.length > 0 ? orderItems : [{
//               id: `${productType}_${Date.now()}`,
//               name: `ProxySock ${productType.toUpperCase()} Service`,
//               category: productType,
//               price: amount
//             }]
//           });

//           console.log('✅ Reddit purchase conversion tracked:', {
//             orderId,
//             value: amount,
//             currency,
//             category: productType,
//             itemCount: orderItems.length || 1
//           });

//           // Clean up stored order data
//           localStorage.removeItem('lastOrder');
//         } catch (error) {
//           console.error('❌ Failed to track Reddit purchase conversion:', error);
//         }
//       }
//     };

//     // Track the conversion
//     trackPurchaseConversion();

//     // Clear cart (existing functionality)
//     clearCart();
//   }, [clearCart, amount, orderId, currency, productType]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#1A2333] p-4">
//       <Helmet>
//         <title>Payment Successful | ProxySock</title>
//         <meta name="description" content="Your payment was successfully processed. View your dashboard or order history." />
//       </Helmet>
//       <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
//         <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
//         <p className="text-gray-600 mb-6">Thank you for your payment. Your order is being processed.</p>

//         <div className="space-y-2 text-left mb-6">
//           <p className="text-gray-700"><span className="font-medium">Order ID:</span> {orderId}</p>
//           <p className="text-gray-700"><span className="font-medium">Amount Paid:</span> ${amount.toFixed(2)} {currency}</p>
//           <p className="text-gray-700"><span className="font-medium">Payment Method:</span> {paymentMethod}</p>
//           <p className="text-gray-700"><span className="font-medium">Service Type:</span> {productType.toUpperCase()}</p>
//           <p className="text-gray-700"><span className="font-medium">Date & Time:</span> {formattedDate}</p>
//         </div>

//         {/* ✅ Success indicator for tracking */}
//         {process.env.NODE_ENV === 'development' && (
//           <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
//             <p className="text-green-800 text-sm">
//               ✅ Reddit Ads conversion tracking: Purchase event sent
//             </p>
//             <p className="text-green-600 text-xs mt-1">
//               Order ID: {orderId} | Value: ${amount} | Category: {productType}
//             </p>
//           </div>
//         )}

//         <div className="space-y-3">
//           <Link
//             to="/dashboard"
//             className="block w-full bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
//           >
//             Go to Dashboard
//           </Link>

//           <Link
//             to="/dashboard/orders"
//             className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
//           >
//             View Order History
//           </Link>
//         </div>

//         {/* ✅ Additional tracking for order confirmation email */}
//         <div className="mt-6 pt-4 border-t border-gray-200">
//           <p className="text-gray-500 text-sm">
//             A confirmation email has been sent with your order details.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
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
  }, []);

  useEffect(() => {
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
  }, [clearCart, orderData, amountFromQuery, orderIdFromQuery, currencyFromQuery]);

  // Use order data if available, otherwise fall back to query params
  const displayOrderId = orderData?.orderId || orderIdFromQuery;
  const displayAmount = orderData?.totalValue || amountFromQuery;
  const displayCurrency = orderData?.currency || currencyFromQuery;
  const displayPaymentMethod = orderData?.paymentMethod || paymentMethodFromQuery;
  const orderItems = orderData?.items || [];

  const isActuallyDeposit = isDeposit && orderItems.length === 0;

  // Determine product type display
  const getProductTypeDisplay = () => {
    if (orderItems.length === 0) return 'Service';
    if (orderItems.length === 1) return orderItems[0].category.toUpperCase();

    const uniqueCategories = [...new Set(orderItems.map(item => item.category))];
    if (uniqueCategories.length === 1) return uniqueCategories[0].toUpperCase();

    return `MIXED (${uniqueCategories.map(c => c.toUpperCase()).join(', ')})`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A2333] p-4">
      <Helmet>
        <title>Payment Successful | ProxySock</title>
        <meta name="description" content="Your payment was successfully processed. View your dashboard or order history." />
      </Helmet>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isActuallyDeposit ? 'Deposit Successful' : 'Payment Successful'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isActuallyDeposit
            ? 'Your funds have been successfully added to your account.'
            : 'Thank you for your payment. Your order is being processed.'}
        </p>

        <div className="space-y-2 text-left mb-6">
          {!isActuallyDeposit && (
            <p className="text-gray-700">
              <span className="font-medium">Order ID:</span> {displayOrderId}
            </p>
          )}
          <p className="text-gray-700">
            <span className="font-medium">{isActuallyDeposit ? 'Amount Deposited:' : 'Amount Paid:'}</span> ${displayAmount.toFixed(2)} {displayCurrency}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Payment Method:</span> {displayPaymentMethod}
          </p>
          {!isActuallyDeposit && (
            <p className="text-gray-700">
              <span className="font-medium">Service Type:</span> {getProductTypeDisplay()}
            </p>
          )}

          {/* Show order items if available */}
          {orderItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="font-medium text-gray-900 mb-2">Order Items:</p>
              <ul className="space-y-1">
                {orderItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 flex justify-between">
                    <span>
                      {item.name}
                      {item.quantity && item.quantity > 1 ? ` (×${item.quantity})` : ''}
                    </span>
                    <span className="font-medium">${item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-gray-700 pt-2">
            <span className="font-medium">Date & Time:</span> {formattedDate}
          </p>
        </div>

        {/* Success indicator for tracking (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-green-800 text-sm">
              ✅ Reddit Ads conversion tracking: Purchase event sent
            </p>
            <p className="text-green-600 text-xs mt-1">
              Order ID: {displayOrderId} | Value: ${displayAmount} | Items: {orderItems.length}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="block w-full bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </Link>

          <Link
            to={isActuallyDeposit ? "/dashboard/transactions" : "/dashboard/orders"}
            className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isActuallyDeposit ? 'View Transaction History' : 'View Order History'}
          </Link>
        </div>

        {/* Additional tracking for order confirmation email */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            {isActuallyDeposit
              ? 'A confirmation email for your deposit has been sent.'
              : 'A confirmation email with your order details has been sent.'}
          </p>
        </div>
      </div>
    </div>
  );
}