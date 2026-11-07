import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { fetchResellerOrders } from "@/services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import ServiceCard, { ServiceGrid, type ServiceFact } from "../../SuperAdmin/components/ServiceCard";

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

    return (
        <div className="ws-stack">
            <PageHeader
                title="VPN"
                description="Your VPN subscriptions and their logins."
                actions={<button type="button" onClick={load} disabled={loading} aria-label="Refresh" title="Refresh" className="ws-icon-button"><RefreshCw className={loading ? "animate-spin" : ""} /></button>}
            />

            {!loading && orders.length > 0 && (
                <div className="proxy-summary" style={{ marginBottom: 0 }}>
                    <span><strong>{orders.length}</strong> Subscriptions</span>
                    <span><strong>{orders.filter(o => o.status === "active").length}</strong> Active</span>
                </div>
            )}

            <ServiceGrid loading={loading} empty={orders.length === 0} emptyIcon={ShieldCheck} emptyTitle="No VPN orders yet" emptyText="VPN subscriptions you order appear here with their logins.">
                {orders.map((vpn) => {
                    const closed = CLOSED.includes(vpn.status);
                    const creds = vpn.credentials || {};
                    const facts: ServiceFact[] = [
                        { label: "Location", value: vpn.country || "Global" },
                        { label: "Expires", value: vpn.expires_at ? new Date(vpn.expires_at).toLocaleDateString() : "N/A" },
                    ];
                    if (!closed && creds.username) {
                        facts.push(
                            { label: "Server", value: creds.server || "Use the .ovpn file", copy: creds.server },
                            ...(creds.protocol ? [{ label: "Protocol", value: creds.protocol }] : []),
                            { label: "Username", value: creds.username, copy: creds.username },
                            { label: "Password", value: creds.password, copy: creds.password, secret: true },
                        );
                    }
                    return (
                        <ServiceCard
                            key={vpn.id}
                            icon={ShieldCheck}
                            kind="VPN"
                            status={vpn.status}
                            title={vpn.product_name}
                            subtitle={vpn.order_number}
                            facts={facts}
                            note={closed ? `This subscription is ${vpn.status}; its login no longer works.` : !creds.username ? "Provisioning credentials…" : undefined}
                        />
                    );
                })}
            </ServiceGrid>
        </div>
    );
}
