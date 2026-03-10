import { useState, useEffect, useCallback } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, CloudArrowDownIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import {
    fetchAdminProducts,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    syncInhouseProducts,
    syncExternalProducts
} from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface ProductRow {
    id: number;
    name: string;
    description: string;
    product_type: string;
    provider: string;
    stock_status: string;
    is_active: boolean;
    metadata: Record<string, any>;
    created_at: string;
}

export default function ProductsTab() {
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
                name: "", description: "", product_type: "proxy", provider: "", stock_status: "in_stock", is_active: true, metadataString: "{}"
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

    const handleSyncInhouse = async () => {
        if (!window.confirm("Sync in-house products from local data file?")) return;
        setActionLoading(true);
        try {
            await syncInhouseProducts();
            toast.success("In-house products synced");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to sync in-house products");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSyncExternal = async () => {
        if (!window.confirm("Sync external products from MyProxyApi & eSIM Access? This might take a few moments.")) return;
        setActionLoading(true);
        try {
            await syncExternalProducts();
            toast.success("External products synced");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to sync external products");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: "id", label: "ID", render: (row: ProductRow) => <span className="text-muted-foreground">#{row.id}</span> },
        {
            key: "name", label: "Product", sortable: true, render: (row: ProductRow) => (
                <div>
                    <p className="text-sm font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.provider}</p>
                </div>
            )
        },
        { key: "product_type", label: "Type", sortable: true, render: (row: ProductRow) => <span className="uppercase text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{row.product_type}</span> },
        { key: "stock_status", label: "Stock", render: (row: ProductRow) => <StatusBadge status={row.stock_status === "in_stock" ? "success" : "warning"} /> },
        { key: "is_active", label: "Active", render: (row: ProductRow) => <StatusBadge status={row.is_active ? "active" : "inactive"} /> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-foreground">Products Management</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncInhouse}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 transition-colors rounded-xl text-sm font-medium disabled:opacity-50"
                        title="Load local in-house products"
                    >
                        <CloudArrowDownIcon className="h-5 w-5" /> In-House Sync
                    </button>
                    <button
                        onClick={handleSyncExternal}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-colors rounded-xl text-sm font-medium disabled:opacity-50"
                        title="Sync from external APIs"
                    >
                        <ArrowPathIcon className="h-5 w-5" /> External Sync
                    </button>
                    <button onClick={() => openModal("create")} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 transition-colors text-foreground rounded-xl text-sm font-medium">
                        <PlusIcon className="h-5 w-5" /> Add Product
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={products}
                loading={loading}
                emptyMessage="No products found."
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

            <FormModal
                open={!!modalMode} onClose={() => setModalMode(null)}
                title={modalMode === "create" ? "Create Product" : "Edit Product"}
                onSubmit={handleSubmit} submitLabel={modalMode === "create" ? "Create" : "Save Changes"}
                loading={actionLoading}
            >
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Name *">
                        <input className={inputClasses} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </Field>
                    <Field label="Type *">
                        <select className={inputClasses} value={formData.product_type} onChange={e => setFormData({ ...formData, product_type: e.target.value })} required>
                            <option value="residential">Residential Proxy</option>
                            <option value="vps">VPS</option>
                            <option value="rdp">RDP</option>
                            <option value="vpn">VPN</option>
                            <option value="esim">eSIM</option>
                            <option value="usa_esim">USA eSIM</option>
                        </select>
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Provider Backend">
                        <input className={inputClasses} value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} placeholder="e.g. proxmox, xproxy" />
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
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-muted border-border text-red-500 focus:ring-red-500 cursor-pointer" />
                    <span className="text-sm font-medium text-muted-foreground">Is Active?</span>
                </label>
            </FormModal>
        </div>
    );
}
