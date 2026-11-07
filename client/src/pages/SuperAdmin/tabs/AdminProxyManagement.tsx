import { useState, useEffect } from "react";
import { GlobeAltIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import ServiceCard, { ServiceGrid, ServiceSearch } from "../components/ServiceCard";
import { fetchAdminOrders, rotateProxyIp } from "@/services/adminApi";
import { toast } from "sonner";
import ManagementFilters from "../components/ManagementFilters";

interface ProxyInstance {
    id: number;
    product_name: string;
    product_type: string;
    ip: string;
    port: number;
    username: string;
    password: string;
    status: string;
    user_email: string;
    expires_at: string;
    country?: string;
    protocol?: string;
}

export default function AdminProxyManagement() {
    const [proxies, setProxies] = useState<ProxyInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState("");
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        fetchProxies();
    }, [search, userType]);

    const fetchProxies = async () => {
        setLoading(true);
        try {
            const params: any = { product_type: 'proxy' };
            if (search) params.q = search;
            if (userType) params.entity_type = userType;
            
            const response = await fetchAdminOrders(params);
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.map((order: any) => ({
                    id: order.id,
                    product_name: order.product_name,
                    product_type: order.product_type,
                    ip: order.credentials?.ip || 'N/A',
                    port: order.credentials?.port || 0,
                    username: order.credentials?.username || 'N/A',
                    password: order.credentials?.password || 'N/A',
                    status: order.status,
                    user_email: order.entity_email || order.user_email,
                    expires_at: order.expires_at,
                    country: order.country,
                    protocol: order.metadata?.protocol || 'http'
                }));
                setProxies(transformed);
            }
        } catch (error) {
            console.error('Failed to fetch admin proxies:', error);
            toast.error("Failed to load proxies");
        } finally {
            setLoading(false);
        }
    };

    const handleRotate = async (id: number) => {
        try {
            setRefreshing(prev => ({ ...prev, [id]: true }));
            await rotateProxyIp(id);
            toast.success("IP rotation triggered");
            setTimeout(fetchProxies, 3000);
        } catch (error: any) {
            toast.error(error.message || "Rotation failed");
        } finally {
            setRefreshing(prev => ({ ...prev, [id]: false }));
        }
    };


    const fmt = (v?: string) => (v ? new Date(v).toLocaleDateString() : "—");

    return (
        <div>
            <div className="ws-toolbar">
                <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
                <ServiceSearch value={search} onChange={setSearch} placeholder="Search IP, user or order" />
            </div>
            <ServiceGrid loading={loading} empty={proxies.length === 0} emptyIcon={GlobeAltIcon}>
                {proxies.map((proxy) => (
                    <ServiceCard
                        key={proxy.id}
                        icon={GlobeAltIcon}
                        kind={proxy.protocol?.toUpperCase() || "Proxy"}
                        status={proxy.status}
                        title={proxy.product_name}
                        subtitle={proxy.user_email}
                        facts={[
                            { label: "Address", value: `${proxy.ip}:${proxy.port}`, copy: `${proxy.ip}:${proxy.port}` },
                            { label: "Username", value: proxy.username, copy: proxy.username },
                            { label: "Password", value: proxy.password, copy: proxy.password, secret: true },
                            { label: "Expires", value: fmt(proxy.expires_at) },
                        ]}
                        actions={
                            <button type="button" onClick={() => handleRotate(proxy.id)} disabled={refreshing[proxy.id]}>
                                <ArrowPathIcon className={`h-3.5 w-3.5 ${refreshing[proxy.id] ? "animate-spin" : ""}`} /> Rotate IP
                            </button>
                        }
                    />
                ))}
            </ServiceGrid>
        </div>
    );
}
