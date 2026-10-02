import { useEffect, useState } from "react";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon, GlobeAltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchResellerOrders } from "@/services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import { Skeleton } from "@/components/ui/skeleton";

interface VPNOrder {
    id: string;
    order_number: string;
    product_name: string;
    status: string;
    country?: string;
    expires_at?: string;
    credentials?: { server?: string; protocol?: string; username?: string; password?: string };
}

const CLOSED = ["expired", "cancelled", "refunded", "failed"];

// The reseller's VPN subscriptions with their login, from the order list.
export default function ResVPNManagement() {
    const [orders, setOrders] = useState<VPNOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

    const load = async () => {
        try {
            setLoading(true);
            const response = await fetchResellerOrders({ product_type: "vpn" });
            setOrders(response.data.orders || []);
        } catch (error) {
            toast.error(getApiError(error, "Failed to load VPN orders"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const row = (label: string, value: React.ReactNode) => (
        <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate">{value}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">VPN Management</h1>
                    <p className="text-muted-foreground mt-1">Your VPN subscriptions and their logins.</p>
                </div>
                <button onClick={load} aria-label="Refresh" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                    <ShieldCheckIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No VPN orders yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((vpn) => {
                        const closed = CLOSED.includes(vpn.status);
                        const creds = vpn.credentials || {};
                        return (
                            <div key={vpn.id} className="bg-card rounded-xl border p-6 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><ShieldCheckIcon className="w-6 h-6" /></div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold truncate">{vpn.product_name}</h3>
                                            <p className="text-xs text-muted-foreground">{vpn.order_number}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${vpn.status === "active" ? "bg-green-500/10 text-green-500" : "bg-secondary text-secondary-foreground"}`}>{vpn.status}</span>
                                </div>

                                {closed ? (
                                    <p className="text-sm text-muted-foreground">This subscription is {vpn.status}; its login no longer works.</p>
                                ) : creds.username ? (
                                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                                        {row("Server:", creds.server || "Use the .ovpn file")}
                                        {creds.protocol && row("Protocol:", creds.protocol)}
                                        {row("Username:", creds.username)}
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-muted-foreground">Password:</span>
                                            <span className="truncate">{showPassword[vpn.id] ? creds.password : "••••••••"}</span>
                                            <button
                                                onClick={() => setShowPassword(p => ({ ...p, [vpn.id]: !p[vpn.id] }))}
                                                aria-label={showPassword[vpn.id] ? "Hide password" : "Show password"}
                                            >
                                                {showPassword[vpn.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Provisioning credentials…</p>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><GlobeAltIcon className="w-3.5 h-3.5" />{vpn.country || "Global"}</span>
                                    <span>Expires: {vpn.expires_at ? new Date(vpn.expires_at).toLocaleDateString() : "N/A"}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
