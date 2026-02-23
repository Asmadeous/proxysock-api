"use client"

import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface DepositPaymentProps {
  clientSecret?: string;
  paymentUrl?: string;
  onCancel: () => void;
}

const DepositPayment: React.FC<DepositPaymentProps> = ({ clientSecret, paymentUrl, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    if (!stripe || !elements || !clientSecret) {
      setError('Stripe not initialized or missing client secret');
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {}
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        globalThis.location.href = `${globalThis.location?.origin}/deposit?success=true`;
      } else {
        throw new Error('Payment not successful');
      }
    } catch (err) {
      console.error('Stripe payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (paymentUrl) {
    return (
      <div className="p-4">
        <p className="text-gray-300 mb-4">You will be redirected to complete your crypto payment.</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="bg-[#444] hover:bg-[#555] text-gray-300 font-semibold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <a
            href={paymentUrl}
            className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-semibold py-2 px-4 rounded-lg"
          >
            Proceed to Payment
          </a>
        </div>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <form onSubmit={handleStripeSubmit} className="p-4">
        <div className="mb-4">
          <div className="block text-gray-300 mb-2 font-medium">Card Details</div>
          <div className="p-2 border border-[#444] bg-[#2d3748] rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': { color: '#888' }
                  },
                  invalid: { color: '#FF3D77' }
                }
              }}
            />
          </div>
        </div>
        {error && <p className="text-[#FF3D77] mb-4">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#444] hover:bg-[#555] text-gray-300 font-semibold py-2 px-4 rounded-lg"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-semibold py-2 px-4 rounded-lg"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>
    );
  }

  return <p className="text-[#FF3D77] p-4">No payment method selected</p>;
};

const WrappedDepositPayment: React.FC<DepositPaymentProps> = (props) => (
  <Elements stripe={stripePromise}>
    <DepositPayment {...props} />
  </Elements>
);

export default WrappedDepositPayment;