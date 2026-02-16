// app/src/pages/NotFound.tsx
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {

  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>404 - Page Not Found | ProxySock</title>
        <meta
          name="description"
          content="The page you are looking for does not exist. Explore our premium proxies, VPS, RDP, and eSIM services."
        />
      </Helmet>

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-8 md:p-12 text-center"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-manrope-bold text-primary">
                  404
                </span>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-pulse" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl md:text-4xl font-manrope-bold font-bold text-foreground mb-4"
          >
            Oops! Page Not Found
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base md:text-lg font-inter-regular text-muted-foreground mb-8 leading-relaxed"
          >
            The page you're looking for seems to have wandered off into the
            digital void. Don't worry, let's get you back to exploring our
            premium digital infrastructure services.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 text-sm sm:text-base font-manrope-semibold font-semibold group"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Go Back
            </button>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-primary text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-sm sm:text-base font-manrope-semibold font-semibold group"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Contact Support
            </Link>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="border-t border-border pt-6"
          >
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                99.9% Uptime
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                24/7 Support
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                Enterprise Security
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
