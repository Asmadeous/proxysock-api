import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    SignalIcon,
    ClipboardDocumentIcon,
    UserIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { fetchAdminOrders, verifyAdminEsim, fetchAdminEsimVerification } from "@/services/adminApi";
import { toast } from "react-hot-toast";
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
                        data_label: cred.data
                    }));
                });
                setProfiles(transformed);
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
    };

    const pollVerification = async (esimId: string, attempt = 0) => {
        try {
            const { data } = await fetchAdminEsimVerification(esimId);
            setVerification(v => ({ ...v, [esimId]: data.status }));
            if (data.status === "pending" && attempt < 20) setTimeout(() => pollVerification(esimId, attempt + 1), 15000);
        } catch (error: any) {
            setVerification(v => ({ ...v, [esimId]: "error" }));
            toast.error(error?.response?.data?.error || "Could not read the verification");
        }
    };

    const verify = async (esimId: string) => {
        if (!confirm("Verify this eSIM with MeiSIM? It costs $1 from the MeiSIM wallet.")) return;
        setVerification(v => ({ ...v, [esimId]: "pending" }));
        try {
            await verifyAdminEsim(esimId);
            setTimeout(() => pollVerification(esimId), 15000);
        } catch (error: any) {
            setVerification(v => { const { [esimId]: _, ...rest } = v; return rest; });
            toast.error(error?.response?.data?.error || "Verification failed to start");
        }
    };

    const copy = (t: string) => {
        navigator.clipboard.writeText(t);
        toast.success('Copied!');
    };

    const filteredProfiles = profiles.filter(p => {
        if (productTypeFilter === 'all') return true;
        return p.product_type === productTypeFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">eSIM Management (Admin)</h1>
                        <p className="text-muted-foreground mt-1">Manage global travel eSIM profiles across all users.</p>
                    </div>
                    <ManagementFilters entityType={userType} onEntityTypeChange={setUserType} />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search ICCID/User..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 lg:w-64"
                        />
                    </div>
                    <select
                        value={productTypeFilter}
                        onChange={(e) => setProductTypeFilter(e.target.value)}
                        className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="esim">eSIM (eSIM Access & MeiSIM)</option>
                    </select>
                </div>
            </div>

            <EsimTopupQueue />

            {loading ? (
                <div className="p-8 text-center animate-pulse text-muted-foreground">Loading eSIMs...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfiles.map((p) => (
                        <motion.div key={p.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><DevicePhoneMobileIcon className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="font-bold text-foreground truncate max-w-[150px]">{p.package_name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <UserIcon className="w-3 h-3 text-muted-foreground" />
                                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{p.user_email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    p.esim_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-secondary-foreground'
                                }`}>{p.esim_status}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2"><GlobeAltIcon className="w-4 h-4" /> {p.data_label || `${p.data_limit_gb}GB`}</div>
                                <div className="flex items-center gap-2"><SignalIcon className="w-4 h-4" /> {p.duration_days} Days</div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm font-mono break-all">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">ICCID:</span>
                                    <span className="text-xs text-foreground">{p.iccid || 'N/A'}</span>
                                    {p.iccid && <button onClick={() => copy(p.iccid)} className="text-muted-foreground hover:text-foreground transition-colors"><ClipboardDocumentIcon className="w-4 h-4" /></button>}
                                </div>
                            </div>

                            {p.esim_id && verification[p.esim_id] && (
                                <p className="text-xs text-muted-foreground" role="status">
                                    Verify: {VERDICTS[verification[p.esim_id]] || verification[p.esim_id]}
                                </p>
                            )}

                            <div className="flex gap-2">
                                {p.esim_id && p.activation_code?.startsWith("LPA:") && (
                                    <button
                                        onClick={() => verify(p.esim_id!)}
                                        disabled={verification[p.esim_id] === "pending"}
                                        className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                    >
                                        Verify eSIM ($1)
                                    </button>
                                )}
                                {p.qr_code_url && (
                                    <a href={p.qr_code_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:opacity-90 transition-opacity">
                                        View QR Code
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            
            {!loading && filteredProfiles.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <DevicePhoneMobileIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No eSIM profiles found.</p>
                </div>
            )}
        </div>
    );
}
