import { AlertCircle } from "lucide-react";

interface IPCheckerErrorDisplayProps {
  error: string;
}

export const IPCheckerErrorDisplay = ({ error }: IPCheckerErrorDisplayProps) => {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="bg-destructive/10 border border-destructive/50 rounded-2xl p-6 flex items-start space-x-4 animate-slide-in backdrop-blur-sm">
        <div className="p-2 bg-destructive/20 rounded-xl">
          <AlertCircle className="text-destructive w-5 h-5" />
        </div>
        <div>
          <p className="text-destructive font-semibold">
            Analysis Failed
          </p>
          <p className="text-destructive text-sm mt-1">{error}</p>
          <button
            onClick={() => globalThis.location?.reload()}
            className="text-destructive hover:text-destructive/80 text-sm underline mt-2"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};
