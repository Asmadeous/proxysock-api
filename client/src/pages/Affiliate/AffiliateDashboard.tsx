import { useState, useEffect } from "react";
import { LinkIcon, ClipboardDocumentIcon, ArrowTrendingUpIcon, BanknotesIcon, ClockIcon } from "@heroicons/react/24/outline";
import StatsCard from "../SuperAdmin/components/StatsCard";
import DataTable from "../SuperAdmin/components/DataTable";
import StatusBadge from "../SuperAdmin/components/StatusBadge";
import FormModal, { Field, inputClasses } from "../SuperAdmin/components/FormModal";
import { enrollAffiliate, fetchAffiliateProfile, fetchReferrals, fetchPayouts, requestPayout } from "../../services/affiliateApi";
import { toast } from "react-hot-toast";

export default function AffiliateDashboard() {
    const [affiliate, setAffiliate] = useState<Record<string, unknown> | null>(null);
    const [referrals, setReferrals] = useState<Record<string, unknown>[]>([]);
    const [payouts, setPayouts] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<"overview" | "referrals" | "payouts">("overview");
    const [showPayout, setShowPayout] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutLoading, setPayoutLoading] = useState(false);

    useEffect(() => {
        fetchAffiliateProfile()
            .then((r) => setAffiliate(r.data))
            .catch(() => setAffiliate(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!affiliate) return;
        if (activeSubTab === "referrals") fetchReferrals().then((r) => setReferrals(r.data.referrals || r.data || [])).catch(() => { });
        if (activeSubTab === "payouts") fetchPayouts().then((r) => setPayouts(r.data.payouts || r.data || [])).catch(() => { });
    }, [activeSubTab, affiliate]);

    const handleEnroll = async () => {
        try { const r = await enrollAffiliate(); setAffiliate(r.data); toast.success("Enrolled!"); }
        catch { toast.error("Failed to enroll"); }
    };

    const handlePayout = async () => {
        setPayoutLoading(true);
        try { await requestPayout(Number(payoutAmount)); toast.success("Payout requested"); setShowPayout(false); }
        catch { toast.error("Failed"); }
        finally { setPayoutLoading(false); }
    };

    const copyLink = () => {
        const code = affiliate?.referral_code;
        if (!code) return;
        navigator.clipboard.writeText(`${window.location.origin}?ref=${code}`);
        toast.success("Referral link copied!");
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500" /></div>;

    if (!affiliate) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Affiliate Program</h2>
                <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-8 text-center max-w-md mx-auto">
                    <LinkIcon className="h-14 w-14 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Join Our Affiliate Program</h3>
                    <p className="text-gray-400 text-sm mb-6">Earn commissions on every purchase made by users you refer. Get a unique link and start earning today.</p>
                    <button onClick={handleEnroll} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600">Enroll Now</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-white">Affiliate Dashboard</h2>
                <button onClick={() => setShowPayout(true)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Request Payout</button>
            </div>

            {/* Referral Link */}
            <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-4 flex items-center gap-3 flex-wrap">
                <LinkIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Your referral link</p>
                    <p className="text-sm text-white font-mono truncate">{window.location.origin}?ref={String(affiliate.referral_code)}</p>
                </div>
                <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-xs hover:bg-gray-700 transition-colors">
                    <ClipboardDocumentIcon className="h-4 w-4" /> Copy
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatsCard title="Total Referrals" value={Number(affiliate.total_referrals || 0)} icon={ArrowTrendingUpIcon} />
                <StatsCard title="Converted" value={Number(affiliate.converted_referrals || 0)} icon={LinkIcon} />
                <StatsCard title="Earnings" value={`$${Number(affiliate.total_earnings || 0).toFixed(2)}`} icon={BanknotesIcon} />
                <StatsCard title="Pending" value={`$${Number(affiliate.pending_balance || 0).toFixed(2)}`} icon={ClockIcon} />
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2">
                {(["overview", "referrals", "payouts"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveSubTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeSubTab === tab ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50"}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeSubTab === "overview" && (
                <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Referral Code</span><span className="text-white font-mono">{String(affiliate.referral_code)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Commission Rate</span><span className="text-white">{Number(affiliate.commission_rate || 10)}%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Discount Rate</span><span className="text-white">{Number(affiliate.discount_rate || 5)}%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Status</span><StatusBadge status={String(affiliate.status || "active")} /></div>
                </div>
            )}

            {activeSubTab === "referrals" && (
                <DataTable
                    columns={[
                        { key: "referred_email", label: "Referred User", render: (r: Record<string, unknown>) => <span className="text-sm">{String(r.referred_email || r.referred_user_email || "—")}</span> },
                        { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "pending")} /> },
                        { key: "commission_amount", label: "Commission", render: (r: Record<string, unknown>) => <span className="text-sm">${Number(r.commission_amount || 0).toFixed(2)}</span> },
                        { key: "created_at", label: "Date", render: (r: Record<string, unknown>) => <span className="text-xs text-gray-400">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                    ]}
                    data={referrals}
                    emptyMessage="No referrals yet. Share your link!"
                />
            )}

            {activeSubTab === "payouts" && (
                <DataTable
                    columns={[
                        { key: "amount", label: "Amount", render: (r: Record<string, unknown>) => <span className="font-medium">${Number(r.amount).toFixed(2)}</span> },
                        { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} /> },
                        { key: "created_at", label: "Requested", render: (r: Record<string, unknown>) => <span className="text-xs text-gray-400">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                    ]}
                    data={payouts}
                    emptyMessage="No payouts yet"
                />
            )}

            {/* Payout Modal */}
            <FormModal open={showPayout} onClose={() => setShowPayout(false)} title="Request Payout" onSubmit={handlePayout} submitLabel="Request" loading={payoutLoading}>
                <p className="text-sm text-gray-400">Available: <span className="text-white font-medium">${Number(affiliate.pending_balance || 0).toFixed(2)}</span></p>
                <Field label="Amount ($)">
                    <input className={inputClasses} type="number" step="0.01" min="1" max={Number(affiliate.pending_balance || 0)} value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
                </Field>
            </FormModal>
        </div>
    );
}
