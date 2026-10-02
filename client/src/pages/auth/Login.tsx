"use client";

import type React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LoginBrandPanel from "@/components/auth/login/LoginBrandPanel";
import "./login.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { isSessionExpired } from "../../services/auth";
import { toast } from "sonner";
import { useRedditTracking } from "../../utils/redditPixel";

import {
  LoginForm,
  SocialLoginButtons,
  LoginHeader,
} from "../../components/auth/login";
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
    <div className="login-page">
      <LoginBrandPanel />
      <main className="login-main">
        <header className="login-topbar">
          <Link to="/" className="login-back"><ArrowLeft size={15} aria-hidden="true" /> Back to website</Link>
        </header>
        <div className="login-form-area">
          <div className="login-form-content">
            <LoginHeader />
            <LoginForm
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              isLoading={isLoading} showPassword={showPassword}
              setShowPassword={setShowPassword} rememberMe={rememberMe}
              setRememberMe={setRememberMe} error={error}
              isOAuthDisabled={isOAuthDisabled} onSubmit={handleSubmit}
            />
            <div className="login-divider"><span>Or continue with</span></div>
            <SocialLoginButtons
              onGoogleSignIn={handleGoogleSignIn} onXSignIn={handleXSignIn}
              googleLoading={googleLoading} xLoading={xLoading}
              isOAuthDisabled={isOAuthDisabled}
            />
            <p className="login-register">New to ProxySock? <Link to="/register">Create an account <span aria-hidden="true">↗</span></Link></p>
          </div>
        </div>
      </main>
    </div>
  );
}
