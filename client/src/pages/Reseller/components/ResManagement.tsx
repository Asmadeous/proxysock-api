import { useState, useEffect } from "react";
import {
    Server,
    Monitor,
    Smartphone,
    ShoppingCart,
    ArrowRight,
    Lock,
    RefreshCw
} from "lucide-react";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import { fetchResellerOrderStats } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import { toast } from "sonner";

interface ProductStats {
    vps: { total: number; active: number; expired: number; pending: number; failed: number };
    rdp: { total: number; active: number; expired: number; pending: number; failed: number };
    esim: { total: number; active: number; expired: number; pending: number };
    proxy: { total: number; active: number; expired: number; pending: number };
    vpn: { total: number; active: number; expired: number; pending: number };
}

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

    return (
        <div className="ws-stack">
            <PageHeader
                title="Service management"
                description="Monitor and control the services you have provisioned."
                actions={<button type="button" onClick={fetchStats} disabled={loading} aria-label="Refresh" className="ws-icon-button"><RefreshCw className={loading ? "animate-spin" : ""} /></button>}
            />

            <div className="proxy-summary" style={{ marginBottom: 0 }}>
                <span><strong>{loading ? "—" : productCards.reduce((n, p) => n + (p.stats?.total || 0), 0)}</strong> Total services</span>
                <span><strong>{loading ? "—" : productCards.reduce((n, p) => n + (p.stats?.active || 0), 0)}</strong> Active</span>
                <span><strong>{loading ? "—" : productCards.reduce((n, p) => n + (p.stats?.pending || 0), 0)}</strong> Pending</span>
            </div>

            <div className="overview-service-grid">
                {productCards.map((product) => (
                    <article className="overview-service" key={product.title}>
                        <div className="overview-service-top">
                            <product.icon size={21} strokeWidth={1.5} aria-hidden="true" />
                            <span>{loading ? "Loading…" : `${product.stats?.total || 0} total`}</span>
                        </div>
                        <h3>{product.title}</h3>
                        <p>{product.description}</p>
                        <dl className="proxy-facts" style={{ marginTop: 16 }}>
                            <div><dt>{product.labels.primary}</dt><dd>{loading ? "—" : product.stats?.active || 0}</dd></div>
                            <div><dt>{product.labels.secondary}</dt><dd>{loading ? "—" : product.stats?.expired || 0}</dd></div>
                        </dl>
                        <button type="button" onClick={() => onNavigate(product.tab)} aria-label={`Manage ${product.title}`}>Manage <ArrowRight size={15} /></button>
                    </article>
                ))}
            </div>
        </div>
    );
}
