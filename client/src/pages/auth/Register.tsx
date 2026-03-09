import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";

import { toast } from "react-hot-toast";
import { conversionTracker } from "../../utils/redditPixel";
import { registerUser } from "../../services/api";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
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
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

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
      const { data } = await registerUser({
        email,
        password,
        password_confirmation: passwordConfirmation,
        first_name: firstName,
        last_name: lastName,
        username,
        country,
        city,
        profile_picture_url: profilePictureUrl,
      });

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
      setProfilePictureUrl("");

      setTimeout(() => navigate("/wait-for-verification"), 1500);
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
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <AuroraBackground />

        {/* Register Benefits Carousel */}
        <RegisterBenefitsCarousel />

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
              Join ProxySock Today
            </h3>
            <p className="text-white/60 text-sm">
              Get instant access to premium proxies, RDP, VPS, and global eSIM solutions
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
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

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-lg"
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
                profilePictureUrl={profilePictureUrl}
                setProfilePictureUrl={setProfilePictureUrl}
                onSubmit={handleSubmit}
              />

              {/* Social Login Buttons */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6">
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isOAuthDisabled}
                    className="w-full flex items-center justify-center px-6 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl group"
                  >
                    {googleLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 mr-3"></div>
                    ) : (
                      <FontAwesomeIcon
                        icon={faGoogle}
                        className="h-5 w-5 text-red-500 mr-3"
                      />
                    )}
                    <span className="text-gray-800 font-medium">
                      {googleLoading
                        ? "Connecting to Google..."
                        : "Continue with Google"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleXSignIn}
                    disabled={isOAuthDisabled}
                    className="w-full flex items-center justify-center px-6 py-4 bg-black hover:bg-gray-900 border border-gray-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl group"
                  >
                    {xLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    ) : (
                      <FontAwesomeIcon
                        icon={faXTwitter}
                        className="h-5 w-5 text-white mr-3"
                      />
                    )}
                    <span className="text-white font-medium">
                      {xLoading ? "Connecting to X..." : "Continue with X"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}