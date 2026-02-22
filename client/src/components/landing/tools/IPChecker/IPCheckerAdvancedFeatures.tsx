import { Activity, AlertTriangle, ExternalLink } from "lucide-react";
import { IPCheckerInfoCard } from "./IPCheckerInfoCard";

interface ReputationScore {
  [key: string]: number;
}

interface BlocklistEntry {
  name: string;
  site: string;
  type: string;
}

interface IPCheckerAdvancedFeaturesProps {
  scores?: ReputationScore;
  blocklists?: BlocklistEntry[];
}

export const IPCheckerAdvancedFeatures = ({ scores, blocklists }: IPCheckerAdvancedFeaturesProps) => {
  if ((!scores || Object.keys(scores).length === 0) && (!blocklists || blocklists.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Reputation Scores */}
      {scores && Object.keys(scores).length > 0 && (
        <IPCheckerInfoCard
          icon={Activity}
          title="ML Reputation Analysis"
          badge="AI-Powered"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(scores).map(([provider, score]) => (
              <div
                key={provider}
                className="p-4 bg-secondary/30 rounded-xl"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground text-sm capitalize font-medium">
                    {provider.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      score >= 80
                        ? "text-red-400"
                        : score >= 60
                        ? "text-orange-400"
                        : score >= 40
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {score}/100
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      score >= 80
                        ? "bg-red-500"
                        : score >= 60
                        ? "bg-orange-500"
                        : score >= 40
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </IPCheckerInfoCard>
      )}

      {/* Blocklists */}
      {blocklists && blocklists.length > 0 && (
        <IPCheckerInfoCard
          icon={AlertTriangle}
          title="Threat Blocklists"
          badge={`${blocklists.length} Detected`}
        >
          <div className="grid gap-4">
            {blocklists.map((blocklist, index) => (
              <div
                key={index}
                className="bg-red-900/30 border border-red-700/30 rounded-xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-red-300 font-semibold text-sm">
                      {blocklist.name}
                    </h4>
                    <p className="text-red-400 text-xs mt-1 capitalize">
                      Type: {blocklist.type}
                    </p>
                  </div>
                  {blocklist.site && (
                    <a
                      href={blocklist.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-300 hover:text-red-200 text-xs flex items-center space-x-1 transition-colors duration-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Details</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </IPCheckerInfoCard>
      )}
    </div>
  );
};
