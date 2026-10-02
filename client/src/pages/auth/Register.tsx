import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";

import { toast } from "sonner";
import { conversionTracker } from "../../utils/redditPixel";
import { registerUser } from "../../services/api";
import AuthPage from "@/components/auth/AuthPage";
import { RegisterForm } from "@/components/auth/register";
import SocialLoginButtons from "@/components/auth/login/SocialLoginButtons";

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

      setTimeout(() => navigate("/wait-for-verification", { state: { email } }), 1500);

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
    <AuthPage variant="register" title="Create your account" eyebrow="Join ProxySock" description="Your services and connections, together in one account.">
      <SocialLoginButtons onGoogleSignIn={handleGoogleSignIn} onXSignIn={handleXSignIn} googleLoading={googleLoading} xLoading={xLoading} isOAuthDisabled={isOAuthDisabled || isLoading} />
      <div className="login-divider"><span>Or sign up with email</span></div>
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
      <p className="login-register">Already have an account? <Link to="/login">Sign in <span aria-hidden="true">↗</span></Link></p>
    </AuthPage>
  );
}
