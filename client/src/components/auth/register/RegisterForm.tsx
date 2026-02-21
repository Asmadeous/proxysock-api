<<<<<<< HEAD
import React from "react";
=======
import React, { useMemo, useState, useEffect, useRef } from "react";
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
} from "@heroicons/react/24/outline";

interface RegisterFormProps {
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
=======
  CheckCircleIcon,
  XCircleIcon,
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  passwordConfirmation: string;
<<<<<<< HEAD
  setPasswordConfirmation: (password: string) => void;
  avatar: File | null;
  setAvatar: (file: File | null) => void;
=======
  setPasswordConfirmation: (v: string) => void;
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
  phone?: string;
  setPhone?: (phone: string) => void;
=======
  profilePictureUrl: string;
  setProfilePictureUrl: (v: string) => void;
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
  // avatar,
  // setAvatar,
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
=======
  profilePictureUrl,
  setProfilePictureUrl,
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
  // Debug log to verify new code is running
  console.log("RegisterForm rendering - with Name fields");
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

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
<<<<<<< HEAD
                  Wait {Math.floor(remainingTime / 60)}m{" "}
                  {remainingTime % 60}s
=======
                  Wait {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
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
=======
      <form onSubmit={onSubmit} className="space-y-4">
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
            >
=======
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
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
=======
        {/* Username with live availability */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">@</span>
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            <input
              id="username"
              name="username"
              type="text"
              value={username}
<<<<<<< HEAD
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
=======
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              disabled={isLoading || isRateLimited}
              required
              placeholder="johndoe"
              maxLength={30}
              className={`pl-8 pr-10 py-3 w-full rounded-lg border bg-background focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular ${usernameStatus.available === true
                ? "border-green-500 focus:border-green-500"
                : usernameStatus.available === false
                  ? "border-destructive focus:border-destructive"
                  : "border-input focus:border-ring"
                }`}
            />
            {/* Status icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {usernameStatus.checking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : usernameStatus.available === true ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : usernameStatus.available === false ? (
                <XCircleIcon className="h-5 w-5 text-destructive" />
              ) : null}
            </div>
          </div>
          {usernameStatus.message && (
            <p className={`text-xs mt-1 font-inter-regular ${usernameStatus.available === true ? "text-green-600" : usernameStatus.available === false ? "text-destructive" : "text-muted-foreground"
              }`}>
              {usernameStatus.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
        {/* Password Field with Strength Indicator */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
          >
=======
        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {/* Password Strength Bar */}
=======
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          {password && (
            <div className="mt-2">
              <div className="flex space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
<<<<<<< HEAD
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength
                      ? passwordStrengthColors[passwordStrength]
                      : "bg-muted"
=======
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength ? passwordStrengthColors[passwordStrength] : "bg-muted"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                      }`}
                  />
                ))}
              </div>
              {passwordStrength > 0 && (
<<<<<<< HEAD
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
=======
                <p className={`text-xs mt-1 font-inter-regular ${passwordStrength === 1 ? "text-destructive"
                  : passwordStrength === 2 ? "text-yellow-600"
                    : passwordStrength === 3 ? "text-blue-600"
                      : "text-green-600"
                  }`}>
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                  {passwordStrengthLabels[passwordStrength]} password
                </p>
              )}
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* Password Confirmation Field */}
        <div>
          <label
            htmlFor="passwordConfirmation"
            className="block text-sm font-medium text-foreground mb-2 font-manrope-medium"
          >
=======
        {/* Confirm Password */}
        <div>
          <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
              placeholder="Confirm your password"
              className="pl-10 pr-10 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
=======
              placeholder="Re-enter your password"
              className={`pl-10 pr-10 py-3 w-full rounded-lg border bg-background focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular ${passwordsMatch
                ? "border-green-500 focus:border-green-500"
                : passwordsMismatch
                  ? "border-destructive focus:border-destructive"
                  : "border-input focus:border-ring"
                }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {passwordsMatch ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : passwordsMismatch ? (
                <XCircleIcon className="h-5 w-5 text-destructive" />
              ) : null}
            </div>
          </div>
          {passwordsMismatch && (
            <p className="text-xs mt-1 text-destructive font-inter-regular">
              Passwords do not match
            </p>
          )}
        </div>

        {/* Country & City Dropdowns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
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

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
              City
            </label>
            {country && cityOptions.length === 0 ? (
              <div className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background text-muted-foreground font-inter-regular text-sm relative">
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

        {/* Profile Picture URL */}
        <div>
          <label htmlFor="profilePictureUrl" className="block text-sm font-medium text-foreground mb-2 font-manrope-medium">
            Profile Picture URL (Optional)
          </label>
          <div className="relative">
            <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              id="profilePictureUrl"
              name="profilePictureUrl"
              type="url"
              value={profilePictureUrl}
              onChange={(e) => setProfilePictureUrl(e.target.value)}
              disabled={isLoading || isRateLimited}
              placeholder="https://example.com/photo.jpg"
              className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 font-inter-regular"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            />
          </div>
        </div>

<<<<<<< HEAD
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
=======
        {/* Terms */}
        <div className="flex items-start">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          <input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isLoading || isRateLimited}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:opacity-50"
          />
<<<<<<< HEAD
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
=======
          <label htmlFor="terms" className="ml-2 block text-sm text-foreground font-inter-regular">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:text-primary/80 transition-colors font-manrope-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:text-primary/80 transition-colors font-manrope-medium">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
              Privacy Policy
            </Link>
          </label>
        </div>

<<<<<<< HEAD
        {/* Submit Button */}
        <button
          type="submit"
          disabled={(isLoading || submitAttempts >= 5 || isRateLimited) || !agreedToTerms}
=======
        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || submitAttempts >= 5 || isRateLimited || !agreedToTerms || passwordsMismatch || usernameStatus.available !== true}
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors font-manrope-semibold"
          >
=======
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors font-manrope-semibold">
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
