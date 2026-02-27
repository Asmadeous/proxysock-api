import { Link } from "react-router-dom";
import { XCircleIcon } from "@heroicons/react/24/solid";

export default function DepositFailed() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 text-center">
          <XCircleIcon className="h-20 w-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Deposit Failed</h2>
          <p className="text-gray-300 mb-6">
            There was an issue processing your deposit. Please try again.
          </p>
          <Link
            to="/fund-account"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
            Back to Deposit
          </Link>
        </div>
      </div>
    </div>
  );
}
