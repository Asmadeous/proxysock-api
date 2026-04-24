import { useState, useEffect } from "react";
import { LinkIcon, ClipboardDocumentIcon, ArrowTrendingUpIcon, BanknotesIcon, ClockIcon } from "@heroicons/react/24/outline";
import StatsCard from "../SuperAdmin/components/StatsCard";
import DataTable from "../SuperAdmin/components/DataTable";
import StatusBadge from "../SuperAdmin/components/StatusBadge";
import FormModal, { Field, inputClasses } from "../SuperAdmin/components/FormModal";
import { enrollAffiliate, fetchAffiliateProfile, fetchReferrals, fetchPayouts, requestPayout } from "../../services/affiliateApi";
import { toast } from "react-hot-toast";

const CRYPTO_CURRENCIES = [
    { id: "BTC", name: "Bitcoin (BTC)", color: "text-orange-400" },
    { id: "USDC", name: "USD Coin (USDC)", color: "text-blue-400" },
    { id: "ETH", name: "Ethereum (ETH)", color: "text-purple-400" },
    { id: "USDT", name: "Tether USDT (ERC20)", color: "text-green-400" },
];

type PayoutMethod = "wallet" | "crypto" | "manual";

export default function AffiliateDashboard() {
    const [affiliate, setAffiliate] = useState<Record<string, unknown> | null>(null);
    const [referrals, setReferrals] = useState<Record<string, unknown>[]>([]);
    const [payouts, setPayouts] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<"overview" | "referrals" | "payouts">("overview");
    const [showPayout, setShowPayout] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("wallet");
    const [cryptoCurrency, setCryptoCurrency] = useState("USDT");
    const [cryptoAddress, setCryptoAddress] = useState("");
    const [manualDetails, setManualDetails] = useState({ account_name: "", account_number: "", bank_name: "", country: "" });

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
        const amount = Number(payoutAmount);
        if (!amount || amount <= 0) return toast.error("Enter a valid amount");

        if (payoutMethod === "crypto" && !cryptoAddress.trim()) {
            return toast.error("Enter your crypto wallet address");
        }

        setPayoutLoading(true);
        try {
            let details: Record<string, string> = {};
            if (payoutMethod === "crypto") {
                details = { crypto_currency: cryptoCurrency, crypto_address: cryptoAddress.trim() };
            } else if (payoutMethod === "manual") {
                details = { ...manualDetails };
            }

            await requestPayout(amount, payoutMethod, details);

            if (payoutMethod === "crypto") {
                toast.success("Crypto payout processed!");
            } else if (payoutMethod === "manual") {
                toast.success("Payout request submitted — admin will process it shortly");
            } else {
                toast.success("Transferred to your wallet balance");
            }

            setShowPayout(false);
            setPayoutAmount("");
            setCryptoAddress("");
            fetchAffiliateProfile().then((r) => setAffiliate(r.data)).catch(() => { });
        } catch {
            toast.error("Payout failed");
        } finally {
            setPayoutLoading(false);
        }
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
                        { key: "payment_method", label: "Method", render: (r: Record<string, unknown>) => <span className="text-xs uppercase font-medium">{String(r.payment_method || "—")}</span> },
                        { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} /> },
                        { key: "created_at", label: "Requested", render: (r: Record<string, unknown>) => <span className="text-xs text-gray-400">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                    ]}
                    data={payouts}
                    emptyMessage="No payouts yet"
                />
            )}

            {/* Payout Modal */}
            <FormModal open={showPayout} onClose={() => setShowPayout(false)} title="Request Payout" onSubmit={handlePayout} submitLabel={payoutMethod === "crypto" ? "Send Crypto Payout" : payoutMethod === "manual" ? "Submit for Review" : "Transfer to Wallet"} loading={payoutLoading}>
                <p className="text-sm text-gray-400">Available: <span className="text-white font-medium">${Number(affiliate.pending_balance || 0).toFixed(2)}</span></p>

                <Field label="Amount ($)">
                    <input className={inputClasses} type="number" step="0.01" min="1" max={Number(affiliate.pending_balance || 0)} value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
                </Field>

                <Field label="Payout Method">
                    <div className="grid grid-cols-1 gap-2">
                        {([
                            { id: "wallet" as const, name: "Wallet Balance", desc: "Instant transfer to your main wallet" },
                            { id: "crypto" as const, name: "Crypto Withdrawal", desc: "BTC, USDC, ETH, USDT (ERC20)" },
                            { id: "manual" as const, name: "Bank / Other", desc: "Admin will process manually" },
                        ]).map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setPayoutMethod(m.id)}
                                className={`text-left p-3 rounded-xl border transition-all ${payoutMethod === m.id
                                    ? "border-red-500 bg-red-500/10 ring-1 ring-red-500"
                                    : "border-gray-700 hover:border-gray-600"
                                }`}
                            >
                                <p className="text-sm font-medium text-white">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </Field>

                {payoutMethod === "crypto" && (
                    <>
                        <Field label="Crypto Currency">
                            <div className="grid grid-cols-2 gap-2">
                                {CRYPTO_CURRENCIES.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCryptoCurrency(c.id)}
                                        className={`p-2 rounded-lg border text-sm font-medium transition-all ${cryptoCurrency === c.id
                                            ? "border-red-500 bg-red-500/10 text-white"
                                            : "border-gray-700 text-gray-400 hover:border-gray-600"
                                        }`}
                                    >
                                        <span className={c.color}>{c.id}</span>
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label={`${cryptoCurrency} Wallet Address`}>
                            <input
                                className={inputClasses}
                                type="text"
                                placeholder={`Enter your ${cryptoCurrency} address${cryptoCurrency === "USDT" ? " (ERC20)" : ""}`}
                                value={cryptoAddress}
                                onChange={(e) => setCryptoAddress(e.target.value)}
                            />
                        </Field>
                        <p className="text-xs text-amber-400/80">⚠️ Double-check your wallet address. Crypto payouts are processed automatically and cannot be reversed.</p>
                    </>
                )}

                {payoutMethod === "manual" && (
                    <>
                        <Field label="Account Holder Name">
                            <input className={inputClasses} type="text" placeholder="Full name" value={manualDetails.account_name} onChange={(e) => setManualDetails({ ...manualDetails, account_name: e.target.value })} />
                        </Field>
                        <Field label="Account Number / IBAN">
                            <input className={inputClasses} type="text" placeholder="Account number" value={manualDetails.account_number} onChange={(e) => setManualDetails({ ...manualDetails, account_number: e.target.value })} />
                        </Field>
                        <Field label="Bank Name">
                            <input className={inputClasses} type="text" placeholder="Bank name" value={manualDetails.bank_name} onChange={(e) => setManualDetails({ ...manualDetails, bank_name: e.target.value })} />
                        </Field>
                        <Field label="Country">
                            <input className={inputClasses} type="text" placeholder="Country" value={manualDetails.country} onChange={(e) => setManualDetails({ ...manualDetails, country: e.target.value })} />
                        </Field>
                        <p className="text-xs text-blue-400/80">ℹ️ Manual payouts are reviewed by our team and typically processed within 1-3 business days.</p>
                    </>
                )}
            </FormModal>
        </div>
    );
}
