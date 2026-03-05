import { useState } from "react";
import {
    CodeBracketIcon,
    CommandLineIcon,
    ClipboardDocumentIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    BookOpenIcon,
    KeyIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function ResApiDocs() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";
    const apiKey = isEnterprise ? (user?.dedicated_api_key || "ps_live_••••••••••••••••") : "ROTATIONAL_TOKEN_ACTIVE";

    const [activeTab, setActiveTab] = useState<"access" | "docs">("access");

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Developer Portal</h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">
                        {isEnterprise
                            ? "Dedicated Enterprise API architecture."
                            : "Rotational JWT-based Partner integration."}
                    </p>
                </div>
                <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border/50 shadow-inner w-fit">
                    <button
                        onClick={() => setActiveTab("access")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "access" ? "bg-white text-primary shadow-lg ring-1 ring-border/5" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <KeyIcon className="w-4 h-4" />
                        API ACCESS
                    </button>
                    <button
                        onClick={() => setActiveTab("docs")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "docs" ? "bg-white text-primary shadow-lg ring-1 ring-border/5" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        DOCUMENTATION
                    </button>
                </div>
            </div>

            {activeTab === "access" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-card border-none shadow-2xl rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <CodeBracketIcon className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner"><KeyIcon className="w-8 h-8" /></div>
                                <h3 className="text-2xl font-black tracking-tight">
                                    {isEnterprise ? "Static API Key" : "Partner Access Token"}
                                </h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                {isEnterprise
                                    ? "Your dedicated production key. This key is static and valid for all Enterprise endpoints. Never share this key."
                                    : "Your initial entry token. Secure communication starts here with our rotational security protocol."}
                            </p>
                            <div className="bg-muted/30 p-6 rounded-2xl flex justify-between items-center font-mono text-sm border border-border/50 group/key shadow-inner">
                                <span className="truncate mr-4 text-primary font-bold tracking-tight">{apiKey}</span>
                                <button
                                    onClick={() => copyToClipboard(apiKey)}
                                    className="p-3 hover:bg-primary/10 rounded-xl transition-all text-primary hover:scale-[1.1] active:scale-[0.9]"
                                >
                                    <ClipboardDocumentIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-muted/20 border border-dashed border-border/50 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-4">
                            <div className="p-4 bg-white/50 rounded-full shadow-inner"><ShieldCheckIcon className="w-10 h-10 text-emerald-500" /></div>
                            <h4 className="text-lg font-black uppercase tracking-widest text-emerald-600">Security Audit</h4>
                            <p className="text-xs text-muted-foreground font-medium max-w-[200px]">All API requests are logged and monitored for infrastructure compliance.</p>
                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">PCI_DSS Compliant</div>
                        </div>
                    </div>

                    {!isEnterprise && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-4 text-emerald-600">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl"><ArrowPathIcon className="w-8 h-8" /></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-widest">Rotational Protocol</h3>
                                    <p className="text-[10px] font-black opacity-60">EXCLUSIVE TO API-ONLY TIER</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "01", title: "AUTH_HEADER", desc: "Pass token in Authorization Bearer header." },
                                    { step: "02", title: "X_NEXT_TOKEN", desc: "Extract new key from response headers." },
                                    { step: "03", title: "RECYCLE", desc: "Old key is burned. Use new key instantly." }
                                ].map((item) => (
                                    <div key={item.step} className="bg-white/50 p-6 rounded-2xl border border-emerald-500/10 space-y-2 group hover:bg-emerald-500/10 transition-colors">
                                        <div className="text-emerald-500 font-black text-xs tracking-widest">{item.step}</div>
                                        <h5 className="font-black text-sm uppercase tracking-tighter">{item.title}</h5>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-zinc-950 p-8 rounded-3xl border border-white/5 shadow-2xl relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><CommandLineIcon className="w-20 h-20 text-blue-500" /></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="ml-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Request Playground</span>
                        </div>
                        <pre className="text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto selection:bg-emerald-500/30">
                            {`curl -X GET "https://api.proxysock.com/v1/pools" \\
     -H "Authorization: Bearer ${isEnterprise ? 'YOUR_DEDICATED_KEY' : 'YOUR_ROTATIONAL_TOKEN'}" \\
     -H "Content-Type: application/json"`}
                        </pre>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-card border-none shadow-2xl rounded-3xl p-10 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 max-w-xl">
                                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 w-fit shadow-inner">
                                    <BookOpenIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter">API SPECIFICATION V4</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed">
                                    Explore our comprehensive OpenAPI/Swagger documentation. Find detailed schemas for {isEnterprise ? "Infrastructure nodes, Cluster management, and Billing." : "Retail node pools, Order management, and Partner balances."}
                                </p>
                                <div className="flex gap-4 pt-4">
                                    <a
                                        href="https://docs.proxysock.com"
                                        target="_blank"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                                    >
                                        READ FULL DOCS
                                    </a>
                                    <button className="bg-muted hover:bg-muted/80 text-foreground font-black px-8 py-4 rounded-2xl transition-all border border-border/50">
                                        POSTMAN COLL.
                                    </button>
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500/20 w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Authentication", desc: "Detailed guide on JWT and Signature security headers.", icon: ShieldCheckIcon },
                            { title: "Endpoints", desc: "Path references for all proxy and node actions.", icon: CommandLineIcon },
                            { title: "Webhooks", desc: "Event-driven feedback for automated deployments.", icon: ArrowPathIcon }
                        ].map((card) => (
                            <div key={card.title} className="bg-white/50 p-8 rounded-3xl border border-border/50 hover:border-primary/50 transition-all group">
                                <card.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                <h5 className="font-black text-lg tracking-tight mb-2">{card.title}</h5>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
