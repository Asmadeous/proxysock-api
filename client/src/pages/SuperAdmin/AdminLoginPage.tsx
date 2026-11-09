import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { adminLogin } from "@/services/adminApi";
import { getApiError } from "@/utils/apiError";
import { useThemeStore } from "@/store/themeStore";
import LoginBrandPanel from "@/components/auth/login/LoginBrandPanel";
import "@/pages/auth/login.css";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const dark = useThemeStore(state => state.dark);

    // Zoho SSO failures come back as ?error=…&message=…
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const errorParam = params.get("error");
        const messageParam = params.get("message");
        if (errorParam) {
            setError(messageParam || errorParam);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [location]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            const res = await adminLogin(email, password);
            localStorage.setItem("adminToken", res.data.token);
            localStorage.setItem("adminUser", JSON.stringify(res.data.employee));
            navigate("/admin");
        } catch (err: unknown) {
            setError(getApiError(err, "Login failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleZohoSignIn = () => {
        const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, "");
        window.location.href = `${baseUrl}/admin/api/auth/zoho`;
    };

    return (
        <div className={`landing-theme ${dark ? "dark" : ""}`}>
            <Helmet><title>Admin Sign In | ProxySock</title><meta name="robots" content="noindex" /></Helmet>
            <div className="login-page">
                <LoginBrandPanel variant="admin" />
                <main className="login-main">
                    <header className="login-topbar">
                        <Link to="/" className="login-back"><ArrowLeft size={15} aria-hidden="true" /> Back to website</Link>
                    </header>
                    <div className="login-form-area">
                        <div className="login-form-content">
                            <div className="login-form-heading">
                                <p className="login-eyebrow">ProxySock / Management console</p>
                                <h1>Welcome back<span>.</span></h1>
                                <p>Sign in with your employee credentials to access the dashboard.</p>
                            </div>
                            <form className="login-form" onSubmit={handleSubmit} aria-label="Admin sign in" aria-busy={loading}>
                                {error && <div className="login-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{error}</p></div>}
                                <div className="login-field">
                                    <label htmlFor="admin-email">Email address</label>
                                    <input id="admin-email" name="email" type="email" autoComplete="username" required autoFocus
                                        disabled={loading} value={email} onChange={event => setEmail(event.target.value)}
                                        placeholder="employee@company.com" />
                                </div>
                                <div className="login-field">
                                    <label htmlFor="admin-password">Password</label>
                                    <div className="login-password">
                                        <input id="admin-password" name="password" type={showPassword ? "text" : "password"}
                                            autoComplete="current-password" required disabled={loading} value={password}
                                            onChange={event => setPassword(event.target.value)} placeholder="Enter your password" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
                                            aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="login-submit" disabled={loading}>
                                    <span>{loading ? "Signing in..." : "Sign in"}</span>
                                    {loading ? <LoaderCircle className="login-spinner" size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
                                </button>
                            </form>
                            <div className="login-divider"><span>Or continue with</span></div>
                            <div className="login-social" style={{ gridTemplateColumns: "1fr" }}>
                                <button type="button" onClick={handleZohoSignIn} disabled={loading} aria-label="Sign in with Zoho SSO">
                                    <Building2 size={17} aria-hidden="true" />
                                    <span>Zoho SSO</span>
                                </button>
                            </div>
                            <p className="login-register">Employee access only. Unauthorized access is logged.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
