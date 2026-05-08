import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { 
    ComputerDesktopIcon, 
    ServerIcon, 
    DevicePhoneMobileIcon, 
    GlobeAltIcon, 
    ShieldCheckIcon,
    ArrowLeftIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load the sub-components
const AdminRDPManagement = lazy(() => import("./AdminRDPManagement"));
const AdminVPSManagement = lazy(() => import("./AdminVPSManagement"));
const AdminESIMManagement = lazy(() => import("./AdminESIMManagement"));
const AdminProxyManagement = lazy(() => import("./AdminProxyManagement"));
const AdminVPNManagement = lazy(() => import("./AdminVPNManagement"));

const PRODUCTS = [
    { 
        id: "rdp", 
        name: "RDP Management", 
        desc: "Manage Windows Remote Desktop instances", 
        icon: ComputerDesktopIcon, 
        component: AdminRDPManagement,
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    },
    { 
        id: "vps", 
        name: "VPS Management", 
        desc: "Manage Virtual Private Servers", 
        icon: ServerIcon, 
        component: AdminVPSManagement,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    { 
        id: "esim", 
        name: "eSIM Management", 
        desc: "Global travel eSIM profiles", 
        icon: DevicePhoneMobileIcon, 
        component: AdminESIMManagement,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    { 
        id: "proxy", 
        name: "Proxy Management", 
        desc: "Residential & Static proxy instances", 
        icon: GlobeAltIcon, 
        component: AdminProxyManagement,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
    { 
        id: "vpn", 
        name: "VPN Management", 
        desc: "Secure VPN subscriptions", 
        icon: ShieldCheckIcon, 
        component: AdminVPNManagement,
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
];

export default function ManagementTab() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    // Deep link support: ?type=rdp or similar
    useEffect(() => {
        const type = searchParams.get("type");
        if (type && PRODUCTS.find(p => p.id === type)) {
            setSelectedProduct(type);
        }
    }, [searchParams]);

    const activeProduct = PRODUCTS.find(p => p.id === selectedProduct);
    const ActiveComponent = activeProduct?.component;

    const handleBack = () => {
        setSelectedProduct(null);
        // Clear type param but keep others (like search)
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("type");
        setSearchParams(newParams);
    };

    const handleSelect = (id: string) => {
        setSelectedProduct(id);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("type", id);
        setSearchParams(newParams);
    };

    return (
        <div className="min-h-[60vh]">
            <AnimatePresence mode="wait">
                {!selectedProduct ? (
                    <motion.div 
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
                            <p className="text-muted-foreground mt-2">Select a product category to manage its instances across the platform.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PRODUCTS.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelect(product.id)}
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
                ) : (
                    <motion.div 
                        key="management"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={handleBack}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Back to categories"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{activeProduct?.name}</h1>
                                <p className="text-sm text-muted-foreground">Managing all platform {activeProduct?.id.toUpperCase()} instances</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Suspense fallback={<div className="p-12 text-center animate-pulse text-muted-foreground">Loading management interface...</div>}>
                                {ActiveComponent && <ActiveComponent />}
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
