import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    HomeIcon,
    ShoppingCartIcon,
    CubeIcon,
    KeyIcon,
    WalletIcon,
    LinkIcon,
    ChatBubbleLeftRightIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar, { type SidebarItem } from "../SuperAdmin/components/AdminSidebar";
import DataTable from "../SuperAdmin/components/DataTable";
import StatusBadge from "../SuperAdmin/components/StatusBadge";
import StatsCard from "../SuperAdmin/components/StatsCard";
import FormModal, { Field, inputClasses } from "../SuperAdmin/components/FormModal";
import {
    fetchResellerOrders, createResellerOrder, fetchResellerProducts,
    fetchResellerTickets, createResellerTicket, replyResellerTicket,
    fetchResellerBalance, fetchResellerTransactions,
    createResellerDeposit,
    
    sendSupportMessage
} from "../../services/resellerApi";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowRight, CreditCard, Wallet as WalletLucide } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS: SidebarItem[] = [
    { id: "overview", name: "Overview", icon: HomeIcon },
    { id: "orders", name: "Orders", icon: ShoppingCartIcon },
    { id: "products", name: "Products", icon: CubeIcon },
    { id: "api-keys", name: "API Keys", icon: KeyIcon },
    { id: "wallet", name: "Wallet", icon: WalletIcon },
    { id: "affiliate", name: "Affiliate", icon: LinkIcon },
    { id: "tickets", name: "Tickets", icon: CubeIcon },
    { id: "support_chat", name: "Support Chat", icon: ChatBubbleLeftRightIcon },
    { id: "profile", name: "Profile", icon: UserCircleIcon },
    { id: "logout", name: "Logout", icon: ArrowRightOnRectangleIcon },
];

export default function ResellerDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");

    useEffect(() => {
        if (!localStorage.getItem("resellerToken")) navigate("/reseller/login");
    }, [navigate]);

    const handleTab = (id: string) => {
        if (id === "logout") {
            localStorage.removeItem("resellerToken");
            localStorage.removeItem("resellerUser");
            navigate("/reseller/login");
            return;
        }
        setActiveTab(id);
    };

    return (
        <div className="min-h-screen flex">
            <AdminSidebar
                items={TABS}
                activeTab={activeTab}
                onTabChange={handleTab}
                title="Reseller"
                userName={user?.username || "Reseller"}
                userRole="Reseller"
                accentColor="purple"
            />
            <main className="flex-1 overflow-hidden">
                <div className="h-screen overflow-y-auto p-4 sm:p-6 lg:pt-6 pt-16 bg-background custom-scrollbar">
                    {activeTab === "overview" && <ResOverview />}
                    {activeTab === "orders" && <ResOrders />}
                    {activeTab === "products" && <ResProducts />}
                    {activeTab === "api-keys" && <ResApiKeys />}
                    {activeTab === "wallet" && <ResWallet />}
                    {activeTab === "affiliate" && <ResAffiliate />}
                    {activeTab === "tickets" && <ResTickets />}
                    {activeTab === "support_chat" && <ResSupportChat />}
                    {activeTab === "profile" && <ResProfile />}
                </div>
            </main>
        </div>
    );
}

