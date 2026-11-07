import { useState, useMemo } from "react";
import {
    ShieldCheck,
    Package,
    ShoppingCart,
    Bell,
    Wallet,
    Code2,
    Copy,
    Play,
    Users,
    Server,
    Headphones,
    X,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";
import { generateSnippet } from "../../../utils/snippetGenerator";

const LANGUAGES = [
    { id: "curl", label: "cURL" },
    { id: "node", label: "Node" },
    { id: "python", label: "Python" },
    { id: "go", label: "Go" },
    { id: "php", label: "PHP" },
    { id: "java", label: "Java" },
    { id: "csharp", label: "C#" },
];

async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    catch { toast.error("Couldn't copy. Select the text and copy it manually."); }
}

interface Endpoint {
    id: string;
    method: string;
    path: string;
    name: string;
    description: string;
    body?: unknown;
    response?: unknown;
}

function EndpointCard({ endpoint, authValue }: { endpoint: Endpoint; authValue: string }) {
    const [lang, setLang] = useState("curl");
    const [response, setResponse] = useState<string | null>(null);
    const snippet = generateSnippet(lang, endpoint.method, endpoint.path, authValue, endpoint.body);

    return (
        <article className="ws-panel" aria-labelledby={`ep-${endpoint.id}`}>
            <div className="ws-panel-heading">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="ws-status" data-tone={endpoint.method === "GET" ? "info" : "good"}>{endpoint.method}</span>
                        <code className="ws-mono" style={{ color: "var(--ov-text)" }}>{endpoint.path}</code>
                    </div>
                    <h2 id={`ep-${endpoint.id}`} style={{ marginTop: 10 }}>{endpoint.name}</h2>
                    <p>{endpoint.description}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setResponse(JSON.stringify(endpoint.response ?? {}, null, 2))}><Play aria-hidden="true" /> Example response</Button>
            </div>

            <div className="flex items-end justify-between gap-3">
                <div className="ws-tabs flex-1" role="group" aria-label={`${endpoint.name} code language`}>
                    {LANGUAGES.map(l => <button type="button" key={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>)}
                </div>
                <button type="button" className="ws-icon-button" onClick={() => copyText(snippet)} aria-label={`Copy ${LANGUAGES.find(l => l.id === lang)?.label} example`} title="Copy example"><Copy /></button>
            </div>
            <pre className="ws-code" style={{ marginTop: 14, maxHeight: 360 }}>{snippet}</pre>

            {response && (
                <div style={{ marginTop: 18 }}>
                    <div className="flex items-center justify-between gap-3">
                        <p className="ws-label" style={{ margin: 0 }}>Example response · 200 OK</p>
                        <button type="button" className="ws-icon-button" onClick={() => setResponse(null)} aria-label="Hide example response" title="Hide"><X /></button>
                    </div>
                    <pre className="ws-code" style={{ marginTop: 8, maxHeight: 360 }}>{response}</pre>
                </div>
            )}
        </article>
    );
}

export default function ResApiDocs() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";
    const [activeCategory, setActiveCategory] = useState("authentication");
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
            name: "USA Phone-Number eSIM", description: "Payload required to provision a US prepaid line (products with `requires_imei: true`). Each line is activated on one phone, so `quantity` must be 1. `metadata.imei` (15 digits) is required, `metadata.eid` (32 digits) is required when the product has `requires_eid: true`, and `metadata.address` (E911: `address_line_1` starting with a street number, `city`, 2-letter `state`, 5-digit `zip_code`) is required when the product has `accepts_address: true`. Invalid details are rejected with 422 before any payment.",
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
        {
            id: "order-renew", category: "orders", method: "POST", path: "/api/v1/orders/:id/renew",
            name: "Renew Order", description: "Extend an active VM, static proxy or VPN by one period, paid from your balance.",
            visible: true,
            response: { message: "Order renewed successfully" }
        },
        {
            id: "order-restart-vpn", category: "orders", method: "POST", path: "/api/v1/orders/:id/restart_vpn",
            name: "Restart VPN", description: "Restart a VPN whose connection misbehaves.",
            visible: true,
            response: { message: "VPN restart requested" }
        },
        {
            id: "order-rotation", category: "orders", method: "POST", path: "/api/v1/orders/:id/rotation",
            name: "Mobile IP Rotation", description: "Turn 30-minute IP rotation on or off for a mobile proxy order.",
            visible: true,
            body: { status: "off" },
            response: { message: "Rotation turned off" }
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

    const authLabel = isEnterprise ? "Dedicated API Key" : "Bearer Token";
    const authValue = isEnterprise ? (user?.dedicated_api_key || "ps_live_...") : "YOUR_ROTATIONAL_TOKEN";
    const visible = endpoints.filter(e => e.category === activeCategory);

    return (
        <div className="ws-stack">
            <PageHeader
                title="API documentation"
                description={`Reference and example responses for the ProxySock ${isEnterprise ? "Enterprise API" : "Reseller API"}.`}
            />

            <p className="ws-callout">Every request needs the <code>{authLabel}</code> authorization header. Use <strong>Example response</strong> on an endpoint to see the response format; examples use sample data and make no API calls.</p>

            <div className="ws-tabs" role="group" aria-label="API section">
                {categories.map(cat => (
                    <button type="button" key={cat.id} aria-pressed={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}><cat.icon aria-hidden="true" />{cat.name}</button>
                ))}
            </div>

            {visible.map(endpoint => <EndpointCard key={endpoint.id} endpoint={endpoint as Endpoint} authValue={authValue} />)}

            {activeCategory === "authentication" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <section className="ws-panel">
                        <div className="ws-panel-heading"><div><h2>{isEnterprise ? "Persistent key" : "Rotational JWT"}</h2>
                            <p>{isEnterprise
                                ? "Your dedicated key is static. For security, rotate it every 90 days."
                                : "Tokens are valid for single operations. Every response includes a new X-Next-Token header for your next call."}</p></div></div>
                    </section>
                    <section className="ws-panel">
                        <div className="ws-panel-heading"><div><h2>Data retention</h2>
                            <p>Resources and credentials stay available from the <code>/credentials</code> endpoint for up to 72 hours after provisioning.</p></div></div>
                    </section>
                </div>
            )}
        </div>
    );
}
