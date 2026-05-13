import { useState } from "react";
import { WalletIcon, CogIcon, ServerStackIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { validEmail, positiveNumber, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import {
    useAdminProductCategories,
    useSystemInfo,
    useCreateProductCategory,
    useCreditWallet,
    useDebitWallet,
} from "../queries/settings.queries";

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

    const [walletAction, setWalletAction] = useState<"credit" | "debit">("credit");
    const [walletForm, setWalletForm] = useState({ entity_type: "User", email: "", amount: "", description: "" });
    const [walletErrors, setWalletErrors] = useState<ValidationErrors>({});

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });

    const { data: categoriesData, isLoading: categoriesLoading } = useAdminProductCategories();
    const { data: systemInfoData, isLoading: systemLoading } = useSystemInfo();

    const categories: ProductCategory[] = categoriesData?.categories || [];
    const systemInfo: SystemInfo | null = systemInfoData ?? null;

    const creditWallet = useCreditWallet();
    const debitWallet = useDebitWallet();
    const createCategory = useCreateProductCategory();

    const handleWalletAction = async () => {
        const errors = { email: validEmail(walletForm.email), amount: positiveNumber(walletForm.amount, "Amount") };
        if (hasErrors(errors)) { setWalletErrors(errors); return; }
        setWalletErrors({});
        const payload = {
            entity_type: walletForm.entity_type,
            email: walletForm.email,
            amount: parseFloat(walletForm.amount),
            description: walletForm.description || undefined,
        };
        const mutation = walletAction === "credit" ? creditWallet : debitWallet;
        await mutation.mutateAsync(payload);
        setWalletForm({ entity_type: "User", email: "", amount: "", description: "" });
    };

    const handleCreateCategory = async () => {
        if (!categoryForm.name) return;
        await createCategory.mutateAsync({ name: categoryForm.name, slug: categoryForm.slug || undefined });
        setShowCategoryModal(false);
        setCategoryForm({ name: "", slug: "" });
    };

    const walletLoading = creditWallet.isLoading || debitWallet.isLoading;

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
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === s.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
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
                        <button
                            onClick={() => setWalletAction("credit")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${walletAction === "credit" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                            <ArrowUpIcon className="h-4 w-4" /> Credit
                        </button>
                        <button
                            onClick={() => setWalletAction("debit")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${walletAction === "debit" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                            <ArrowDownIcon className="h-4 w-4" /> Debit
                        </button>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Entity Type">
                                <select className={selectClasses} value={walletForm.entity_type} onChange={(e) => setWalletForm({ ...walletForm, entity_type: e.target.value })}>
                                    <option value="User">User</option>
                                    <option value="Reseller">Reseller</option>
                                </select>
                            </Field>
                            <Field label="Email" error={walletErrors.email}>
                                <input className={inputClasses} type="email" value={walletForm.email} onChange={(e) => setWalletForm({ ...walletForm, email: e.target.value })} placeholder="user@example.com" />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Amount ($)" error={walletErrors.amount}>
                                <input className={inputClasses} type="number" step="0.01" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} placeholder="100.00" />
                            </Field>
                            <Field label="Description">
                                <input className={inputClasses} value={walletForm.description} onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })} placeholder="Reason for adjustment" />
                            </Field>
                        </div>
                        <button
                            onClick={handleWalletAction}
                            disabled={walletLoading}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${walletAction === "credit" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-destructive hover:bg-destructive/90"}`}
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
                        <Button onClick={() => setShowCategoryModal(true)} size="sm">
                            <PlusIcon className="h-4 w-4" /> Add Category
                        </Button>
                    </div>
                    {categoriesLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                                    <div className="h-3 w-16 bg-muted/70 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
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
                    )}

                    <FormModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Create Product Category" onSubmit={handleCreateCategory} submitLabel="Create" loading={createCategory.isLoading}>
                        <Field label="Name"><input className={inputClasses} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Proxies" /></Field>
                        <Field label="Slug (optional)"><input className={inputClasses} value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="auto-generated if empty" /></Field>
                    </FormModal>
                </div>
            )}

            {/* System Info */}
            {activeSection === "system" && (
                systemLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    </div>
                ) : systemInfo ? (
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
                                        {active
                                            ? <CheckCircleIcon className="h-6 w-6 text-emerald-500 mx-auto" />
                                            : <XCircleIcon className="h-6 w-6 text-red-500 mx-auto" />
                                        }
                                        <p className="text-sm font-medium mt-2 capitalize text-foreground">{name}</p>
                                        <p className={`text-xs ${active ? "text-emerald-400" : "text-red-400"}`}>{active ? "Active" : "Not Configured"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null
            )}
        </div>
    );
}
