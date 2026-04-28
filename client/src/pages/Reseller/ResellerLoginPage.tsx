import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BuildingStorefrontIcon, ExclamationCircleIcon, EnvelopeIcon, LockClosedIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { resellerLogin } from "../../services/resellerApi";
import { getApiError } from "../../utils/apiError";
import { Helmet } from "react-helmet-async";

const TERMS_SECTIONS = [
    {
        title: "1. Reseller Tier Definitions",
        content: `ProxySock offers three (3) distinct reseller partnership tiers:

• API Reseller (api_only) — Full catalog access to all product categories (Proxies, VPN, eSIM, VPS/RDP). Minimum deposit: $1,500.00 USD. Orders are processed via prepaid balance. Suitable for high-volume integrators who serve multiple product lines through their own platforms.

• Single Product Reseller (single_product) — Access restricted to one (1) assigned product category as configured by the ProxySock administration team. Minimum deposit: $500.00 USD. Orders are processed via prepaid balance. Ideal for niche resellers who focus on a specific service vertical.

• Infrastructure Partner (infrastructure) — Full catalog access with gateway-based checkout, managed end-user accounts, earnings tracking, and withdrawal capabilities. Pricing includes a configurable infrastructure surcharge and monthly subscription fee. Suitable for white-label operators running their own branded platforms.`
    },
    {
        title: "2. Data Separation & Privacy",
        content: `All reseller data is strictly isolated:

• Resellers may only access data associated with their own account — including orders, transactions, users, and product listings.
• Platform end-users cannot view reseller data, and resellers cannot view platform user data.
• Single Product resellers are restricted to viewing and ordering products exclusively within their assigned category.
• Infrastructure Partners' managed users are separated from platform users and from users managed by other Infrastructure Partners.
• ProxySock employs cache-level and query-level isolation to enforce these boundaries at every tier.`
    },
    {
        title: "3. Financial Terms",
        content: `• API and Single Product resellers operate on a prepaid balance model. Credits must be deposited before orders can be placed.
• Minimum deposit amounts are enforced per tier: $1,500 for API resellers, $500 for Single Product resellers.
• Infrastructure Partners pay via payment gateway at checkout and may withdraw accumulated earnings through supported payout methods (bank transfer, cryptocurrency).
• All transactions are final. Refunds are handled on a case-by-case basis at ProxySock's sole discretion.
• ProxySock reserves the right to adjust pricing, surcharges, and subscription fees with 30 days' written notice.
• Balances do not accrue interest and are non-transferable between reseller accounts.`
    },
    {
        title: "4. API Usage & Rate Limits",
        content: `• Resellers are granted API credentials (rotating tokens and/or dedicated API keys) for programmatic access.
• API credentials must be kept confidential. Sharing or exposing credentials in client-side code is prohibited.
• ProxySock reserves the right to revoke, rotate, or suspend API access for accounts exhibiting abuse, excessive error rates, or security violations.
• Rate limits may be applied and are subject to change. Current limits are documented in the API reference.`
    },
    {
        title: "5. Acceptable Use Policy",
        content: `Resellers and their end-users must comply with all applicable laws and regulations. The following activities are strictly prohibited:

• Using ProxySock services for any illegal activity, including but not limited to fraud, harassment, unauthorized access, or distribution of illegal content.
• Reselling or sublicensing ProxySock services without proper authorization through the reseller program.
• Attempting to circumvent data separation, access controls, or tier restrictions.
• Engaging in activities that negatively impact the performance, security, or availability of the ProxySock platform.
• Misrepresenting your relationship with ProxySock or using ProxySock trademarks without written permission.

Violations may result in immediate suspension or termination of the reseller account without refund.`
    },
    {
        title: "6. Limitation of Liability",
        content: `• ProxySock provides services on an "as-is" and "as-available" basis.
• ProxySock is not liable for any indirect, incidental, special, or consequential damages arising from the use of its services.
• Total liability shall not exceed the amount paid by the reseller in the 12 months preceding the claim.
• ProxySock does not guarantee uninterrupted service availability and is not responsible for third-party provider outages.`
    },
    {
        title: "7. Termination",
        content: `• Either party may terminate the reseller relationship with 14 days' written notice.
• ProxySock reserves the right to immediately suspend or terminate accounts that violate these terms.
• Upon termination, any remaining balance will be refunded minus outstanding fees and charges, provided the account is in good standing.
• Access to the API and dashboard will be revoked upon termination.`
    }
];

