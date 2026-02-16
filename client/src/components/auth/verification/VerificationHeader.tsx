import { EnvelopeIcon } from '@heroicons/react/24/solid';

export default function VerificationHeader() {
  return (
    <div className="text-center mb-6">
      <EnvelopeIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
      <p className="text-foreground/50 mb-6">
        We've sent a confirmation link to your email. Please check your inbox and click the link to verify your account.
      </p>
    </div>
  );
}
