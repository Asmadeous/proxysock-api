import { useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";
import { VerificationContent } from "../../components/auth/verification";

export default function WaitForVerification() {
  const { user } = useAuth();
  const location = useLocation();
  const userEmail = user?.email || (typeof location.state?.email === "string" ? location.state.email : undefined);
  return (
    <AuthPage variant="verification" title="Check your inbox" eyebrow="Verify your email" icon={<Mail />}
      description="Open the verification email from ProxySock and follow the link to finish setting up your account.">
      <VerificationContent userEmail={userEmail} />
    </AuthPage>
  );
}
