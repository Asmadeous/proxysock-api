import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
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
    DollarSign
} from "lucide-react";
import AdminSidebar from "../SuperAdmin/components/AdminSidebar";

// Directly imported components for core tabs
import ResOverview from "./components/ResOverview";
import ResOrders from "./components/ResOrders";
import ResProducts from "./components/ResProducts";
import ResWallet from "./components/ResWallet";

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

// Tab definitions per reseller tier
const API_ONLY_TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "store", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ListTodo },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "developer", label: "Developer", icon: Code },
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
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "logout", label: "Logout", icon: LogOut },
];

const DEVELOPER_SUBTABS = [
    { id: "api-docs", label: "API Docs", icon: BookOpen },
    { id: "webhook-config", label: "Webhooks", icon: Webhook },
];

const TabLoader = () => (
    <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
    </div>
);

export default function ResellerDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [devSubTab, setDevSubTab] = useState<string | null>(null);
    const navigate = useNavigate();

    // Read reseller data from localStorage (NOT from AuthContext which is for regular users)
    const resellerUser = JSON.parse(localStorage.getItem("resellerUser") || "{}");

    useEffect(() => {
        if (!localStorage.getItem("resellerToken")) {
            navigate("/reseller/login");
        }
    }, [navigate]);

    const isEnterprise = resellerUser?.reseller_type === "infrastructure";
    const tabs = isEnterprise ? ENTERPRISE_TABS : API_ONLY_TABS;

    const handleTab = (id: string) => {
        if (id === "logout") {
            localStorage.removeItem("resellerToken");
            localStorage.removeItem("resellerUser");
            navigate("/reseller/login");
            return;
        }
        // If clicking developer and already on a developer sub-tab, toggle to api-docs
        if (id === "developer") {
            setActiveTab("developer");
            setDevSubTab("api-docs");
            return;
        }
        setDevSubTab(null);
        setActiveTab(id);
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
            case "store": return <ResStore onSelectCategory={(cat) => setActiveTab(cat)} />;
            case "management": return <ResManagement onNavigate={(tab) => setActiveTab(tab)} />;
            case "orders": return <ResOrders />;
            case "wallet": return <ResWallet />;
            case "earnings": return <ResWallet />;
            case "users": return <ResUserManagement />;
            case "settings": return <ResSettings />;

            // Category Store Views (from ResStore)
            case "buy-proxies": return <ResProducts type="proxy" />;
            case "buy-vps": return <ResProducts type="vps" />;
            case "buy-rdp": return <ResProducts type="rdp" />;
            case "buy-esim": return <ResProducts type="esim" />;
            case "buy-vpn": return <ResProducts type="vpn" />;

            // Management Module Views (from ResManagement)
            case "proxy-management": return <ResProxyManagement />;
            case "vps-management": return <ResVPSManagement />;
            case "rdp-management": return <ResRDPManagement />;
            case "esim-management": return <ResESIMManagement />;

            default: return <ResOverview />;
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            <AdminSidebar
                items={tabs.map(t => ({ ...t, name: t.label }))}
                activeTab={activeTab}
                onTabChange={handleTab}
                title={isEnterprise ? "Enterprise" : "API Reseller"}
                userName={resellerUser?.company_name || resellerUser?.username || "Reseller"}
                userRole={isEnterprise ? "Infrastructure Partner" : "API Partner"}
            />

            <main className="flex-1 overflow-y-auto">
                {/* Developer Sub-tabs */}
                {activeTab === "developer" && (
                    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-8 pt-4">
                        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                            {DEVELOPER_SUBTABS.map(st => (
                                <button
                                    key={st.id}
                                    onClick={() => setDevSubTab(st.id)}
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
