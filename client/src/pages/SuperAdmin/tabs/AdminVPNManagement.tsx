import { useState, useEffect } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import ServiceCard, { ServiceGrid, ServiceSearch } from "../components/ServiceCard";
import { fetchAdminOrders } from "@/services/adminApi";
import { toast } from "sonner";
import ManagementFilters from "../components/ManagementFilters";

interface VPNInstance {
    id: number;
    product_name: string;
    status: string;
    user_email: string;
    expires_at: string;
    country?: string;
    username?: string;
    password?: string;
    server?: string;
}

export default function AdminVPNManagement() {
    const [vpns, setVpns] = useState<VPNInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchVpns();
    }, [search, userType]);

    const fetchVpns = async () => {
        setLoading(true);
        try {
            const params: any = { product_type: 'vpn' };
            if (search) params.q = search;
            if (userType) params.entity_type = userType;
            
            const response = await fetchAdminOrders(params);
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.map((order: any) => ({
                    id: order.id,
                    product_name: order.product_name,
                    status: order.status,
                    user_email: order.entity_email || order.user_email,
                    expires_at: order.expires_at,
                    country: order.country,
                    username: order.credentials?.username,
                    password: order.credentials?.password,
                    server: order.credentials?.server || order.credentials?.ip
                }));
                setVpns(transformed);
            }
        } catch (error) {
            console.error('Failed to fetch admin VPNs:', error);
            toast.error("Failed to load VPN instances");
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v?: string) => (v ? new Date(v).toLocaleDateString() : "—");

    return (
        <div>
            <div className="ws-toolbar">
                <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
                <ServiceSearch value={search} onChange={setSearch} placeholder="Search user or order" />
            </div>
            <ServiceGrid loading={loading} empty={vpns.length === 0} emptyIcon={ShieldCheckIcon}>
                {vpns.map((vpn) => (
                    <ServiceCard
                        key={vpn.id}
                        icon={ShieldCheckIcon}
                        kind={vpn.country || "Global"}
                        status={vpn.status}
                        title={vpn.product_name}
                        subtitle={vpn.user_email}
                        facts={[
                            { label: "Server", value: vpn.server || "N/A", copy: vpn.server || undefined },
                            { label: "Username", value: vpn.username || "N/A", copy: vpn.username || undefined },
                            { label: "Password", value: vpn.password || "N/A", copy: vpn.password || undefined, secret: Boolean(vpn.password) },
                            { label: "Expires", value: fmt(vpn.expires_at) },
                        ]}
                    />
                ))}
            </ServiceGrid>
        </div>
    );
}
