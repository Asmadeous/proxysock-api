import { useState, useEffect, useRef } from "react";
import { DevicePhoneMobileIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import ServiceCard, { ServiceGrid, ServiceSearch } from "../components/ServiceCard";
import { fetchAdminOrders, verifyAdminEsim, fetchAdminEsimVerification } from "@/services/adminApi";
import { toast } from "sonner";
import ManagementFilters from "../components/ManagementFilters";
import EsimTopupQueue from "../components/EsimTopupQueue";

interface ESIMProfile {
    id: string;
    esim_id?: string;
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
    user_email: string;
    data_label?: string;
    verification?: string;
}

export default function AdminESIMManagement() {
    const [profiles, setProfiles] = useState<ESIMProfile[]>([]);
    const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
    const [userType, setUserType] = useState("");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchProfiles();
    }, [productTypeFilter, search, userType]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const params: any = { product_type: 'esim' };
            if (search) params.q = search;
            if (userType) params.entity_type = userType;
            
            const response = await fetchAdminOrders(params);
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.flatMap((order: any) => {
                    const credentials = order.credentials_list || [order.credentials];
                    return credentials.filter(Boolean).map((cred: any, index: number) => ({
                        id: `${order.id}-${index}`,
                        esim_id: cred.id,
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
                        user_email: order.entity_email || order.user_email,
                        data_label: cred.data,
                        verification: cred.verification
                    }));
                });
                setProfiles(transformed);

                // Show each eSIM's saved Verify result, and keep watching checks still running.
                const saved: Record<string, string> = {};
                transformed.forEach((p: ESIMProfile) => {
                    if (p.esim_id && p.verification) saved[p.esim_id] = p.verification;
                });
                setVerification(v => ({ ...v, ...saved }));
                Object.keys(saved).filter(id => saved[id] === "pending").forEach(startPolling);
            }
        } catch (error) {
            console.error('Failed to fetch admin eSIM:', error);
            toast.error("Failed to load eSIM profiles");
        } finally {
            setLoading(false);
        }
    };

    // MeiSIM eSIM Verify: "available" = never installed, "used" = already installed.
    const [verification, setVerification] = useState<Record<string, string>>({});
    const VERDICTS: Record<string, string> = {
        available: "Available — not installed yet",
        used: "Used — already installed",
        invalid: "Invalid activation code",
        unknown: "Unknown — carrier gave no answer",
        error: "Check failed (refunded)",
        pending: "Checking…",
        timed_out: "No answer from MeiSIM within 24 hours — verify again",
    };

    // One poll loop per eSIM, however often the list reloads.
    const polling = useRef(new Set<string>());
    const startPolling = (esimId: string) => {
        if (polling.current.has(esimId)) return;
        polling.current.add(esimId);
        setTimeout(() => pollVerification(esimId), 15000);
    };

    const pollVerification = async (esimId: string, attempt = 0) => {
        try {
            const { data } = await fetchAdminEsimVerification(esimId);
            setVerification(v => ({ ...v, [esimId]: data.status }));
            if (data.status === "pending" && attempt < 20) {
                setTimeout(() => pollVerification(esimId, attempt + 1), 15000);
                return;
            }
        } catch (error: any) {
            setVerification(v => ({ ...v, [esimId]: "error" }));
            toast.error(error?.response?.data?.error || "Could not read the verification");
        }
        polling.current.delete(esimId);
    };

    const verify = async (esimId: string) => {
        if (!confirm("Verify this eSIM with MeiSIM? It costs $1 from the MeiSIM wallet.")) return;
        setVerification(v => ({ ...v, [esimId]: "pending" }));
        try {
            await verifyAdminEsim(esimId);
            startPolling(esimId);
        } catch (error: any) {
            setVerification(v => { const { [esimId]: _, ...rest } = v; return rest; });
            toast.error(error?.response?.data?.error || "Verification failed to start");
        }
    };


    const filteredProfiles = profiles.filter(p => {
        if (productTypeFilter === 'all') return true;
        return p.product_type === productTypeFilter;
    });

    const fmt = (v?: string) => (v ? new Date(v).toLocaleDateString() : "—");

    return (
        <div className="ws-stack">
            <EsimTopupQueue />
            <div>
                <div className="ws-toolbar">
                    <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
                    <div className="ws-toolbar-actions">
                        <ServiceSearch value={search} onChange={setSearch} placeholder="Search ICCID or user" />
                        <select aria-label="Product type" value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)} className="ws-input" style={{ width: "auto" }}>
                            <option value="all">All types</option>
                            <option value="esim">eSIM (eSIM Access & MeiSIM)</option>
                        </select>
                    </div>
                </div>
                <ServiceGrid loading={loading} empty={filteredProfiles.length === 0} emptyIcon={DevicePhoneMobileIcon}>
                    {filteredProfiles.map((p) => {
                        const canVerify = Boolean(p.activation_code?.startsWith("LPA:"));
                        return (
                            <ServiceCard
                                key={p.id}
                                icon={DevicePhoneMobileIcon}
                                kind={p.location_name}
                                status={p.esim_status}
                                title={p.package_name}
                                subtitle={p.user_email}
                                facts={[
                                    { label: "ICCID", value: p.iccid || "N/A", copy: p.iccid || undefined },
                                    { label: "Data", value: p.data_label || `${p.data_limit_gb} GB` },
                                    { label: "Duration", value: `${p.duration_days} days` },
                                    { label: "Expires", value: fmt(p.expires_at) },
                                ]}
                                note={
                                    <>
                                        {p.esim_id && !canVerify && <span className="block">Verify unavailable: carrier-held eSIM with no activation code (QR only).</span>}
                                        {p.esim_id && verification[p.esim_id] && <span className="block" role="status">Verify: {VERDICTS[verification[p.esim_id]] || verification[p.esim_id]}</span>}
                                    </>
                                }
                                actions={(p.esim_id || p.qr_code_url) ? (
                                    <>
                                        {p.esim_id && (
                                            <button
                                                type="button"
                                                onClick={() => verify(p.esim_id!)}
                                                disabled={!canVerify || verification[p.esim_id] === "pending"}
                                                title={canVerify ? "Check with MeiSIM whether this eSIM is installed ($1)" : "Carrier-held eSIM (e.g. Moxee): no activation code, so MeiSIM cannot verify it"}
                                            >
                                                Verify eSIM ($1)
                                            </button>
                                        )}
                                        {p.qr_code_url && <a href={p.qr_code_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ov-accent)]">View QR code <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" /></a>}
                                    </>
                                ) : undefined}
                            />
                        );
                    })}
                </ServiceGrid>
            </div>
        </div>
    );
}
