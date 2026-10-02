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
import { motion, AnimatePresence } from "framer-motion";

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
        color: "text-orange-500",
        bg: "bg-orange-500/10"
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
        color: "text-blue-500",
        bg: "bg-blue-500/10"
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
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
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
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
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
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
];

const PROVISION_GUIDE =
    "Create an order for a customer by their account email. It is paid from the customer's own wallet, so top them up first for a free or manual sale. Credentials are emailed to them once it is ready.";

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
        <div className="min-h-[60vh]">
            <AnimatePresence mode="wait">
                {!activeProduct ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
                            <p className="text-muted-foreground mt-2">Select a product category to manage its orders, products and provisioning.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PRODUCTS.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => go(product.id, null)}
                                    className="group relative flex flex-col p-6 bg-card hover:bg-muted/50 border border-border rounded-2xl transition-all hover:shadow-lg text-left"
                                >
                                    <div className={cn("p-3 rounded-xl w-fit mb-4 transition-transform group-hover:scale-110", product.bg, product.color)}>
                                        <product.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{product.desc}</p>

                                    <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        Manage Products <ArrowRightIcon className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : !activeView ? (
                    <motion.div
                        key={`hub-${activeProduct.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => go(null, null)}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Back to categories"
                                aria-label="Back to categories"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div className={cn("p-3 rounded-xl", activeProduct.bg, activeProduct.color)}>
                                <activeProduct.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{activeProduct.name}</h1>
                                <p className="text-sm text-muted-foreground">{activeProduct.guide}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {VIEWS.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => go(activeProduct.id, card.id)}
                                    className="group flex flex-col p-6 bg-card hover:bg-muted/50 border border-border rounded-2xl transition-all hover:shadow-lg text-left"
                                >
                                    <div className={cn("p-3 rounded-xl w-fit mb-4", activeProduct.bg, activeProduct.color)}>
                                        <card.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-6">{card.text(activeProduct)}</p>
                                    <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
                                        Open {card.title} <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`${activeProduct.id}-${activeView.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => go(activeProduct.id, null)}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title={`Back to ${activeProduct.name}`}
                                aria-label={`Back to ${activeProduct.name}`}
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{activeProduct.name} · {activeView.title}</h1>
                                <p className="text-sm text-muted-foreground">{activeView.text(activeProduct)}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Suspense fallback={<div className="p-12 text-center animate-pulse text-muted-foreground">Loading...</div>}>
                                {renderView()}
                            </Suspense>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
