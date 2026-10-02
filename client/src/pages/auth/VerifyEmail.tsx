import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthPage from "@/components/auth/AuthPage";
import { ArrowRight, Check, Link2Off, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { verifyEmail } from "../../services/railsAuth";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        verifyEmail(token)
            .then(() => {
                setStatus("success");
                toast.success("Email verified!");
                setTimeout(() => navigate("/dashboard"), 2000);
            })
            .catch((error) => {
                setStatus("error");
                toast.error(error.response?.data?.error || "Verification failed");
            });
    }, [token, navigate]);

    return (
      <AuthPage variant="verification" eyebrow="Email verification"
        title={status === "verifying" ? "Confirming your email" : status === "success" ? "You're connected" : "Let's try that again"}
        description={status === "verifying" ? "We're checking your verification link. This should only take a moment." : status === "success" ? "Your email is verified. We're taking you to your dashboard." : "This verification link is invalid or has expired. Request another email to complete your account setup."}
        icon={status === "verifying" ? <LoaderCircle className="login-spinner" /> : status === "success" ? <Check /> : <Link2Off />}>
        <div role="status" className="auth-note">{status === "verifying" ? "Verifying your email..." : status === "success" ? "Email verified. Your account is ready." : "We couldn't verify this link."}</div>
        {status === "success" && <Link to="/dashboard" className="login-submit">Continue to dashboard <ArrowRight size={18} aria-hidden="true" /></Link>}
        {status === "error" && <Link to="/wait-for-verification" className="login-submit">Request another email <ArrowRight size={18} aria-hidden="true" /></Link>}
        {status !== "verifying" && <Link to="/login" className="auth-secondary-link">Back to sign in</Link>}
      </AuthPage>
    );
}
