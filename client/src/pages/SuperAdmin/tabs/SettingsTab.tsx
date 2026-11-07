import { useState } from "react";
import { ServerStackIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { validEmail, positiveNumber, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
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
        { id: "wallet" as const, label: "Wallet" },
        { id: "categories" as const, label: "Product categories" },
        { id: "system" as const, label: "System" },
    ];

    return (
        <div className="ws-stack">
            <PageHeader title="Settings" description="Wallet adjustments, product categories and system information." />

            <div className="ws-tabs" role="group" aria-label="Settings section">
                {sections.map((s) => (
                    <button type="button" key={s.id} aria-pressed={activeSection === s.id} onClick={() => setActiveSection(s.id)}>{s.label}</button>
                ))}
            </div>

            {activeSection === "wallet" && (
                <section className="ws-panel max-w-2xl" aria-labelledby="wallet-title">
                    <div className="ws-panel-heading">
                        <div><h2 id="wallet-title">Wallet adjustment</h2><p>Credit or debit any user or reseller wallet directly. Every adjustment is written to the ledger.</p></div>
                    </div>

                    <div className="space-y-4">
                        <div className="ws-options" role="group" aria-label="Adjustment type">
                            <button type="button" className="ws-option" aria-pressed={walletAction === "credit"} onClick={() => setWalletAction("credit")}>
                                <ArrowUpIcon aria-hidden="true" /><span>Credit</span><small>Add funds to the wallet.</small>
                            </button>
                            <button type="button" className="ws-option" aria-pressed={walletAction === "debit"} onClick={() => setWalletAction("debit")}>
                                <ArrowDownIcon aria-hidden="true" /><span>Debit</span><small>Remove funds from the wallet.</small>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Entity type">
                                <select className={selectClasses} value={walletForm.entity_type} onChange={(e) => setWalletForm({ ...walletForm, entity_type: e.target.value })}>
                                    <option value="User">User</option>
                                    <option value="Reseller">Reseller</option>
                                </select>
                            </Field>
                            <Field label="Email" error={walletErrors.email}>
                                <input className={inputClasses} type="email" value={walletForm.email} onChange={(e) => setWalletForm({ ...walletForm, email: e.target.value })} placeholder="user@example.com" />
                            </Field>
                            <Field label="Amount ($)" error={walletErrors.amount}>
                                <input className={inputClasses} type="number" step="0.01" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} placeholder="100.00" />
                            </Field>
                            <Field label="Description">
                                <input className={inputClasses} value={walletForm.description} onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })} placeholder="Reason for adjustment" />
                            </Field>
                        </div>
                        <div className="flex justify-end">
                            <Button variant={walletAction === "credit" ? "primary" : "danger"} onClick={handleWalletAction} loading={walletLoading}>
                                {walletLoading ? "Processing…" : `${walletAction === "credit" ? "Credit" : "Debit"} wallet`}
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {activeSection === "categories" && (
                <section className="overview-services" style={{ marginBottom: 0 }} aria-labelledby="categories-title">
                    <div className="overview-section-heading">
                        <div><h2 id="categories-title">Product categories</h2><p>{categories.length} categories group the product catalogue.</p></div>
                        <Button onClick={() => setShowCategoryModal(true)} size="sm"><PlusIcon /> Add category</Button>
                    </div>
                    <div className="ws-grid">
                        {categoriesLoading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="overview-service">
                                    <span className="overview-skeleton" />
                                    <span className="overview-skeleton" style={{ marginTop: 12, maxWidth: 80 }} />
                                </div>
                            ))
                            : categories.map((cat) => (
                                <div key={cat.id} className="overview-service">
                                    <div className="overview-service-top"><ServerStackIcon width={18} height={18} aria-hidden="true" /><span className="ws-mono">{cat.slug}</span></div>
                                    <h3>{cat.name}</h3>
                                    <p>{cat.products_count} product{cat.products_count === 1 ? "" : "s"}</p>
                                </div>
                            ))}
                    </div>

                    <FormModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Create product category" onSubmit={handleCreateCategory} submitLabel="Create" loading={createCategory.isLoading}>
                        <Field label="Name"><input className={inputClasses} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Proxies" /></Field>
                        <Field label="Slug (optional)"><input className={inputClasses} value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="auto-generated if empty" /></Field>
                    </FormModal>
                </section>
            )}

            {activeSection === "system" && (
                <>
                    <div className="overview-metrics" style={{ marginBottom: 0 }}>
                        {[
                            { label: "Users", value: systemInfo?.total_users },
                            { label: "Resellers", value: systemInfo?.total_resellers },
                            { label: "Orders", value: systemInfo?.total_orders },
                            { label: "Products", value: systemInfo?.total_products },
                        ].map((m) => (
                            <div className="overview-metric" key={m.label}>
                                <span>{m.label}</span>
                                {systemLoading ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong>{m.value ?? "—"}</strong>}
                            </div>
                        ))}
                    </div>

                    {systemInfo && (
                        <div className="ws-grid-2">
                            <section className="ws-panel" aria-labelledby="env-title">
                                <div className="ws-panel-heading"><div><h2 id="env-title">Environment</h2><p>Runtime versions for this deployment.</p></div></div>
                                <dl className="ws-rows">
                                    <div><dt>Rails</dt><dd className="ws-mono">{systemInfo.rails_version}</dd></div>
                                    <div><dt>Ruby</dt><dd className="ws-mono">{systemInfo.ruby_version}</dd></div>
                                    <div><dt>Environment</dt><dd className="ws-mono">{systemInfo.environment}</dd></div>
                                    <div><dt>Active subscriptions</dt><dd>{systemInfo.active_subscriptions}</dd></div>
                                </dl>
                            </section>
                            <section className="ws-panel" aria-labelledby="gateways-title">
                                <div className="ws-panel-heading"><div><h2 id="gateways-title">Payment gateways</h2><p>Gateways with credentials configured on the server.</p></div></div>
                                <ul className="ws-list">
                                    {Object.entries(systemInfo.gateways).map(([name, active]) => (
                                        <li key={name}>
                                            <span className="flex items-center gap-2 capitalize">
                                                {active ? <CheckCircleIcon className="h-4 w-4 ws-good" aria-hidden="true" /> : <XCircleIcon className="h-4 w-4 ws-bad" aria-hidden="true" />}
                                                {name}
                                            </span>
                                            <span className="ws-status" data-tone={active ? "good" : "bad"}>{active ? "Active" : "Not configured"}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
