import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { getCountries, getCitiesForCountry } from "../../../data/countryCities";
import { checkUsername as checkUsernameApi } from "../../../services/api";
import SearchableSelect from "../../ui/SearchableSelect";

interface RegisterFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  passwordConfirmation: string;
  setPasswordConfirmation: (v: string) => void;
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
  profilePicture: File | null;
  setProfilePicture: (v: File | null) => void;
  referralCode: string;
  setReferralCode: (v: string) => void;
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
  profilePicture,
  setProfilePicture,
  referralCode,
  setReferralCode,
  onSubmit,
}: RegisterFormProps) {
  const passwordStrengthColors = [
    "bg-muted",
    "bg-destructive",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];
  const passwordStrengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const usernameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username check
  useEffect(() => {
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);

    if (!username || username.length < 3) {
      setUsernameStatus({
        checking: false,
        available: username.length > 0 ? false : null,
        message: username.length > 0 ? "Username must be at least 3 characters" : "",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: "Only letters, numbers, and underscores allowed",
      });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: "Checking..." });

    usernameDebounce.current = setTimeout(async () => {
      try {
        const { data } = await checkUsernameApi(username);
        setUsernameStatus({
          checking: false,
          available: data.available,
          message: data.message,
        });
      } catch {
        setUsernameStatus({
          checking: false,
          available: null,
          message: "Could not verify username",
        });
      }
    }, 500);

    return () => {
      if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    };
  }, [username]);

  // Password confirmation match
  const passwordsMatch = passwordConfirmation.length > 0 && password === passwordConfirmation;
  const passwordsMismatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;

  // Memoize country options with flag URLs
  const countryOptions = useMemo(() => {
    return getCountries().map((c) => ({
      value: c.isoCode,
      label: c.name,
      flagUrl: `https://flagcdn.com/w40/${c.isoCode.toLowerCase()}.png`,
    }));
  }, []);

  // City options
  const cityOptions = useMemo(() => {
    if (!country) return [];
    return getCitiesForCountry(country).map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [country]);

  const handleCountryChange = (val: string) => {
    setCountry(val);
    setCity("");
  };

  // Shared input class
  const inputBase = "pl-14 pr-4 py-3.5 w-full rounded-xl border border-input/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm";

  // Shared icon wrapper
  const IconBox = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-focus-within:bg-primary/10 ${className}`}>
      {children}
    </div>
  );

  const iconClass = "h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-card/60 backdrop-blur-2xl rounded-2xl border border-border/60 shadow-2xl shadow-black/5 dark:shadow-black/20 p-7 relative overflow-hidden"
    >
      {/* Subtle gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Rate Limit Warning */}
      {isRateLimited && remainingTime && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/8 border border-destructive/15 rounded-xl p-4 mb-6 backdrop-blur-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-destructive font-semibold text-sm font-manrope">
                Rate Limited
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ClockIcon className="h-3.5 w-3.5 text-destructive/70" />
                <p className="text-destructive/80 text-xs font-inter">
                  Wait {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Password Error Alert */}
      {passwordError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3.5 mb-5 backdrop-blur-sm"
        >
          <div className="flex items-start space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-amber-700 dark:text-amber-300 text-sm font-inter pt-1.5">{passwordError}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
              First Name
            </label>
            <div className="relative group">
              <IconBox>
                <UserIcon className={iconClass} />
              </IconBox>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading || isRateLimited}
                required
                placeholder="John"
                className={inputBase}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
              Last Name
            </label>
            <div className="relative group">
              <IconBox>
                <UserIcon className={iconClass} />
              </IconBox>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading || isRateLimited}
                required
                placeholder="Doe"
                className={inputBase}
              />
            </div>
          </div>
        </div>

        {/* Username with live availability */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
            Username
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-focus-within:bg-primary/10">
              <span className="text-muted-foreground text-sm font-semibold transition-colors group-focus-within:text-primary">@</span>
            </div>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              disabled={isLoading || isRateLimited}
              required
              placeholder="johndoe"
              maxLength={30}
              className={`pl-14 pr-12 py-3.5 w-full rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm ${usernameStatus.available === true
                ? "border-emerald-500/60 focus:border-emerald-500"
                : usernameStatus.available === false
                  ? "border-destructive/60 focus:border-destructive"
                  : "border-input/60 focus:border-primary/40"
                }`}
            />
            {/* Status icon */}
            <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
              {usernameStatus.checking ? (
                <motion.div
                  className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : usernameStatus.available === true ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              ) : usernameStatus.available === false ? (
                <XCircleIcon className="h-5 w-5 text-destructive" />
              ) : null}
            </div>
          </div>
          {usernameStatus.message && (
            <p className={`text-xs font-inter ${usernameStatus.available === true ? "text-emerald-600 dark:text-emerald-400" : usernameStatus.available === false ? "text-destructive" : "text-muted-foreground"
              }`}>
              {usernameStatus.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
            Email Address
          </label>
          <div className="relative group">
            <IconBox>
              <EnvelopeIcon className={iconClass} />
            </IconBox>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="you@example.com"
              className={inputBase}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
            Password
          </label>
          <div className="relative group">
            <IconBox>
              <LockClosedIcon className={iconClass} />
            </IconBox>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="Create a strong password"
              className="pl-14 pr-12 py-3.5 w-full rounded-xl border border-input/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isRateLimited}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
            >
              {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="pt-1">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < passwordStrength ? passwordStrengthColors[passwordStrength] : "bg-muted"
                      }`}
                  />
                ))}
              </div>
              {passwordStrength > 0 && (
                <p className={`text-xs mt-1.5 font-inter font-medium ${passwordStrength === 1 ? "text-destructive"
                  : passwordStrength === 2 ? "text-amber-600 dark:text-amber-400"
                    : passwordStrength === 3 ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                  {passwordStrengthLabels[passwordStrength]} password
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
            Confirm Password
          </label>
          <div className="relative group">
            <IconBox>
              <LockClosedIcon className={iconClass} />
            </IconBox>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type={showPassword ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              disabled={isLoading || isRateLimited}
              required
              placeholder="Re-enter your password"
              className={`pl-14 pr-12 py-3.5 w-full rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm ${passwordsMatch
                ? "border-emerald-500/60 focus:border-emerald-500"
                : passwordsMismatch
                  ? "border-destructive/60 focus:border-destructive"
                  : "border-input/60 focus:border-primary/40"
                }`}
            />
            <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
              {passwordsMatch ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              ) : passwordsMismatch ? (
                <XCircleIcon className="h-5 w-5 text-destructive" />
              ) : null}
            </div>
          </div>
          {passwordsMismatch && (
            <p className="text-xs text-destructive font-inter">
              Passwords do not match
            </p>
          )}
        </div>

        {/* Country & City Dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="country" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
              Country
            </label>
            <SearchableSelect
              id="country"
              options={countryOptions}
              value={country}
              onChange={handleCountryChange}
              placeholder="Select country"
              disabled={isLoading || isRateLimited}
              required
              icon={<GlobeAltIcon className="h-5 w-5 text-muted-foreground" />}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
              City
            </label>
            {country && cityOptions.length === 0 ? (
              <div className="pl-10 pr-3 py-3.5 w-full rounded-xl border border-input/60 bg-background/50 text-muted-foreground/60 font-inter text-sm relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                No cities available
              </div>
            ) : (
              <SearchableSelect
                id="city"
                options={cityOptions}
                value={city}
                onChange={setCity}
                placeholder={country ? "Select city" : "Select country first"}
                disabled={isLoading || isRateLimited || !country}
                required={cityOptions.length > 0}
                icon={<MapPinIcon className="h-5 w-5 text-muted-foreground" />}
              />
            )}
          </div>
        </div>

        {/* Profile Picture */}
        <div className="space-y-2">
          <label htmlFor="profilePicture" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
            Profile Picture <span className="text-muted-foreground/60 font-normal">(Optional)</span>
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="profilePicture"
              name="profilePicture"
              type="file"
              accept="image/jpeg, image/png, image/gif, image/webp"
              onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
              disabled={isLoading || isRateLimited}
              className="pl-14 pr-4 py-2.5 w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 rounded-xl border border-input/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 disabled:opacity-50 font-inter text-sm"
            />
          </div>
          {profilePicture && profilePicture.size > 5 * 1024 * 1024 && (
            <p className="text-xs text-destructive font-inter">
              File must be less than 5MB
            </p>
          )}
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label htmlFor="referralCode" className="block text-sm font-medium text-foreground/80 font-manrope-medium">
            Referral Code <span className="text-muted-foreground/60 font-normal">(Optional)</span>
          </label>
          <div className="relative group">
            <IconBox>
              <TagIcon className={iconClass} />
            </IconBox>
            <input
              id="referralCode"
              name="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              disabled={isLoading || isRateLimited}
              placeholder="e.g. FRIEND20"
              className={inputBase}
            />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <label className="relative flex items-start gap-2.5 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isLoading || isRateLimited}
                className="sr-only peer"
              />
              <div className="w-[18px] h-[18px] rounded-md border-2 border-input/80 peer-checked:border-primary peer-checked:bg-primary transition-all duration-200 flex items-center justify-center">
                {agreedToTerms && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-inter leading-relaxed">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading || submitAttempts >= 5 || isRateLimited || !agreedToTerms || passwordsMismatch || usernameStatus.available !== true}
          whileHover={{ scale: (isLoading || isRateLimited) ? 1 : 1.01 }}
          whileTap={{ scale: (isLoading || isRateLimited) ? 1 : 0.98 }}
          className="w-full bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 disabled:from-muted disabled:to-muted disabled:cursor-not-allowed text-primary-foreground py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-manrope shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none text-sm mt-2"
        >
          {isLoading ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Creating account...</span>
            </>
          ) : isRateLimited ? (
            <span>Rate limited — wait {remainingTime}s</span>
          ) : submitAttempts >= 5 ? (
            <span>Too many attempts</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Sign In Link */}
      <div className="text-center mt-6 pt-5 border-t border-border/40">
        <p className="text-sm text-muted-foreground font-inter">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors font-manrope">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
