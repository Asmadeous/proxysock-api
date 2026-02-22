import { Network, ExternalLink } from "lucide-react";

interface ASNData {
  asn: string;
  name: string;
  domain?: string;
  route?: string;
}

interface IPCheckerNetworkCardProps {
  asn?: ASNData;
}

export const IPCheckerNetworkCard = ({ asn }: IPCheckerNetworkCardProps) => {
  if (!asn) return null;

  return (
    <div className="group bg-card/60 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-card/80 hover:scale-[1.02] hover:shadow-2xl border border-border/50 hover:border-primary/30">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <div className="p-2 bg-primary/10 rounded-xl mr-3 group-hover:bg-primary/20 transition-colors duration-300">
            <Network className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
          <h3 className="text-foreground text-sm font-semibold">Network Information</h3>
        </div>
        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">
          ASN Intelligence
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
          <span className="text-muted-foreground text-sm">ASN</span>
          <span className="text-foreground font-medium font-mono">
            {asn.asn}
          </span>
        </div>
        <div className="p-3 bg-secondary/30 rounded-xl">
          <span className="text-muted-foreground text-sm block mb-2">
            Organization
          </span>
          <span className="text-foreground font-medium">
            {asn.name}
          </span>
        </div>
        {asn.domain && (
          <div className="p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm block mb-2">
              Domain
            </span>
            <a
              href={`https://${asn.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors duration-200 flex items-center"
            >
              <span>{asn.domain}</span>
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </div>
        )}
        {asn.route && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">Network</span>
            <span className="text-foreground font-medium font-mono text-sm">
              {asn.route}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
