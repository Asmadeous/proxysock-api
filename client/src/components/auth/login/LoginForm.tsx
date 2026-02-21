import React from "react";
import { Link } from "react-router-dom";
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
    <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 text-destructive"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
          >
            Email Address
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
          >
            Password
          </label>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              className="pl-10 pr-10 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isOAuthDisabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading || isOAuthDisabled}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:opacity-50"
            />
            <label
              htmlFor="remember-me"
<<<<<<< HEAD
              className="ml-2 block text-sm text-foreground font-inter-regular select-none"
=======
              className="ml-2 block text-sm text-foreground font-inter-regular"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            >
              Remember me
            </label>
          </div>

          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary/80 transition-colors font-manrope-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isOAuthDisabled}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 font-manrope-semibold"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground font-inter-regular">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary/80 transition-colors font-manrope-semibold"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
