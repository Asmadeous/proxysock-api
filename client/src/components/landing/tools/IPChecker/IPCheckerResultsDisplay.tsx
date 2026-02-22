import { motion } from "framer-motion";
import { MapPin, Server, ExternalLink } from "lucide-react";

interface IPResult {
  ip: string;
  is_eu?: boolean;
  city?: string;
  region?: string;
  country_name?: string;
  emoji_flag?: string;
  usage_type?: string;
  score?: number;
  risk?: string;
  url?: string;
}

interface IPCheckerResultsDisplayProps {
  result: IPResult;
}

export const IPCheckerResultsDisplay = ({ result }: IPCheckerResultsDisplayProps) => {
  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case "very high":
        return "text-red-400";
      case "high":
        return "text-red-500";
      case "medium":
        return "text-orange-400";
      case "low":
        return "text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getRiskBorderColor = (risk: string): string => {
    switch (risk) {
      case "very high":
        return "#f87171";
      case "high":
        return "#ef4444";
      case "medium":
        return "#fb923c";
      case "low":
        return "#4ade80";
      default:
        return "#6b7280";
    }
  };

  const getRiskGradient = (risk: string): string => {
    switch (risk) {
      case "very high":
        return "from-red-600/20 to-red-800/10";
      case "high":
        return "from-red-500/20 to-red-700/10";
      case "medium":
        return "from-orange-500/20 to-orange-700/10";
      case "low":
        return "from-green-500/20 to-green-700/10";
      default:
        return "from-gray-600/20 to-gray-800/10";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-16 space-y-8 animate-slide-in"
    >
      {/* IP Header Card */}
      <div className="bg-card/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground font-mono">
                {result.ip}
              </h2>
              {result.emoji_flag && (
                <span className="text-4xl">{result.emoji_flag}</span>
              )}
            </div>
            {result.is_eu && (
              <div className="bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-medium px-4 py-2 rounded-full">
                🇪🇺 European Union
              </div>
            )}
          </div>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 px-4 py-2 rounded-xl transition-all duration-300 hover:bg-primary/30"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Full Report</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="text-muted-foreground text-xl mb-6">
              {result.city && result.region && result.country_name ? (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>
                    {result.city}, {result.region},{" "}
                    {result.country_name}
                  </span>
                </div>
              ) : result.country_name ? (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{result.country_name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>Location unavailable</span>
                </div>
              )}
            </div>

            {result.usage_type && (
              <div className="inline-flex items-center space-x-2 bg-secondary text-secondary-foreground text-sm px-4 py-2 rounded-xl">
                <Server className="w-4 h-4" />
                <span>
                  Usage:{" "}
                  {result.usage_type.charAt(0).toUpperCase() +
                    result.usage_type.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Quick Risk Overview */}
          {result.score !== undefined && result.risk && (
            <div
              className={`bg-gradient-to-br ${getRiskGradient(
                result.risk
              )} rounded-2xl p-6 border border-border/30`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">
                    Risk Assessment
                  </p>
                  <p className="text-foreground text-3xl font-bold">
                    {result.score}/100
                  </p>
                  <p
                    className={`font-semibold ${getRiskColor(
                      result.risk
                    )} text-lg capitalize`}
                  >
                    {result.risk} Risk
                  </p>
                </div>
                <div
                  className="w-20 h-20 rounded-2xl border-3 flex items-center justify-center backdrop-blur-sm"
                  style={{
                    borderColor: getRiskBorderColor(result.risk),
                  }}
                >
                  <span className="text-2xl font-bold text-foreground">
                    {result.score}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
