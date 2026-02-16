import { Link } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function DepositSuccess() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 text-center">
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Deposit Successful!</h2>
          <p className="text-gray-300 mb-6">
            Your funds have been successfully added to your account.
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
