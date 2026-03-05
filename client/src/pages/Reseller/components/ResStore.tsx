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
}

const CATEGORIES = [
    {
        id: "proxy",
        name: "Proxies",
        description: "Datacenter, Residential, and Mobile proxies",
        icon: GlobeAltIcon,
        color: "blue",
        tabId: "buy-proxies"
    },
    {
        id: "vps",
        name: "Cloud VPS",
        description: "High-performance virtual private servers",
        icon: CpuChipIcon,
        color: "purple",
        tabId: "buy-vps"
    },
    {
        id: "rdp",
        name: "Remote Desktop (RDP)",
        description: "Windows instances with full admin access",
        icon: ComputerDesktopIcon,
        color: "orange",
        tabId: "buy-rdp"
    },
    {
        id: "esim",
        name: "Global eSIM",
        description: "Travel data plans for 190+ countries",
        icon: DevicePhoneMobileIcon,
        color: "green",
        tabId: "buy-esim"
    },
    {
        id: "vpn",
        name: "Premium VPN",
        description: "Secure and private internet access",
        icon: ShieldCheckIcon,
        color: "red",
        tabId: "buy-vpn"
    }
];

export default function ResStore({ onSelectCategory }: ResStoreProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Service Store</h1>
                <p className="text-muted-foreground mt-2">Select a category to browse and configure our premium services.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CATEGORIES.map((cat) => (
                    <motion.div
                        key={cat.id}
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Card
                            className="cursor-pointer hover:shadow-xl transition-all border-border hover:border-primary/50 group overflow-hidden relative"
                            onClick={() => onSelectCategory(cat.tabId)}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${cat.color}-500/10 rounded-full blur-3xl group-hover:bg-${cat.color}-500/20 transition-colors`} />

                            <CardHeader>
                                <div className={`w-12 h-12 rounded-xl bg-${cat.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <cat.icon className={`w-6 h-6 text-${cat.color}-500`} />
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
        </div>
    );
}
