import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { fetchResellerProducts } from "../../../services/resellerApi";
import DataTable from "../../SuperAdmin/components/DataTable";

interface ResProductsProps {
    type?: string;
}

export default function ResProducts({ type }: ResProductsProps) {
    const [products, setProducts] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadProducts = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const r = await fetchResellerProducts({
                page: String(p),
                ...(type ? { product_type: type } : {})
            });
            const data = r.data.products || r.data;
            setProducts(Array.isArray(data) ? data : []);
            setTotalPages(r.data.meta?.total_pages || 1);
            setTotal(r.data.meta?.total_count || 0);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [type]);

    const addToCart = (product: any) => {
        try {
            const storedCart = localStorage.getItem("cartItems");
            const currentCart = storedCart ? JSON.parse(storedCart) : [];

            // Map reseller product to cart item format based on strict ResellerCart requirements
            const productTypeRaw = product.product_type || type || "proxy";
            // Use only the first type if comma-separated, and normalize underscores to hyphens
            const productType = productTypeRaw.split(',')[0].replace("_", "-");
            const planDetails = { id: product.id, name: product.name, price: Number(product.base_price || 0) };

            const newItem: any = {
                productType,
                productId: product.id,
                name: product.name,
                quantity: 1,
                effective_base_price: Number(product.base_price || 0)
            };

            // Satisfy ResellerCart.tsx filtering logic
            if (productType === "proxy" || productType === "residential") newItem.plan = planDetails;
            else if (productType === "vps") newItem.vpsPlan = planDetails;
            else if (productType === "rdp") newItem.rdpPlan = planDetails;
            else if (productType === "esim") newItem.esimPackage = planDetails;
            else if (productType === "usa-esim") newItem.usaEsimPlan = planDetails;
            else if (productType === "vpn") newItem.vpnPlan = planDetails;
            else newItem.plan = planDetails; // Fallback

            const updatedCart = [...currentCart, newItem];
            localStorage.setItem("cartItems", JSON.stringify(updatedCart));

            // Trigger update event
            globalThis.dispatchEvent(new CustomEvent("cart-updated", {
                detail: { count: updatedCart.length }
            }));

            toast.success(`${product.name} added to cart`);
        } catch (err) {
            toast.error("Failed to add to cart");
        }
    };

    useEffect(() => {
        loadProducts(page);
    }, [page, loadProducts]);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Products</h2>
            <DataTable
                columns={[
                    { key: "name", label: "Product" },
                    { key: "category", label: "Category", render: (r: Record<string, unknown>) => String(r.category || 'Uncategorized') },
                    { key: "provider_type", label: "Provider" },
                    { key: "base_price", label: "Price", render: (r: Record<string, unknown>) => `$${Number(r.base_price || 0).toFixed(2)}` },
                    {
                        key: "actions",
                        label: "Actions",
                        render: (r: Record<string, unknown>) => (
                            <button
                                onClick={() => addToCart(r)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Add to Cart
                            </button>
                        )
                    }
                ]}
                data={products}
                loading={loading}
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
            />
        </div>
    );
}
