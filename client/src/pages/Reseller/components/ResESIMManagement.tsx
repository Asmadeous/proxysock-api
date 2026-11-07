import { useState, useEffect } from "react";
import { QrCode, RefreshCw, Smartphone, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import resellerApi, { fetchResellerOrders } from "@/services/resellerApi";
import EsimTopupDialog from "../../UserDashboard/EsimTopupDialog";
import { toast } from "sonner";
import { getApiError } from "../../SuperAdmin/utils/errors";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import ServiceCard, { ServiceGrid } from "../../SuperAdmin/components/ServiceCard";

const FILTERS = [
    { id: "all", label: "All eSIMs" },
    { id: "esim", label: "eSIM" },
    { id: "usa_esim", label: "USA eSIM" },
];

interface ESIMProfile {
    id: string;
    iccid: string;
    product_type: string;
    package_name: string;
    location_name: string;
    data_limit_gb: number;
    duration_days: number;
    qr_code_url: string;
    activation_code: string;
    esim_status: string;
    expires_at: string;
    data_label?: string;
    order_id: string;
    // Active MeiSIM phone-number line that can be topped up.
    topup_eligible: boolean;
}

export default function ResESIMManagement() {
    const [profiles, setProfiles] = useState<ESIMProfile[]>([]);
    const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [topupProfile, setTopupProfile] = useState<ESIMProfile | null>(null);
    const [qrProfileId, setQrProfileId] = useState<string | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const response = await fetchResellerOrders({ product_type: 'esim,usa_esim' });
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.flatMap((order: any) => {
                    // Every order gets a card, even before its eSIM is delivered.
                    const found = (order.credentials_list || [order.credentials]).filter(Boolean);
                    const credentials = found.length ? found : [{}];
                    return credentials.map((cred: any, index: number) => ({
                        id: `${order.id}-${index}`,
                        iccid: cred.iccid || '',
                        product_type: order.product_type || 'esim',
                        package_name: order.product_name,
                        location_name: order.country || 'Global',
                        data_limit_gb: order.esim_details?.data_amount_gb || 0,
                        duration_days: order.esim_details?.duration_days || 30,
                        qr_code_url: cred.qr_code || '',
                        activation_code: cred.activation_code || cred.qr_activation_code || '',
                        esim_status: order.status,
                        expires_at: order.expires_at,
                        data_label: cred.data,
                        order_id: order.id,
                        topup_eligible: order.topup_eligible === true,
                    }));
                });
                setProfiles(transformed);
            }
        } catch (error) {
            toast.error(getApiError(error, "Failed to load eSIM profiles"));
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(p => productTypeFilter === "all" || p.product_type === productTypeFilter);

    return (
        <div className="ws-stack">
            <PageHeader
                title="eSIM"
                description="Manage your global travel and USA eSIM profiles."
                actions={<button type="button" onClick={fetchProfiles} disabled={loading} aria-label="Refresh" title="Refresh" className="ws-icon-button"><RefreshCw className={loading ? "animate-spin" : ""} /></button>}
            />

            <div className="ws-tabs" role="group" aria-label="Filter by eSIM type">
                {FILTERS.map(f => (
                    <button type="button" key={f.id} aria-pressed={productTypeFilter === f.id} onClick={() => setProductTypeFilter(f.id)}>
                        {f.label}<span className="ws-count">{f.id === "all" ? profiles.length : profiles.filter(p => p.product_type === f.id).length}</span>
                    </button>
                ))}
            </div>

            <ServiceGrid loading={loading} empty={filteredProfiles.length === 0} emptyIcon={Smartphone} emptyTitle="No eSIMs found" emptyText={productTypeFilter === "all" ? "eSIMs you order appear here with their install codes." : "There are no eSIMs of this type yet."}>
                {filteredProfiles.map((p) => (
                    <ServiceCard
                        key={p.id}
                        icon={Smartphone}
                        kind={p.product_type === "usa_esim" ? "USA eSIM" : "eSIM"}
                        status={p.esim_status}
                        title={p.package_name}
                        subtitle={p.location_name}
                        facts={[
                            { label: "Data", value: p.data_label || `${p.data_limit_gb} GB` },
                            { label: "Validity", value: `${p.duration_days} days` },
                            { label: "ICCID", value: p.iccid ? `…${p.iccid.slice(-8)}` : "Pending", copy: p.iccid || undefined },
                            { label: "Expires", value: p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "—" },
                        ]}
                        actions={(p.activation_code?.startsWith("LPA:") || p.topup_eligible) ? <>
                            {p.activation_code?.startsWith("LPA:") && (
                                <button type="button" onClick={() => setQrProfileId(qrProfileId === p.id ? null : p.id)} aria-expanded={qrProfileId === p.id}><QrCode size={14} aria-hidden="true" /> {qrProfileId === p.id ? "Hide QR" : "View QR"}</button>
                            )}
                            {p.topup_eligible && <button type="button" onClick={() => setTopupProfile(p)}><Wallet size={14} aria-hidden="true" /> Top up</button>}
                        </> : undefined}
                    >
                        {qrProfileId === p.id && (
                            <div className="flex flex-col items-center gap-2" style={{ marginTop: 18 }}>
                                {/* White quiet zone so phones can scan it in dark mode too. */}
                                <div className="rounded bg-white p-3">
                                    <QRCodeSVG value={p.activation_code} size={180} aria-label="eSIM installation QR code" />
                                </div>
                                <p className="proxy-usage text-center" style={{ marginTop: 0 }}>Scan with the phone’s camera to install this eSIM.</p>
                            </div>
                        )}
                    </ServiceCard>
                ))}
            </ServiceGrid>

            {topupProfile && (
                <EsimTopupDialog
                    orderId={topupProfile.order_id}
                    lineName={topupProfile.package_name}
                    open={!!topupProfile}
                    onOpenChange={(open) => !open && setTopupProfile(null)}
                    client={resellerApi}
                    ordersPath="/orders"
                />
            )}
        </div>
    );
}
