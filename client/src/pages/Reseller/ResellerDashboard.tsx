import { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    LayoutDashboard,
    ShoppingBag,
    Cog,
    ListTodo,
    Wallet,
    Users,
    Code,
    Settings as SettingsIcon,
    LogOut,
    Loader2,
    Webhook,
    BookOpen,
    DollarSign,
    MessageSquare,
    Ticket
} from "lucide-react";


import AdminSidebar from "../SuperAdmin/components/AdminSidebar";
import { formatImageUrl } from "../../services/api";

// Directly imported components for core tabs
import ResOverview from "./components/ResOverview";
import ResOrders from "./components/ResOrders";
import ResWallet from "./components/ResWallet";
import ResellerCheckout from "./ResellerCheckout";



// Lazy loaded components for less frequent views
const ResStore = lazy(() => import("./components/ResStore"));
const ResManagement = lazy(() => import("./components/ResManagement"));
const ResProxyManagement = lazy(() => import("./components/ResProxyManagement"));
const ResVPSManagement = lazy(() => import("./components/ResVPSManagement"));
const ResRDPManagement = lazy(() => import("./components/ResRDPManagement"));
const ResESIMManagement = lazy(() => import("./components/ResESIMManagement"));
const ResUserManagement = lazy(() => import("./components/ResUserManagement"));
const ResApiDocs = lazy(() => import("./components/ResApiDocs"));
const ResWebhookConfig = lazy(() => import("./components/ResWebhookConfig"));
const ResSettings = lazy(() => import("./components/ResSettings"));
const SupportChat = lazy(() => import("../UserDashboard/SupportChat"));
const Tickets = lazy(() => import("../UserDashboard/Tickets"));


// User dashboard buy pages (reused for full product configuration)
const BuyProxies = lazy(() => import("../UserDashboard/BuyProxies"));
const VPSTypes = lazy(() => import("../products/VPSTypes"));
const VPSPlans = lazy(() => import("../products/VPSPlans"));
const RDPTypes = lazy(() => import("../products/RDPTypes"));
const RDPPlans = lazy(() => import("../products/RDPPlans"));
const ESIMTypes = lazy(() => import("../products/ESIMTypes"));
const ESIMPackages = lazy(() => import("../products/EsimPackages"));
const USAESIMPlans = lazy(() => import("../products/USAESIMPlansPage"));
const VPNPlans = lazy(() => import("../products/VPNPlans"));

// Tab definitions per reseller tier
const API_ONLY_TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "store", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ListTodo },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "developer", label: "Developer", icon: Code },
    { id: "support", label: "Support", icon: MessageSquare },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "logout", label: "Logout", icon: LogOut },
];

const SINGLE_PRODUCT_TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "store", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ListTodo },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "developer", label: "Developer", icon: Code },
    { id: "support", label: "Support", icon: MessageSquare },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "logout", label: "Logout", icon: LogOut },
];

const ENTERPRISE_TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "store", label: "Store", icon: ShoppingBag },
    { id: "management", label: "Management", icon: Cog },
    { id: "orders", label: "Orders", icon: ListTodo },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "developer", label: "Developer", icon: Code },
    { id: "users", label: "Users", icon: Users },
    { id: "support", label: "Support", icon: MessageSquare },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "logout", label: "Logout", icon: LogOut },
];





const TabLoader = () => (
    <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
    </div>
);

