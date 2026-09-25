import React, { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";

import ResStore from "../../Reseller/components/ResStore";
import BuyProxies from "../../UserDashboard/BuyProxies";
import VPSTypes from "../../products/VPSTypes";
import VPSPlans from "../../products/VPSPlans";
import RDPTypes from "../../products/RDPTypes";
import RDPPlans from "../../products/RDPPlans";
import ESIMTypes from "../../products/ESIMTypes";
import ESIMPackages from "../../products/EsimPackages";
import USAESIMPlans from "../../products/USAESIMPlansPage";
import VPNPlans from "../../products/VPNPlans";

import { useAdminPurchaseProduct } from "../queries/products.queries";

interface AdminPurchaseViewProps {
    onBack: () => void;
}

export default function AdminPurchaseView({ onBack }: AdminPurchaseViewProps) {
    const [activeTab, setActiveTab] = useState("store");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");

    const adminPurchase = useAdminPurchaseProduct();

    const handleDirectBuy = async (productId: string | number, quantity: number, metadata: any) => {
        if (!customerEmail.trim()) {
            toast.error("Please enter a target customer email at the top of the page first.");
            throw new Error("Missing email");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            toast.error("Please enter a valid email address");
            throw new Error("Invalid email");
        }

        await adminPurchase.mutateAsync({
            product_id: String(productId), // product IDs are UUIDs
            customer_email: customerEmail,
            quantity: quantity,
            metadata: metadata,
        });
        
        toast.success("Order provisioned successfully!");
        setTimeout(() => setActiveTab("store"), 1500);
    };

    const withBack = (content: React.ReactNode) => (
        <div className="space-y-4">
            <button
                onClick={() => setActiveTab("store")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Store
            </button>
            {content}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "store": return <ResStore onSelectCategory={(cat) => setActiveTab(cat)} resellerType="infrastructure" />;
            case "buy-proxies": return withBack(<BuyProxies isDirectBuy={true} onDirectBuy={handleDirectBuy} />);
            case "buy-vps": return withBack(<VPSTypes onNavigate={(code) => { setSelectedCountry(code); setActiveTab("buy-vps-plans"); }} />);
            case "buy-vps-plans": return <VPSPlans country={selectedCountry} onBack={() => setActiveTab("buy-vps")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-rdp": return withBack(<RDPTypes onNavigate={(code) => { setSelectedCountry(code); setActiveTab("buy-rdp-plans"); }} />);
            case "buy-rdp-plans": return <RDPPlans country={selectedCountry} onBack={() => setActiveTab("buy-rdp")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-esim": return withBack(<ESIMTypes onNavigateUSA={() => setActiveTab("buy-usa-esim")} onNavigateGlobal={() => setActiveTab("buy-global-esim")} />);
            case "buy-global-esim": return <ESIMPackages onBack={() => setActiveTab("buy-esim")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-usa-esim": return <USAESIMPlans onBack={() => setActiveTab("buy-esim")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-vpn": return withBack(<VPNPlans isDirectBuy={true} onDirectBuy={handleDirectBuy} />);
            default: return <ResStore onSelectCategory={(cat) => setActiveTab(cat)} resellerType="infrastructure" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" /> Back to Products
                </button>
                <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-500">
                        <AlertCircle className="w-5 h-5 hidden sm:block" />
                        <span className="text-xs font-bold uppercase tracking-wider">Admin Provisioning</span>
                    </div>
                    <div className="h-6 w-px bg-blue-500/20" />
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <input
                            type="email"
                            placeholder="Target Customer Email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium outline-none placeholder:text-blue-500/50 text-blue-700 min-w-[250px]"
                        />
                    </div>
                </div>
            </div>

            {renderContent()}
        </div>
    );
}
