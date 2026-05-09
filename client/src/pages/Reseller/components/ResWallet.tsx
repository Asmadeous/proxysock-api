import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WalletIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from "@heroicons/react/24/outline";
import { AlertCircle, TrendingUp, ShieldCheckIcon, Clock, CheckCircle2 } from "lucide-react";
import { fetchResellerBalance, fetchResellerTransactions, createResellerDeposit, requestResellerPayout } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import DataTable from "../../SuperAdmin/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResWallet() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";
    const isSingleProduct = user?.reseller_type === "single_product";
    const isBalanceBased = !isEnterprise; // api_only + single_product use balance
    const minDeposit = isSingleProduct ? 500 : 1500;

    const [balance, setBalance] = useState(0);
    const [earningsBalance, setEarningsBalance] = useState(0);
    const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
    const [withdrawDetails, setWithdrawDetails] = useState<Record<string, string>>({});
    const [paymentGateway, setPaymentGateway] = useState("paystack");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balRes, transRes] = await Promise.all([
                fetchResellerBalance(),
                fetchResellerTransactions()
            ]);
            setBalance(balRes.data.balance || 0);
            setEarningsBalance(balRes.data.earnings_balance || 0);
            setTransactions(transRes.data.transactions || []);
        } catch (error) {
            toast.error(getApiError(error, "Failed to load wallet data"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount < minDeposit) {
            toast.error(`Minimum deposit for ${isSingleProduct ? 'Single Product' : 'API'} resellers is $${minDeposit.toLocaleString()}.00`);
            return;
        }

        setIsProcessing(true);
        try {
            const res = await createResellerDeposit({ amount, gateway: paymentGateway });
            if (res.data.payment_url || res.data.checkout_url) {
                window.location.href = res.data.payment_url || res.data.checkout_url;
            } else {
                toast.success("Deposit initiated! Please follow the instructions.");
            }
            setIsDepositModalOpen(false);
        } catch (error) {
            toast.error(getApiError(error, "Deposit failed"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (amount > earningsBalance) {
            toast.error("Insufficient earnings balance");
            return;
        }

        setIsProcessing(true);
        try {
            let details: Record<string, string> = {};
            if (withdrawMethod === "crypto") {
                details = { crypto_currency: withdrawDetails.crypto_currency || "USDT", crypto_address: withdrawDetails.crypto_address };
            } else if (withdrawMethod === "manual") {
                details = { 
                    account_name: withdrawDetails.account_name, 
                    account_number: withdrawDetails.account_number, 
                    bank_name: withdrawDetails.bank_name,
                    country: withdrawDetails.country
                };
            }

            await requestResellerPayout({
                amount,
                payment_method: withdrawMethod,
                payment_details: details
            });
            toast.success("Withdrawal request submitted for approval!");
            setIsWithdrawModalOpen(false);
            setWithdrawAmount("");
            setWithdrawDetails({});
            fetchData();
        } catch (error) {
            toast.error(getApiError(error, "Withdrawal failed"));
        } finally {
            setIsProcessing(false);
        }
    };

    const renderWithdrawFields = () => {
        if (withdrawMethod === "manual") {
            return (
                <div className="grid gap-4 pt-2">
                    <div className="grid gap-2">
                        <Label className="text-sm font-bold">Account Name</Label>
                        <Input
                            placeholder="Full name"
                            value={withdrawDetails.account_name || ""}
                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, account_name: e.target.value })}
                            className="rounded-xl border-border/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-sm font-bold">Account Number</Label>
                        <Input
                            placeholder="Account number or IBAN"
                            value={withdrawDetails.account_number || ""}
                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, account_number: e.target.value })}
                            className="rounded-xl border-border/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-sm font-bold">Bank Name</Label>
                        <Input
                            placeholder="e.g. Chase Bank"
                            value={withdrawDetails.bank_name || ""}
                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, bank_name: e.target.value })}
                            className="rounded-xl border-border/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-sm font-bold">Country</Label>
                        <Input
                            placeholder="e.g. USA"
                            value={withdrawDetails.country || ""}
                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, country: e.target.value })}
                            className="rounded-xl border-border/50"
                        />
                    </div>
                    <p className="text-xs text-blue-400">ℹ️ Manual payouts are reviewed by our team and processed in 1-3 days.</p>
                </div>
            );
        }
        if (withdrawMethod === "crypto") {
            return (
                <div className="grid gap-4 pt-2">
                    <div className="grid gap-2">
                        <Label className="text-sm font-bold">Currency</Label>
                        <Select value={withdrawDetails.crypto_currency || "USDT"} onValueChange={(v) => setWithdrawDetails({ ...withdrawDetails, crypto_currency: v })}>
                            <SelectTrigger className="rounded-xl border-border/50">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                <SelectItem value="USDT">Tether (USDT ERC20)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-sm font-bold">Wallet Address</Label>
                        <Input
                            placeholder={`Paste your ${withdrawDetails.crypto_currency || "USDT"} address`}
                            value={withdrawDetails.crypto_address || ""}
                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, crypto_address: e.target.value })}
                            className="rounded-xl border-border/50"
                        />
                    </div>
                    <p className="text-xs text-amber-500">⚠️ Ensure the address is correct. Crypto transfers are non-reversible.</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Financial Hub</h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        {isEnterprise ? "Manage your partnership earnings and infrastructure fees." : "Manage your API credits and top-ups."}
                    </p>
                </div>
                {isBalanceBased && (
                    <Button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="bg-primary text-primary-foreground shadow-sm hover:brightness-110 px-8 py-7 rounded-2xl font-black text-lg gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        <ArrowUpRightIcon className="h-6 w-6" />
                        Add Credits
                    </Button>
                )}
                {isEnterprise && (
                    <Button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 px-8 py-7 rounded-2xl font-black text-lg gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        <ArrowDownLeftIcon className="h-6 w-6" />
                        Request Payout
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Balance Card - API ONLY */}
                {isBalanceBased && (
                    <Card className="border-none shadow-sm rounded-3xl p-2 bg-gradient-to-br from-red-600 via-red-500 to-pink-600 text-white overflow-hidden relative">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Available Credits</CardTitle>
                                <div className="p-2 rounded-xl bg-white/10">
                                    <WalletIcon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black tracking-tighter">${balance.toFixed(2)}</div>
                            <div className="mt-6 flex items-center gap-2 text-[10px] bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/20 font-bold uppercase tracking-wider backdrop-blur-sm">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Minimum Top-up: ${minDeposit.toLocaleString()}.00
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Earnings Card - ENTERPRISE ONLY */}
                {isEnterprise && (
                    <Card className="border-none shadow-sm rounded-3xl p-2 bg-gradient-to-br from-red-600 via-red-500 to-pink-600 text-white overflow-hidden relative">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Total Earnings</CardTitle>
                                <div className="p-2 rounded-xl bg-white/10">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black tracking-tighter">${earningsBalance.toFixed(2)}</div>
                            <div className="mt-6 flex items-center gap-2 text-[10px] bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/20 font-bold uppercase tracking-wider backdrop-blur-sm">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Ready for Withdrawal
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Subscription Card - ENTERPRISE ONLY */}
                {isEnterprise && (
                    <Card className="border border-border shadow-sm rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Infrastructure Fee</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="text-3xl font-black tracking-tight text-foreground">${user?.subscription_fee || "0.00"}<span className="text-sm font-medium text-muted-foreground">/mo</span></div>
                                <div className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                    <span>Next Auto-Bill</span>
                                    <span>{new Date(user?.subscription_expires_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/10">
                                    <div className="h-full bg-primary w-3/4 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Global Stats Card */}
                <Card className="border border-border shadow-sm rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Account Velocity</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Sub-Orders</p>
                            <p className="text-2xl font-black tracking-tight">{transactions.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Volume</p>
                            <p className="text-2xl font-black tracking-tight">$0.00</p>
                        </div>
                        <div className="col-span-2 pt-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground border-t border-border/30 pt-4 uppercase tracking-tighter">
                                <ShieldCheckIcon className="h-3.5 w-3.5" />
                                Compliance Level: HIGH
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Deposit Dialog - API ONLY */}
            {isBalanceBased && (
                <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
                    <DialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight">Add Credits</DialogTitle>
                            <DialogDescription className="font-medium text-muted-foreground">Top up your API balance. Minimum requirement is ${minDeposit.toLocaleString()}.00.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                            <div className="grid gap-3">
                                <Label htmlFor="amount" className="text-sm font-bold ml-1">Credits to Purchase ($)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">$</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min={minDeposit}
                                        placeholder={`${minDeposit}.00`}
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="text-xl font-black pl-8 py-7 rounded-2xl bg-muted/30 border-none ring-offset-background focus-visible:ring-primary"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center mt-1">Minimum deposit enforcment active</p>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold ml-1">Secure Gateway</Label>
                                <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Paystack Option */}
                                    <div 
                                        onClick={() => setPaymentGateway("paystack")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${paymentGateway === "paystack" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl p-1 border shadow-sm flex items-center justify-center">
                                                <img src="/paystack.png" alt="Paystack" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">Paystack Checkout</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">Instant Credit Activation (NGN)</p>
                                            </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-4 transition-all ${paymentGateway === "paystack" ? "border-primary bg-white shadow-inner" : "border-muted-foreground/30"}`} />
                                    </div>

                                    {/* FastSpring Option */}
                                    {/* <div 
                                        onClick={() => setPaymentGateway("fastspring")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${paymentGateway === "fastspring" ? "border-blue-500 bg-blue-500/5" : "border-border/50 hover:bg-muted/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${paymentGateway === "fastspring" ? "bg-blue-500/10" : "bg-muted"}`}><CreditCard className={`w-5 h-5 ${paymentGateway === "fastspring" ? "text-blue-600" : "text-muted-foreground"}`} /></div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">FastSpring (Global)</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">Cards & PayPal (USD)</p>
                                            </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-4 transition-all ${paymentGateway === "fastspring" ? "border-blue-500 bg-white shadow-inner" : "border-muted-foreground/30"}`} />
                                    </div> */}

                                    {/* 100Pay Option */}
                                    <div 
                                        onClick={() => setPaymentGateway("hundredpay")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${paymentGateway === "hundredpay" ? "border-purple-500 bg-purple-500/5" : "border-border/50 hover:bg-muted/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl p-1 border shadow-sm flex items-center justify-center">
                                                <img src="/100pay.png" alt="100Pay" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">100Pay (Card & Crypto)</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">Global Payment Hub (USD)</p>
                                            </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-4 transition-all ${paymentGateway === "hundredpay" ? "border-purple-500 bg-white shadow-inner" : "border-muted-foreground/30"}`} />
                                    </div>

                                    {/* Plisio Option */}
                                    <div 
                                        onClick={() => setPaymentGateway("plisio")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${paymentGateway === "plisio" ? "border-orange-500 bg-orange-500/5" : "border-border/50 hover:bg-muted/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl p-1 border shadow-sm flex items-center justify-center">
                                                <img src="/plisio.webp" alt="Plisio" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">Plisio Crypto</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">BTC, ETH, USDT & more</p>
                                            </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-4 transition-all ${paymentGateway === "plisio" ? "border-orange-500 bg-white shadow-inner" : "border-muted-foreground/30"}`} />
                                    </div>

                                    {/* Payvra Option */}
                                    <div 
                                        onClick={() => setPaymentGateway("payvra")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${paymentGateway === "payvra" ? "border-blue-500 bg-blue-500/5" : "border-border/50 hover:bg-muted/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl p-1 border shadow-sm flex items-center justify-center">
                                                <img src="/payvra.webp" alt="Payvra" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">Payvra Crypto</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">BTC, ETH, USDT & more</p>
                                            </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-4 transition-all ${paymentGateway === "payvra" ? "border-blue-500 bg-white shadow-inner" : "border-muted-foreground/30"}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setIsDepositModalOpen(false)} className="rounded-2xl font-bold py-6">Cancel</Button>
                            <Button
                                onClick={handleDeposit}
                                disabled={isProcessing || !depositAmount || parseFloat(depositAmount) < minDeposit}
                                className="rounded-2xl font-black py-6 px-8 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                            >
                                {isProcessing ? "Connecting..." : "Initialize Payment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Withdrawal Dialog - ENTERPRISE ONLY */}
            {isEnterprise && (
                <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
                    <DialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight">Request Payout</DialogTitle>
                            <DialogDescription className="font-medium text-muted-foreground">Withdraw your accumulated earnings to your preferred destination.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            <div className="bg-gradient-to-br from-red-600 via-red-500 to-pink-600 rounded-2xl p-5 flex items-center justify-between text-white">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Withdrawable</p>
                                    <p className="text-2xl font-black tracking-tighter">${earningsBalance.toFixed(2)}</p>
                                </div>
                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="w-method" className="text-sm font-bold ml-1">Destination</Label>
                                <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                                    <SelectTrigger className="rounded-2xl py-6 bg-muted/30 border-none font-bold text-sm">
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="manual" className="font-bold">Traditional Bank / Other</SelectItem>
                                        <SelectItem value="crypto" className="font-bold">Cryptocurrency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="w-amount" className="text-sm font-bold ml-1">Amount to Payout ($)</Label>
                                <Input
                                    id="w-amount"
                                    type="number"
                                    placeholder="0.00"
                                    max={earningsBalance}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="text-xl font-black py-7 rounded-2xl bg-muted/30 border-none ring-offset-background focus-visible:ring-emerald-500"
                                />
                            </div>
                            {renderWithdrawFields()}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setIsWithdrawModalOpen(false)} className="rounded-2xl font-bold py-6">Cancel</Button>
                            <Button
                                onClick={handleWithdraw}
                                disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                className="rounded-2xl font-black py-6 px-8 bg-primary shadow-sm hover:bg-primary/90 hover:scale-[1.02] transition-transform text-primary-foreground"
                            >
                                {isProcessing ? "Processing..." : "Confirm Payout"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <div className="grid gap-8">
                <Card className="border border-border shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-border/30 bg-muted/20 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tight">
                                <ArrowDownLeftIcon className="h-6 w-6 text-primary" />
                                Financial Accountability
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={[
                                { key: "description", label: "Event Description", render: (r) => <span className="font-black text-sm tracking-tight">{String(r.description)}</span> },
                                {
                                    key: "amount", label: "Delta Value", render: (r: Record<string, unknown>) => {
                                        const val = Number(r.amount);
                                        return <span className={`font-black px-4 py-1.5 rounded-xl text-xs tracking-tighter shadow-sm border ${val >= 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
                                            {val >= 0 ? "+" : "-"}${Math.abs(val).toFixed(2)}
                                        </span>
                                    }
                                },
                                { key: "created_at", label: "Timestamp", render: (r: Record<string, unknown>) => <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {new Date(String(r.created_at)).toLocaleString()}</div> },
                                { key: "status", label: "Ledger Status", render: () => <span className="text-[10px] font-black uppercase bg-muted/80 px-3 py-1.5 rounded-xl border border-border/50 shadow-inner">Verified</span> }
                            ]}
                            data={transactions}
                            loading={loading}
                            emptyMessage="No financial ledger entries found."
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
