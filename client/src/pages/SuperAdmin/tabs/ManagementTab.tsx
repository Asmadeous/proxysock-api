import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ComputerDesktopIcon,
    ServerIcon,
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

// Lazy load the sub-components
const AdminRDPManagement = lazy(() => import("./AdminRDPManagement"));
const AdminVPSManagement = lazy(() => import("./AdminVPSManagement"));
const AdminESIMManagement = lazy(() => import("./AdminESIMManagement"));
const AdminProxyManagement = lazy(() => import("./AdminProxyManagement"));
const AdminVPNManagement = lazy(() => import("./AdminVPNManagement"));
const ProductsTab = lazy(() => import("./ProductsTab"));
const AdminPurchaseView = lazy(() => import("./AdminPurchaseView"));

type View = "orders" | "products" | "provision";

const PRODUCTS = [
    {
        id: "rdp",
        name: "RDP Management",
        desc: "Manage Windows Remote Desktop instances",
        guide: "Windows servers with remote desktop, hosted on our Proxmox cluster.",
        orders: "See every RDP server with its host, RDP port, login and expiry. Start, stop, reboot or delete a server.",
        products: "RDP plans and prices customers can buy. Sync plans, edit prices, switch plans on or off.",
        icon: ComputerDesktopIcon,
        component: AdminRDPManagement,
        buyTab: "buy-rdp",
        color: "ws-wait",
        bg: "bg-[var(--ov-wash)]"
    },
    {
        id: "vps",
        name: "VPS Management",
        desc: "Manage Virtual Private Servers",
        guide: "Linux virtual servers hosted on our Proxmox cluster.",
        orders: "See every VPS with its host, SSH port, login, specs and expiry. Start, stop, reboot or delete a server.",
        products: "VPS plans and prices customers can buy. Sync plans, edit prices, switch plans on or off.",
        icon: ServerIcon,
        component: AdminVPSManagement,
        buyTab: "buy-vps",
        color: "ws-info",
        bg: "bg-[var(--ov-wash)]"
    },
    {
        id: "esim",
        name: "eSIM Management",
        desc: "Global travel eSIM profiles",
        guide: "Travel data eSIMs (eSIM Access and MeiSIM) and US/UK phone-number lines (MeiSIM).",
        orders: "See every eSIM with its ICCID and QR, apply paid phone-line top-ups, and verify whether an eSIM has been installed.",
        products: "eSIM plans and prices. Sync eSIM Access or MeiSIM plans, edit prices, switch plans on or off.",
        icon: DevicePhoneMobileIcon,
        component: AdminESIMManagement,
        buyTab: "buy-esim",
        color: "ws-good",
        bg: "bg-[var(--ov-wash)]"
    },
    {
        id: "proxy",
        name: "Proxy Management",
        desc: "Residential & Static proxy instances",
        guide: "Datacenter, ISP, static residential, rotating residential, mobile and Global ISP proxies, mostly bought from MyProxyAPI.",
        orders: "See every proxy order with its endpoints, login and expiry. Change protocol or login, replace IPs and manage whitelists.",
        products: "Proxy plans and prices. Sync plans from MyProxyAPI, edit prices, switch plans on or off.",
        icon: GlobeAltIcon,
        component: AdminProxyManagement,
        buyTab: "buy-proxies",
        color: "ws-info",
        bg: "bg-[var(--ov-wash)]"
    },
    {
        id: "vpn",
        name: "VPN Management",
        desc: "Secure VPN subscriptions",
        guide: "Residential VPN subscriptions bought from MyProxyAPI.",
        orders: "See every VPN with its server, login, location and expiry.",
        products: "VPN plans and prices. Sync plans, edit prices, switch plans on or off.",
        icon: ShieldCheckIcon,
        component: AdminVPNManagement,
        buyTab: "buy-vpn",
        color: "ws-info",
        bg: "bg-[var(--ov-wash)]"
    },
];

