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
    Database,
    Users,
    Server,
    Headphones
} from "lucide-react";
import { toast } from "sonner";
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
        { id: "provisioning", name: "Provisioning Payloads", icon: Code2 },
        { id: "orders", name: "Orders", icon: ShoppingCart },
        { id: "billing", name: "Billing", icon: Wallet },
        { id: "webhooks", name: "Webhooks", icon: Bell },
        { id: "vms", name: "Virtual Machines", icon: Server },
        { id: "support", name: "Support", icon: Headphones },
        ...(isEnterprise ? [{ id: "users", name: "Sub-Users", icon: Users }] : []),
    ];

    const endpoints = useMemo(() => [
        // Authentication
        {
            id: "auth-token", category: "authentication", method: "POST", path: "/api/v1/auth/token",
            name: "Generate Token", description: "Exchange your username and API Key for a single-use rotational JWT.",
            visible: true,
            body: { username: user?.username || "partner_123", api_key: "ps_permanent_..." },
            response: { token: "eyJhbGciOiJIUzI1NiIsInR5...", refresh_token: "a1b2c3d4..." }
        },
        {
            id: "auth-me", category: "authentication", method: "GET", path: "/api/v1/auth/me",
            name: "Get Profile", description: "Retrieve your reseller account configuration and status.",
            visible: true,
            response: { id: user?.id, username: user?.username, reseller_type: user?.reseller_type }
        },
        {
            id: "auth-refresh", category: "authentication", method: "POST", path: "/api/v1/auth/refresh",
            name: "Refresh Token", description: "Manually refresh an expired or invalid token.",
            visible: true,
            body: { refresh_token: "a1b2c3d4..." },
            response: { token: "eyJhbGciOiJIUzI1NiIsInR5..." }
        },

        // Products
        {
            id: "prod-cats", category: "products", method: "GET", path: "/api/v1/product_categories",
            name: "List Categories", description: "Retrieve all available product categories.",
            visible: true,
            response: { categories: [{ id: 1, name: "Residential Proxies", slug: "residential-rotating" }] }
        },
        {
            id: "prod-list", category: "products", method: "GET", path: "/api/v1/products",
            name: "List Products", description: "Browse the full catalog of available inventory.",
            visible: true,
            response: { products: [{ id: 15, name: "USA Residential", base_price: 3.0, type: "residential_rotating" }] }
        },
        {
            id: "prod-single", category: "products", method: "GET", path: "/api/v1/products/:id",
            name: "Get Product Details", description: "Retrieve details and pricing for a specific product.",
            visible: true,
            response: { product: { id: 15, name: "USA Residential", base_price: 3.0 } }
        },

        // Orders
        {
            id: "order-create", category: "orders", method: "POST", path: "/api/v1/orders",
            name: "Create Order (API-Only)", description: "Instantly deducts wallet balance and provisions a new resource.",
            visible: !isEnterprise,
            body: { product_id: 15, quantity: 1, metadata: { period: "1", protocol: "http" } },
            response: { id: 104, order_number: "ORD-1234", status: "pending" }
        },
        {
            id: "order-cart", category: "orders", method: "POST", path: "/api/v1/orders/checkout_cart",
            name: "Checkout Cart (Infrastructure)", description: "Generates a payment gateway link for batch orders on behalf of a managed user. Supported 'gateway' values: 'rexpay' (Fiat/Cards), 'plisio' (Crypto), 'payvra' (Crypto), 'hundredpay' (Crypto/Local). The 'customer_email' MUST match a provisioned Sub-User.",
            visible: isEnterprise,
            body: { gateway: "plisio", customer_email: "client@ex.com", items: [{ product_id: 15, quantity: 1, metadata: { period: "1", protocol: "http" } }] },
            response: { payment_url: "https://plisio.net/checkout/...", reference: "ref_123" }
        },
        
        // Provisioning Payloads (Product-Specific Metadata)
        {
            id: "prov-residential", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Residential Rotating Proxies", description: "Payload required to provision rotating residential proxies. Includes specific configuration for rotation strategy, region, and generated credentials.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 15, quantity: 1, metadata: { period: "1", protocol: "http", residentalRotatingConfig: { rotationStrategy: "0", proxyRegion: "ip-na.myproxyapi.com", quantity: 1, autoGenerate: true } } }] } : { product_id: 15, quantity: 1, metadata: { period: "1", protocol: "http", residentalRotatingConfig: { rotationStrategy: "0", proxyRegion: "ip-na.myproxyapi.com", quantity: 1, autoGenerate: true } } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-static", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Static ISP / Datacenter Proxies", description: "Payload required to provision Static ISP or Datacenter proxies.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 18, quantity: 1, metadata: { period: "30d", protocol: "http", locationId: "123" } }] } : { product_id: 18, quantity: 1, metadata: { period: "30d", protocol: "http", locationId: "123" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-premium-isp", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Premium ISP Proxies", description: "Payload required to provision Premium ISP proxies.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 21, quantity: 1, metadata: { period: "30d", protocol: "http", locationId: "123" } }] } : { product_id: 21, quantity: 1, metadata: { period: "30d", protocol: "http", locationId: "123" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-static-res", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Static Residential Proxies", description: "Payload required to provision Static Residential proxies.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 22, quantity: 1, metadata: { period: "30d", protocol: "http", locationId: "123" } }] } : { product_id: 22, quantity: 1, metadata: { period: "30d", protocol: "http", locationId: "123" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-global-isp", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Global ISP Proxies", description: "Payload required to provision Global ISP proxies.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 19, quantity: 1, metadata: { period: "30d", protocol: "http", target_section_id: "45", target_id: "89", selected_country_id: "US" } }] } : { product_id: 19, quantity: 1, metadata: { period: "30d", protocol: "http", target_section_id: "45", target_id: "89", selected_country_id: "US" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-mobile", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Mobile Proxies", description: "Payload required to provision 4G/5G Mobile proxies.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 20, quantity: 1, metadata: { period: "1", protocol: "http", locationId: "123" } }] } : { product_id: 20, quantity: 1, metadata: { period: "1", protocol: "http", locationId: "123" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-esim", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Global eSIM Data & Voice", description: "Payload required to provision a Global eSIM package. The `product_id` inherently defines the package traits (data, duration, country), so `metadata` remains empty.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 55, quantity: 1, metadata: {} }] } : { product_id: 55, quantity: 1, metadata: {} },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-usa-esim", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "USA Phone-Number eSIM", description: "Payload required to provision a US prepaid line (products with `requires_imei: true`). Each line is activated on one phone, so `quantity` must be 1. `metadata.imei` (15 digits) is required, `metadata.eid` (32 digits) is required when the product has `requires_eid: true`, and `metadata.address` (E911) is optional. Invalid details are rejected with 422 before any payment.",
            visible: true,
            body: isEnterprise
                ? { items: [{ product_id: "0cf1fe4c-c82b-4a15-9de5-62daf21ea00f", quantity: 1, metadata: { imei: "356938035643809", eid: "89049032000001000000000000000001", address: { address_line_1: "120 Main St", city: "Phoenix", state: "AZ", zip_code: "85001" } } }] }
                : { product_id: "0cf1fe4c-c82b-4a15-9de5-62daf21ea00f", quantity: 1, metadata: { imei: "356938035643809", eid: "89049032000001000000000000000001", address: { address_line_1: "120 Main St", city: "Phoenix", state: "AZ", zip_code: "85001" } } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-vps", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Virtual Private Server (VPS)", description: "Payload required to provision a Linux-based Virtual Private Server. Hardware limits (RAM/CPU/Storage) are derived securely from the product_id. The `management_type` controls whether Ansible installs management tools.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 42, quantity: 1, metadata: { os_template: "ubuntu-22-04", countryCode: "US", management_type: "unmanaged" } }] } : { product_id: 42, quantity: 1, metadata: { os_template: "ubuntu-22-04", countryCode: "US", management_type: "unmanaged" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-rdp", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Remote Desktop Protocol (RDP)", description: "Payload required to provision a Remote Desktop instance. Hardware specs are bound to the product. Use `management_type` to declare if the instance requires managed agent installation.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 43, quantity: 1, metadata: { os_template: "windows-2022", countryCode: "US", management_type: "unmanaged" } }] } : { product_id: 43, quantity: 1, metadata: { os_template: "windows-2022", countryCode: "US", management_type: "unmanaged" } },
            response: { message: "See Orders documentation for response structure" }
        },
        {
            id: "prov-vpn", category: "provisioning", method: "POST", path: isEnterprise ? "/api/v1/orders/checkout_cart" : "/api/v1/orders",
            name: "Virtual Private Network (VPN)", description: "Payload required to provision a VPN subscription (via API providers). Local inventory VPNs read data directly from the product.",
            visible: true,
            body: isEnterprise ? { items: [{ product_id: 40, quantity: 1, metadata: { period: "30", protocol: "http", locationId: "123" } }] } : { product_id: 40, quantity: 1, metadata: { period: "30", protocol: "http", locationId: "123" } },
            response: { message: "See Orders documentation for response structure" }
        },

        {
            id: "order-list", category: "orders", method: "GET", path: "/api/v1/orders",
            name: "List Orders", description: "Retrieve all placed orders and their statuses.",
            visible: true,
            response: { orders: [{ id: 104, status: "active", total_amount: "5.0" }] }
        },
        {
            id: "order-show", category: "orders", method: "GET", path: "/api/v1/orders/:id",
            name: "Get Single Order", description: "Retrieve complete details for a specific order. Infrastructure resellers can look up their Sub-Users' order IDs as well.",
            visible: true,
            response: { id: 104, order_number: "ORD-1234", status: "active", product_name: "USA Residential", total_amount: "5.0" }
        },
        {
            id: "order-creds", category: "orders", method: "GET", path: "/api/v1/orders/:id/credentials",
            name: "Get Credentials", description: "Retrieve connection details for a provisioned order.",
            visible: true,
            response: { proxies: [{ ip_address: "1.1.1.1", port: 8080, username: "usr", password: "pwd" }] }
        },
        {
            id: "order-cancel", category: "orders", method: "POST", path: "/api/v1/orders/:id/cancel",
            name: "Cancel Order", description: "Cancel an order and refund to wallet (must be within 1 hour).",
            visible: true,
            response: { message: "Order cancelled and refunded" }
        },

        // Billing
        {
            id: "billing-bal", category: "billing", method: "GET", path: "/api/v1/billing/balance",
            name: "Check Balance", description: "Monitor your real-time wallet and earnings.",
            visible: true,
            response: { balance: 450.00, earnings_balance: 25.50, currency: "USD" }
        },
        {
            id: "billing-trans", category: "billing", method: "GET", path: "/api/v1/billing/transactions",
            name: "Wallet Transactions", description: "View your wallet deposit and deduction history.",
            visible: true,
            response: { transactions: [{ amount: "50.0", description: "Deposit", created_at: "2026-04-23" }] }
        },
        {
            id: "billing-deposit", category: "billing", method: "POST", path: "/api/v1/resellers/:id/deposit",
            name: "Initiate Deposit", description: "Top up your API wallet balance. Only available for API-Only and Single-Product partners.",
            visible: !isEnterprise,
            body: { amount: 50.00, gateway: "rexpay", currency: "USD" },
            response: { authorization_url: "https://checkout..." }
        },
        {
            id: "billing-payout", category: "billing", method: "POST", path: "/api/v1/billing/request_payout",
            name: "Request Payout", description: "Withdraw your accumulated earnings to a bank or crypto wallet. Supported methods: 'manual' (Bank), 'crypto'.",
            visible: isEnterprise,
            body: { amount: 150.00, payment_method: "crypto", payment_details: { crypto_currency: "USDT", crypto_address: "0xABC..." } },
            response: { message: "Payout request submitted for review", payout_id: 1, amount: 150.00, status: "pending" }
        },

        // Sub-Users
        {
            id: "user-list", category: "users", method: "GET", path: "/api/v1/users",
            name: "List Sub-Users", description: "List all isolated end-users managed by your infrastructure.",
            visible: isEnterprise,
            response: { users: [{ id: 1, email: "client@example.com", username: "client1" }] }
        },
        {
            id: "user-create", category: "users", method: "POST", path: "/api/v1/users",
            name: "Create Sub-User", description: "Provision a new sub-user account. The provided email MUST be passed as 'customer_email' when placing orders via the Checkout Cart.",
            visible: isEnterprise,
            body: { user: { email: "client@example.com", username: "client1", first_name: "John", country: "US" }, password: "securepassword" },
            response: { id: 1, email: "client@example.com", message: "User created" }
        },
        {
            id: "user-orders", category: "users", method: "GET", path: "/api/v1/users/:id/orders",
            name: "Sub-User Orders", description: "View orders and provisions belonging to a specific sub-user.",
            visible: isEnterprise,
            response: { orders: [{ id: 105, status: "active" }] }
        },

        // Virtual Machines
        {
            id: "vm-list", category: "vms", method: "GET", path: "/api/v1/vms",
            name: "List VMs", description: "List all provisioned Virtual Machines and RDPs.",
            visible: true,
            response: { vms: [{ id: 42, vm_type: "vps", os_type: "ubuntu-22-04", status: "active" }] }
        },
        {
            id: "vm-start", category: "vms", method: "POST", path: "/api/v1/vms/:id/start",
            name: "Start VM", description: "Power on a Virtual Machine.",
            visible: true,
            response: { message: "VM start signal sent" }
        },
        {
            id: "vm-restart", category: "vms", method: "POST", path: "/api/v1/vms/:id/restart",
            name: "Restart VM", description: "Hard reboot a Virtual Machine.",
            visible: true,
            response: { message: "VM restart signal sent" }
        },

        // Support
        {
            id: "tickets-list", category: "support", method: "GET", path: "/api/v1/tickets",
            name: "List Tickets", description: "Retrieve all support tickets.",
            visible: true,
            response: { tickets: [{ id: 1, subject: "API Issue", status: "open" }] }
        },
        {
            id: "tickets-create", category: "support", method: "POST", path: "/api/v1/tickets",
            name: "Create Ticket", description: "Open a new support request.",
            visible: true,
            body: { subject: "Connection failure", message: "Proxy is failing to connect." },
            response: { ticket_id: 2, message: "Ticket created" }
        },

        // Webhooks
        {
            id: "webhook-list", category: "webhooks", method: "GET", path: "/api/v1/webhook_endpoints",
            name: "List Webhooks", description: "View your registered webhook endpoints.",
            visible: true,
            response: { endpoints: [{ id: 1, url: "https://your-domain.com/webhook", events: ["order.completed"] }] }
        },
        {
            id: "webhook-create", category: "webhooks", method: "POST", path: "/api/v1/webhook_endpoints",
            name: "Create Webhook", description: "Register a new webhook to receive real-time notifications.",
            visible: true,
            body: { webhook_endpoint: { url: "https://your-domain.com/webhook", events: ["order.completed"] } },
            response: { id: 1, url: "https://...", secret: "whsec_..." }
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
        <div className="space-y-8 animate-in fade-in duration-500">
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
