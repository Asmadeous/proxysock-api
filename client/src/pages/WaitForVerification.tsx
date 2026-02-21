import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Helmet } from 'react-helmet-async';
import { motion } from "framer-motion";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import {
  VerificationHeader,
  VerificationContent,
} from "../components/auth/verification";
import {
  AuroraBackground,
  VerificationFeaturesCarousel,
} from "../components/auth/carousel";


export default function WaitForVerification() {
<<<<<<< HEAD
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check verification status - With Rails, users are verified on registration
  // This page is mostly for email confirmation flows if implemented
  useEffect(() => {
    const checkVerification = async () => {
      if (isAuthenticated && user) {
        // With Rails, if user is authenticated, they're verified
        // If you implement email verification in Rails, check user.status here
        if (user.status === 'active') {
          navigate("/dashboard");
        }
      }
    };

    // Check immediately on mount
    checkVerification();

    // Poll for verification status changes (if email verification is async)
    const checkInterval = setInterval(checkVerification, 5000);

    return () => clearInterval(checkInterval);
  }, [user, isAuthenticated, navigate]);
=======
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check verification status
  useEffect(() => {
    // Supabase removed
  }, [user, navigate]);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Aurora Background with Features */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <AuroraBackground />

        {/* Verification Features Carousel */}
        <VerificationFeaturesCarousel />

        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <ShieldCheckIcon className="h-6 w-6 text-red-400" />
            </div>
            <span className="text-white font-bold text-xl">ProxySock</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h3 className="text-white/90 text-lg font-medium leading-relaxed mb-2">
              Email Verification Required
            </h3>
            <p className="text-white/60 text-sm">
              Verify your email to complete your ProxySock account setup and start accessing our services
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Verification Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center py-8 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-foreground font-bold text-lg">ProxySock</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            <Helmet>
              <title>Verify Your Email | ProxySock</title>
              <meta name="description" content="Please verify your email to access your ProxySock account and services." />
            </Helmet>

            <div className="space-y-6">
              {/* Form Header */}
              <VerificationHeader />

              {/* Verification Content */}
              <VerificationContent userEmail={user?.email} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}