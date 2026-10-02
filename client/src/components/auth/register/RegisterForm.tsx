import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
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

  const disabled = isLoading || isRateLimited;
  return (
    <form onSubmit={onSubmit} className="login-form" aria-busy={isLoading}>
      {isRateLimited && remainingTime && <div className="login-error" role="alert">Please wait {Math.floor(remainingTime / 60)}m {remainingTime % 60}s before trying again.</div>}
      {passwordError && <div className="login-error" role="alert">{passwordError}</div>}
      <fieldset className="auth-form-section" disabled={disabled}>
        <legend>Your details</legend>
        <div className="auth-field-row">
          <div className="login-field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" /></div>
          <div className="login-field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" /></div>
        </div>
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username" required maxLength={30} value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="Choose a username" aria-describedby="username-status" aria-invalid={usernameStatus.available === false} />
          <p id="username-status" role="status" className={`auth-hint ${usernameStatus.available === false ? "auth-hint-error" : usernameStatus.available === true ? "auth-hint-success" : ""}`}>{usernameStatus.message || "Letters, numbers and underscores. At least 3 characters."}</p>
        </div>
        <div className="login-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
      </fieldset>
      <fieldset className="auth-form-section" disabled={disabled}>
        <legend>Account security</legend>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <div className="login-password">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" aria-describedby="password-requirements" />
            <button type="button" disabled={disabled} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <p id="password-requirements" className="auth-hint">Use 8+ characters, with uppercase, lowercase, a number and a special character.</p>
          {password && <><div className="auth-strength" aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} data-filled={i < passwordStrength} />)}</div><p className="auth-hint">{passwordStrengthLabels[passwordStrength] || "Weak"} password</p></>}
        </div>
        <div className="login-field">
          <label htmlFor="passwordConfirmation">Confirm password</label>
          <input id="passwordConfirmation" name="passwordConfirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Re-enter your password" aria-invalid={passwordsMismatch} aria-describedby="password-match" />
          <p id="password-match" className={`auth-hint ${passwordsMismatch ? "auth-hint-error" : "auth-hint-success"}`}>{passwordsMismatch ? "Passwords do not match" : passwordsMatch ? "Passwords match" : ""}</p>
        </div>
      </fieldset>
      <fieldset className="auth-form-section" disabled={disabled}>
        <legend>Your location</legend>
        <div className="auth-field-row">
          <div className="login-field auth-select"><label htmlFor="country">Country</label><SearchableSelect id="country" options={countryOptions} value={country} onChange={handleCountryChange} placeholder="Select country" disabled={disabled} required /></div>
          <div className="login-field auth-select"><label htmlFor="city">City</label>{country && cityOptions.length === 0 ? <p className="auth-hint">No cities available</p> : <SearchableSelect id="city" options={cityOptions} value={city} onChange={setCity} placeholder={country ? "Select city" : "Select country first"} disabled={disabled || !country} required={cityOptions.length > 0} />}</div>
        </div>
      </fieldset>
      <details className="auth-optional">
        <summary>Profile picture & referral code <span>(optional)</span></summary>
        <div className="login-field"><label htmlFor="profilePicture">Profile picture</label><input id="profilePicture" name="profilePicture" type="file" accept="image/jpeg, image/png, image/gif, image/webp" disabled={disabled} onChange={(e) => setProfilePicture(e.target.files?.[0] || null)} />{profilePicture && profilePicture.size > 5 * 1024 * 1024 && <p className="auth-hint auth-hint-error">File must be less than 5MB</p>}</div>
        <div className="login-field"><label htmlFor="referralCode">Referral code</label><input id="referralCode" name="referralCode" value={referralCode} disabled={disabled} onChange={(e) => setReferralCode(e.target.value)} placeholder="Enter your code" /></div>
      </details>
      <div className="auth-terms"><input id="terms" type="checkbox" required checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} disabled={disabled} /><label htmlFor="terms">I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</label></div>
      <button type="submit" className="login-submit" disabled={disabled || submitAttempts >= 5 || !agreedToTerms || passwordsMismatch || usernameStatus.available !== true}>
        <span>{isLoading ? "Creating account..." : isRateLimited ? `Please wait ${remainingTime}s` : submitAttempts >= 5 ? "Too many attempts" : "Create account"}</span>
        {isLoading ? <LoaderCircle size={18} className="login-spinner" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </form>
  );
}
