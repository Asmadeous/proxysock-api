import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightIcon,
    BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { resellerLogin } from "../../services/resellerApi";
import { Helmet } from "react-helmet-async";
import AuthLogo from "../../components/auth/AuthLogo";
import AuroraBackground from "../../components/auth/carousel/AuroraBackground";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const TERMS_SECTIONS = [
    {
        title: "1. Reseller Tier Definitions",
        content: `ProxySock offers three (3) distinct reseller partnership tiers:

• API Reseller (api_only) — Full catalog access to all product categories (Proxies, VPN, eSIM, VPS/RDP). Minimum deposit: $1,500.00 USD. Orders are processed via prepaid balance. Suitable for high-volume integrators who serve multiple product lines through their own platforms.

• Single Product Reseller (single_product) — Access restricted to one (1) assigned product category as configured by the ProxySock administration team. Minimum deposit: $500.00 USD. Orders are processed via prepaid balance. Ideal for niche resellers who focus on a specific service vertical.

• Infrastructure Partner (infrastructure) — Full catalog access with gateway-based checkout, managed end-user accounts, earnings tracking, and withdrawal capabilities. Pricing includes a configurable infrastructure surcharge and monthly subscription fee. Suitable for white-label operators running their own branded platforms.`,
    },
    {
        title: "2. Data Separation & Privacy",
        content: `All reseller data is strictly isolated:

• Resellers may only access data associated with their own account — including orders, transactions, users, and product listings.
• Platform end-users cannot view reseller data, and resellers cannot view platform user data.
• Single Product resellers are restricted to viewing and ordering products exclusively within their assigned category.
• Infrastructure Partners' managed users are separated from platform users and from users managed by other Infrastructure Partners.
• ProxySock employs cache-level and query-level isolation to enforce these boundaries at every tier.`,
    },
    {
        title: "3. Financial Terms",
        content: `• API and Single Product resellers operate on a prepaid balance model. Credits must be deposited before orders can be placed.
• Minimum deposit amounts are enforced per tier: $1,500 for API resellers, $500 for Single Product resellers.
• Infrastructure Partners pay via payment gateway at checkout and may withdraw accumulated earnings through supported payout methods (bank transfer, cryptocurrency).
• All transactions are final. Refunds are handled on a case-by-case basis at ProxySock's sole discretion.
• ProxySock reserves the right to adjust pricing, surcharges, and subscription fees with 30 days' written notice.
• Balances do not accrue interest and are non-transferable between reseller accounts.`,
    },
    {
        title: "4. API Usage & Rate Limits",
        content: `• Resellers are granted API credentials (rotating tokens and/or dedicated API keys) for programmatic access.
• API credentials must be kept confidential. Sharing or exposing credentials in client-side code is prohibited.
• ProxySock reserves the right to revoke, rotate, or suspend API access for accounts exhibiting abuse, excessive error rates, or security violations.
• Rate limits may be applied and are subject to change. Current limits are documented in the API reference.`,
    },
    {
        title: "5. Acceptable Use Policy",
        content: `Resellers and their end-users must comply with all applicable laws and regulations. The following activities are strictly prohibited:

• Using ProxySock services for any illegal activity, including but not limited to fraud, harassment, unauthorized access, or distribution of illegal content.
• Reselling or sublicensing ProxySock services without proper authorization through the reseller program.
• Attempting to circumvent data separation, access controls, or tier restrictions.
• Engaging in activities that negatively impact the performance, security, or availability of the ProxySock platform.
• Misrepresenting your relationship with ProxySock or using ProxySock trademarks without written permission.

Violations may result in immediate suspension or termination of the reseller account without refund.`,
    },
    {
        title: "6. Limitation of Liability",
        content: `• ProxySock provides services on an "as-is" and "as-available" basis.
• ProxySock is not liable for any indirect, incidental, special, or consequential damages arising from the use of its services.
• Total liability shall not exceed the amount paid by the reseller in the 12 months preceding the claim.
• ProxySock does not guarantee uninterrupted service availability and is not responsible for third-party provider outages.`,
    },
    {
        title: "7. Termination",
        content: `• Either party may terminate the reseller relationship with 14 days' written notice.
• ProxySock reserves the right to immediately suspend or terminate accounts that violate these terms.
• Upon termination, any remaining balance will be refunded minus outstanding fees and charges, provided the account is in good standing.
• Access to the API and dashboard will be revoked upon termination.`,
    },
];

export default function ResellerLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) {
            setError("You must accept the Terms of Service to proceed.");
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
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Login failed";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Helmet>
                <title>Reseller Login | ProxySock</title>
            </Helmet>

            {/* Left Panel */}
            <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
                <AuroraBackground />

                <div className="absolute top-8 left-8 z-10">
                    <AuthLogo variant="dark" />
                </div>

                <div className="absolute bottom-8 left-8 right-8 z-10">
                    <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <BuildingStorefrontIcon className="w-5 h-5 text-white/90" />
                            </div>
                            <h3 className="text-white/90 text-lg font-medium">Reseller Portal</h3>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Partner access only. Sign in to manage orders, credits, and your reseller dashboard.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col bg-background">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-center py-8 px-6">
                    <AuthLogo variant="auto" size="sm" />
                </div>

                <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="w-full max-w-md"
                    >
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Reseller Portal</h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Sign in with your partner credentials to access the dashboard.
                            </p>
                        </div>

                        {/* Form card */}
                        <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-6 space-y-4">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-5 w-5 text-destructive shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-destructive text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                            disabled={loading}
                                            placeholder="partner@company.com"
                                            className="pl-10 pr-3 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                            placeholder="Enter your password"
                                            className="pl-10 pr-10 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={loading}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                        >
                                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Terms acceptance */}
                                <div className="flex items-start gap-3 pt-1">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            setTermsAccepted(e.target.checked);
                                            if (e.target.checked) setError("");
                                        }}
                                        className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                                        I have read and agree to the{" "}
                                        <button
                                            type="button"
                                            onClick={() => setTermsOpen(true)}
                                            className="text-primary font-medium hover:underline focus:outline-none"
                                        >
                                            Reseller Terms of Service
                                        </button>
                                    </label>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || !termsAccepted}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        <p className="text-center text-xs text-muted-foreground mt-6">
                            Partner access only. Unauthorized access is logged and prosecuted.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Terms of Service Dialog */}
            <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Reseller Terms of Service</DialogTitle>
                        <p className="text-xs text-muted-foreground">Last Updated: March 21, 2026</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar mt-2">
                        {TERMS_SECTIONS.map((section, i) => (
                            <div key={i} className="space-y-2">
                                <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
                            </div>
                        ))}
                        <div className="border-t border-border pt-4">
                            <p className="text-xs text-muted-foreground">
                                By accepting, you acknowledge that you have read, understood, and agree to be bound by these terms.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setTermsOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTermsAccepted(true); setTermsOpen(false); setError(""); }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Accept & Close
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
