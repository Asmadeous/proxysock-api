import { useState, useEffect, useCallback } from "react";
import { WalletIcon, CogIcon, ServerStackIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { adminCreditWallet, adminDebitWallet, fetchAdminProductCategories, createAdminProductCategory, fetchSystemInfo } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface ProductCategory {
    id: number;
    name: string;
    slug: string;
    products_count: number;
}

interface SystemInfo {
    environment: string;
    ruby_version: string;
    rails_version: string;
    total_users: number;
    total_resellers: number;
    total_orders: number;
    total_products: number;
    active_subscriptions: number;
    gateways: Record<string, boolean>;
}

export default function SettingsTab() {
    const [activeSection, setActiveSection] = useState<"wallet" | "categories" | "system">("wallet");
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(false);

    // Wallet form
    const [walletAction, setWalletAction] = useState<"credit" | "debit">("credit");
    const [walletForm, setWalletForm] = useState({ entity_type: "User", email: "", amount: "", description: "" });
    const [walletLoading, setWalletLoading] = useState(false);

    // Category form
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
    const [categoryLoading, setCategoryLoading] = useState(false);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAdminProductCategories();
            setCategories(res.data.categories || []);
        } catch { toast.error("Failed to load categories"); }
        finally { setLoading(false); }
    }, []);

    const loadSystemInfo = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchSystemInfo();
            setSystemInfo(res.data);
        } catch { toast.error("Failed to load system info"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (activeSection === "categories") loadCategories();
        if (activeSection === "system") loadSystemInfo();
    }, [activeSection, loadCategories, loadSystemInfo]);

    const handleWalletAction = async () => {
        const amount = parseFloat(walletForm.amount);
        if (!walletForm.email || isNaN(amount) || amount <= 0) {
            toast.error("Enter a valid email and amount");
            return;
        }
        setWalletLoading(true);
        try {
            const fn = walletAction === "credit" ? adminCreditWallet : adminDebitWallet;
            const res = await fn({
                entity_type: walletForm.entity_type,
                email: walletForm.email,
                amount,
                description: walletForm.description || undefined,
            });
            toast.success(res.data.message);
            setWalletForm({ entity_type: "User", email: "", amount: "", description: "" });
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed");
        } finally {
            setWalletLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!categoryForm.name) return;
        setCategoryLoading(true);
        try {
            await createAdminProductCategory({ name: categoryForm.name, slug: categoryForm.slug || undefined });
            toast.success("Category created");
            setShowCategoryModal(false);
            setCategoryForm({ name: "", slug: "" });
            loadCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed");
        } finally {
            setCategoryLoading(false);
        }
    };

    const sections = [
        { id: "wallet" as const, label: "Wallet Management", icon: WalletIcon },
        { id: "categories" as const, label: "Product Categories", icon: CogIcon },
        { id: "system" as const, label: "System Info", icon: ServerStackIcon },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">System Settings</h2>

            {/* Section tabs */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 w-fit">
                {sections.map((s) => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === s.id ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                        <s.icon className="h-4 w-4" /> {s.label}
                    </button>
                ))}
            </div>

            {/* Wallet Management */}
            {activeSection === "wallet" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-2xl">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Wallet Management</h3>
                        <p className="text-sm text-muted-foreground mt-1">Credit or debit any user or reseller wallet directly.</p>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setWalletAction("credit")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${walletAction === "credit" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                            <ArrowUpIcon className="h-4 w-4" /> Credit
                        </button>
                        <button onClick={() => setWalletAction("debit")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${walletAction === "debit" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                            <ArrowDownIcon className="h-4 w-4" /> Debit
                        </button>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Entity Type</label>
                                <select className={selectClasses} value={walletForm.entity_type} onChange={(e) => setWalletForm({ ...walletForm, entity_type: e.target.value })}>
                                    <option value="User">User</option>
                                    <option value="Reseller">Reseller</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                                <input className={inputClasses} type="email" value={walletForm.email} onChange={(e) => setWalletForm({ ...walletForm, email: e.target.value })} placeholder="user@example.com" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Amount ($)</label>
                                <input className={inputClasses} type="number" step="0.01" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} placeholder="100.00" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                                <input className={inputClasses} value={walletForm.description} onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })} placeholder="Reason for adjustment" />
                            </div>
                        </div>
                        <button
                            onClick={handleWalletAction}
                            disabled={walletLoading}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${walletAction === "credit" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
                        >
                            {walletLoading ? "Processing..." : `${walletAction === "credit" ? "Credit" : "Debit"} Wallet`}
                        </button>
                    </div>
                </div>
            )}

            {/* Product Categories */}
            {activeSection === "categories" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{categories.length} categories</p>
                        <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-foreground rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                            <PlusIcon className="h-4 w-4" /> Add Category
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="bg-card border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-foreground">{cat.name}</h4>
                                    <span className="text-xs bg-muted px-2 py-1 rounded-lg text-muted-foreground font-mono">{cat.slug}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{cat.products_count} products</p>
                            </div>
                        ))}
                    </div>
                    {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}

                    <FormModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Create Product Category" onSubmit={handleCreateCategory} submitLabel="Create" loading={categoryLoading}>
                        <Field label="Name"><input className={inputClasses} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Proxies" /></Field>
                        <Field label="Slug (optional)"><input className={inputClasses} value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="auto-generated if empty" /></Field>
                    </FormModal>
                </div>
            )}

            {/* System Info */}
            {activeSection === "system" && systemInfo && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Users", value: systemInfo.total_users },
                            { label: "Resellers", value: systemInfo.total_resellers },
                            { label: "Orders", value: systemInfo.total_orders },
                            { label: "Products", value: systemInfo.total_products },
                        ].map((s) => (
                            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Environment</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Rails</span>
                                <span className="float-right font-mono text-foreground">{systemInfo.rails_version}</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Ruby</span>
                                <span className="float-right font-mono text-foreground">{systemInfo.ruby_version}</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Environment</span>
                                <span className="float-right font-mono text-foreground">{systemInfo.environment}</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Active Subs</span>
                                <span className="float-right font-bold text-foreground">{systemInfo.active_subscriptions}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Payment Gateways</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(systemInfo.gateways).map(([name, active]) => (
                                <div key={name} className={`rounded-xl p-4 border text-center ${active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                                    {active ? <CheckCircleIcon className="h-6 w-6 text-emerald-500 mx-auto" /> : <XCircleIcon className="h-6 w-6 text-red-500 mx-auto" />}
                                    <p className="text-sm font-medium mt-2 capitalize text-foreground">{name}</p>
                                    <p className={`text-xs ${active ? "text-emerald-400" : "text-red-400"}`}>{active ? "Active" : "Not Configured"}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {activeSection === "system" && !systemInfo && loading && (
                <p className="text-sm text-muted-foreground text-center py-12">Loading system info...</p>
            )}
        </div>
    );
}
