import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LoaderCircle, AlertCircle } from "lucide-react";

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
  const disabled = isLoading || isOAuthDisabled;
  return (
    <form onSubmit={onSubmit} className="login-form" aria-busy={disabled}>
      {error && <div className="login-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{error}</p></div>}
      <div className="login-field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled}
          placeholder="you@example.com" />
      </div>
      <div className="login-field">
        <label htmlFor="password">Password</label>
        <div className="login-password">
          <input id="password" name="password" type={showPassword ? "text" : "password"}
            autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} disabled={disabled}
            placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className="login-form-options">
        <label htmlFor="remember-me"><input id="remember-me" name="remember-me" type="checkbox"
          checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={disabled} />Remember me</label>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
      <button type="submit" className="login-submit" disabled={disabled}>
        <span>{isLoading ? "Signing in..." : "Sign in"}</span>
        {isLoading ? <LoaderCircle className="login-spinner" size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </form>
  );
}
