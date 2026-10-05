import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon,
    GlobeAltIcon, CpuChipIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, ShieldCheckIcon,
    ArrowLeftIcon, BuildingStorefrontIcon, ArrowRightIcon, ShoppingCartIcon
} from "@heroicons/react/24/outline";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import AdminPurchaseView from "./AdminPurchaseView";

import {
    useAdminProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useSyncProducts,
    type SyncType,
} from "../queries/products.queries";

interface CategoryColors {
    border: string;
    bg: string;
    bgSubtle: string;
    text: string;
    glow: string;
}

const COLOR_MAP: Record<string, CategoryColors> = {
    blue:   { border: "hover:border-blue-500/50",   bg: "bg-blue-500/10",   bgSubtle: "bg-blue-500/5",   text: "text-blue-500",   glow: "group-hover:bg-blue-500/10"   },
    purple: { border: "hover:border-purple-500/50", bg: "bg-purple-500/10", bgSubtle: "bg-purple-500/5", text: "text-purple-500", glow: "group-hover:bg-purple-500/10" },
    orange: { border: "hover:border-orange-500/50", bg: "bg-orange-500/10", bgSubtle: "bg-orange-500/5", text: "text-orange-500", glow: "group-hover:bg-orange-500/10" },
    green:  { border: "hover:border-green-500/50",  bg: "bg-green-500/10",  bgSubtle: "bg-green-500/5",  text: "text-green-500",  glow: "group-hover:bg-green-500/10"  },
    red:    { border: "hover:border-red-500/50",    bg: "bg-red-500/10",    bgSubtle: "bg-red-500/5",    text: "text-red-500",    glow: "group-hover:bg-red-500/10"    },
};

interface ProductRow {
    id: number;
    name: string;
    description: string;
    product_type: string;
    provider: string;
    stock_status: string;
    active: boolean;
    metadata: Record<string, unknown>;
    product_category_name?: string;
    product_category_id?: number;
    created_at: string;
}

const STORE_CATEGORIES = [
    {
        id: "proxy",
        name: "Proxies",
        description: "Datacenter, Residential, and Mobile proxies",
        icon: GlobeAltIcon,
        color: "blue",
        types: ["proxy", "datacenter", "isp", "premium_isp", "global_isp", "static_residential", "residential_rotating", "mobile"],
        syncs: [{ type: "proxies" as SyncType, label: "Sync Proxies" }]
    },
    {
        id: "vps",
        name: "Cloud VPS",
        description: "High-performance virtual private servers",
        icon: CpuChipIcon,
        color: "purple",
        types: ["vps"],
        syncs: [{ type: "vps" as SyncType, label: "Sync VPS" }]
    },
    {
        id: "rdp",
        name: "Remote Desktop (RDP)",
        description: "Windows instances with full admin access",
        icon: ComputerDesktopIcon,
        color: "orange",
        types: ["rdp"],
        syncs: [{ type: "rdp" as SyncType, label: "Sync RDP" }]
    },
    {
        id: "esim",
        name: "Global eSIM",
        description: "Travel data plans and US phone-number lines",
        icon: DevicePhoneMobileIcon,
        color: "green",
        types: ["esim"],
        syncs: [
            { type: "esims" as SyncType, label: "Sync eSIM Access" },
            { type: "meisim" as SyncType, label: "Sync MeiSIM" },
        ]
    },
    {
        id: "vpn",
        name: "Premium VPN",
        description: "Secure and private internet access",
        icon: ShieldCheckIcon,
        color: "red",
        types: ["vpn"],
        syncs: [{ type: "vpn" as SyncType, label: "Sync VPN" }]
    }
];

interface ProductsTabProps {
    // Opened from Management for one category: show only that category's catalogue.
    category?: string;
}

