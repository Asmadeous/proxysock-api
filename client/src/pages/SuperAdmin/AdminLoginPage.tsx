import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { adminLogin } from "../../services/adminApi";
import AuthLogo from "../../components/auth/AuthLogo";
import AuroraBackground from "../../components/auth/carousel/AuroraBackground";
import { getApiError } from "../../utils/apiError";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
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

    return (
        <div className="flex h-screen bg-background">
            {/* Left Panel */}
            <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
                <AuroraBackground />

                {/* Logo */}
                <div className="absolute top-8 left-8 z-10">
                    <AuthLogo variant="dark" />
                </div>

                {/* Welcome text */}
                <div className="absolute bottom-8 left-8 right-8 z-10">
                    <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <ShieldCheckIcon className="w-5 h-5 text-white/90" />
                            </div>
                            <h3 className="text-white/90 text-lg font-medium">Management Console</h3>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Restricted access. Employee credentials required. All sessions are monitored and logged.
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
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Portal</h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Sign in with your employee credentials to access the dashboard.
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
                                            placeholder="employee@company.com"
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

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
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
                            Employee access only. Unauthorized access is logged.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
