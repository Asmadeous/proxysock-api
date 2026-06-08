import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  error: string;
  isOAuthDisabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  error,
  isOAuthDisabled,
  onSubmit,
}: LoginFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-card/60 backdrop-blur-2xl rounded-2xl border border-border/60 shadow-2xl shadow-black/5 dark:shadow-black/20 p-7 relative overflow-hidden"
    >
      {/* Subtle gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          className="bg-destructive/8 border border-destructive/15 rounded-xl p-3.5 mb-5 backdrop-blur-sm"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <svg
                className="h-4 w-4 text-destructive"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-destructive text-sm font-medium font-inter">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Login Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground/80 font-manrope-medium"
          >
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-focus-within:bg-primary/10">
              <EnvelopeIcon className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isOAuthDisabled}
              placeholder="you@example.com"
              className="pl-14 pr-4 py-3.5 w-full rounded-xl border border-input/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground/80 font-manrope-medium"
          >
            Password
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-focus-within:bg-primary/10">
              <LockClosedIcon className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isOAuthDisabled}
              placeholder="Enter your password"
              className="pl-14 pr-12 py-3.5 w-full rounded-xl border border-input/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isOAuthDisabled}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label
            htmlFor="remember-me"
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || isOAuthDisabled}
                className="sr-only peer"
              />
              <div className="w-[18px] h-[18px] rounded-md border-2 border-input/80 peer-checked:border-primary peer-checked:bg-primary transition-all duration-200 flex items-center justify-center">
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-inter">
              Remember me
            </span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-primary/80 hover:text-primary transition-colors font-manrope-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading || isOAuthDisabled}
          whileHover={{ scale: isLoading || isOAuthDisabled ? 1 : 1.01 }}
          whileTap={{ scale: isLoading || isOAuthDisabled ? 1 : 0.98 }}
          className="w-full bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 disabled:from-muted disabled:to-muted disabled:cursor-not-allowed text-primary-foreground py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-manrope shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none text-sm"
        >
          {isLoading ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </motion.button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center mt-6 pt-5 border-t border-border/40">
        <p className="text-sm text-muted-foreground font-inter">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary/80 transition-colors font-manrope"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
