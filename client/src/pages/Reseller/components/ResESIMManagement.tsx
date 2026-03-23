import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    SignalIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { fetchResellerOrders } from "@/services/resellerApi";
import { toast } from "react-hot-toast";

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
}

export default function ResESIMManagement() {
    const [profiles, setProfiles] = useState<ESIMProfile[]>([]);
    const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [_showActivation, _setShowActivation] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const response = await fetchResellerOrders({ product_type: 'esim,usa_esim' });
            if (response.data && response.data.orders) {
                const transformed = response.data.orders.flatMap((order: any) => {
                    const credentials = order.credentials_list || [order.credentials];
                    return credentials.filter(Boolean).map((cred: any, index: number) => ({
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
                    }));
                });
                setProfiles(transformed);
            }
        } catch (error) {
            console.error('Failed to fetch reseller eSIM:', error);
        } finally {
            setLoading(false);
        }
    };

    const copy = (t: string) => {
        navigator.clipboard.writeText(t);
        toast.success('Copied!');
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading eSIMs...</div>;

    const filteredProfiles = profiles.filter(p => {
        if (productTypeFilter === 'all') return true;
        return p.product_type === productTypeFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">eSIM Management</h1>
                    <p className="text-muted-foreground mt-1">Manage global travel eSIM profiles.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        value={productTypeFilter}
                        onChange={(e) => setProductTypeFilter(e.target.value)}
                        className="px-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    >
                        <option value="all">All eSIMs</option>
                        <option value="esim">eSIM Access</option>
                        <option value="usa_esim">USA eSIM</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((p) => (
                    <motion.div key={p.id} className="bg-card rounded-xl border p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><DevicePhoneMobileIcon className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold truncate max-w-[150px]">{p.package_name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.product_type === 'usa_esim' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                                            {p.product_type === 'usa_esim' ? 'USA eSIM' : 'eSIM Access'}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{p.location_name}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">{p.esim_status}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><GlobeAltIcon className="w-4 h-4" /> {p.data_limit_gb}GB</div>
                            <div className="flex items-center gap-2"><SignalIcon className="w-4 h-4" /> {p.duration_days} Days</div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono break-all">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">ICCID:</span>
                                <span className="text-xs">{p.iccid.slice(-8)}...</span>
                                <button onClick={() => copy(p.iccid)}><ClipboardDocumentIcon className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">View QR</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
