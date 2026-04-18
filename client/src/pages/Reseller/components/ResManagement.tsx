import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Server,
    Monitor,
    Smartphone,
    ShoppingCart,
    ArrowRight,
    CheckCircle,
    XCircle,
    BarChart3,
    Lock,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchResellerOrderStats } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import { toast } from "react-hot-toast";

interface ProductStats {
    vps: { total: number; active: number; expired: number; pending: number; failed: number };
    rdp: { total: number; active: number; expired: number; pending: number; failed: number };
    esim: { total: number; active: number; expired: number; pending: number };
    proxy: { total: number; active: number; expired: number; pending: number };
    vpn: { total: number; active: number; expired: number; pending: number };
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    blue:   { bg: "bg-blue-500/10",   text: "text-blue-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
    green:  { bg: "bg-green-500/10",  text: "text-green-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
    red:    { bg: "bg-red-500/10",    text: "text-red-500" },
};

interface ResManagementProps {
    onNavigate: (tab: string) => void;
}

export default function ResManagement({ onNavigate }: ResManagementProps) {
    const [stats, setStats] = useState<ProductStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetchResellerOrderStats();
            const ts = response.data.type_stats || {};

            setStats({
                vps: ts.vps || { total: 0, active: 0, expired: 0, pending: 0, failed: 0 },
                rdp: ts.rdp || { total: 0, active: 0, expired: 0, pending: 0, failed: 0 },
                esim: {
                    total: (ts.esim?.total || 0) + (ts.usa_esim?.total || 0),
                    active: (ts.esim?.active || 0) + (ts.usa_esim?.active || 0),
                    expired: (ts.esim?.expired || 0) + (ts.usa_esim?.expired || 0),
                    pending: (ts.esim?.pending || 0) + (ts.usa_esim?.pending || 0),
                },
                proxy: ts.proxy || { total: 0, active: 0, expired: 0, pending: 0 },
                vpn: ts.vpn || { total: 0, active: 0, expired: 0, pending: 0 },
            });
        } catch (error) {
            toast.error(getApiError(error, "Failed to load service stats"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const productCards = [
        {
            title: "VPS Hosting",
            description: "Cloud servers and virtual instances",
            icon: Server,
            color: "blue",
            tab: "vps-management",
            stats: stats?.vps,
            labels: { primary: "Running", secondary: "Stopped", tertiary: "Creating" }
        },
        {
            title: "RDP Access",
            description: "Windows remote desktop instances",
            icon: Monitor,
            color: "purple",
            tab: "rdp-management",
            stats: stats?.rdp,
            labels: { primary: "Running", secondary: "Stopped", tertiary: "Creating" }
        },
        {
            title: "eSIMs",
            description: "Global travel data packages",
            icon: Smartphone,
            color: "green",
            tab: "esim-management",
            stats: stats?.esim,
            labels: { primary: "Active", secondary: "Expired", tertiary: "Pending" }
        },
        {
            title: "Proxies",
            description: "Residential and Datacenter proxies",
            icon: ShoppingCart,
            color: "orange",
            tab: "proxy-management",
            stats: stats?.proxy,
            labels: { primary: "Active", secondary: "Expired", tertiary: "Pending" }
        },
        {
            title: "VPN",
            description: "Secure private network access",
            icon: Lock,
            color: "red",
            tab: "vpn-management",
            stats: stats?.vpn,
            labels: { primary: "Active", secondary: "Expired", tertiary: "Pending" }
        },
    ];

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Service Management</h1>
                    <p className="text-muted-foreground mt-1">Monitor and control your active reseller services.</p>
                </div>
                <Button onClick={fetchStats} variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productCards.map((product) => (
                    <motion.div
                        key={product.title}
                        whileHover={{ y: -5 }}
                        className="group"
                        onClick={() => onNavigate(product.tab)}
                    >
                        <Card className="cursor-pointer border-border hover:border-primary/50 transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-3 rounded-lg ${COLOR_MAP[product.color]?.bg ?? "bg-muted"}`}>
                                        <product.icon className={`h-6 w-6 ${COLOR_MAP[product.color]?.text ?? "text-muted-foreground"}`} />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <CardTitle className="text-xl">{product.title}</CardTitle>
                                <CardDescription>{product.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Services</p>
                                        <p className="text-3xl font-bold">{product.stats?.total || 0}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t">
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            {product.labels.primary}
                                        </span>
                                        <Badge variant="secondary">{product.stats?.active || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-destructive" />
                                            {product.labels.secondary}
                                        </span>
                                        <Badge variant="destructive">{product.stats?.expired || 0}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
