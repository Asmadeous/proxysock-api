import { useState, useEffect } from "react";
import { WalletIcon, ShoppingCartIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { fetchResellerOrderStats } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import { toast } from "sonner";
import StatsCard from "../../SuperAdmin/components/StatsCard";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShieldCheckIcon, Clock, CreditCard, Activity } from "lucide-react";

export default function ResOverview() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";

    const [stats, setStats] = useState({
        balance: 0,
        earnings: 0,
        orders: 0,
        tickets: 0,
        totalSpent: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResellerOrderStats()
            .then((res) => {
                const d = res.data;
                setStats({
                    balance: Number(d.balance || 0),
                    earnings: Number(d.earnings_balance || 0),
                    orders: Number(d.total_orders || 0),
                    tickets: 0,
                    totalSpent: Number(d.total_spent || 0)
                });
                setLoading(false);
            })
            .catch((err) => {
                toast.error(getApiError(err, "Failed to load overview stats"));
                setLoading(false);
            });
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-foreground tracking-tight">Executive Overview</h2>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        {isEnterprise ? "Enterprise infrastructure and partnership metrics." : "API Partner node and credit performance."}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border bg-card shadow-sm flex items-center gap-2 ${isEnterprise ? 'text-primary' : 'text-emerald-500'}`}>
                    <ShieldCheckIcon className="w-4 h-4" />
                    {isEnterprise ? 'Tier: Enterprise' : 'Tier: API Only'}
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {!isEnterprise ? (
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Available Credits"
                            value={`$${stats.balance.toFixed(2)}`}
                            icon={WalletIcon}
                            loading={loading}
                        />
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Total Earnings"
                            value={`$${stats.earnings.toFixed(2)}`}
                            icon={BanknotesIcon}
                            loading={loading}
                        />
                    </motion.div>
                )}

                {isEnterprise ? (
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Infrastructure Fee"
                            value={`$${user?.subscription_fee || "0.00"}`}
                            icon={CreditCard}
                            loading={loading}
                        />
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Lifetime Credits Used"
                            value={`$${stats.totalSpent.toFixed(2)}`}
                            icon={Activity}
                            loading={loading}
                        />
                    </motion.div>
                )}

                <motion.div variants={itemVariants}>
                    <StatsCard
                        title="Sub-Order Volume"
                        value={stats.orders}
                        icon={ShoppingCartIcon}
                        loading={loading}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <StatsCard
                        title="Network Health"
                        value="99.9%"
                        icon={Activity}
                        loading={loading}
                    />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                <Card className="lg:col-span-2 border border-border shadow-sm bg-card overflow-hidden relative rounded-3xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp className="h-40 w-40" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                            Market Performance Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-border/50 rounded-3xl group hover:border-primary/50 transition-colors bg-muted/5">
                            <div className="text-center">
                                <p className="text-muted-foreground font-bold mb-2 group-hover:text-primary transition-colors">Growth engine analysis in progress</p>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-50">PARTNER_CORE_V5</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {isEnterprise && (
                        <Card className="border border-border shadow-sm bg-card rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black text-primary flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Fee Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Next Renewal</span>
                                    <span className="text-sm font-black">{new Date(user?.subscription_expires_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-2/3 shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium italic">Billed automatically from earnings wallet.</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border border-border shadow-sm bg-card rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold tracking-tight">Account Compliance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-all cursor-pointer group">
                                <h4 className="font-black text-sm mb-1 group-hover:text-primary uppercase tracking-tight">Sub-Order Audit</h4>
                                <p className="text-[11px] text-muted-foreground font-medium">Full transparency protocol enabled for all downstream orders.</p>
                            </div>
                            {!isEnterprise && (
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-all cursor-pointer group border-dashed">
                                    <h4 className="font-black text-sm text-primary mb-1 uppercase tracking-tight">Enterprise Upgrade</h4>
                                    <p className="text-[11px] text-muted-foreground font-medium">Static keys & revenue sharing available for high-volume partners.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}
