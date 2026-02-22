
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faXTwitter } from "@fortawesome/free-brands-svg-icons";

interface SocialLoginButtonsProps {
  onGoogleSignIn: () => void;
  onXSignIn: () => void;
  googleLoading: boolean;
  xLoading: boolean;
  isOAuthDisabled: boolean;
}

export default function SocialLoginButtons({
  onGoogleSignIn,
  onXSignIn,
  googleLoading,
  xLoading,
  isOAuthDisabled,
}: SocialLoginButtonsProps) {
  return (
    <div className="space-y-4">
      {/* Google Button */}
      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isOAuthDisabled}
        className="w-full flex items-center justify-center px-6 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl group"
      >
        {googleLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 mr-3"></div>
        ) : (
          <FontAwesomeIcon
            icon={faGoogle}
            className="h-5 w-5 text-red-500 mr-3 group-hover:scale-110 transition-transform"
          />
        )}
        <span className="text-gray-800 font-semibold">
          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </span>
      </button>

      {/* X (Twitter) Button */}
      <button
        type="button"
        onClick={onXSignIn}
        disabled={isOAuthDisabled}
        className="w-full flex items-center justify-center px-6 py-4 bg-black hover:bg-gray-900 border border-gray-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl group"
      >
        {xLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
        ) : (
          <FontAwesomeIcon
            icon={faXTwitter}
            className="h-5 w-5 text-white mr-3 group-hover:scale-110 transition-transform"
          />
        )}
        <span className="text-white font-semibold">
          {xLoading ? "Connecting to X..." : "Continue with X"}
        </span>
      </button>
    </div>
  );
}
