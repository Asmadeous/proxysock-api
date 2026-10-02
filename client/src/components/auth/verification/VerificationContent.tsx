import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import api from '../../../services/api';

export default function VerificationContent({ userEmail }: { userEmail?: string }) {
  const [email, setEmail] = useState(userEmail || "");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleResendEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || resending) return;
    setResending(true);
    setMessage(null);
    setHasError(false);
    try {
      const { data } = await api.post('/web/api/auth/resend_confirmation', { email });
      setMessage(data.message || 'Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setHasError(true);
      setMessage(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="auth-note">{userEmail && <><strong>{userEmail}</strong><br /></>}Can't find it? Check your spam folder, or request another email below.</div>
      <form className="login-form" onSubmit={handleResendEmail} aria-busy={resending}>
        {!userEmail && <div className="login-field"><label htmlFor="verification-email">Email address</label><input id="verification-email" type="email" autoComplete="email" required value={email} disabled={resending} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>}
        {message && <div className={hasError ? "login-error" : "auth-note"} role={hasError ? "alert" : "status"}>{message}</div>}
        <button type="submit" disabled={resending} className="login-submit"><span>{resending ? 'Sending email...' : 'Resend verification email'}</span>{resending ? <LoaderCircle className="login-spinner" size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}</button>
      </form>
      <Link to="/login" className="auth-secondary-link">Already verified? Sign in</Link>
      <p className="login-register">Need a hand? <Link to="/contact">Contact support</Link></p>
    </>
  );
}
