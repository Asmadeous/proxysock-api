import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Helmet } from 'react-helmet-async';
import { motion } from "framer-motion";
import AuthLogo from "../../components/auth/AuthLogo";
import {
  VerificationHeader,
  VerificationContent,
} from "../../components/auth/verification";
import {
  AuroraBackground,
  VerificationFeaturesCarousel,
} from "../../components/auth/carousel";


export default function WaitForVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check verification status
  useEffect(() => {
    // Check verification status moved to Rails API
  }, [user, navigate]);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Aurora Background with Features */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <AuroraBackground />

        {/* Verification Features Carousel */}
        <VerificationFeaturesCarousel />

        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <AuthLogo variant="dark" />
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
          <AuthLogo variant="auto" size="sm" />
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