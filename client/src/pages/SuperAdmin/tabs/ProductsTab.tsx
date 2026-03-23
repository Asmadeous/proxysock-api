import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon,
    GlobeAltIcon, CpuChipIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, ShieldCheckIcon,
    ArrowLeftIcon, BuildingStorefrontIcon, ArrowRightIcon
} from "@heroicons/react/24/outline";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import FormModal, { Field, inputClasses } from "../components/FormModal";

import {
    fetchAdminProducts,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    syncAdminProxies,
    syncAdminEsims,
    syncAdminVPS,
    syncAdminVPN,
    syncAdminRDP
} from "../../../services/adminApi";

interface ProductRow {
    id: number;
    name: string;
    description: string;
    product_type: string;
    provider: string;
    stock_status: string;
    is_active: boolean;
    metadata: Record<string, any>;
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
        syncAction: syncAdminProxies,
        syncLabel: "Sync Proxies"
    },
    {
        id: "vps",
        name: "Cloud VPS",
        description: "High-performance virtual private servers",
        icon: CpuChipIcon,
        color: "purple",
        types: ["vps"],
        syncAction: syncAdminVPS,
        syncLabel: "Sync VPS"
    },
    {
        id: "rdp",
        name: "Remote Desktop (RDP)",
        description: "Windows instances with full admin access",
        icon: ComputerDesktopIcon,
        color: "orange",
        types: ["rdp"],
        syncAction: syncAdminRDP,
        syncLabel: "Sync RDP"
    },
    {
        id: "esim",
        name: "Global eSIM",
        description: "Travel data plans for 190+ countries",
        icon: DevicePhoneMobileIcon,
        color: "green",
        types: ["esim", "usa_esim"],
        syncAction: syncAdminEsims,
        syncLabel: "Sync eSIMs" // using eSimAccess
    },
    {
        id: "vpn",
        name: "Premium VPN",
        description: "Secure and private internet access",
        icon: ShieldCheckIcon,
        color: "red",
        types: ["vpn"],
        syncAction: syncAdminVPN,
        syncLabel: "Sync VPN"
    }
];

