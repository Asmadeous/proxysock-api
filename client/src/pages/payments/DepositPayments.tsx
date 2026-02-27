"use client"

import React from 'react';

interface DepositPaymentProps {
  clientSecret?: string;
  paymentUrl?: string;
  onCancel: () => void;
}

const DepositPayment: React.FC<DepositPaymentProps> = ({ paymentUrl, onCancel }) => {
  if (paymentUrl) {
    return (
      <div className="p-4">
        <p className="text-gray-300 mb-4">You will be redirected to complete your payment.</p>
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

  return <p className="text-[#FF3D77] p-4">Payment method not supported or initialization failed.</p>;
};

export default DepositPayment;