export default function ProductsTab({ category }: ProductsTabProps = {}) {
    const [tabMode, setTabMode] = useState<"root" | "management" | "purchase">(category ? "management" : "root");
    const [activeCategory, setActiveCategory] = useState<string | null>(category ?? null);
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
    const [providerFilter, setProviderFilter] = useState("all");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        product_type: "proxy",
        provider: "",
        stock_status: "in_stock",
        active: true,
        metadataString: "{}"
    });

    const { data: productsData, isLoading } = useAdminProducts();
    const products: ProductRow[] = productsData?.products || [];

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();
    const syncProducts = useSyncProducts();

    const activeCatData = STORE_CATEGORIES.find(c => c.id === activeCategory);
    const categoryProducts = activeCatData
        ? products.filter(p => activeCatData.types.includes(p.product_type))
        : products;
    const categoryProviders = [...new Set(categoryProducts.map(p => p.provider).filter(Boolean))].sort();
    const filteredProducts = providerFilter !== "all"
        ? categoryProducts.filter(p => p.provider === providerFilter)
        : categoryProducts;

    const openModal = (mode: "create" | "edit", product?: ProductRow) => {
        setModalMode(mode);
        if (mode === "edit" && product) {
            setSelectedProduct(product);
            setFormData({
                name: product.name || "",
                description: product.description || "",
                product_type: product.product_type || "proxy",
                provider: product.provider || "",
                stock_status: product.stock_status || "in_stock",
                active: product.active,
                metadataString: JSON.stringify(product.metadata || {}, null, 2)
            });
        } else {
            setSelectedProduct(null);
            
            let defaultMetadata = {};
            if (activeCatData?.id === 'esim') {
                defaultMetadata = {
                    esim_type: "data_only",
                    data_gb: 10,
                    duration_days: 30,
                    country_code: "US",
                    network_operator: "Lyca Mobile"
                };
            }

            setFormData({
                name: "",
                description: "",
                product_type: activeCatData?.types[0] || "proxy",
                provider: "inhouse", // Manual products are in-house
                stock_status: "in_stock",
                active: true,
                metadataString: JSON.stringify(defaultMetadata, null, 2)
            });
        }
    };


    const handleSubmit = async () => {
        let parsedMetadata = {};
        try {
            parsedMetadata = JSON.parse(formData.metadataString);
        } catch {
            toast.error("Invalid JSON in Metadata");
            return;
        }

        const payload = { ...formData, metadata: parsedMetadata, metadataString: undefined };

        if (modalMode === "create") {
            await createProduct.mutateAsync(payload as Record<string, unknown>);
        } else if (modalMode === "edit" && selectedProduct) {
            await updateProduct.mutateAsync({ id: selectedProduct.id, data: payload as Record<string, unknown> });
        }
        setModalMode(null);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteProduct.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleSync = (sync: { type: SyncType; label: string }) => {
        if (!window.confirm(`${sync.label}? This updates plans and prices from the provider.`)) return;
        syncProducts.mutate(sync.type);
    };

    const toggleActive = (row: ProductRow) =>
        updateProduct.mutate({ id: row.id, data: { active: !row.active } });


    const columns = [
        { key: "id", label: "ID", render: (row: ProductRow) => <span className="text-muted-foreground">#{row.id}</span> },
        {
            key: "name", label: "Product", sortable: true, render: (row: ProductRow) => (
                <div>
                    <div className="flex items-center gap-2">
                        {row.metadata?.country_code ? (
                            <img
                                src={`https://flagcdn.com/w20/${String(row.metadata.country_code).toLowerCase()}.png`}
                                alt={String(row.metadata.country_code)}
                                className="h-3 w-5 object-cover rounded-sm border border-border/50"
                            />
                        ) : null}
                        <p className="text-sm font-medium text-foreground">{row.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{row.provider}</p>
                        {row.metadata?.locations ? (
                            <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">
                                {Array.isArray(row.metadata.locations) ? (row.metadata.locations as string[]).join(', ') : String(row.metadata.locations)}
                            </span>
                        ) : null}
                    </div>
                </div>
            )
        },
        { key: "product_type", label: "Type", render: (row: ProductRow) => (
            <div className="flex flex-col gap-1">
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase w-fit">{row.product_type}</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase w-fit tracking-tighter shadow-sm border ${
                    row.provider === 'inhouse' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                    {row.provider === 'inhouse' ? 'In-House' : row.provider}
                </span>
            </div>
        )},
        { key: "stock_status", label: "Stock", render: (row: ProductRow) => <StatusBadge status={row.stock_status === "in_stock" ? "success" : "warning"} /> },
        { key: "active", label: "Active", render: (row: ProductRow) => (
            <button
                type="button"
                role="switch"
                aria-checked={row.active}
                aria-label={`${row.active ? "Deactivate" : "Activate"} ${row.name}`}
                onClick={() => toggleActive(row)}
                disabled={updateProduct.isLoading}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${row.active ? "bg-green-500" : "bg-muted-foreground/30"}`}
            >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${row.active ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
        ) },
    ];



    if (tabMode === "purchase") {
        return <AdminPurchaseView onBack={() => setTabMode("root")} />;
    }

    if (tabMode === "root") {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Products & Provisioning</h1>
                    <p className="text-sm text-muted-foreground">Manage the product catalog or provision products for users.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        whileHover={{ y: -4 }}
                        onClick={() => setTabMode("management")}
                        className="bg-card cursor-pointer border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden hover:border-blue-500/50"
                    >
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BuildingStorefrontIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Product Management</h3>
                        <p className="text-sm text-muted-foreground">Create, edit, sync, and delete products from the catalog.</p>
                    </motion.div>
                    
                    <motion.div
                        whileHover={{ y: -4 }}
                        onClick={() => setTabMode("purchase")}
                        className="bg-card cursor-pointer border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden hover:border-green-500/50"
                    >
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingCartIcon className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Provision Service</h3>
                        <p className="text-sm text-muted-foreground">Configure and instantly provision a product to a user's email.</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!activeCategory ? (
                    <motion.div
                        key="store"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                            <button
                                onClick={() => setTabMode("root")}
                                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <div className="h-8 w-px bg-border" />
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <BuildingStorefrontIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Service Catalog</h1>
                                <p className="text-sm text-muted-foreground">Manage existing products and stock.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {STORE_CATEGORIES.map((cat) => (
                                <motion.div
                                    key={cat.id}
                                    whileHover={{ y: -4 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`bg-card cursor-pointer border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${COLOR_MAP[cat.color]?.border}`}
                                >
                                    <div className={`absolute -right-4 -top-4 w-32 h-32 ${COLOR_MAP[cat.color]?.bgSubtle} rounded-full blur-2xl ${COLOR_MAP[cat.color]?.glow} transition-colors`} />
                                    <div className={`w-12 h-12 rounded-xl ${COLOR_MAP[cat.color]?.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <cat.icon className={`w-6 h-6 ${COLOR_MAP[cat.color]?.text}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">{cat.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-6">{cat.description}</p>
                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold bg-muted text-foreground px-2 py-1 rounded-md">
                                                {products.filter(p => cat.types.includes(p.product_type)).length} Products
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                                            Manage <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="category"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                            {/* Inside Management the page heading already names the category. */}
                            {!category && (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { setActiveCategory(null); setProviderFilter("all"); }}
                                        className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                                    >
                                        <ArrowLeftIcon className="h-5 w-5" />
                                    </button>
                                    <div className="h-8 w-px bg-border" />
                                    <div className={`h-10 w-10 ${activeCatData ? COLOR_MAP[activeCatData.color]?.bg : ""} rounded-lg flex items-center justify-center`}>
                                        {activeCatData && <activeCatData.icon className={`h-5 w-5 ${COLOR_MAP[activeCatData.color]?.text}`} />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">{activeCatData?.name}</h2>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 ml-auto">
                                {categoryProviders.length > 1 && (
                                    <select
                                        aria-label="Filter by provider"
                                        value={providerFilter}
                                        onChange={e => setProviderFilter(e.target.value)}
                                        className="px-3 py-2 bg-muted rounded-xl text-sm border border-border text-foreground"
                                    >
                                        <option value="all">All providers</option>
                                        {categoryProviders.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                )}
                                {activeCatData?.syncs.map(sync => (
                                    <button
                                        key={sync.type}
                                        onClick={() => handleSync(sync)}
                                        disabled={syncProducts.isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border transition-colors rounded-xl text-sm font-medium border border-border disabled:opacity-50 text-foreground"
                                    >
                                        <ArrowPathIcon className={`h-4 w-4 ${syncProducts.isLoading && syncProducts.variables === sync.type ? 'animate-spin' : ''}`} />
                                        {sync.label}
                                    </button>
                                ))}
                                <Button onClick={() => openModal("create")}>
                                    <PlusIcon className="h-4 w-4" /> Add Product
                                </Button>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <DataTable
                                columns={columns}
                                data={filteredProducts}
                                loading={isLoading}
                                emptyMessage={<EmptyState icon={BuildingStorefrontIcon} title={`No ${activeCatData?.name} found`} description="Click Sync or Add Product to populate." action={activeCatData ? { label: activeCatData.syncs[0].label, onClick: () => handleSync(activeCatData.syncs[0]) } : undefined} />}
                                actions={(row: ProductRow) => (
                                    <div className="flex items-center justify-end gap-2 pr-2">
                                        <button onClick={() => openModal("edit", row)} aria-label="Edit product" className="p-1.5 text-muted-foreground hover:text-blue-400 hover:bg-muted rounded-lg transition-colors">
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(row)} aria-label="Delete product" className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <FormModal
                open={!!modalMode} onClose={() => setModalMode(null)}
                title={modalMode === "create" ? "Add Custom Product" : "Edit Product"}
                onSubmit={handleSubmit} submitLabel={modalMode === "create" ? "Create" : "Save Changes"}
                loading={createProduct.isLoading || updateProduct.isLoading}
            >
                {modalMode === "create" && (
                    <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl mb-4 text-xs text-blue-400">
                        <strong>Note:</strong> You are creating a custom <strong>In-House</strong> product. 
                        API-based products (like Global eSIMs) should be managed via the <strong>Sync</strong> tool.
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Name *"><input className={inputClasses} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Field>
                    <Field label="Type *">
                        <select className={inputClasses} value={formData.product_type} onChange={e => setFormData({ ...formData, product_type: e.target.value })} required>
                            {activeCatData?.types.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Provider"><input className={inputClasses} value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} /></Field>
                    <Field label="Stock">
                        <select className={inputClasses} value={formData.stock_status} onChange={e => setFormData({ ...formData, stock_status: e.target.value })}>
                            <option value="in_stock">In Stock</option><option value="out_of_stock">Out of Stock</option>
                        </select>
                    </Field>
                </div>
                <Field label="Description"><textarea className={inputClasses} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Field>
                <Field label="Metadata (JSON)"><textarea className={`${inputClasses} font-mono text-xs h-32`} value={formData.metadataString} onChange={e => setFormData({ ...formData, metadataString: e.target.value })} /></Field>
                <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm font-medium"><input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
            </FormModal>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Product"
                message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                loading={deleteProduct.isLoading}
            />
        </div>
    );
}