const PROVISION_GUIDE ="Create an order for a customer by their account email. It is paid from the customer's own wallet, so top them up first for a free or manual sale. Credentials are emailed to them once it is ready.";

const VIEWS: { id: View; title: string; icon: typeof CubeIcon; text: (p: typeof PRODUCTS[number]) => string }[] = [
    { id: "orders", title: "Orders", icon: ClipboardDocumentListIcon, text: (p) => p.orders },
    { id: "products", title: "Products", icon: CubeIcon, text: (p) => p.products },
    { id: "provision", title: "Provision", icon: ShoppingCartIcon, text: () => PROVISION_GUIDE },
];

export default function ManagementTab() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [view, setView] = useState<View | null>(null);

    // Deep links: ?type=rdp opens the category page, &view=orders|products|provision opens a card.
    useEffect(() => {
        const type = searchParams.get("type");
        const v = searchParams.get("view") as View | null;
        setSelectedProduct(type && PRODUCTS.find(p => p.id === type) ? type : null);
        setView(v && VIEWS.find(x => x.id === v) ? v : null);
    }, [searchParams]);

    const activeProduct = PRODUCTS.find(p => p.id === selectedProduct);
    const ActiveComponent = activeProduct?.component;
    const activeView = VIEWS.find(v => v.id === view);

    const go = (type: string | null, nextView: View | null) => {
        const params = new URLSearchParams(searchParams);
        if (type) params.set("type", type); else params.delete("type");
        if (nextView) params.set("view", nextView); else params.delete("view");
        setSearchParams(params);
    };

    const renderView = () => {
        if (!activeProduct) return null;
        if (view === "orders") return ActiveComponent && <ActiveComponent />;
        if (view === "products") return <ProductsTab category={activeProduct.id} />;
        return <AdminPurchaseView initialTab={activeProduct.buyTab} />;
    };

    return (
        <div className="ws-stack">
            {!activeProduct ? (
                <>
                    <PageHeader title="Product management" description="Pick a product category to manage its orders, products and provisioning." />
                    <div className="ws-grid">
                        {PRODUCTS.map((product) => (
                            <button type="button" key={product.id} onClick={() => go(product.id, null)} className="overview-service text-left">
                                <div className="overview-service-top"><product.icon width={18} height={18} aria-hidden="true" /></div>
                                <h3>{product.name}</h3>
                                <p className="line-clamp-2">{product.desc}</p>
                                <span className="mt-4 inline-flex items-center gap-2 text-[11px] text-[var(--ov-accent)]">Manage <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                            </button>
                        ))}
                    </div>
                </>
            ) : !activeView ? (
                <>
                    <PageHeader
                        title={activeProduct.name}
                        description={activeProduct.guide}
                        actions={<Button variant="secondary" onClick={() => go(null, null)} aria-label="Back to categories"><ArrowLeftIcon /> Categories</Button>}
                    />
                    <div className="ws-grid">
                        {VIEWS.map((card) => (
                            <button type="button" key={card.id} onClick={() => go(activeProduct.id, card.id)} className="overview-service text-left">
                                <div className="overview-service-top"><card.icon width={18} height={18} aria-hidden="true" /></div>
                                <h3>{card.title}</h3>
                                <p>{card.text(activeProduct)}</p>
                                <span className="mt-4 inline-flex items-center gap-2 text-[11px] text-[var(--ov-accent)]">Open {card.title} <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <PageHeader
                        title={`${activeProduct.name} · ${activeView.title}`}
                        description={activeView.text(activeProduct)}
                        actions={<Button variant="secondary" onClick={() => go(activeProduct.id, null)} aria-label={`Back to ${activeProduct.name}`}><ArrowLeftIcon /> Back</Button>}
                    />
                    <Suspense fallback={<div className="ws-panel space-y-3" role="status" aria-label="Loading"><span className="ws-skeleton block" style={{ height: 14 }} /><span className="ws-skeleton block" style={{ height: 14, maxWidth: "60%" }} /></div>}>
                        {renderView()}
                    </Suspense>
                </>
            )}
        </div>
    );
}
