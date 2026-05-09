import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import {
    ShoppingCart,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    MapPin,
    Lock,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VPNOrder {
    id: string;
    order_number: string;
    proxy_plan_id: number;
    plan_name: string;
    amount: number;
    status: "active" | "expired" | "pending" | "cancelled" | "completed" | "processing";
    created_at: string;
    expires_at?: string;
    country?: string;
    credentials: {
        username?: string;
        password?: string;
        endpoints?: string[];
        [key: string]: any;
    };
    traffic_used?: number;
    traffic_limit?: number;
    auto_renew?: boolean;
    renewal_method?: string;
}

interface VPNCardProps {
    order: VPNOrder;
    onOpenDetails: (order: VPNOrder) => void;
    onOpenSubscription: (order: VPNOrder) => void;
    onReorder: (orderId: string) => void;
}

const VPNCard = ({ order, onOpenDetails, onOpenSubscription, onReorder }: VPNCardProps) => {
    const { ref } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    // In the future, we could fetch live usage stats here when inView
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
            case "completed":
                return <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-0"><CheckCircle className="h-3 w-3" /> Active</Badge>;
            case "pending":
            case "processing":
                return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
            case "expired":
                return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Expired</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Lock className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{order.plan_name}</CardTitle>
                                <p className="text-xs text-muted-foreground">ID: {order.order_number}</p>
                            </div>
                        </div>
                        {getStatusBadge(order.status)}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Expires
                            </span>
                            <p className="font-medium">
                                {order.expires_at ? formatDate(order.expires_at) : "N/A"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Location
                            </span>
                            <p className="font-medium">{order.country || "Global"}</p>
                        </div>
                    </div>

                    {/* Credentials Preview */}
                    <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-medium">Authentication</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => onOpenDetails(order)}
                            >
                                View Details
                            </Button>
                        </div>
                        {order.credentials?.username ? (
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">Username</span>
                                    <span className="font-mono text-xs">{order.credentials.username}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">Password</span>
                                    <span className="font-mono text-xs">********</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic text-center">
                                No credentials available
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 gap-2"
                                onClick={() => onOpenDetails(order)}
                            >
                                <Eye className="h-4 w-4" /> Manage
                            </Button>
                            {order.status === "active" && (
                                <Button
                                    variant="secondary"
                                    className="flex-1 gap-2"
                                    onClick={() => onOpenSubscription(order)}
                                >
                                    <Clock className="h-4 w-4" /> Auto-Renew
                                </Button>
                            )}
                        </div>
                        {order.status === "expired" && (
                            <Button
                                className="w-full gap-2"
                                variant="outline"
                                onClick={() => onReorder(order.id)}
                            >
                                <ShoppingCart className="h-4 w-4" /> Reorder
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default VPNCard;
