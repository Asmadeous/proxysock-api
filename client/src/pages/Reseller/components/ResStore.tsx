import {
    GlobeAltIcon,
    CpuChipIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { ArrowRight, ShoppingBag } from "lucide-react";
import PageHeader from "../../SuperAdmin/components/PageHeader";

interface ResStoreProps {
    onSelectCategory: (category: string) => void;
    resellerType?: string;
    allowedCategoryName?: string;
}

const ALL_CATEGORIES = [
    { id: "proxy", name: "Proxies", description: "Datacenter, residential and mobile proxies.", icon: GlobeAltIcon, tabId: "buy-proxies" },
    { id: "vps", name: "Cloud VPS", description: "High-performance virtual private servers.", icon: CpuChipIcon, tabId: "buy-vps" },
    { id: "rdp", name: "Remote Desktop (RDP)", description: "Windows instances with full admin access.", icon: ComputerDesktopIcon, tabId: "buy-rdp" },
    { id: "esim", name: "Global eSIM", description: "Travel data plans for 190+ countries.", icon: DevicePhoneMobileIcon, tabId: "buy-esim" },
    { id: "vpn", name: "Premium VPN", description: "Secure and private internet access.", icon: ShieldCheckIcon, tabId: "buy-vpn" },
];

// Map allowed_product_category_name to the store category IDs
// Supports both internal slugs and full database names (case-insensitive)
const CATEGORY_NAME_MAP: Record<string, string[]> = {
    // Internal slugs
    "proxies": ["proxy"],
    "vpn": ["vpn"],
    "esims": ["esim"],
    "vms": ["vps", "rdp"],

    // Full database category names
    "virtual private servers": ["vps"],
    "rdp servers": ["rdp"],
    "datacenter": ["proxy"],
    "isp": ["proxy"],
    "premium isp": ["proxy"],
    "global isp": ["proxy"],
    "static residential": ["proxy"],
    "mobile": ["proxy"],
    "residential rotating": ["proxy"],
    "residential vpn": ["vpn"],
    "global esim": ["esim"],
    "usa esim": ["esim"],
};

export default function ResStore({ onSelectCategory, resellerType, allowedCategoryName }: ResStoreProps) {
    const isSingleProduct = resellerType === "single_product";

    const categories = isSingleProduct && allowedCategoryName
        ? ALL_CATEGORIES.filter(cat => {
            const allowed = CATEGORY_NAME_MAP[allowedCategoryName.toLowerCase()] || [];
            return allowed.includes(cat.id);
        })
        : ALL_CATEGORIES;

    return (
        <div className="ws-stack">
            <PageHeader
                title={isSingleProduct ? "Your products" : "Service store"}
                description={isSingleProduct ? "Browse and configure your assigned product category." : "Pick a category to browse plans and place an order."}
            />

            {categories.length > 0 ? (
                <div className="overview-service-grid">
                    {categories.map((cat) => (
                        <article className="overview-service" key={cat.id}>
                            <div className="overview-service-top"><cat.icon width={21} height={21} strokeWidth={1.5} aria-hidden="true" /></div>
                            <h3>{cat.name}</h3>
                            <p>{cat.description}</p>
                            <button type="button" onClick={() => onSelectCategory(cat.tabId)} aria-label={`Browse ${cat.name} plans`}>Browse plans <ArrowRight size={15} /></button>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="proxy-empty">
                    <ShoppingBag size={25} aria-hidden="true" />
                    <h2>No product category assigned</h2>
                    <p>Contact your administrator to configure your allowed product category.</p>
                </div>
            )}
        </div>
    );
}
