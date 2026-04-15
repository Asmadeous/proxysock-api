"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShoppingCart,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Copy,
    Key,
    MapPin,
    Calendar,
    Download,
    Shield,
    Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import api from "../../services/api";
import ManageSubscriptionModal from "@/components/dashboard/ManageSubscriptionModal";
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

export default function VPNManagement() {
    const [activeTab, setActiveTab] = useState<"active" | "all">("active");
    const [vpnOrders, setVpnOrders] = useState<VPNOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<VPNOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const { user, accessToken } = useAuth();

    useEffect(() => {
        if (accessToken && user) {
            fetchVPNData();
        }
    }, [accessToken, user, activeTab]);

    const fetchVPNData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/web/api/orders?product_type=vpn');

            if (response.data && response.data.orders) {
                const transformedOrders = response.data.orders
                    .filter((order: any) => order.product_type === 'vpn')
                    .map((order: any) => ({
                        id: String(order.id),
                        order_number: order.order_number,
                        proxy_plan_id: order.product_id,
                        plan_name: order.product_name || "VPN Plan",
                        amount: Number(order.amount) || 0,
                        status: (order.status === "completed" || order.status === "active") ? "active" : order.status,
                        created_at: order.created_at,
                        expires_at: order.expires_at,
                        country: order.country,
                        credentials: order.credentials || {},
                        traffic_used: order.vpn_details?.traffic_used || 0,
                        traffic_limit: Number(order.bandwidth_gb) || 0,
                        auto_renew: order.auto_renew,
                        renewal_method: order.renewal_method,
                    }));

                // Filter based on active tab
                const filtered = activeTab === "active"
                    ? transformedOrders.filter((o: VPNOrder) => o.status === "active" || o.status === "pending" || o.status === "processing")
                    : transformedOrders;

                setVpnOrders(filtered);
            }
        } catch (error) {
            console.error("Failed to fetch VPN data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = async (orderId: string) => {
        try {
            setLoading(true);
            const { data: _data } = await api.post(`/web/api/orders/${orderId}/reorder`);
            alert("Reorder successful! A new order has been created.");
            fetchVPNData(); // Refresh data
        } catch (error: any) {
            console.error("Failed to reorder:", error);
            const errorMsg = error.response?.data?.error || "Failed to reorder";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

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

    const copyToClipboard = (text: string | undefined) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
        alert("Copied to clipboard!");
    };

    const openDetails = (order: VPNOrder) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const renderVPNCard = (order: VPNOrder) => (
        <motion.div
            key={order.id}
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
                                onClick={() => openDetails(order)}
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
                                    onClick={() => openDetails(order)}
                                >
                                    <Eye className="h-4 w-4" /> Manage
                                </Button>
                                {order.status === "active" && (
                                    <Button
                                        variant="secondary"
                                        className="flex-1 gap-2"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setIsSubscriptionOpen(true);
                                        }}
                                    >
                                        <Clock className="h-4 w-4" /> Auto-Renew
                                    </Button>
                                )}
                            </div>
                            {order.status === "expired" && (
                                <Button
                                    className="w-full gap-2"
                                    variant="outline"
                                    onClick={() => handleReorder(order.id)}
                                >
                                    <ShoppingCart className="h-4 w-4" /> Reorder
                                </Button>
                            )}
                        </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg"></div>
                        <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2"></div>
                    </div>
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card border rounded-lg p-4">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2"></div>
                            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        </div>
                    ))}
                </div>

                {/* Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card border rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-muted animate-pulse rounded-lg"></div>
                                    <div>
                                        <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2"></div>
                                        <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="flex justify-between">
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 w-full bg-muted animate-pulse rounded-lg mt-4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">VPN Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your active VPN subscriptions
                    </p>
                </div>
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                    <Button
                        variant={activeTab === "active" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("active")}
                        className="gap-2"
                    >
                        Active Services
                    </Button>
                    <Button
                        variant={activeTab === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("all")}
                        className="gap-2"
                    >
                        History
                    </Button>
                </div>
            </div>

            {vpnOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vpnOrders.map(renderVPNCard)}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <CardContent>
                        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No VPN Services Found</h3>
                        <p className="text-muted-foreground mb-6">
                            You don't have any {activeTab === "active" ? "active" : ""} VPN subscriptions.
                        </p>
                        <Button
                            onClick={() => globalThis.location.href = '/dashboard/vpn'}
                            className="gap-2"
                        >
                            <ShoppingCart className="h-4 w-4" /> Purchase VPN
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>VPN Details</DialogTitle>
                        <DialogDescription>
                            Connection information
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <div>{getStatusBadge(selectedOrder.status)}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Expires</span>
                                    <p className="font-medium">{selectedOrder.expires_at ? formatDate(selectedOrder.expires_at) : 'Never'}</p>
                                </div>
                            </div>

                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Key className="h-4 w-4" /> Credentials
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedOrder.credentials?.username && (
                                        <div className="grid gap-4">
                                            <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Username</p>
                                                    <p className="font-mono font-medium">{selectedOrder.credentials.username}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedOrder.credentials.username)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Password</p>
                                                    <p className="font-mono font-medium">{selectedOrder.credentials.password}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedOrder.credentials.password)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {/* Add server list if available */}
                                            {selectedOrder.credentials.endpoints && Array.isArray(selectedOrder.credentials.endpoints) && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-muted-foreground">Endpoints</p>
                                                    <div className="max-h-32 overflow-y-auto space-y-2">
                                                        {selectedOrder.credentials.endpoints.map((endpoint: string) => (
                                                            <div key={endpoint} className="flex items-center justify-between p-2 bg-card rounded border text-xs font-mono">
                                                                <span>{endpoint}</span>
                                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(endpoint)}>
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
                                <Button variant="default" onClick={async () => {
                                    try {
                                        const response = await api.get(`/web/api/orders/${selectedOrder.id}/download_ovpn`, {
                                            responseType: 'blob'
                                        });
                                        const blob = new Blob([response.data], { type: 'application/x-openvpn-profile' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = `vpn-${selectedOrder.order_number}.ovpn`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(url);
                                    } catch (error) {
                                        console.error('Failed to download OVPN:', error);
                                        alert('Failed to download OVPN config. The file may not be available yet.');
                                    }
                                }} className="gap-2">
                                    <Download className="h-4 w-4" /> Download
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <ManageSubscriptionModal
                isOpen={isSubscriptionOpen}
                onClose={() => setIsSubscriptionOpen(false)}
                orderId={selectedOrder?.id || ''}
                autoRenew={!!selectedOrder?.auto_renew}
                renewalMethod={selectedOrder?.renewal_method || 'wallet'}
                expiresAt={selectedOrder?.expires_at || ''}
                onUpdate={fetchVPNData}
                api={api}
            />
        </div>
    );
}
