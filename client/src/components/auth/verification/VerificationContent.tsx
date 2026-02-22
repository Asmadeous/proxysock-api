import railsApi from "@/lib/railsApi";

interface VerificationContentProps {
  userEmail?: string;
}

export default function VerificationContent({ userEmail }: VerificationContentProps) {
  const handleResendEmail = async () => {
    if (!userEmail) return;

    try {
      await railsApi.post('/auth/confirmation', { email: userEmail });
      alert("Verification email resent!");
    } catch (error) {
      console.error("Failed to resend verification:", error);
      alert("If your email is not verified, you can retry registration or contact support.");
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-6">
      <div className="space-y-2 text-left mb-6">
        <p className="text-foreground font-inter-regular">
          <span className="font-medium font-manrope-medium">Email:</span> {userEmail}
        </p>
        <p className="text-foreground font-inter-regular">
          <span className="font-medium font-manrope-medium">Tip:</span> If you don't see the email, check your spam folder.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleResendEmail}
          disabled={!userEmail}
          className="block w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors font-manrope-semibold"
        >
          Resend Verification Email
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-muted-foreground text-sm font-inter-regular">
          Need help? Contact our support team.
        </p>
      </div>
    </div>
  );
}
