import { useState } from "react";
// import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ForgotPasswordHeader,
  ForgotPasswordForm,
} from "../components/auth/forgot-password";
import {
  AuroraBackground,
  PasswordResetFeaturesCarousel,
} from "../components/auth/carousel";
import { ShieldCheckIcon } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Stubbed functionality - Supabase removed
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.error("Password reset is currently disabled during system migration. Please contact support.");

      /* 
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Password reset instructions have been sent to your email.");
      */
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to send reset instructions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Aurora Background with Features */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <AuroraBackground />

        {/* Password Reset Features Carousel */}
        <PasswordResetFeaturesCarousel />

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
              Secure Password Recovery
            </h3>
            <p className="text-white/60 text-sm">
              Reset your password safely and get back to accessing your ProxySock account
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
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
            <div className="space-y-6">
              {/* Form Header */}
              <ForgotPasswordHeader />

              {/* Forgot Password Form */}
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                isLoading={isLoading}
                onSubmit={handleSubmit}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
