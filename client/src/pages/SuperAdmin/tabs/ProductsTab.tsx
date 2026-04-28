import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { getApiError } from "../../../utils/apiError";
import { motion, AnimatePresence } from "framer-motion";
import {
    PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon,
    GlobeAltIcon, CpuChipIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, ShieldCheckIcon,
    ArrowLeftIcon, BuildingStorefrontIcon, ArrowRightIcon,
    PhotoIcon, DocumentChartBarIcon, CheckCircleIcon, XCircleIcon
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
    syncAdminRDP,
    fetchAdminUsaCredentials,
    importUsaCredentials,
    deleteAdminUsaCredential
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

interface UsaCredentialRow {
    id: string;
    iccid: string;
    provider: string;
    status: string;
    has_qr_image: boolean;
    qr_image_url?: string;
    qr_activation_code?: string;
    created_at: string;
    assigned_at?: string;
    order_id?: string;
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
        syncLabel: "Sync eSIMs"
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

    // USA Credentials State
    const [showInventory, setShowInventory] = useState(false);
    const [credentials, setCredentials] = useState<UsaCredentialRow[]>([]);
    const [credsLoading, setCredsLoading] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    
    // Refs for USA Import
    const fileRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);

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

    const loadCredits = useCallback(async () => {
        setCredsLoading(true);
        try {
            const res = await fetchAdminUsaCredentials();
            setCredentials(res.data.credentials || []);
        } catch {
            toast.error("Failed to load USA credentials");
        } finally {
            setCredsLoading(false);
        }
    }, []);

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
                is_active: true,
                metadataString: JSON.stringify(defaultMetadata, null, 2)
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
            toast.error(getApiError(err, "Failed to save product"));
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
        if (!window.confirm(`Are you sure you want to sync ${activeCatData.name} products?`)) return;
        
        setActionLoading(true);
        try {
            await activeCatData.syncAction();
            toast.success(`${activeCatData.name} synced successfully`);
            load();
        } catch (err: any) {
            toast.error(getApiError(err, `Failed to sync ${activeCatData.name}`));
        } finally {
            setActionLoading(false);
        }
    };

    const handleImport = async () => {
        if (!excelFile) {
            toast.error("Please select an Excel file");
            return;
        }

        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", excelFile);
            formData.append("provider", "lyca");
            imageFiles.forEach((file) => {
                formData.append("images[]", file);
            });

            const res = await importUsaCredentials(formData);
            const { imported, updated, image_matched } = res.data;

            toast.success(`Imported: ${imported}, Updated: ${updated}, Matched ${image_matched} images.`);
            
            setImportModalOpen(false);
            setExcelFile(null);
            setImageFiles([]);
            loadCredits();
        } catch (err: any) {
            toast.error(getApiError(err, "Failed to import credentials"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCred = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteAdminUsaCredential(id);
            toast.success("Credential deleted");
            loadCredits();
        } catch (err: any) {
            toast.error(getApiError(err, "Failed to delete product"));
        }
    };

    const toggleInventory = () => {
        const next = !showInventory;
        setShowInventory(next);
        if (next) loadCredits();
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
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mt-0.5">{row.provider}</p>
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
        { key: "is_active", label: "Active", render: (row: ProductRow) => <StatusBadge status={row.is_active ? "active" : "inactive"} /> },
    ];

    const credentialColumns = [
        { key: "iccid", label: "ICCID", sortable: true, render: (row: UsaCredentialRow) => (
            <div className="flex flex-col">
                <span className="font-mono text-xs font-medium">{row.iccid}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{row.provider}</span>
            </div>
        )},
        { key: "qr_activation_code", label: "Activation Code", render: (row: UsaCredentialRow) => (
            <div className="max-w-[200px] truncate text-xs font-mono text-muted-foreground">{row.qr_activation_code}</div>
        )},
        { key: "has_qr_image", label: "QR Image", render: (row: UsaCredentialRow) => (
            row.has_qr_image ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-muted-foreground/30" />
        )},
        { key: "status", label: "Status", render: (row: UsaCredentialRow) => <StatusBadge status={row.status === "available" ? "active" : "inactive"} /> },
    ];

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!activeCategory ? (
                    <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <BuildingStorefrontIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Service Store</h1>
                                <p className="text-sm text-muted-foreground">Select a category to browse and manage services.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {STORE_CATEGORIES.map((cat) => (
                                <div key={cat.id} onClick={() => { setActiveCategory(cat.id); setShowInventory(false); }} className={`bg-card cursor-pointer border border-border hover:border-primary/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}>
                                    <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4`}>
                                        <cat.icon className={`w-6 h-6 text-primary`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">{cat.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-6">{cat.description}</p>
                                    <div className="flex items-center justify-between text-sm font-medium text-primary">
                                        <span>{products.filter(p => cat.types.includes(p.product_type)).length} Products</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveCategory(null)} className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-border">
                                    <ArrowLeftIcon className="h-5 w-5" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{activeCatData?.name}</h2>
                                    <span className="text-xs text-muted-foreground">{showInventory ? "Inventory Management" : "Product Configuration"}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={handleSync} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border transition-colors rounded-xl text-sm font-medium border border-border disabled:opacity-50 text-foreground">
                                    <ArrowPathIcon className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} /> Sync
                                </button>
                                {activeCategory === 'esim' && (
                                    <button onClick={toggleInventory} className={`flex items-center gap-2 px-4 py-2 transition-colors rounded-xl text-sm font-medium border ${showInventory ? 'bg-blue-500 text-white' : 'bg-muted border-border text-foreground'}`}>
                                        <DevicePhoneMobileIcon className="h-4 w-4" />
                                        {showInventory ? "View Products" : "Manage USA Inventory"}
                                    </button>
                                )}
                                {!showInventory ? (
                                    <button onClick={() => openModal("create")} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors rounded-xl text-sm font-medium">
                                        <PlusIcon className="h-4 w-4" /> Add In-House {activeCatData?.name?.replace('Global ', '').replace('Premium ', '')}
                                    </button>
                                ) : (
                                    <button onClick={() => setImportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl text-sm font-medium shadow-sm">
                                        <PlusIcon className="h-4 w-4" /> Bulk Import Credentials
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            {showInventory ? (
                                <DataTable
                                    columns={credentialColumns}
                                    data={credentials}
                                    loading={credsLoading}
                                    actions={(row: UsaCredentialRow) => (
                                        <div className="flex items-center justify-end gap-2 pr-2">
                                            {row.status === 'available' && (
                                                <button onClick={() => handleDeleteCred(row.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-muted rounded-lg transition-colors">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                />
                            ) : (
                                <DataTable
                                    columns={columns}
                                    data={filteredProducts}
                                    loading={loading}
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
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <FormModal 
                open={!!modalMode} 
                onClose={() => setModalMode(null)} 
                title={modalMode === "create" ? `Create New In-House ${activeCatData?.name} Product` : `Edit ${selectedProduct?.provider === 'inhouse' ? 'In-House' : 'API'} Product`} 
                onSubmit={handleSubmit} 
                loading={actionLoading}
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
                <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm font-medium"><input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} /> Active</label>
            </FormModal>

            {/* USA Import Modal */}
            <FormModal open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Bulk Import (Lyca)" onSubmit={handleImport} loading={actionLoading}>
                <div className="space-y-4">
                    <div onClick={() => fileRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer ${excelFile ? 'border-green-500 bg-green-500/5' : 'border-border'}`}>
                        <DocumentChartBarIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm mt-2">{excelFile ? excelFile.name : "Select Excel File (.xlsx)"}</span>
                        <input type="file" ref={fileRef} className="hidden" accept=".xlsx" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
                    </div>
                    <div onClick={() => imageRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer ${imageFiles.length > 0 ? 'border-green-500 bg-green-500/5' : 'border-border'}`}>
                        <PhotoIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm mt-2">{imageFiles.length > 0 ? `${imageFiles.length} Images Selected` : "Select QR Code Images"}</span>
                        <input type="file" ref={imageRef} className="hidden" multiple accept="image/png" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
                    </div>
                </div>
            </FormModal>
        </div>
    );
}
