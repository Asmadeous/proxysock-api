import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";

import { toast } from "sonner";
import { conversionTracker } from "../../utils/redditPixel";
import { registerUser } from "../../services/api";
import AuthLogo from "../../components/auth/AuthLogo";
import {
  RegisterHeader,
  RegisterForm,
} from "../../components/auth/register";
import {
  AuroraBackground,
  RegisterBenefitsCarousel,
} from "../../components/auth/carousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faXTwitter } from "@fortawesome/free-brands-svg-icons";



export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [searchParams] = useSearchParams();

  // Enhanced rate limiting state
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(
    null
  );
  const [, setRateLimitType] = useState<"email" | "ip" | "general" | null>(
    null
  );
  const lastSubmitTime = useRef<number>(0);

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState(0);

  // OAuth loading states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [xLoading, setXLoading] = useState(false);

  // Check for existing rate limit on component mount
  useEffect(() => {
    const savedRateLimit = localStorage.getItem("signup_rate_limit");
    if (savedRateLimit) {
      const { resetTime, attempts, type } = JSON.parse(savedRateLimit);
      if (Date.now() < resetTime) {
        setIsRateLimited(true);
        setRateLimitResetTime(resetTime);
        setSubmitAttempts(attempts);
        setRateLimitType(type);
      } else {
        localStorage.removeItem("signup_rate_limit");
      }
    }
  }, []);

  // Capture referral code from URL (?ref=CODE)
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Also save to localStorage in case user navigates away and returns
      localStorage.setItem('referral_code', ref);
    } else {
      // Check localStorage for previously captured referral code
      const storedRef = localStorage.getItem('referral_code');
      if (storedRef) setReferralCode(storedRef);
    }
  }, [searchParams]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    setPasswordStrength(Math.min(strength, 4));
  }, [password]);

  const validatePassword = (password: string): string | null => {
    const errors = [];
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("One special character");
    }

    return errors.length > 0 ? errors.join(" • ") : null;
  };

  // Enhanced rate limit checking
  const checkClientRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime.current;

    // Check if we're in a known rate limited state
    if (isRateLimited && rateLimitResetTime && now < rateLimitResetTime) {
      const remainingTime = Math.ceil((rateLimitResetTime - now) / 1000);
      toast.error(`Rate limited. Please wait ${remainingTime} seconds.`);
      return true;
    }

    // Clear rate limit if time has passed
    if (isRateLimited && rateLimitResetTime && now >= rateLimitResetTime) {
      setIsRateLimited(false);
      setRateLimitResetTime(null);
      setRateLimitType(null);
      setSubmitAttempts(0);
      localStorage.removeItem("signup_rate_limit");
    }

    // Prevent submissions within 5 seconds of each other
    if (timeSinceLastSubmit < 5000) {
      toast.error("Please wait a moment before trying again.");
      return true;
    }

    // Exponential backoff based on attempt count
    if (submitAttempts >= 3) {
      const waitTime = Math.pow(2, submitAttempts - 3) * 10000; // 10s, 20s, 40s, etc.
      if (timeSinceLastSubmit < waitTime) {
        toast.error(
          `Too many attempts. Please wait ${Math.ceil(
            waitTime / 1000
          )} seconds.`
        );
        return true;
      }
    }

    return false;
  }, [submitAttempts, isRateLimited, rateLimitResetTime]);

  // Handle rate limit errors from Rails Auth
  const handleRateLimitError = (error: any) => {
    const now = Date.now();
    let resetTime = now + 60 * 60 * 1000; // Default 1 hour
    let type: "email" | "ip" | "general" = "general";

    // Parse different types of rate limit errors
    if (error.message.includes("email rate limit")) {
      type = "email";
      resetTime = now + 60 * 60 * 1000; // 1 hour for email limits
      toast.error(
        "Email rate limit exceeded. Try a different email or wait 1 hour."
      );
    } else if (error.message.includes("rate limit")) {
      type = "ip";
      resetTime = now + 24 * 60 * 60 * 1000; // 24 hours for IP limits
      toast.error(
        "Rate limit exceeded. Please wait 24 hours or try from a different network."
      );
    }

    setIsRateLimited(true);
    setRateLimitResetTime(resetTime);
    setRateLimitType(type);

    // Save to localStorage
    localStorage.setItem(
      "signup_rate_limit",
      JSON.stringify({
        resetTime,
        attempts: submitAttempts + 1,
        type,
        email: type === "email" ? email : null,
      })
    );
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = () => {
    if (googleLoading || xLoading || isRateLimited) return;
    setGoogleLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/web/api/auth/google`;
  };

  // X (Twitter) OAuth Sign In
  const handleXSignIn = () => {
    if (googleLoading || xLoading || isRateLimited) return;
    setXLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/web/api/auth/twitter`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) {
      return;
    }

    // Check client-side rate limiting
    if (checkClientRateLimit()) {
      return;
    }

    // Validate password before proceeding
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);
    setPasswordError(null);
    lastSubmitTime.current = Date.now();

    try {
      let payload: any;
      if (profilePicture) {
        payload = new FormData();
        payload.append("user[email]", email);
        payload.append("user[password]", password);
        payload.append("user[password_confirmation]", passwordConfirmation);
        payload.append("user[first_name]", firstName);
        payload.append("user[last_name]", lastName);
        payload.append("user[username]", username);
        payload.append("user[country_code]", country);
        // We'll leave user[country] as the code too, or we can omit it since the backend only validates country_code
        payload.append("user[country]", country);
        payload.append("user[city]", city);
        payload.append("user[avatar]", profilePicture);
        if (referralCode) payload.append("user[referral_code]", referralCode);
      } else {
        payload = {
          email,
          password,
          password_confirmation: passwordConfirmation,
          first_name: firstName,
          last_name: lastName,
          username,
          country,
          country_code: country,
          city,
          referral_code: referralCode || undefined,
        };
      }

      const { data } = await registerUser(payload);

      // Reset all rate limiting state on success
      setSubmitAttempts(0);
      setIsRateLimited(false);
      setRateLimitResetTime(null);
      setRateLimitType(null);
      localStorage.removeItem("signup_rate_limit");

      // Track Reddit Ads signup conversion
      if (data.user) {
        try {
          await conversionTracker.trackSignUp({
            userId: data.user.id,
            email: email,
            method: "email",
          });

          console.log("✅ Reddit signup conversion tracked:", {
            userId: data.user.id,
            email: email,
          });
        } catch (trackingError) {
          console.error(
            "❌ Failed to track Reddit signup conversion:",
            trackingError
          );
        }
      }

      console.log("User created:", data.user);
      toast.success("Account created! Check your email to verify.");

      // Clear form data on success
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
      setFirstName("");
      setLastName("");
      setUsername("");
      setCountry("");
      setCity("");
      setProfilePicture(null);

      setTimeout(() => navigate("/wait-for-verification"), 1500);

      // Clear referral code from localStorage after successful registration
      localStorage.removeItem('referral_code');
    } catch (error: any) {
      console.error("Registration failed:", error);
      setSubmitAttempts((prev) => prev + 1);

      // Enhanced error messages
      let errorMessage = "Registration failed. Please check your details.";

      if (error.status === 429 || error.message.includes("rate limit")) {
        handleRateLimitError(error);
        return;
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes("Password")) {
        errorMessage = "Password doesn't meet requirements.";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate remaining time for rate limit
  const getRemainingTime = () => {
    if (!rateLimitResetTime) return null;
    const remaining = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : null;
  };

  const isOAuthDisabled = googleLoading || xLoading || isRateLimited;
  const remainingTime = getRemainingTime();

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Aurora Background with Benefits */}
      <div className="hidden lg:flex w-[45%] xl:w-[42%] relative">
        <AuroraBackground />

        {/* Register Benefits Carousel */}
        <RegisterBenefitsCarousel />

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
              { value: "50K+", label: "Users" },
              { value: "Free", label: "Trial" },
              { value: "< 1 min", label: "Setup" },
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
              Join ProxySock Today
            </h3>
            <p className="text-white/50 text-sm font-inter leading-relaxed">
              Get instant access to premium proxies, RDP, VPS, and global eSIM solutions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
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

        <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[480px] m-auto"
          >
            <div className="space-y-6">
              {/* Form Header */}
              <RegisterHeader />

              {/* Registration Form */}
              <RegisterForm
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                passwordConfirmation={passwordConfirmation}
                setPasswordConfirmation={setPasswordConfirmation}
                country={country}
                setCountry={setCountry}
                city={city}
                setCity={setCity}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                agreedToTerms={agreedToTerms}
                setAgreedToTerms={setAgreedToTerms}
                isLoading={isLoading}
                isRateLimited={isRateLimited}
                remainingTime={remainingTime}
                submitAttempts={submitAttempts}
                passwordError={passwordError}
                passwordStrength={passwordStrength}
                profilePicture={profilePicture}
                setProfilePicture={setProfilePicture}
                referralCode={referralCode}
                setReferralCode={setReferralCode}
                onSubmit={handleSubmit}
              />

              {/* Social Login Divider */}
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="space-y-3"
              >
                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isOAuthDisabled}
                  whileHover={{ scale: isOAuthDisabled ? 1 : 1.01 }}
                  whileTap={{ scale: isOAuthDisabled ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-white/95 hover:bg-gray-50 dark:hover:bg-white border border-gray-200/80 dark:border-gray-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
                >
                  {googleLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faGoogle}
                      className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform duration-200"
                    />
                  )}
                  <span className="text-gray-700 font-semibold text-sm font-inter">
                    {googleLoading
                      ? "Connecting..."
                      : "Continue with Google"}
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleXSignIn}
                  disabled={isOAuthDisabled}
                  whileHover={{ scale: isOAuthDisabled ? 1 : 1.01 }}
                  whileTap={{ scale: isOAuthDisabled ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#0a0a0a] hover:bg-black border border-gray-800 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
                >
                  {xLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faXTwitter}
                      className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200"
                    />
                  )}
                  <span className="text-white font-semibold text-sm font-inter">
                    {xLoading ? "Connecting..." : "Continue with X"}
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}