import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getApiError } from "../../../utils/apiError";
import { Zap, CreditCard, Mail, AlertCircle } from "lucide-react";

import { fetchResellerProducts, fetchResellerBalance, createResellerOrder } from "../../../services/resellerApi";
import DataTable from "../../SuperAdmin/components/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



interface ResProductsProps {
    type?: string;
}

export default function ResProducts({ type }: ResProductsProps) {
    const [products, setProducts] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [resellerUser] = useState(() => JSON.parse(localStorage.getItem("resellerUser") || "{}"));
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [balance, setBalance] = useState(0);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [customerEmail, setCustomerEmail] = useState("");

    const isEnterprise = resellerUser?.reseller_type === "infrastructure";



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

            // Fetch balance if API only to show updated credits
            if (!isEnterprise) {
                const balRes = await fetchResellerBalance();
                setBalance(balRes.data.balance || 0);
            }
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [type, isEnterprise]);



    const handleBuyNow = async () => {
        if (!selectedProduct) return;
        const price = Number(selectedProduct.base_price || 0);
        
        if (balance < price) {
            toast.error("Insufficient credits. Please top up your wallet.");
            return;
        }

        setIsBuying(true);
        try {
            // Normalize product type for backend
            const productTypeRaw = selectedProduct.product_type || type || "proxy";
            const productType = productTypeRaw.split(',')[0].replace("_", "-");

            await createResellerOrder({
                order_items_attributes: [{
                    product_id: selectedProduct.id,
                    product_type: productType,
                    quantity: 1
                }],
                payment_method: "balance"
            });
            toast.success(`Successfully purchased ${selectedProduct.name}`);
            setIsBuyModalOpen(false);
            // Refresh balance
            const balRes = await fetchResellerBalance();
            setBalance(balRes.data.balance || 0);
        } catch (err: any) {
            toast.error(getApiError(err, "Purchase failed"));
        } finally {
            setIsBuying(false);
        }
    };

    const handleEnterpriseOrder = () => {
        if (!selectedProduct || !customerEmail.trim()) {
            toast.error("Please enter a valid customer email");
            return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        const productTypeRaw = selectedProduct.product_type || type || "proxy";
        const productType = productTypeRaw.split(',')[0].replace("_", "-");

        const checkoutItem = {
            productType,
            productId: selectedProduct.id,
            name: selectedProduct.name,
            quantity: 1,
            effective_base_price: Number(selectedProduct.base_price || 0),
            customer_email: customerEmail
        };

        // Prepare for checkout component
        localStorage.setItem("cartItems", JSON.stringify([checkoutItem]));
        localStorage.setItem("checkout_customer_email", customerEmail);
        
        setShowEmailModal(false);
        // Dispatch "cart-updated" to notify dashboard if needed (though cart tab is gone, checkout might use it)
        globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 1 } }));
        
        // Trigger navigation to checkout in parent
        // We'll rely on the dashboard activeTab "checkout"
        // But since this is a child, we need a way to tell the parent.
        // For now, let's assume we can trigger a storage event or similar if needed, 
        // but better to pass a prop from ResellerDashboard.
        window.location.hash = "#checkout"; // Simple trigger or use a custom event
        globalThis.dispatchEvent(new CustomEvent("navigate-to-tab", { detail: { tab: "checkout" } }));
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
                    { key: "base_price", label: "Price", render: (r: Record<string, unknown>) => `$${Number(r.base_price || 0).toFixed(2)}` },
                    {

                        key: "actions",
                        label: "Actions",
                        render: (r: Record<string, unknown>) => (
                            <div className="flex items-center gap-2">
                                {!isEnterprise && (
                                    <button
                                        onClick={() => {
                                            setSelectedProduct(r);
                                            setIsBuyModalOpen(true);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        Buy Now
                                    </button>
                                )}
                            </div>
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

            {/* Buy Now Confirmation Dialog */}
            <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Confirm Purchase</DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground">
                            You are about to purchase <strong>{selectedProduct?.name}</strong> using your available credits.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Price</p>
                                    <p className="text-xl font-black">${Number(selectedProduct?.base_price || 0).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Remaining Credits</p>
                                <p className="text-xl font-black">${(balance - Number(selectedProduct?.base_price || 0)).toFixed(2)}</p>
                            </div>
                        </div>

                        {balance < Number(selectedProduct?.base_price || 0) && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                                <CreditCard className="w-4 h-4" />
                                <span>Insufficient balance. Please add credits to your wallet.</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsBuyModalOpen(false)} className="rounded-2xl font-bold py-6">Cancel</Button>
                        <Button
                            onClick={handleBuyNow}
                            disabled={isBuying || balance < Number(selectedProduct?.base_price || 0)}
                            className="rounded-2xl font-black py-6 px-8 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                        >
                            {isBuying ? "Processing..." : "Confirm & Pay"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enterprise Customer Email Modal */}
            <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
                <DialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight text-blue-600 font-inter">Customer Delivery</DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground">
                            Enter the customer email where credentials and notifications should be sent for <strong>{selectedProduct?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Customer Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-blue-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <Input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    className="pl-12 py-7 rounded-2xl bg-muted/40 border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-blue-500 transition-all font-medium text-lg"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2">
                            <div className="flex items-center gap-2 text-blue-600">
                                <AlertCircle className="w-4 h-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Enterprise Protocol</p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                The system will automatically provision the service and send unique access credentials to this email upon payment.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowEmailModal(false)} className="rounded-2xl font-bold py-6 px-6">Cancel</Button>
                        <Button
                            onClick={handleEnterpriseOrder}
                            disabled={!customerEmail.trim()}
                            className="rounded-2xl font-black py-7 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Proceed to Checkout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


