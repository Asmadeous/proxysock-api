import { useState } from "react";
import { toast } from "sonner";
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
import PageHeader from "../components/PageHeader";
import AdminPurchaseView from "./AdminPurchaseView";

import {
    useAdminProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useSyncProducts,
    type SyncType,
} from "../queries/products.queries";

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
                        <p className="text-[10px] uppercase font-medium text-muted-foreground/60 tracking-wider">{row.provider}</p>
                        {row.metadata?.locations ? (
                            <span className="ws-status" data-tone="info">
                                {Array.isArray(row.metadata.locations) ? (row.metadata.locations as string[]).join(', ') : String(row.metadata.locations)}
                            </span>
                        ) : null}
                    </div>
                </div>
            )
        },
        { key: "product_type", label: "Type", render: (row: ProductRow) => (
            <div className="flex flex-col gap-1">
                <span className="ws-status w-fit uppercase">{row.product_type}</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-medium uppercase w-fit tracking-tight  border ${
                    row.provider === 'inhouse' 
                        ? 'bg-[var(--ov-wash)] ws-info border-[var(--ov-line)]' 
                        : 'bg-[var(--ov-wash)] ws-good border-[var(--ov-line)]'
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
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${row.active ? "bg-[var(--ov-accent)]" : "bg-[var(--ov-line)]"}`}
            >
                <span className={`inline-block h-4 w-4 rounded-full bg-white  transition-transform ${row.active ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
        ) },
    ];



    if (tabMode === "purchase") {
        return <AdminPurchaseView onBack={() => setTabMode("root")} />;
    }

    if (tabMode === "root") {
        return (
            <div className="ws-stack">
                <PageHeader title="Products & provisioning" description="Manage the product catalogue or provision a product for a customer." />
                <div className="ws-grid-2">
                    <button type="button" onClick={() => setTabMode("management")} className="overview-service text-left">
                        <div className="overview-service-top"><BuildingStorefrontIcon width={18} height={18} aria-hidden="true" /><span>Catalogue</span></div>
                        <h3>Product Management</h3>
                        <p>Create, edit, sync and delete products in the catalogue.</p>
                        <span className="mt-4 inline-flex items-center gap-2 text-[11px] text-[var(--ov-accent)]">Open <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    </button>
                    <button type="button" onClick={() => setTabMode("purchase")} className="overview-service text-left">
                        <div className="overview-service-top"><ShoppingCartIcon width={18} height={18} aria-hidden="true" /><span>Provision</span></div>
                        <h3>Provision Service</h3>
                        <p>Configure and instantly provision a product to a customer's email.</p>
                        <span className="mt-4 inline-flex items-center gap-2 text-[11px] text-[var(--ov-accent)]">Open <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ws-stack">
            {!activeCategory ? (
                <>
                    <PageHeader
                        title="Service catalogue"
                        description="Pick a category to manage its products and stock."
                        actions={<Button variant="secondary" onClick={() => setTabMode("root")}><ArrowLeftIcon /> Back</Button>}
                    />
                    <div className="ws-grid">
                        {STORE_CATEGORIES.map((cat) => {
                            const count = products.filter(p => cat.types.includes(p.product_type)).length;
                            return (
                                <button type="button" key={cat.id} onClick={() => setActiveCategory(cat.id)} className="overview-service text-left">
                                    <div className="overview-service-top"><cat.icon width={18} height={18} aria-hidden="true" /><span>{count} product{count === 1 ? "" : "s"}</span></div>
                                    <h3>{cat.name}</h3>
                                    <p>{cat.description}</p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-[11px] text-[var(--ov-accent)]">Manage <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                                </button>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    {/* Inside Management the page heading already names the category. */}
                    {!category && (
                        <PageHeader
                            title={activeCatData?.name || "Products"}
                            description={`${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} in this category.`}
                            actions={<Button variant="secondary" onClick={() => { setActiveCategory(null); setProviderFilter("all"); }}><ArrowLeftIcon /> Back</Button>}
                        />
                    )}
                    <div className="ws-toolbar flex-wrap">
                        {categoryProviders.length > 1 && (
                            <select aria-label="Filter by provider" value={providerFilter} onChange={e => setProviderFilter(e.target.value)} className="ws-input" style={{ width: "auto" }}>
                                <option value="all">All providers</option>
                                {categoryProviders.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        )}
                        <div className="ws-toolbar-actions">
                            {activeCatData?.syncs.map(sync => (
                                <Button key={sync.type} variant="secondary" onClick={() => handleSync(sync)} disabled={syncProducts.isLoading}>
                                    <ArrowPathIcon className={syncProducts.isLoading && syncProducts.variables === sync.type ? "animate-spin" : ""} />
                                    {sync.label}
                                </Button>
                            ))}
                            <Button onClick={() => openModal("create")}><PlusIcon /> Add product</Button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredProducts}
                        loading={isLoading}
                        emptyMessage={<EmptyState icon={BuildingStorefrontIcon} title={`No ${activeCatData?.name} found`} description="Click Sync or Add product to populate." action={activeCatData ? { label: activeCatData.syncs[0].label, onClick: () => handleSync(activeCatData.syncs[0]) } : undefined} />}
                        actions={(row: ProductRow) => (
                            <>
                                <button type="button" onClick={() => openModal("edit", row)} aria-label="Edit product" className="ws-icon-button"><PencilSquareIcon /></button>
                                <button type="button" onClick={() => setDeleteTarget(row)} aria-label="Delete product" className="ws-icon-button"><TrashIcon /></button>
                            </>
                        )}
                    />
                </>
            )}

            <FormModal
                open={!!modalMode} onClose={() => setModalMode(null)}
                title={modalMode === "create" ? "Add Custom Product" : "Edit Product"}
                onSubmit={handleSubmit} submitLabel={modalMode === "create" ? "Create" : "Save Changes"}
                loading={createProduct.isLoading || updateProduct.isLoading}
            >
                {modalMode === "create" && (
                    <div className="ws-callout">
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
                <label className="ws-check"><input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
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
