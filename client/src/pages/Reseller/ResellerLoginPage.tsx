import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BuildingStorefrontIcon, ExclamationCircleIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { resellerLogin } from "../../services/resellerApi";
import { Helmet } from "react-helmet-async";

export default function ResellerLoginPage() {
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

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
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
