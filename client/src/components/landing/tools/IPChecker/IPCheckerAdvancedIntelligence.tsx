import { Building2, Globe2, Network, ExternalLink, ShieldCheck } from "lucide-react";
import { IPCheckerInfoCard } from "./IPCheckerInfoCard";

interface CompanyData {
    name?: string;
    domain?: string;
    network?: string;
    type?: string;
}

interface LanguageData {
    name: string;
    native: string;
    code: string;
}

interface ASNDetails {
    domain?: string;
    usage?: string;
    registry?: string;
    peers?: Array<{ asn: string; name: string; country: string }>;
    upstream?: Array<{ asn: string; name: string; country: string }>;
    downstream?: Array<{ asn: string; name: string; country: string }>;
}

interface IPCheckerAdvancedIntelligenceProps {
    company?: CompanyData;
    languages?: LanguageData[];
    asnDetails?: ASNDetails;
}

export const IPCheckerAdvancedIntelligence = ({
    company,
    languages,
    asnDetails,
}: IPCheckerAdvancedIntelligenceProps) => {
    const hasData = company || (languages && languages.length > 0) || asnDetails;

    if (!hasData) return null;

    return (
        <div className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                {company && (
                    <IPCheckerInfoCard
                        icon={Building2}
                        title="Company Information"
                        badge={company.type || "Corporate"}
                    >
                        <div className="space-y-4">
                            <div className="p-3 bg-secondary/30 rounded-xl">
                                <span className="text-muted-foreground text-xs block mb-1">Entity Name</span>
                                <span className="text-foreground font-semibold">{company.name || "Unknown Entity"}</span>
                            </div>
                            {company.domain && (
                                <div className="p-3 bg-secondary/30 rounded-xl">
                                    <span className="text-muted-foreground text-xs block mb-1">Official Domain</span>
                                    <a
                                        href={`https://${company.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 flex items-center text-sm transition-colors duration-200"
                                    >
                                        <span>{company.domain}</span>
                                        <ExternalLink className="w-3 h-3 ml-2" />
                                    </a>
                                </div>
                            )}
                            {company.network && (
                                <div className="p-3 bg-secondary/30 rounded-xl">
                                    <span className="text-muted-foreground text-xs block mb-1">Network Range</span>
                                    <span className="text-foreground font-mono text-xs">{company.network}</span>
                                </div>
                            )}
                        </div>
                    </IPCheckerInfoCard>
                )}

                {/* Global Context */}
                {languages && languages.length > 0 && (
                    <IPCheckerInfoCard
                        icon={Globe2}
                        title="Language & Culture"
                        badge={`${languages.length} Detected`}
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {languages.map((lang, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-semibold text-sm">{lang.name}</span>
                                        <span className="text-muted-foreground text-xs">{lang.native}</span>
                                    </div>
                                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-mono">
                                        {lang.code.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </IPCheckerInfoCard>
                )}
            </div>

            {/* Deep Network Analysis */}
            {asnDetails && (
                <IPCheckerInfoCard
                    icon={Network}
                    title="Advanced Routing Intelligence"
                    badge={asnDetails.registry || "Global Registry"}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Upstream Providers */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                                Upstream (Backbone)
                            </h4>
                            <div className="space-y-2">
                                {asnDetails.upstream && asnDetails.upstream.length > 0 ? (
                                    asnDetails.upstream.slice(0, 3).map((u, i) => (
                                        <div key={i} className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center space-x-3">
                                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-foreground text-xs font-bold truncate">{u.name}</span>
                                                <span className="text-muted-foreground text-[10px] font-mono">AS{u.asn} • {u.country}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-muted-foreground italic">No upstream data available</div>
                                )}
                            </div>
                        </div>

                        {/* Peers */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                                Peering Partners
                            </h4>
                            <div className="space-y-2">
                                {asnDetails.peers && asnDetails.peers.length > 0 ? (
                                    asnDetails.peers.slice(0, 3).map((p, i) => (
                                        <div key={i} className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center space-x-3">
                                            <div className="p-1.5 bg-purple-500/10 rounded-lg">
                                                <Network className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-foreground text-xs font-bold truncate">{p.name}</span>
                                                <span className="text-muted-foreground text-[10px] font-mono">AS{p.asn} • {p.country}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-muted-foreground italic">No peering data available</div>
                                )}
                            </div>
                        </div>

                        {/* Downstream (Customers) */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                                Downstream (Network Reach)
                            </h4>
                            <div className="space-y-2">
                                {asnDetails.downstream && asnDetails.downstream.length > 0 ? (
                                    asnDetails.downstream.slice(0, 3).map((d, i) => (
                                        <div key={i} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl flex items-center space-x-3">
                                            <div className="p-1.5 bg-green-500/10 rounded-lg">
                                                <Globe2 className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-foreground text-xs font-bold truncate">{d.name}</span>
                                                <span className="text-muted-foreground text-[10px] font-mono">AS{d.asn} • {d.country}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-muted-foreground italic">No downstream data available</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {asnDetails.usage && (
                        <div className="mt-6 p-4 bg-secondary/20 rounded-2xl border border-border/40">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest block mb-2">Network Profile & Usage</span>
                            <p className="text-foreground text-sm leading-relaxed">{asnDetails.usage}</p>
                        </div>
                    )}
                </IPCheckerInfoCard>
            )}
        </div>
    );
};
