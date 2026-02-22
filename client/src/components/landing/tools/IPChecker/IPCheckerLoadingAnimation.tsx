import { Shield } from "lucide-react";

interface IPCheckerLoadingAnimationProps {
  loadingStage: string;
}

export const IPCheckerLoadingAnimation = ({ loadingStage }: IPCheckerLoadingAnimationProps) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-primary/40 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "3s",
              }}
            ></div>
            <div
              className="absolute inset-4 border-4 border-primary/60 rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            ></div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center animate-pulse">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Pulsing dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-3xl font-bold text-foreground mb-4">
          IP Intelligence Analysis
        </h2>
        <p className="text-xl text-primary mb-2 animate-pulse">
          {loadingStage}
        </p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Performing comprehensive security analysis, geolocation lookup,
          and threat intelligence assessment
        </p>

        {/* Progress Steps */}
        <div className="mt-8 space-y-3 max-w-sm mx-auto">
          <div
            className={`flex items-center text-sm transition-colors duration-500 ${
              loadingStage.includes("Detecting")
                ? "text-primary"
                : loadingStage.includes("Processing")
                ? "text-green-400"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-3 transition-colors duration-500 ${
                loadingStage.includes("Detecting")
                  ? "bg-primary animate-pulse"
                  : loadingStage.includes("Processing")
                  ? "bg-green-400"
                  : "bg-muted-foreground"
              }`}
            ></div>
            <span>Automatic IP Detection</span>
          </div>

          <div
            className={`flex items-center text-sm transition-colors duration-500 ${
              loadingStage.includes("Processing")
                ? "text-primary animate-pulse"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-3 transition-colors duration-500 ${
                loadingStage.includes("Processing")
                  ? "bg-primary animate-pulse"
                  : "bg-muted-foreground"
              }`}
            ></div>
            <span>Comprehensive Intelligence Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};
