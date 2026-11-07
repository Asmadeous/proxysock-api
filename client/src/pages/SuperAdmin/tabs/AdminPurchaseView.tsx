import React, { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import Button from "../components/Button";

import ResStore from "../../Reseller/components/ResStore";
import BuyProxies from "../../UserDashboard/BuyProxies";
import VPSTypes from "../../products/VPSTypes";
import VPSPlans from "../../products/VPSPlans";
import RDPTypes from "../../products/RDPTypes";
import RDPPlans from "../../products/RDPPlans";
import ESIMTypes from "../../products/ESIMTypes";
import ESIMPackages from "../../products/EsimPackages";
import USAESIMPlans from "../../products/USAESIMPlansPage";
import PhoneESIMCountries from "../../products/PhoneESIMCountries";
import VPNPlans from "../../products/VPNPlans";

import { useAdminPurchaseProduct } from "../queries/products.queries";

interface AdminPurchaseViewProps {
    onBack?: () => void;
    // Opened from Management for one category, e.g. "buy-vps": start there and stay there.
    initialTab?: string;
}

export default function AdminPurchaseView({ onBack, initialTab }: AdminPurchaseViewProps) {
    const home = initialTab ?? "store";
    const [activeTab, setActiveTab] = useState(home);
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
        setTimeout(() => setActiveTab(home), 1500);
    };

    const withBack = (content: React.ReactNode) => activeTab === home ? <>{content}</> : (
        <div className="space-y-4">
            <button type="button" onClick={() => setActiveTab(home)} className="proxy-back" style={{ marginBottom: 0 }}>
                <ArrowLeft size={14} aria-hidden="true" />
                {home === "store" ? "Back to store" : "Back"}
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
            case "buy-esim": return withBack(<ESIMTypes onNavigateUSA={() => setActiveTab("buy-phone-esim")} onNavigateGlobal={() => setActiveTab("buy-global-esim")} />);
            case "buy-global-esim": return <ESIMPackages onBack={() => setActiveTab("buy-esim")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-phone-esim": return <PhoneESIMCountries onBack={() => setActiveTab("buy-esim")} onSelect={(country) => setActiveTab(country === "GB" ? "buy-uk-esim" : "buy-usa-esim")} />;
            case "buy-usa-esim": return <USAESIMPlans country="US" onBack={() => setActiveTab("buy-phone-esim")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-uk-esim": return <USAESIMPlans country="GB" onBack={() => setActiveTab("buy-phone-esim")} isDirectBuy={true} onDirectBuy={handleDirectBuy} />;
            case "buy-vpn": return withBack(<VPNPlans isDirectBuy={true} onDirectBuy={handleDirectBuy} />);
            default: return <ResStore onSelectCategory={(cat) => setActiveTab(cat)} resellerType="infrastructure" />;
        }
    };

    return (
        <div className="ws-stack">
            <section className="ws-panel flex flex-wrap items-end justify-between gap-4" aria-label="Provisioning target">
                <div className="ws-field min-w-[260px] flex-1" style={{ maxWidth: 420 }}>
                    <label htmlFor="provision-email">Customer email</label>
                    <div className="ws-search" style={{ maxWidth: "none" }}>
                        <Mail aria-hidden="true" />
                        <input id="provision-email" type="email" placeholder="customer@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                    </div>
                    <p className="ws-field-hint">The order is created and provisioned on this customer's account. No payment is taken.</p>
                </div>
                {onBack && <Button variant="secondary" onClick={onBack}><ArrowLeft /> Back to products</Button>}
            </section>

            {renderContent()}
        </div>
    );
}
