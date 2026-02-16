import { Shield, AlertTriangle, AlertCircle, Activity, Wifi, Server, Building, Smartphone, CheckCircle } from "lucide-react";

interface ThreatData {
  is_tor?: boolean;
  is_vpn?: boolean;
  is_icloud_relay?: boolean;
  is_proxy?: boolean;
  is_datacenter?: boolean;
  is_anonymous?: boolean;
  is_known_attacker?: boolean;
  is_known_abuser?: boolean;
  is_threat?: boolean;
  is_bogon?: boolean;
}

interface IPCheckerThreatAssessmentProps {
  threat?: ThreatData;
  score?: number;
  risk?: string;
}

export const IPCheckerThreatAssessment = ({ threat, score, risk }: IPCheckerThreatAssessmentProps) => {
  const ThreatIndicator = ({
    isActive,
    label,
    color = "red",
    icon: Icon = AlertTriangle,
  }: any) =>
    isActive ? (
      <div
        className={`flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${
          color === "red"
            ? "from-red-600/10 to-red-800/5 border border-red-500/20"
            : color === "orange"
            ? "from-orange-600/10 to-orange-800/5 border border-orange-500/20"
            : color === "yellow"
            ? "from-yellow-600/10 to-yellow-800/5 border border-yellow-500/20"
            : color === "blue"
            ? "from-blue-600/10 to-blue-800/5 border border-blue-500/20"
            : color === "gray"
            ? "from-gray-600/10 to-gray-800/5 border border-gray-500/20"
            : "from-green-600/10 to-green-800/5 border border-green-500/20"
        }`}
      >
        <div className="flex items-center">
          <Icon
            className={`w-4 h-4 mr-3 ${
              color === "red"
                ? "text-red-400"
                : color === "orange"
                ? "text-orange-400"
                : color === "yellow"
                ? "text-yellow-400"
                : color === "blue"
                ? "text-blue-400"
                : color === "gray"
                ? "text-gray-400"
                : "text-green-400"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              color === "red"
                ? "text-red-300"
                : color === "orange"
                ? "text-orange-300"
                : color === "yellow"
                ? "text-yellow-300"
                : color === "blue"
                ? "text-blue-300"
                : color === "gray"
                ? "text-gray-300"
                : "text-green-300"
            }`}
          >
            {label}
          </span>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${
            color === "red"
              ? "bg-red-500"
              : color === "orange"
              ? "bg-orange-500"
              : color === "yellow"
              ? "bg-yellow-500"
              : color === "blue"
              ? "bg-blue-500"
              : color === "gray"
              ? "bg-gray-500"
              : "bg-green-500"
          } animate-pulse`}
        ></div>
      </div>
    ) : null;

  if (!threat || score === undefined || !risk) return null;

  return (
    <div className="group bg-card/60 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-card/80 hover:scale-[1.02] hover:shadow-2xl border border-border/50 hover:border-primary/30">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <div className="p-2 bg-primary/10 rounded-xl mr-3 group-hover:bg-primary/20 transition-colors duration-300">
            <Shield className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
          <h3 className="text-foreground text-sm font-semibold">Threat Intelligence</h3>
        </div>
        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">
          Security Analysis
        </span>
      </div>
      <div className="space-y-3">
        <ThreatIndicator
          isActive={threat.is_known_attacker}
          label="Known Attacker"
          color="red"
          icon={AlertTriangle}
        />
        <ThreatIndicator
          isActive={threat.is_known_abuser}
          label="Known Abuser"
          color="red"
          icon={AlertCircle}
        />
        <ThreatIndicator
          isActive={threat.is_tor}
          label="Tor Network"
          color="red"
          icon={Activity}
        />
        <ThreatIndicator
          isActive={threat.is_vpn}
          label="VPN Connection"
          color="orange"
          icon={Wifi}
        />
        <ThreatIndicator
          isActive={threat.is_proxy}
          label="Proxy Server"
          color="yellow"
          icon={Server}
        />
        <ThreatIndicator
          isActive={threat.is_datacenter}
          label="Datacenter/Hosting"
          color="blue"
          icon={Building}
        />
        <ThreatIndicator
          isActive={threat.is_icloud_relay}
          label="iCloud Private Relay"
          color="gray"
          icon={Smartphone}
        />
        <ThreatIndicator
          isActive={threat.is_bogon}
          label="Bogon Address"
          color="red"
          icon={AlertTriangle}
        />

        {!threat.is_anonymous &&
          !threat.is_threat && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-600/10 to-green-800/5 border border-green-500/20">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-3 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  Clean IP Address
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          )}
      </div>
    </div>
  );
};
