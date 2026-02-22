import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { adminLogin } from "../../services/adminApi";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
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
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Login failed";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-14 w-14 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheckIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-sm text-gray-400 mt-1">ProxySock Management Console</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl border border-gray-700/50 p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500
                text-sm focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="admin@proxysock.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500
                text-sm focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-4">
                    Employee access only. Unauthorized access is logged.
                </p>
            </motion.div>
        </div>
    );
}