export default function ResellerLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsExpanded, setTermsExpanded] = useState(false);
    const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
    const termsRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleTermsScroll = () => {
        if (termsRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                setHasScrolledTerms(true);
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) {
            setError("You must read and accept the Terms of Service to proceed.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await resellerLogin(email, password);
            localStorage.setItem("resellerToken", res.data.token);
            localStorage.setItem("resellerUser", JSON.stringify(res.data.reseller));
            navigate("/reseller");
        } catch (err: unknown) {
            setError(getApiError(err, "Login failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <Helmet>
                <title>Reseller Login | ProxySock</title>
            </Helmet>

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
                    >
                        <BuildingStorefrontIcon className="h-10 w-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">ProxySock</h1>
                    <p className="text-lg text-gray-400 font-medium tracking-wide font-outfit uppercase text-[0.7rem] opacity-70">Reseller Portal</p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 md:p-10 shadow-2xl shadow-black/50 overflow-hidden relative group">
                    {/* Interior glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

                    <form onSubmit={handleSubmit} className="relative space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
                            >
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-400 font-medium">{error}</p>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[0.8rem] font-bold text-gray-400 mb-2 block px-2 uppercase tracking-widest opacity-80">Access ID</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-md"
                                        placeholder="Enter your reseller email"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="text-[0.8rem] font-bold text-gray-400 mb-2 block px-2 uppercase tracking-widest opacity-80">Security Token</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-md"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setTermsExpanded(!termsExpanded)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-300 hover:bg-white/[0.06] transition-all duration-300"
                            >
                                <span className="text-[0.75rem] font-bold uppercase tracking-widest">Reseller Terms of Service</span>
                                {termsExpanded
                                    ? <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                                    : <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                }
                            </button>

                            <AnimatePresence>
                                {termsExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div
                                            ref={termsRef}
                                            onScroll={handleTermsScroll}
                                            className="max-h-[280px] overflow-y-auto bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-5 custom-scrollbar"
                                        >
                                            <p className="text-[0.7rem] text-gray-500 font-medium uppercase tracking-widest">
                                                Last Updated: March 21, 2026 — Please scroll through and read the full agreement.
                                            </p>
                                            {TERMS_SECTIONS.map((section, i) => (
                                                <div key={i} className="space-y-2">
                                                    <h4 className="text-sm font-bold text-gray-200">{section.title}</h4>
                                                    <p className="text-[0.8rem] text-gray-400 leading-relaxed whitespace-pre-line">{section.content}</p>
                                                </div>
                                            ))}
                                            <div className="border-t border-white/5 pt-4">
                                                <p className="text-[0.7rem] text-gray-500 font-medium">
                                                    By accepting, you acknowledge that you have read, understood, and agree to be bound by these terms.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <label className="flex items-center gap-3 cursor-pointer px-1 group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            if (!hasScrolledTerms && !termsExpanded) {
                                                setTermsExpanded(true);
                                                setError("Please read through the Terms of Service before accepting.");
                                                return;
                                            }
                                            setTermsAccepted(e.target.checked);
                                            if (e.target.checked) setError("");
                                        }}
                                        className="h-5 w-5 rounded-lg bg-white/5 border-2 border-white/20 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer transition-all checked:bg-blue-600 checked:border-blue-600"
                                    />
                                </div>
                                <span className="text-[0.8rem] text-gray-400 font-medium group-hover:text-gray-300 transition-colors select-none">
                                    I have read and agree to the <span className="text-blue-400 font-semibold">Reseller Terms of Service</span>
                                </span>
                            </label>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !termsAccepted}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-blue-600/20"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </span>
                                ) : "Continue to Dashboard"}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <p className="text-gray-500 text-[0.8rem] font-medium tracking-tight">
                                Protect your credentials. ProxySock will never ask for your password via email.
                            </p>
                        </div>
                    </form>
                </div>

                <p className="text-center text-gray-500 mt-8 text-sm font-medium">
                    &copy; {new Date().getFullYear()} ProxySock Network. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
