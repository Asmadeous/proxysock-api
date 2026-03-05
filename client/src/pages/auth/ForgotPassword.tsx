import { useState } from "react";

import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ForgotPasswordHeader,
  ForgotPasswordForm,
} from "../../components/auth/forgot-password";
import {
  AuroraBackground,
  PasswordResetFeaturesCarousel,
} from "../../components/auth/carousel";
import { ShieldCheckIcon } from "lucide-react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/web/api/auth/forgot_password", { email });
      setIsSuccess(true);
      toast.success("Instructions sent! Please check your email.");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to send reset instructions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Panel - Aurora Background with Features */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <AuroraBackground />
        <PasswordResetFeaturesCarousel />
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <ShieldCheckIcon className="h-6 w-6 text-red-500" />
            </div>
            <span className="text-white font-bold text-xl uppercase tracking-wider">ProxySock</span>
          </div>
        </div>
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h3 className="text-white text-lg font-bold leading-relaxed mb-2">
              Secure Password Recovery
            </h3>
            <p className="text-white/70 text-sm">
              Reset your password safely and get back to accessing your ProxySock account
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Forgot Password Form or Success State */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="lg:hidden flex items-center justify-center py-8 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-foreground font-bold text-lg uppercase tracking-wider">ProxySock</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            {isSuccess ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <EnvelopeIcon className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Check your email</h1>
                <p className="text-muted-foreground text-lg italic">
                  We've sent password reset instructions to <span className="text-foreground font-semibold not-italic">{email}</span>.
                  Please check your inbox and follow the link to reset your password.
                </p>
                <div className="pt-8">
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-600/20"
                  >
                    Return to Login
                  </a>
                </div>
                <p className="text-sm text-muted-foreground pt-4">
                  Didn't receive an email? <button onClick={() => setIsSuccess(false)} className="text-red-500 font-semibold hover:underline">Try again</button>
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <ForgotPasswordHeader />
                <ForgotPasswordForm
                  email={email}
                  setEmail={setEmail}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
