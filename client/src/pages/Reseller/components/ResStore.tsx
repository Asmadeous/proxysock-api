import { motion } from "framer-motion";
import {
    GlobeAltIcon,
    CpuChipIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    ShieldCheckIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ResStoreProps {
    onSelectCategory: (category: string) => void;
    resellerType?: string;
    allowedCategoryName?: string;
}

const ALL_CATEGORIES = [
    {
        id: "proxy",
        name: "Proxies",
        description: "Datacenter, Residential, and Mobile proxies",
        icon: GlobeAltIcon,
        color: "blue",
        tabId: "buy-proxies",
        categoryName: "proxies"
    },
    {
        id: "vps",
        name: "Cloud VPS",
        description: "High-performance virtual private servers",
        icon: CpuChipIcon,
        color: "purple",
        tabId: "buy-vps",
        categoryName: "vms"
    },
    {
        id: "rdp",
        name: "Remote Desktop (RDP)",
        description: "Windows instances with full admin access",
        icon: ComputerDesktopIcon,
        color: "orange",
        tabId: "buy-rdp",
        categoryName: "vms"
    },
    {
        id: "esim",
        name: "Global eSIM",
        description: "Travel data plans for 190+ countries",
        icon: DevicePhoneMobileIcon,
        color: "green",
        tabId: "buy-esim",
        categoryName: "esims"
    },
    {
        id: "vpn",
        name: "Premium VPN",
        description: "Secure and private internet access",
        icon: ShieldCheckIcon,
        color: "red",
        tabId: "buy-vpn",
        categoryName: "vpn"
    }
];

const COLOR_MAP: Record<string, { bg: string; bgHover: string; text: string }> = {
    blue:   { bg: "bg-blue-500/10",   bgHover: "group-hover:bg-blue-500/20",   text: "text-blue-500" },
    purple: { bg: "bg-purple-500/10", bgHover: "group-hover:bg-purple-500/20", text: "text-purple-500" },
    orange: { bg: "bg-orange-500/10", bgHover: "group-hover:bg-orange-500/20", text: "text-orange-500" },
    green:  { bg: "bg-green-500/10",  bgHover: "group-hover:bg-green-500/20",  text: "text-green-500" },
    red:    { bg: "bg-red-500/10",    bgHover: "group-hover:bg-red-500/20",    text: "text-red-500" },
};

// Map allowed_product_category_name to the store category IDs
const CATEGORY_NAME_MAP: Record<string, string[]> = {
    "proxies": ["proxy"],
    "vpn": ["vpn"],
    "esims": ["esim"],
    "vms": ["vps", "rdp"],
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    {isSingleProduct ? "Your Products" : "Service Store"}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {isSingleProduct
                        ? "Browse and configure your assigned product category."
                        : "Select a category to browse and configure our premium services."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                    <motion.div
                        key={cat.id}
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Card
                            className="cursor-pointer shadow-sm hover:shadow-md dark:hover:shadow-xl transition-all border-border hover:border-primary/50 group"
                            onClick={() => onSelectCategory(cat.tabId)}
                        >

                            <CardHeader>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${COLOR_MAP[cat.color]?.bg ?? "bg-muted"}`}>
                                    <cat.icon className={`w-6 h-6 ${COLOR_MAP[cat.color]?.text ?? "text-muted-foreground"}`} />
                                </div>
                                <CardTitle className="text-xl">{cat.name}</CardTitle>
                                <CardDescription>{cat.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                                    Browse Plans
                                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {isSingleProduct && categories.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg">No product category has been assigned to your account yet.</p>
                    <p className="text-muted-foreground text-sm mt-2">Contact your administrator to configure your allowed product category.</p>
                </div>
            )}
        </div>
    );
}
