import { Globe, Shield } from "lucide-react";

interface IPCheckerSearchInterfaceProps {
  ipAddress: string;
  setIpAddress: (ip: string) => void;
  handleManualSearch: () => void;
  loading: boolean;
}

export const IPCheckerSearchInterface = ({
  ipAddress,
  setIpAddress,
  handleManualSearch,
  loading
}: IPCheckerSearchInterfaceProps) => {
  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="ip"
              className="block text-sm font-semibold text-foreground mb-3"
            >
              Analyze Different IP Address
            </label>
            <div className="relative">
              <input
                type="text"
                id="ip"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleManualSearch()
                }
                className="w-full px-5 py-3 bg-background/60 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder-muted-foreground transition-all duration-300 text-base backdrop-blur-sm"
                placeholder="Enter IP address to analyze..."
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Globe className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <button
            onClick={handleManualSearch}
            disabled={loading || !ipAddress.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-foreground font-semibold py-3 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-primary/25 disabled:transform-none hover:scale-[1.02] transform"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Analyze IP Address</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
