"use client";

import type React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { isSessionExpired } from "../../services/auth";
import { toast } from "sonner";
import { useRedditTracking } from "../../utils/redditPixel";

import AuthLogo from "../../components/auth/AuthLogo";
import {
  LoginForm,
  SocialLoginButtons,
  LoginHeader,
} from "../../components/auth/login";
import {


  AuroraBackground,
  LoginFeaturesCarousel,
} from "../../components/auth/carousel";



// ProxySock Features Carousel

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  // OAuth loading states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [xLoading, setXLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackPageView } = useRedditTracking();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    // Track page view with Reddit Pixel
    trackPageView();

    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Only redirect if authenticated and session is not expired
    if (isAuthenticated && !isSessionExpired()) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, trackPageView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the login function from AuthContext
      await login(email, password, rememberMe);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.success("Login successful! Welcome back!");

      // Handle navigation here since we removed it from the context
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message || "Login failed");
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = () => {
    if (googleLoading || xLoading || isLoading) return;
    setGoogleLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/web/api/auth/google`;
  };

  // X (Twitter) OAuth Sign In
  const handleXSignIn = () => {
    if (googleLoading || xLoading || isLoading) return;
    setXLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/web/api/auth/twitter`;
  };

  const isOAuthDisabled = googleLoading || xLoading || isLoading;

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Aurora Background with Features */}
      <div className="hidden lg:flex w-[45%] xl:w-[42%] relative">
        <AuroraBackground />

        {/* Login Features Carousel */}
        <LoginFeaturesCarousel />

        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <AuthLogo variant="dark" />
        </div>

        {/* Welcome Text + Stats */}
        <div className="absolute bottom-8 left-8 right-8 z-10 space-y-3">
          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex gap-3"
          >
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "190+", label: "Countries" },
              { value: "24/7", label: "Support" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex-1 bg-white/[0.06] backdrop-blur-xl rounded-xl px-3 py-2.5 border border-white/8 text-center"
              >
                <div className="text-white font-bold text-sm font-manrope">
                  {stat.value}
                </div>
                <div className="text-white/45 text-[10px] font-inter font-medium uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Welcome card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-white/[0.06] backdrop-blur-2xl rounded-2xl p-5 border border-white/8 shadow-2xl"
          >
            <h3 className="text-white/90 text-lg font-semibold leading-relaxed mb-1.5 font-manrope">
              Welcome Back
            </h3>
            <p className="text-white/50 text-sm font-inter leading-relaxed">
              Access premium proxies, RDP, VPS, and global eSIM solutions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center py-8 px-6">
          <AuthLogo variant="auto" size="sm" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[440px]"
          >
            <div className="space-y-6">
              {/* Form Header */}
              <LoginHeader />

              {/* Login Form */}
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isLoading={isLoading}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                error={error}
                isOAuthDisabled={isOAuthDisabled}
                onSubmit={handleSubmit}
              />

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-background text-muted-foreground/60 font-inter font-medium uppercase tracking-widest">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <SocialLoginButtons
                onGoogleSignIn={handleGoogleSignIn}
                onXSignIn={handleXSignIn}
                googleLoading={googleLoading}
                xLoading={xLoading}
                isOAuthDisabled={isOAuthDisabled}
              />

              {/* Footer Links */}
              {/* <LoginFooter /> */}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
