import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "../../services/railsAuth";
import AuthPage from "@/components/auth/AuthPage";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || loading) return;
    if (password !== passwordConfirmation) {
      setErrorMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await resetPassword(password, passwordConfirmation, token);
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to reset password. Try requesting a new link.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage variant="reset" title={token ? "Set a new password" : "Let's try that again"} eyebrow="Account recovery"
      description={token ? "Choose a password you haven't used before. You'll use it the next time you sign in." : "This reset link is incomplete. Request a new link to get back to your account."}
      icon={token ? <KeyRound /> : <Link2Off />}>
      {token ? <form onSubmit={handleSubmit} className="login-form" aria-busy={loading}>
        {errorMessage && <div className="login-error" role="alert">{errorMessage}</div>}
        <div className="login-field">
          <label htmlFor="new-password">New password</label>
          <div className="login-password">
            <input id="new-password" name="password" autoComplete="new-password" type={showPassword ? "text" : "password"} required minLength={8} disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a new password" aria-describedby="reset-password-hint" />
            <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <p id="reset-password-hint" className="auth-hint">Use at least 8 characters.</p>
        </div>
        <div className="login-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="password_confirmation" autoComplete="new-password" type={showPassword ? "text" : "password"} required minLength={8} disabled={loading} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Re-enter your new password" /></div>
        <button type="submit" className="login-submit" disabled={loading}><span>{loading ? "Resetting password..." : "Reset password"}</span>{loading ? <LoaderCircle size={18} className="login-spinner" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}</button>
        {errorMessage && <Link to="/forgot-password" className="auth-secondary-link">Request a new reset link</Link>}
      </form> : <Link to="/forgot-password" className="login-submit">Request a new link <ArrowRight size={18} aria-hidden="true" /></Link>}
      <Link to="/login" className="auth-secondary-link">Back to sign in</Link>
    </AuthPage>
  );
}
