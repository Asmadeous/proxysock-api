import React from "react";
import { Link } from "react-router-dom";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface RegisterFormProps {
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  passwordConfirmation: string;
  setPasswordConfirmation: (password: string) => void;
  avatar: File | null;
  setAvatar: (file: File | null) => void;
  country: string;
  setCountry: (country: string) => void;
  city: string;
  setCity: (city: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  isLoading: boolean;
  isRateLimited: boolean;
  remainingTime: number | null;
  submitAttempts: number;
  passwordError: string | null;
  passwordStrength: number;
  phone?: string;
  setPhone?: (phone: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function RegisterForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  passwordConfirmation,
  setPasswordConfirmation,
  // avatar,
  // setAvatar,
  country,
  setCountry,
  city,
  setCity,
  showPassword,
  setShowPassword,
  agreedToTerms,
  setAgreedToTerms,
  isLoading,
  isRateLimited,
  remainingTime,
  submitAttempts,
  passwordError,
  passwordStrength,
  onSubmit,
}: RegisterFormProps) {
  const passwordStrengthColors = [
    "bg-muted",
    "bg-destructive",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];
  const passwordStrengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  // Debug log to verify new code is running
  console.log("RegisterForm rendering - with Name fields");

  return (
    <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-6">
      {/* Rate Limit Warning */}
      {isRateLimited && remainingTime && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="text-destructive font-medium font-manrope-semibold">
                Rate Limited
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <ClockIcon className="h-4 w-4 text-destructive" />
                <p className="text-destructive text-sm font-inter-regular">
                  Wait {Math.floor(remainingTime / 60)}m{" "}
                  {remainingTime % 60}s
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Error Alert */}
      {passwordError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-700 text-sm font-inter-regular">{passwordError}</p>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Fields */}
        {/* Name Fields - Simplified Layout */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
            >
              First Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading || isRateLimited}
                required
                placeholder="John"
                className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
            >
              Last Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading || isRateLimited}
                required
                placeholder="Doe"
                className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
              />
            </div>
          </div>
        </div>

        {/* Username Field */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
          >
            Username
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="johndoe123"
              className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
            />
          </div>
        </div>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="you@example.com"
              className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
            />
          </div>
        </div>

        {/* Password Field with Strength Indicator */}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="Create a strong password"
              className="pl-10 pr-10 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isRateLimited}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {/* Password Strength Bar */}
          {password && (
            <div className="mt-2">
              <div className="flex space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength
                      ? passwordStrengthColors[passwordStrength]
                      : "bg-muted"
                      }`}
                  />
                ))}
              </div>
              {passwordStrength > 0 && (
                <p
                  className={`text-xs mt-1 font-inter-regular ${passwordStrength === 1
                    ? "text-destructive"
                    : passwordStrength === 2
                      ? "text-yellow-600"
                      : passwordStrength === 3
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                >
                  {passwordStrengthLabels[passwordStrength]} password
                </p>
              )}
            </div>
          )}
        </div>

        {/* Password Confirmation Field */}
        <div>
          <label
            htmlFor="passwordConfirmation"
            className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
          >
            Confirm Password
          </label>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type={showPassword ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="Confirm your password"
              className="pl-10 pr-10 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
            />
          </div>
        </div>

        {/* Avatar Field Removed */}

        {/* Location Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
            >
              Country
            </label>
            <div className="relative">
              <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                id="country"
                name="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isLoading || isRateLimited}
                required
                placeholder="United States"
                className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
            >
              City
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                id="city"
                name="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isLoading || isRateLimited}
                required
                placeholder="New York"
                className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
              />
            </div>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start items-center">
          <input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isLoading || isRateLimited}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:opacity-50"
          />
          <label
            htmlFor="terms"
            className="ml-2 block text-sm text-foreground font-inter-regular"
          >
            I agree to the{" "}
            <Link
              to="/terms"
              className="text-primary hover:text-primary/80 transition-colors font-manrope-medium"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-primary hover:text-primary/80 transition-colors font-manrope-medium"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={(isLoading || submitAttempts >= 5 || isRateLimited) || !agreedToTerms}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 font-manrope-semibold"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              <span>Creating account...</span>
            </>
          ) : isRateLimited ? (
            <span>Rate limited - wait {remainingTime}s</span>
          ) : submitAttempts >= 5 ? (
            <span>Too many attempts</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground font-inter-regular">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors font-manrope-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