// ── Reseller Support Chat ──
function ResSupportChat() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [chatMeta, setChatMeta] = useState<any>({});
    const pollRef = useRef<any>();
    const endRef = useRef<HTMLDivElement>(null);

    const loadChat = useCallback(async () => {
        try {
            const { data } = await fetchResellerSupportChat();
            setMessages(data.messages || []);
            setChatMeta(data.chat || {});
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadChat();
        pollRef.current = setInterval(loadChat, 5000);
        return () => clearInterval(pollRef.current);
    }, [loadChat]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput("");
        try {
            await sendSupportMessage(msg);
            loadChat();
        } catch { toast.error("Failed to send"); }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>;

    return (
        <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Support Chat</h2>
                    <p className="text-sm text-muted-foreground">Chat with our team for real-time assistance.</p>
                </div>
                {chatMeta.assigned_to_name && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border border-border">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-foreground">{chatMeta.assigned_to_name} (Assigned)</span>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3" />
                            <p>Start a conversation with our support team.</p>
                        </div>
                    ) : (
                        messages.map((m: any) => (
                            <div key={m.id} className={`flex ${m.sender_type === "Reseller" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender_type === "Reseller" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none shadow-sm"}`}>
                                    {m.sender_type === "Employee" && (
                                        <p className="text-[10px] font-bold text-primary mb-1">{m.sender_name || "Support"}</p>
                                    )}
                                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>

                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Describe your issue..."
                            className="flex-1 bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-10 resize-none"
                        />
                        <button onClick={handleSend} disabled={!input.trim()} className="bg-primary text-primary-foreground h-10 w-10 rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-all">
                            <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { fetchSupportChat as fetchResellerSupportChat } from "../../services/resellerApi";

// ── Reseller Sub-components ──

function ResOverview() {
    const [stats, setStats] = useState({ balance: 0, orders: 0, tickets: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([fetchResellerBalance(), fetchResellerOrders(), fetchResellerTickets()]).then(([b, o, t]) => {
            setStats({
                balance: b.status === "fulfilled" ? Number(b.value.data.balance || 0) : 0,
                orders: o.status === "fulfilled" ? (o.value.data.meta?.total_count ?? (o.value.data.orders || o.value.data || []).length) : 0,
                tickets: t.status === "fulfilled" ? (t.value.data.meta?.total_count ?? (t.value.data.tickets || t.value.data || []).length) : 0,
            });
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Reseller Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard title="Wallet Balance" value={`$${stats.balance.toFixed(2)}`} icon={WalletIcon} loading={loading} />
                <StatsCard title="Total Orders" value={stats.orders} icon={ShoppingCartIcon} loading={loading} />
                <StatsCard title="Open Tickets" value={stats.tickets} icon={ChatBubbleLeftRightIcon} loading={loading} />
            </div>
        </div>
    );
}

function ResOrders() {
    const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ product_id: "", quantity: "1" });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchResellerOrders().then((r) => { setOrders(r.data.orders || r.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        try { await createResellerOrder(form); toast.success("Order created"); setShowCreate(false); } catch { toast.error("Failed"); }
        finally { setCreating(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">My Orders</h2>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">+ New Order</button>
            </div>
            <DataTable
                columns={[
                    { key: "id", label: "Order ID", render: (r: Record<string, unknown>) => <span className="font-mono text-xs">#{String(r.id).slice(0, 8)}</span> },
                    { key: "product_name", label: "Product" },
                    { key: "total_amount", label: "Amount", render: (r: Record<string, unknown>) => `$${Number(r.total_amount || 0).toFixed(2)}` },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} /> },
                    { key: "created_at", label: "Date", render: (r: Record<string, unknown>) => <span className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={orders}
                loading={loading}
            />
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="New Order" onSubmit={handleCreate} submitLabel="Place Order" loading={creating}>
                <Field label="Product ID"><input className={inputClasses} value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} /></Field>
                <Field label="Quantity"><input className={inputClasses} type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
            </FormModal>
        </div>
    );
}

function ResProducts() {
    const [products, setProducts] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<Record<string, any> | null>(null);
    const [quantity, setQuantity] = useState("1");
    const [processing, setProcessing] = useState(false);
    const [filterCategory, setFilterCategory] = useState("all");

    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    // Standard tier pays 1x, infrastructure pays 1x + surcharge
    const multiplier = user.reseller_type === "api_only" ? 1.0 : 1.15; // Assumption based on typical markup, ideally backend provides this

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await fetchResellerProducts();
            setProducts(data.products || data || []);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const handlePurchase = async () => {
        if (!purchasing) return;
        setProcessing(true);
        try {
            await createResellerOrder({
                product_id: purchasing.id,
                quantity: parseInt(quantity, 10) || 1
            });
            toast.success(`${purchasing.name} ordered successfully!`);
            setPurchasing(null);
            setQuantity("1");
        } catch (err: any) {
            toast.error(err.response?.data?.errors?.[0] || "Failed to place order.");
        } finally {
            setProcessing(false);
        }
    };

    const categories = ["all", ...Array.from(new Set(products.map(p => p.category || "Other")))];
    const filteredProducts = products.filter(p => filterCategory === "all" || p.category === filterCategory);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Available Products</h2>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {cat === "all" ? "All Products" : cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-muted animate-pulse border border-border" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-muted/50 rounded-2xl border border-border border-dashed">
                    <CubeIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">No Products Found</h3>
                    <p className="text-muted-foreground mt-1">Check back later for new offerings.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(p => {
                        const finalPrice = (Number(p.base_price || 0) * multiplier).toFixed(2);
                        return (
                            <div key={p.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <CubeIcon className="w-5 h-5" />
                                        </div>
                                        <StatusBadge status={p.provider_type || "proxy"} />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{p.category || "General Service"}</p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Wholesale Rate</span>
                                        <span className="font-bold text-lg text-foreground">${finalPrice}</span>
                                    </div>
                                    <Button size="sm" onClick={() => { setPurchasing(p); setQuantity("1"); }}>
                                        Purchase
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={!!purchasing} onOpenChange={() => !processing && setPurchasing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Purchase</DialogTitle>
                        <DialogDescription>
                            Confirm order details for {purchasing?.name}. Funds will be deducted from your Reseller Wallet.
                        </DialogDescription>
                    </DialogHeader>

                    {purchasing && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
                                <span className="text-muted-foreground">Unit Price:</span>
                                <span className="font-medium">${(Number(purchasing.base_price || 0) * multiplier).toFixed(2)}</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 mt-4">
                                <span className="font-semibold text-foreground">Total Deduction:</span>
                                <span className="font-bold text-primary text-xl">
                                    ${((Number(purchasing.base_price || 0) * multiplier) * (parseInt(quantity) || 1)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPurchasing(null)} disabled={processing}>Cancel</Button>
                        <Button onClick={handlePurchase} disabled={processing || !parseInt(quantity)}>
                            {processing ? "Processing..." : "Confirm & Pay"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ResApiKeys() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
            <div className="bg-muted rounded-xl border border-border p-6">
                <p className="text-muted-foreground text-sm mb-4">Your API credentials are used for automated proxy ordering. Keep them secure.</p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">API Token</label>
                        <div className="flex items-center gap-2">
                            <input type="password" readOnly value="••••••••••••••••" className={`${inputClasses} flex-1`} />
                            <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80">Show</button>
                            <button className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">Rotate</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResWallet() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [paymentGateway, setPaymentGateway] = useState("paystack");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        Promise.allSettled([fetchResellerBalance(), fetchResellerTransactions()]).then(([b, t]) => {
            if (b.status === "fulfilled") setBalance(Number(b.value.data.balance || 0));
            if (t.status === "fulfilled") setTransactions(t.value.data.transactions || t.value.data || []);
            setLoading(false);
        });
    }, []);

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        // Minimum deposit logic specifically for Resellers
        if (isNaN(amount) || amount < 1000) {
            toast.error("Minimum deposit for resellers is $1000");
            return;
        }

        setIsProcessing(true);
        try {
            const { data } = await createResellerDeposit({ amount, gateway: paymentGateway, currency: 'USD' });
            if (data?.payment_url) {
                window.location.href = data.payment_url;
            } else {
                toast.success("Deposit initiated successfully!");
                setIsDepositModalOpen(false);
                setDepositAmount("");
            }
        } catch (error: any) {
            console.error("Deposit error:", error);
            toast.error(error.response?.data?.error || "Failed to initiate deposit");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Wallet</h2>
                <Button onClick={() => setIsDepositModalOpen(true)} className="gap-2">
                    <WalletLucide className="h-4 w-4" />
                    Deposit Funds
                </Button>
            </div>

            <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Deposit Funds</DialogTitle>
                        <DialogDescription>
                            Add funds to your reseller wallet to pay for services.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (USD)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="1000"
                                    step="100"
                                    placeholder="1000.00"
                                    className="pl-7"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-amber-500">
                                <AlertCircle className="h-4 w-4" />
                                <span>Minimum deposit: $1,000.00</span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="gateway">Payment Method</Label>
                            <Select value={paymentGateway} onValueChange={setPaymentGateway}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paystack">Credit / Debit Card (Paystack)</SelectItem>
                                    <SelectItem value="plisio">Cryptocurrency (Plisio)</SelectItem>
                                    <SelectItem value="payvra">Crypto / Alternatives (Payvra)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-muted p-3 rounded-lg flex items-start gap-3 mt-2">
                            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium">Secure Payment</p>
                                <p className="text-muted-foreground">You will be redirected to the payment gateway to complete your transaction securely.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDepositModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeposit} disabled={isProcessing || !depositAmount || parseFloat(depositAmount) < 1000} className="gap-2">
                            {isProcessing ? "Processing..." : "Proceed to Payment"}
                            {!isProcessing && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <StatsCard title="Available Balance" value={`$${balance.toFixed(2)}`} icon={WalletIcon} loading={loading} />
            <DataTable
                columns={[
                    { key: "description", label: "Description" },
                    { key: "amount", label: "Amount", render: (r: Record<string, unknown>) => <span className={Number(r.amount) >= 0 ? "text-green-400" : "text-red-400"}>{Number(r.amount) >= 0 ? "+" : ""}${Number(r.amount).toFixed(2)}</span> },
                    { key: "created_at", label: "Date", render: (r: Record<string, unknown>) => <span className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleString()}</span> },
                ]}
                data={transactions}
                loading={loading}
                emptyMessage="No transactions yet"
            />
        </div>
    );
}

function ResAffiliate() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Affiliate Program</h2>
            <div className="bg-muted rounded-xl border border-border p-6 text-center">
                <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">Earn commissions by referring new customers.</p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">Enroll Now</button>
            </div>
        </div>
    );
}

function ResTickets() {
    const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ subject: "", message: "" });
    const [creating, setCreating] = useState(false);
    const [replyTarget, setReplyTarget] = useState<Record<string, unknown> | null>(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetchResellerTickets();
            setTickets(r.data.tickets || r.data || []);
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await createResellerTicket(form);
            toast.success("Ticket created");
            setShowCreate(false);
            setForm({ subject: "", message: "" });
            loadTickets(); // Refresh list
        } catch {
            toast.error("Failed to create ticket");
        } finally {
            setCreating(false);
        }
    };

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        setReplyLoading(true);
        try {
            await replyResellerTicket(Number(replyTarget.id), replyMsg);
            toast.success("Reply sent");
            setReplyTarget(null);
            loadTickets(); // Refresh list
        } catch {
            toast.error("Failed to send reply");
        } finally {
            setReplyLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Support Tickets</h2>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">+ New Ticket</button>
            </div>
            <DataTable
                columns={[
                    { key: "subject", label: "Subject", sortable: true },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "open")} /> },
                    { key: "created_at", label: "Created", render: (r: Record<string, unknown>) => <span className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={tickets}
                loading={loading}
                actions={(row: Record<string, unknown>) => (
                    <button onClick={() => { setReplyTarget(row); setReplyMsg(""); }} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">Reply</button>
                )}
            />
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="New Ticket" onSubmit={handleCreate} submitLabel="Submit" loading={creating}>
                <Field label="Subject"><input className={inputClasses} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
                <Field label="Message"><textarea className={`${inputClasses} h-24 resize-y`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
            </FormModal>
            <FormModal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply: ${String(replyTarget?.subject || "")}`} onSubmit={handleReply} submitLabel="Send" loading={replyLoading}>
                <Field label="Message"><textarea className={`${inputClasses} h-24 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} /></Field>
            </FormModal>
        </div>
    );
}

function ResProfile() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Profile</h2>
            <div className="bg-muted rounded-xl border border-border p-6 space-y-4 max-w-lg">
                <Field label="Company Name"><input className={inputClasses} defaultValue={user.company_name || ""} readOnly /></Field>
                <Field label="Email"><input className={inputClasses} defaultValue={user.email || ""} readOnly /></Field>
                <Field label="Username"><input className={inputClasses} defaultValue={user.username || ""} readOnly /></Field>
                <Field label="Account Type"><input className={inputClasses} defaultValue={user.reseller_type || "standard"} readOnly /></Field>
            </div>
        </div>
    );
}
