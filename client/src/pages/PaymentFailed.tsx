import { Link } from "react-router-dom";
import { XCircleIcon } from "@heroicons/react/24/solid";

export default function PaymentFailed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 shadow-2xl rounded-xl overflow-hidden transform transition-all hover:scale-[1.02] duration-300">
        <div className="px-8 py-12 text-center">
          <XCircleIcon className="h-24 w-24 text-red-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Payment Failed</h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            We encountered an issue processing your payment. Please try again or contact support if the problem persists.
          </p>
          <Link
            to="/dashboard/cart"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg">
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}