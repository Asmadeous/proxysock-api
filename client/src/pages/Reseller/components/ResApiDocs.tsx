import { useState, useMemo } from "react";
import { 
    ShieldCheck, 
    Package, 
    ShoppingCart, 
    Bell, 
    Wallet, 
    Code2, 
    ChevronRight, 
    Copy, 
    Terminal, 
    PlayCircle,
    CheckCircle2,
    Info,
    RefreshCw,
    Database
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateSnippet } from "../../../utils/snippetGenerator";

export default function ResApiDocs() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";
    const [activeCategory, setActiveCategory] = useState("authentication");
    const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
    const [simulating, setSimulating] = useState(false);
    const [mockResponse, setMockResponse] = useState<string | null>(null);

    const categories = [
        { id: "authentication", name: "Authentication", icon: ShieldCheck },
        { id: "products", name: "Products", icon: Package },
        { id: "orders", name: "Orders", icon: ShoppingCart },
        { id: "billing", name: "Billing", icon: Wallet },
        ...(!isEnterprise ? [{ id: "webhooks", name: "Webhooks", icon: Bell }] : []),
    ];

    const endpoints = useMemo(() => [
        {
            id: "auth-token",
            category: "authentication",
            method: "POST",
            path: "/api/v1/auth/token",
            name: "Generate Token",
            description: "Exchange your Permanent API Key for a single-use rotational JWT.",
            visible: !isEnterprise,
            body: { username: user?.username || "partner_123", api_key: "ps_permanent_..." },
            response: { token: "eyJhbGciOiJIUzI1NiIsInR5...", expires_in: 3600 }
        },
        {
            id: "auth-me",
            category: "authentication",
            method: "GET",
            path: "/api/v1/auth/me",
            name: "Get Profile",
            description: "Retrieve your reseller account configuration and status.",
            visible: true,
            response: { id: user?.id, username: user?.username, reseller_type: user?.reseller_type }
        },
        {
            id: "prod-list",
            category: "products",
            method: "GET",
            path: "/api/v1/products",
            name: "List Products",
            description: "Browse the full catalog of available inventory (Proxies, VPS, eSIM).",
            visible: true,
            response: { products: [{ id: "uuid", name: "USA Residential", base_price: 5.0, type: "proxy" }] }
        },
        {
            id: "prod-cats",
            category: "products",
            method: "GET",
            path: "/api/v1/product_categories",
            name: "List Categories",
            description: "Retrieve all product categories for storefront organization.",
            visible: true,
            response: { categories: [{ id: 1, name: "Residential Proxies", slug: "residential" }] }
        },
        {
            id: "order-create",
            category: "orders",
            method: "POST",
            path: "/api/v1/orders",
            name: "Create Order",
            description: "Provision a new resource. API-only uses balance; Enterprise initiates checkout.",
            visible: true,
            body: { product_id: "uuid", quantity: 1, metadata: { country: "US" } },
            response: isEnterprise ? { payment_url: "https://checkout.proxysock..." } : { order_id: "ord_123", status: "provisioning" }
        },
        {
            id: "order-reorder",
            category: "orders",
            method: "POST",
            path: "/api/v1/orders/:id/reorder",
            name: "Reorder Service",
            description: "Quickly duplicate a previous order with identical settings.",
            visible: true,
            response: { message: "Order initiated", order_id: "new_ord_456" }
        },
        {
            id: "balance-get",
            category: "billing",
            method: "GET",
            path: "/api/v1/billing/balance",
            name: "Check Balance",
            description: "Monitor your real-time wallet and referral earnings.",
            visible: true,
            response: { balance: 450.00, earnings: 25.50, currency: "USD" }
        }
    ].filter(e => e.visible), [isEnterprise, user]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const runSimulation = (endpoint: any) => {
        setSimulating(true);
        setSelectedEndpoint(endpoint);
        setMockResponse(null);
        setTimeout(() => {
            setMockResponse(JSON.stringify(endpoint.response, null, 2));
            setSimulating(false);
            toast.success("Simulation complete", { icon: "✨" });
        }, 800);
    };

    const authLabel = isEnterprise ? "Dedicated API Key" : "Bearer Token";
    const authValue = isEnterprise ? (user?.dedicated_api_key || "ps_live_...") : "YOUR_ROTATIONAL_TOKEN";

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                            Protocol v1.4
                        </Badge>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Technical Hub</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">API Documentation</h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        Reference and simulated responses for the ProxySock {isEnterprise ? "Enterprise Layer" : "Reseller API"}.
                    </p>
                </div>
                <div className="flex gap-4 min-w-fit">
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 transition-all hover:bg-muted/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                        <div className="flex items-center gap-2 font-black text-sm text-foreground">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Operational
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-3 space-y-6">
                    <nav className="space-y-1">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                                    activeCategory === cat.id 
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.name}
                                {activeCategory === cat.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                            </button>
                        ))}
                    </nav>

                    <Card className="rounded-3xl border-border/50 bg-muted/30 shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs font-medium text-muted-foreground">
                            <div className="flex gap-3">
                                <Info className="w-4 h-4 text-primary shrink-0" />
                                <p>Use the <strong>Simulate</strong> button to see example response formats.</p>
                            </div>
                            <div className="flex gap-3">
                                <Code2 className="w-4 h-4 text-primary shrink-0" />
                                <p>Authorization requires the <code>{authLabel}</code> header.</p>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9 space-y-6 pb-20">
                    {endpoints
                        .filter(e => e.category === activeCategory)
                        .map((endpoint) => (
                            <Card key={endpoint.id} className="rounded-3xl border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6 md:p-8 space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={`rounded-lg font-black text-[10px] uppercase ${
                                                    endpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="text-xs font-bold text-foreground font-mono">{endpoint.path}</code>
                                            </div>
                                            <h3 className="text-xl font-bold tracking-tight">{endpoint.name}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">{endpoint.description}</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="rounded-xl border-primary/20 text-primary font-bold px-4 hover:bg-primary/5 gap-2"
                                            onClick={() => runSimulation(endpoint)}
                                            disabled={simulating}
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            Simulate
                                        </Button>
                                    </div>

                                    <Tabs defaultValue="curl" className="w-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <TabsList className="bg-muted/50 p-1 rounded-xl h-9">
                                                <TabsTrigger value="curl" className="text-[10px] font-black uppercase tracking-widest">cURL</TabsTrigger>
                                                <TabsTrigger value="node" className="text-[10px] font-black uppercase tracking-widest">Node</TabsTrigger>
                                                <TabsTrigger value="python" className="text-[10px] font-black uppercase tracking-widest">Python</TabsTrigger>
                                                <TabsTrigger value="go" className="text-[10px] font-black uppercase tracking-widest">Go</TabsTrigger>
                                                <TabsTrigger value="php" className="text-[10px] font-black uppercase tracking-widest">PHP</TabsTrigger>
                                                <TabsTrigger value="java" className="text-[10px] font-black uppercase tracking-widest">Java</TabsTrigger>
                                                <TabsTrigger value="csharp" className="text-[10px] font-black uppercase tracking-widest">C#</TabsTrigger>
                                            </TabsList>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleCopy(generateSnippet("curl", endpoint.method, endpoint.path, authValue, endpoint.body))}>
                                                <Copy className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>

                                        {["curl", "node", "python", "go", "php", "java", "csharp"].map(lang => (
                                            <TabsContent key={lang} value={lang}>
                                                <div className="relative group">
                                                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <pre className="relative p-6 bg-zinc-950 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-white/5">
                                                        {generateSnippet(lang, endpoint.method, endpoint.path, authValue, endpoint.body)}
                                                    </pre>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>

                                    {/* Simulation Result */}
                                    {mockResponse && selectedEndpoint?.id === endpoint.id && (
                                        <div className="animate-in slide-in-from-top-4 duration-300">
                                            <div className="flex items-center gap-2 mb-3 px-1">
                                                <Terminal className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Simulated Response</span>
                                                <Badge variant="outline" className="ml-auto rounded-full border-primary/20 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-tighter">Mock Data</Badge>
                                            </div>
                                            <pre className="p-6 bg-muted/40 rounded-2xl text-[11px] font-mono text-foreground border border-border/50 overflow-x-auto">
                                                {mockResponse}
                                            </pre>
                                        </div>
                                    )}
                                    
                                    {/* Simulation wrapper logic fix below */}
                                    <SimulationDisplay endpoint={endpoint} selectedEndpoint={selectedEndpoint} mockResponse={mockResponse} setMockResponse={setMockResponse} />
                                </div>
                            </Card>
                        ))}

                    {/* Authentication Deep-Dive for specific category */}
                    {activeCategory === "authentication" && (
                        <div className="space-y-6 pt-6">
                            <div className="flex items-center gap-3 px-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                <h4 className="text-lg font-black tracking-tight">Access Protocol</h4>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="rounded-3xl border-border/50 bg-primary/5 border-dashed">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" />
                                            {isEnterprise ? "Persistent Key" : "Rotational JWT"}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                        {isEnterprise 
                                            ? "Your dedicated key is static. For security, we recommend rotating it every 90 days via the API Management tab."
                                            : "Tokens are valid for single operations. Every response includes a new 'X-Next-Token' for your subsequent call."}
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-border/50 bg-muted/10">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Database className="w-4 h-4" />
                                            Data Retention
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                        Resources and credentials remain accessible via the <code>/credentials</code> endpoint for up to 72 hours after provision.
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Internal helper for simulation display
function SimulationDisplay({ endpoint, selectedEndpoint, mockResponse, setMockResponse }: any) {
    const [localResponse, setLocalResponse] = useState<string | null>(null);

    // Synchronize local state with global trigger
    useMemo(() => {
        if (mockResponse && selectedEndpoint?.id === endpoint.id) {
            setLocalResponse(mockResponse);
        }
    }, [mockResponse, selectedEndpoint, endpoint.id]);

    if (!localResponse) return null;

    return (
        <div className="animate-in slide-in-from-top-4 duration-500 pt-4 border-t border-border/50 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Simulation Output</span>
                <span className="text-[10px] font-bold text-muted-foreground font-mono ml-auto">Status: 200 OK</span>
            </div>
            <pre className="p-6 bg-[#0B0E14] rounded-2xl text-[11px] font-mono text-zinc-300 border border-white/5 overflow-x-auto shadow-inner relative">
                <div className="absolute top-2 right-2 flex gap-1">
                     <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                     <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                     <div className="w-2 h-2 rounded-full bg-red-500/20" />
                </div>
                {localResponse}
            </pre>
            <div className="flex gap-2 mt-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        setLocalResponse(null);
                        setMockResponse(null);
                    }}
                    className="h-7 text-[10px] font-bold text-muted-foreground hover:text-foreground underline"
                >
                    Clear Simulation
                </Button>
            </div>
        </div>
    );
}
