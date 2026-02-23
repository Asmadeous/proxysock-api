"use client";

import type React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { isSessionExpired } from "../../services/auth";
import { toast } from "react-hot-toast";
import { useRedditTracking } from "../../utils/redditPixel";

import { ShieldCheckIcon } from "@heroicons/react/24/outline";
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
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <AuroraBackground />

        {/* Login Features Carousel */}
        <LoginFeaturesCarousel />

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
              Welcome Back
            </h3>
            <p className="text-white/60 text-sm">
              Access premium proxies, RDP, VPS, and global eSIM solutions
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
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
              <div className="relative my-6 lg:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-r from-transparent via-white/10 to-transparent text-foreground font-medium rounded-full py-1 backdrop-blur-sm">
                    OR
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
