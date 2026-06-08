
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="space-y-3"
    >
      {/* Google Button */}
      <motion.button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isOAuthDisabled}
        whileHover={{ scale: isOAuthDisabled ? 1 : 1.01 }}
        whileTap={{ scale: isOAuthDisabled ? 1 : 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-white/95 hover:bg-gray-50 dark:hover:bg-white border border-gray-200/80 dark:border-gray-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
      >
        {googleLoading ? (
          <motion.div
            className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <FontAwesomeIcon
            icon={faGoogle}
            className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform duration-200"
          />
        )}
        <span className="text-gray-700 font-semibold text-sm font-inter">
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </span>
      </motion.button>

      {/* X (Twitter) Button */}
      <motion.button
        type="button"
        onClick={onXSignIn}
        disabled={isOAuthDisabled}
        whileHover={{ scale: isOAuthDisabled ? 1 : 1.01 }}
        whileTap={{ scale: isOAuthDisabled ? 1 : 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#0a0a0a] hover:bg-black border border-gray-800 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
      >
        {xLoading ? (
          <motion.div
            className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <FontAwesomeIcon
            icon={faXTwitter}
            className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200"
          />
        )}
        <span className="text-white font-semibold text-sm font-inter">
          {xLoading ? "Connecting..." : "Continue with X"}
        </span>
      </motion.button>
    </motion.div>
  );
}
