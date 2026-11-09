import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import AuthPage from "@/components/auth/AuthPage";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      await api.post("/web/api/auth/forgot_password", { email });
      setIsSuccess(true);
      toast.success("Instructions sent! Please check your email.");
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to send reset instructions. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPage variant="recovery" title={isSuccess ? "Check your inbox" : "Forgot your password?"} eyebrow="Account recovery"
      description={isSuccess ? "If an account exists for this email, you'll receive a link to reset your password." : "Enter the email address you use for ProxySock. We'll send you a password reset link."}
      icon={isSuccess ? <Mail /> : <KeyRound />}>
      {isSuccess ? <>
        <div className="auth-note" role="status"><strong>{email}</strong><br />Check your spam folder too. Follow the link in the email to choose a new password.</div>
        <Link to="/login" className="login-submit">Back to sign in <ArrowRight size={18} aria-hidden="true" /></Link>
        <p className="login-register">Didn't get an email? <button type="button" onClick={() => setIsSuccess(false)}>Try again</button></p>
      </> : <>
        <form onSubmit={handleSubmit} className="login-form" aria-busy={isLoading}>
          {errorMessage && <div className="login-error" role="alert">{errorMessage}</div>}
          <div className="login-field"><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="you@example.com" /></div>
          <button type="submit" className="login-submit" disabled={isLoading}><span>{isLoading ? "Sending link..." : "Send reset link"}</span>{isLoading ? <LoaderCircle size={18} className="login-spinner" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}</button>
        </form>
        <Link to="/login" className="auth-secondary-link">Back to sign in</Link>
      </>}
    </AuthPage>
  );
}