export default function ProductsTab() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        product_type: "proxy",
        provider: "",
        stock_status: "in_stock",
        is_active: true,
        metadataString: "{}"
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAdminProducts();
            setProducts(res.data.products || []);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const activeCatData = STORE_CATEGORIES.find(c => c.id === activeCategory);
    const filteredProducts = activeCatData
        ? products.filter(p => activeCatData.types.includes(p.product_type))
        : products;

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
                is_active: product.is_active,
                metadataString: JSON.stringify(product.metadata || {}, null, 2)
            });
        } else {
            setSelectedProduct(null);
            setFormData({
                name: "",
                description: "",
                product_type: activeCatData?.types[0] || "proxy",
                provider: "",
                stock_status: "in_stock",
                is_active: true,
                metadataString: "{}"
            });
        }
    };

    const handleSubmit = async () => {
        setActionLoading(true);
        try {
            let parsedMetadata = {};
            try {
                parsedMetadata = JSON.parse(formData.metadataString);
            } catch (e) {
                toast.error("Invalid JSON in Metadata");
                setActionLoading(false);
                return;
            }

            const payload = {
                ...formData,
                metadata: parsedMetadata,
                metadataString: undefined // remove before send
            };

            if (modalMode === "create") {
                await createAdminProduct(payload);
                toast.success("Product created");
            } else if (modalMode === "edit" && selectedProduct) {
                await updateAdminProduct(selectedProduct.id, payload);
                toast.success("Product updated");
            }
            setModalMode(null);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.errors?.[0] || "Failed to save product");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteAdminProduct(id);
            toast.success("Product deleted");
            load();
        } catch {
            toast.error("Failed to delete product");
        }
    };

    const handleSync = async () => {
        if (!activeCatData) return;
        if (!window.confirm(`Are you sure you want to sync ${activeCatData.name} products? This might take a few moments and syncs external/internal sources.`)) return;
        
        setActionLoading(true);
        try {
            await activeCatData.syncAction();
            toast.success(`${activeCatData.name} synced successfully`);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.error || `Failed to sync ${activeCatData.name}`);
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: "id", label: "ID", render: (row: ProductRow) => <span className="text-muted-foreground">#{row.id}</span> },
        {
            key: "name", label: "Product", sortable: true, render: (row: ProductRow) => (
                <div>
                    <div className="flex items-center gap-2">
                        {row.metadata?.country_code && (
                            <img 
                                src={`https://flagcdn.com/w20/${row.metadata.country_code.toLowerCase()}.png`} 
                                alt={row.metadata.country_code}
                                className="h-3 w-5 object-cover rounded-sm border border-border/50"
                            />
                        )}
                        <p className="text-sm font-medium text-foreground">{row.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{row.provider}</p>
                        {row.metadata?.locations && (
                            <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">
                                {Array.isArray(row.metadata.locations) ? row.metadata.locations.join(', ') : row.metadata.locations}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: "product_type", label: "Sub-Type", sortable: true, render: (row: ProductRow) => (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-muted text-muted-foreground border border-border">
                    {row.product_category_name || row.product_type}
                </span>
            )
        },
        { key: "stock_status", label: "Stock", render: (row: ProductRow) => <StatusBadge status={row.stock_status === "in_stock" ? "success" : "warning"} /> },
        { key: "is_active", label: "Active", render: (row: ProductRow) => <StatusBadge status={row.is_active ? "active" : "inactive"} /> },
    ];


    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!activeCategory ? (
                    // ── STORE CATALOG VIEW ──────────────────────────────────────────
                    <motion.div 
                        key="store"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <BuildingStorefrontIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Service Store</h1>
                                <p className="text-sm text-muted-foreground">
                                    Select a category to browse, manage, and synchronize our premium services.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {STORE_CATEGORIES.map((cat) => (
                                <motion.div
                                    key={cat.id}
                                    whileHover={{ y: -4 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`bg-card cursor-pointer border border-border hover:border-${cat.color}-500/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}
                                >
                                    <div className={`absolute -right-4 -top-4 w-32 h-32 bg-${cat.color}-500/5 rounded-full blur-2xl group-hover:bg-${cat.color}-500/10 transition-colors`} />
                                    
                                    <div className={`w-12 h-12 rounded-xl bg-${cat.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <cat.icon className={`w-6 h-6 text-${cat.color}-500`} />
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
                    // ── CATEGORY PRODUCTS VIEW ──────────────────────────────────────
                    <motion.div 
                        key="category"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setActiveCategory(null)}
                                    className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                                >
                                    <ArrowLeftIcon className="h-5 w-5" />
                                </button>
                                <div className="h-8 w-px bg-border"></div>
                                <div className={`h-10 w-10 bg-${activeCatData?.color}-500/10 rounded-lg flex items-center justify-center`}>
                                   {activeCatData && <activeCatData.icon className={`h-5 w-5 text-${activeCatData.color}-500`} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground leading-tight">{activeCatData?.name}</h2>
                                    <span className="text-xs text-muted-foreground">{filteredProducts.length} items configured</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSync}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border transition-colors rounded-xl text-sm font-medium border border-border disabled:opacity-50 text-foreground"
                                >
                                    <ArrowPathIcon className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} /> 
                                    {activeCatData?.syncLabel}
                                </button>
                                <button onClick={() => openModal("create")} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors rounded-xl text-sm font-medium">
                                    <PlusIcon className="h-4 w-4" /> Add Product
                                </button>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <DataTable
                                columns={columns}
                                data={filteredProducts}
                                loading={loading}
                                emptyMessage={`No ${activeCatData?.name} found. Click Sync or Add Product to populate.`}
                                actions={(row: ProductRow) => (
                                    <div className="flex items-center justify-end gap-2 pr-2">
                                        <button onClick={() => openModal("edit", row)} className="p-1.5 text-muted-foreground hover:text-blue-400 hover:bg-muted rounded-lg transition-colors">
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-muted rounded-lg transition-colors">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
            <FormModal
                open={!!modalMode} onClose={() => setModalMode(null)}
                title={modalMode === "create" ? "Add Custom Product" : "Edit Product"}
                onSubmit={handleSubmit} submitLabel={modalMode === "create" ? "Create" : "Save Changes"}
                loading={actionLoading}
            >
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Name *">
                        <input className={inputClasses} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </Field>
                    <Field label="Specific Type *">
                        <select className={inputClasses} value={formData.product_type} onChange={e => setFormData({ ...formData, product_type: e.target.value })} required>
                            {activeCatData?.types.map(t => (
                                <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Backend Provider">
                        <input className={inputClasses} value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} placeholder="e.g. inhouse, proxmox" />
                    </Field>
                    <Field label="Stock Status">
                        <select className={inputClasses} value={formData.stock_status} onChange={e => setFormData({ ...formData, stock_status: e.target.value })}>
                            <option value="in_stock">In Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="discontinued">Discontinued</option>
                        </select>
                    </Field>
                </div>
                <Field label="Description">
                    <textarea className={`${inputClasses} h-20 resize-y`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </Field>
                <Field label="Metadata (JSON Object)">
                    <textarea className={`${inputClasses} font-mono text-xs h-32 resize-y`} value={formData.metadataString} onChange={e => setFormData({ ...formData, metadataString: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-muted border-border text-primary focus:ring-primary cursor-pointer" />
                    <span className="text-sm font-medium text-foreground">Is Active?</span>
                </label>
            </FormModal>
        </div>
    );
}
