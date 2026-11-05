import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { resellerLogin } from "@/services/resellerApi";
import { getApiError } from "@/utils/apiError";
import { useThemeStore } from "@/store/themeStore";
import LoginBrandPanel from "@/components/auth/login/LoginBrandPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import "@/pages/auth/login.css";
import "./reseller-login.css";

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
    const dark = useThemeStore(state => state.dark);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (loading) return;
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
            setError(getApiError(err, "Login failed"));
        } finally {
            setLoading(false);
        }
    };

    return <div className={`landing-theme ${dark ? 'dark' : ''}`}>
      <Helmet><title>Reseller Sign In | ProxySock</title><meta name="robots" content="noindex" /></Helmet>
      <div className="login-page reseller-login"><LoginBrandPanel variant="reseller" /><main className="login-main"><header className="login-topbar"><Link to="/" className="login-back"><ArrowLeft size={15} aria-hidden="true" />Back to website</Link></header><div className="login-form-area"><div className="login-form-content"><div className="login-form-heading"><p className="login-eyebrow">ProxySock / Reseller access</p><h1>Welcome back.<br /><span>Let’s get to work.</span></h1><p>Sign in to manage your reseller business.</p></div>
        <form className="login-form" onSubmit={handleSubmit} aria-label="Reseller sign in" aria-busy={loading}>
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="login-field"><label htmlFor="reseller-email">Email address</label><input id="reseller-email" name="email" type="email" autoComplete="username" required disabled={loading} value={email} onChange={event => setEmail(event.target.value)} /></div>
          <div className="login-field"><label htmlFor="reseller-password">Password</label><div className="login-password"><input id="reseller-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={loading} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} disabled={loading} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          <div className="reseller-terms-choice"><input id="reseller-terms" type="checkbox" checked={termsAccepted} disabled={loading} onChange={event => { setTermsAccepted(event.target.checked); if(event.target.checked) setError(''); }} /><div><label htmlFor="reseller-terms">I agree to the reseller terms.</label><button type="button" onClick={() => setTermsOpen(true)}>Read Reseller Terms of Service</button></div></div>
          <button type="submit" className="login-submit" disabled={loading || !termsAccepted}>{loading ? 'Signing in…' : 'Sign in'}<ArrowUpRight size={17} aria-hidden="true" /></button>
        </form><p className="login-register">Interested in becoming a reseller? <Link to="/reseller-program">Explore partnerships ↗</Link></p><p className="reseller-login-help"><Link to="/contact">Need help accessing your account?</Link></p>
      </div></div></main></div>
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}><DialogContent className={`reseller-terms-dialog landing-theme ${dark ? 'dark' : ''}`}><DialogHeader><DialogTitle>Reseller Terms of Service</DialogTitle><DialogDescription>Last Updated: March 21, 2026</DialogDescription></DialogHeader><div className="reseller-terms-content">{TERMS_SECTIONS.map(section => <section key={section.title}><h3>{section.title}</h3><p>{section.content}</p></section>)}<p>By accepting, you acknowledge that you have read, understood, and agree to be bound by these terms.</p></div><div className="reseller-terms-actions"><button type="button" onClick={() => setTermsOpen(false)}>Close</button><button type="button" onClick={() => { setTermsAccepted(true); setTermsOpen(false); setError(''); }}>Accept & Close</button></div></DialogContent></Dialog>
    </div>;
}