export default function ResellerDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [devSubTab, setDevSubTab] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [resellerUser, setResellerUser] = useState(() => JSON.parse(localStorage.getItem("resellerUser") || "{}"));
    const [counts, setCounts] = useState<any>({});
    const [seenTabs, setSeenTabs] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch summary counts periodically
    useEffect(() => {
        const loadCounts = async () => {
            const { fetchResellerSummaryCounts } = await import("../../services/resellerApi");
            try {
                const data = await fetchResellerSummaryCounts();
                setCounts(data);
            } catch (e) {
                console.error("Failed to load reseller summary counts", e);
            }
        };

        if (localStorage.getItem("resellerToken")) {
            loadCounts();
            const interval = setInterval(loadCounts, 30000);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        if (!localStorage.getItem("resellerToken")) {
            navigate("/reseller/login");
            return;
        }

        const pathParts = location.pathname.split("/").filter(Boolean);
        // /reseller -> pathParts is ["reseller"]
        // /reseller/orders -> pathParts is ["reseller", "orders"]
        // /reseller/documentation -> pathParts is ["reseller", "documentation"]
        
        const subPath = pathParts[1] || "overview";
        
        if (subPath === "documentation") {
            setActiveTab("developer");
            setDevSubTab("api-docs");
        } else if (subPath === "webhooks") {
            setActiveTab("developer");
            setDevSubTab("webhook-config");
        } else {
            setActiveTab(subPath);
            setDevSubTab(null);
        }

        const handleUpdate = () => {
            setResellerUser(JSON.parse(localStorage.getItem("resellerUser") || "{}"));
        };

        window.addEventListener("storage", handleUpdate);
        window.addEventListener("reseller-user-updated", handleUpdate);

        // Cart Sync
        const updateCartCount = (e: any) => setCartCount(e.detail?.count || 0);
        const initialCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
        setCartCount(Array.isArray(initialCart) ? initialCart.length : 0);
        window.addEventListener("cart-updated", updateCartCount);

        return () => {
            window.removeEventListener("storage", handleUpdate);
            window.removeEventListener("reseller-user-updated", handleUpdate);
            window.removeEventListener("cart-updated", updateCartCount);
        };
    }, [navigate, location.pathname]);

    // Mark tab as seen when visited
    useEffect(() => {
        setSeenTabs(prev => ({ ...prev, [activeTab]: true }));
    }, [activeTab]);

    // Reset seen state when counts change (new activity)
    useEffect(() => {
        setSeenTabs(prev => {
            const next: Record<string, boolean> = {};
            for (const key of Object.keys(prev)) {
                next[key] = key === activeTab; // Only current tab stays seen
            }
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [counts]);


    const isEnterprise = resellerUser?.reseller_type === "infrastructure";
    const isSingleProduct = resellerUser?.reseller_type === "single_product";
    const isDirectBuy = resellerUser?.reseller_type === "api_only" || resellerUser?.reseller_type === "single_product";
    const tabs = isEnterprise ? ENTERPRISE_TABS : isSingleProduct ? SINGLE_PRODUCT_TABS : API_ONLY_TABS;

    const DEVELOPER_SUBTABS = useMemo(() => [
        { id: "api-docs", label: "Protocol Documentation", icon: BookOpen },
        ...(!isEnterprise ? [{ id: "webhook-config", label: "Webhooks", icon: Webhook }] : []),
    ], [isEnterprise]);

    const handleDirectBuy = async (productId: string | number, quantity: number, metadata: any) => {
        const { createResellerOrder } = await import("../../services/resellerApi");
        try {
            toast.loading("Provisioning order...", { id: "direct-buy" });
            await createResellerOrder({ product_id: productId, quantity, metadata });
            toast.success("Order provisioned successfully! Check your orders tab.", { id: "direct-buy" });
            // Let the state settle before redirecting
            setTimeout(() => {
                navigate("/reseller/orders");
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || error.message || "Failed to provision order", { id: "direct-buy", duration: 5000 });
            throw error;
        }
    };

    const handleTab = (id: string) => {
        if (id === "logout") {
            localStorage.removeItem("resellerToken");
            localStorage.removeItem("resellerUser");
            navigate("/reseller/login");
            return;
        }

        if (id === "developer") {
            navigate("/reseller/documentation");
            return;
        }

        navigate(`/reseller/${id}`);
    };

    const renderContent = () => {
        // Developer sub-tabs
        if (activeTab === "developer") {
            switch (devSubTab) {
                case "webhook-config": return <ResWebhookConfig />;
                case "api-docs":
                default: return <ResApiDocs />;
            }
        }

        switch (activeTab) {
            case "overview": return <ResOverview />;
            case "store": return <ResStore onSelectCategory={(cat) => setActiveTab(cat)} resellerType={resellerUser?.reseller_type} allowedCategoryName={resellerUser?.allowed_product_category_name} />;
            case "management": return <ResManagement onNavigate={(tab) => setActiveTab(tab)} />;
            case "orders": return <ResOrders />;
            case "wallet": return <ResWallet />;
            case "earnings": return <ResWallet />;
            case "users": return <ResUserManagement />;
            case "support": return <SupportChat role="Reseller" />;
            case "tickets": return <Tickets role="Reseller" />;
            case "settings": return <ResSettings />;
            case "checkout": return (
                <ResellerCheckout
                    onSuccess={() => setActiveTab("orders")}
                    onCancel={() => setActiveTab("store")}
                />
            );



            // Category Store Views — reuse full user dashboard buy pages
            case "buy-proxies": return <BuyProxies isDirectBuy={isDirectBuy} onDirectBuy={handleDirectBuy} />;

            // VPS: two-step flow (country selection → plans)
            case "buy-vps": return <VPSTypes onNavigate={(code) => { setSelectedCountry(code); setActiveTab("buy-vps-plans"); }} />;
            case "buy-vps-plans": return <VPSPlans country={selectedCountry} onBack={() => setActiveTab("buy-vps")} isDirectBuy={isDirectBuy} onDirectBuy={handleDirectBuy} />;

            // RDP: two-step flow (country selection → plans)
            case "buy-rdp": return <RDPTypes onNavigate={(code) => { setSelectedCountry(code); setActiveTab("buy-rdp-plans"); }} />;
            case "buy-rdp-plans": return <RDPPlans country={selectedCountry} onBack={() => setActiveTab("buy-rdp")} isDirectBuy={isDirectBuy} onDirectBuy={handleDirectBuy} />;

            // eSIM: three paths (type selection → global packages OR usa plans)
            case "buy-esim": return <ESIMTypes onNavigateUSA={() => setActiveTab("buy-usa-esim")} onNavigateGlobal={() => setActiveTab("buy-global-esim")} />;
            case "buy-global-esim": return <ESIMPackages onBack={() => setActiveTab("buy-esim")} isDirectBuy={isDirectBuy} onDirectBuy={handleDirectBuy} />;
            case "buy-usa-esim": return <USAESIMPlans onBack={() => setActiveTab("buy-esim")} isDirectBuy={isDirectBuy} onDirectBuy={handleDirectBuy} />;

            case "buy-vpn": return <VPNPlans isDirectBuy={isDirectBuy} onDirectBuy={handleDirectBuy} />;

            // Management Module Views (from ResManagement)
            case "proxy-management": return <ResProxyManagement />;
            case "vps-management": return <ResVPSManagement />;
            case "rdp-management": return <ResRDPManagement />;
            case "esim-management": return <ResESIMManagement />;

            default: return <ResOverview />;
        }
    };

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            <AdminSidebar
                items={tabs.map(t => {
                    const newItem: any = { ...t, name: t.label };
                    // Map counts per tab
                    const tabCount = (() => {
                        switch (t.id) {
                            case "orders": return counts.orders || 0;
                            case "users": return counts.users || 0;
                            case "tickets": return counts.tickets || 0;
                            case "support": return counts.support_chats || 0;
                            default: return 0;
                        }
                    })();
                    if (t.id === "cart") newItem.count = cartCount;
                    if (tabCount > 0) {
                        newItem.count = tabCount;
                        // Red dot only for unseen tabs
                        if (!seenTabs[t.id]) newItem.badge = "!";
                    }
                    if (t.id === "earnings" && counts.withdrawable_profit > 0) newItem.badge = `$${counts.withdrawable_profit.toFixed(0)}`;
                    return newItem;
                })}
                activeTab={activeTab}
                onTabChange={handleTab}
                title={isEnterprise ? "Enterprise" : isSingleProduct ? "Product Reseller" : "API Reseller"}
                userName={resellerUser?.company_name || resellerUser?.username || "Reseller"}
                userRole={isEnterprise ? "Infrastructure Partner" : isSingleProduct ? "Single Product Partner" : "API Partner"}
                profilePictureUrl={formatImageUrl(resellerUser?.profile_picture_url)}
            />


            <main className="flex-1 overflow-y-auto">
                {/* Developer Sub-tabs */}
                {activeTab === "developer" && (
                    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-8 pt-4">
                        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                            {DEVELOPER_SUBTABS.map(st => (
                                <button
                                    key={st.id}
                                    onClick={() => navigate(st.id === 'api-docs' ? '/reseller/documentation' : '/reseller/webhooks')}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${devSubTab === st.id
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <st.icon className="w-3.5 h-3.5" />
                                    {st.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-8">
                    <Suspense fallback={<TabLoader />}>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
