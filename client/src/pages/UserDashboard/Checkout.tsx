"use client";
import { useState, useEffect } from "react";

import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
    Wallet,
    AlertCircle,
    Loader2,
    Lock,
    Tag,
    Check,
    X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { usePaymentCheckoutHandlers } from "@/components/dashboard/Cart/hook/usePaymentCheckoutHandlers";
import { useCalculateOrderItems } from "@/components/dashboard/Cart/hook/useCalculateOrderTotalSync";
import { CartItem } from "@/types";
import { useRedditTracking } from "@/utils/redditPixel";
import { Input } from "@/components/ui/input";

import api from "@/services/api";


export default function Checkout() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [userBalance, setUserBalance] = useState(0);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("balance");
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingPlisio, setIsLoadingPlisio] = useState(false);

    const [isLoadingPaystack, setIsLoadingPaystack] = useState(false);
    const [isLoadingHundredpay, setIsLoadingHundredpay] = useState(false);
    const [isLoadingFastspring, setIsLoadingFastspring] = useState(false);
    const [isLoadingHeleket, setIsLoadingHeleket] = useState(false);
    const [isAnyPaymentProcessing, setIsAnyPaymentProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Promo / Affiliate code state
    const [promoInput, setPromoInput] = useState("");
    const [promoValidating, setPromoValidating] = useState(false);
    const [promoApplied, setPromoApplied] = useState<{
        code: string;
        discount_type: string;
        discount_value: number;
        description?: string;
    } | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Load Cart
        const storedCart = localStorage.getItem("cartItems");
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                    setCartItems(parsedCart);
                } else {
                    navigate("/dashboard/cart"); // Redirect if empty
                }
            } catch (e) {
                console.error("Error parsing cart:", e);
                navigate("/dashboard/cart");
            }
        } else {
            navigate("/dashboard/cart");
        }

        // 3. Fetch Balance & Exchange Rate
        const fetchData = async () => {
            try {
                const { data } = await api.get("/web/api/billing/balance");
                if (data && data.available_balance !== undefined) {
                    setUserBalance(data.available_balance);
                }
                setExchangeRate(1500); // 1 USD = 1500 NGN default
            } catch (err) {
                console.error("Error fetching checkout data:", err);
            }
        };
        fetchData();
    }, [navigate]);

    const { trackPurchase } = useRedditTracking();

    const storeOrderDataForSuccess = (
        _items: CartItem[],
        totalUsd: number,
        paymentMethod: string
    ) => {
        const orderId = `order_${Date.now()}`;
        // Create a displayable list of items for the success page
        const orderItems = _items.map(item => {
            // Map productType to one of: vpn, vps, rdp, esim, proxy
            let category = item.productType as string;
            if (category === 'usa-esim') category = 'esim';
            if (['global-isp', 'residential', 'intercept'].includes(category)) category = 'proxy';
            if (category === 'vm') category = 'vps';

            return {
                id: `item_${Math.random().toString(36).substr(2, 9)}`,
                name: item.product || item.plan?.name || item.esimPackage?.name || item.vpsPlan?.name || item.rdpPlan?.name || item.vpnPlan?.name || 'Service',
                price: item.totalPrice || 0,
                category: category || 'proxy',
                quantity: item.quantity || 1
            };
        });

        localStorage.setItem("lastOrder", JSON.stringify({
            orderId,
            totalValue: totalUsd,
            paymentMethod,
            timestamp: Date.now(),
            items: orderItems,
            currency: "USD"
        }));

        // Track Reddit Purchase Conversion
        trackPurchase?.({
            orderId,
            value: totalUsd,
            currency: "USD",
            items: _items,
            category: "checkout_complete"
        });

        return orderId;
    };

    const {
        calculateOrderTotalSync,
    } = useCalculateOrderItems({ cartItems, exchangeRate });

    const {
        handleBalancePayment,
        handlePaystackCheckout,
        handleHundredpayCheckout,

        handlePlisioCheckout,
        handleFastSpringCheckout,
        handleHeleketCheckout,
    } = usePaymentCheckoutHandlers({
        cartItems,
        userBalance,
        exchangeRate,
        setIsLoadingBalance,
        setIsAnyPaymentProcessing,
        setError,
        storeOrderDataForSuccess,
        setUserBalance,
        setIsLoadingPlisio,

        setIsLoadingPaystack,
        setIsLoadingHundredpay,
        setIsLoadingFastspring,
        setIsLoadingHeleket,
        clearCart: () => {
            localStorage.removeItem("cartItems");
            setCartItems([]);
            globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 0 } }));
        },
        promoCode: promoApplied?.code,
    });

    const handleCheckout = () => {
        if (selectedPaymentMethod === "balance") handleBalancePayment();
        else if (selectedPaymentMethod === "paystack") handlePaystackCheckout();
        else if (selectedPaymentMethod === "hundredpay") handleHundredpayCheckout();
        else if (selectedPaymentMethod === "plisio") handlePlisioCheckout();
        else if (selectedPaymentMethod === "hundredpay") handleHundredpayCheckout();
        else if (selectedPaymentMethod === "heleket") handleHeleketCheckout();
        else if (selectedPaymentMethod === "fastspring") handleFastSpringCheckout();
    };

    const orderTotal = calculateOrderTotalSync();

    // Calculate promo discount preview
    const promoDiscount = promoApplied
        ? promoApplied.discount_type === 'percentage'
            ? Math.min(orderTotal * (promoApplied.discount_value / 100), orderTotal)
            : Math.min(promoApplied.discount_value, orderTotal)
        : 0;
    const finalTotal = Math.max(orderTotal - promoDiscount, 0);

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setPromoValidating(true);
        setPromoError(null);
        try {
            const { data } = await api.post('/web/api/promo_codes/validate', { code: promoInput.trim() });
            if (data.valid) {
                setPromoApplied({
                    code: data.code,
                    discount_type: data.discount_type,
                    discount_value: data.discount_value,
                    description: data.description,
                });
                setPromoError(null);
            } else {
                setPromoError(data.error || 'Invalid promo code');
                setPromoApplied(null);
            }
        } catch {
            setPromoError('Failed to validate promo code');
            setPromoApplied(null);
        } finally {
            setPromoValidating(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoApplied(null);
        setPromoInput("");
        setPromoError(null);
    };


    const isProcessing =
        isLoadingBalance || isLoadingPaystack || isLoadingHundredpay || isLoadingPlisio || isLoadingFastspring || isLoadingHeleket || isAnyPaymentProcessing;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Helmet>
                <title>Checkout | ProxySock</title>
            </Helmet>

            <div>
                <h1 className="text-3xl font-bold">Checkout</h1>
                <p className="text-muted-foreground mt-1">Select payment method and complete your order</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Payment Methods */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>Select how you want to pay</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 text-destructive">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            <RadioGroup
                                value={selectedPaymentMethod}
                                onValueChange={setSelectedPaymentMethod}
                                className="grid gap-4"
                            >
                                {/* Balance Option */}
                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "balance" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="balance" id="balance" className="sr-only" />
                                    <Label htmlFor="balance" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Wallet Balance</div>
                                            <div className="text-sm text-muted-foreground">Available: ${userBalance.toFixed(2)}</div>
                                        </div>
                                        {userBalance >= orderTotal ? (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Sufficient</Badge>
                                        ) : (
                                            <Badge variant="destructive">Insufficient</Badge>
                                        )}
                                    </Label>
                                </div>

                                {/* Paystack Option */}
                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "paystack" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="paystack" id="paystack" className="sr-only" />
                                    <Label htmlFor="paystack" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-md bg-white border flex items-center justify-center shrink-0 shadow-sm p-1">
                                            <img src="/paystack.png" alt="Paystack" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Paystack (Card)</div>
                                            <div className="text-sm text-muted-foreground">Pay with NGN</div>
                                        </div>
                                    </Label>
                                </div>

                                {/* FastSpring Option */}
                                {/* <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "fastspring" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="fastspring" id="fastspring" className="sr-only" />
                                    <Label htmlFor="fastspring" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">FastSpring (Global)</div>
                                            <div className="text-sm text-muted-foreground">Cards, PayPal (USD)</div>
                                        </div>
                                    </Label>
                                </div> */}

                                {/* Plisio Option */}
                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "plisio" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="plisio" id="plisio" className="sr-only" />
                                    <Label htmlFor="plisio" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-md bg-white border flex items-center justify-center shrink-0 shadow-sm p-1">
                                            <img src="/plisio.webp" alt="Plisio" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Crypto (Plisio)</div>
                                            <div className="text-sm text-muted-foreground">BTC, ETH, USDT</div>
                                        </div>
                                    </Label>
                                </div>

                                {/* 100Pay Option */}
                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "hundredpay" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="hundredpay" id="hundredpay" className="sr-only" />
                                    <Label htmlFor="hundredpay" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-md bg-white border flex items-center justify-center shrink-0 shadow-sm p-1">
                                            <img src="/100pay.png" alt="100Pay" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">100Pay (Card & Crypto)</div>
                                            <div className="text-sm text-muted-foreground">Universal Payment Gateway</div>
                                        </div>
                                    </Label>
                                </div>

                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "heleket" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="heleket" id="heleket" className="sr-only" />
                                    <Label htmlFor="heleket" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-md bg-white border flex items-center justify-center shrink-0 shadow-sm p-1">
                                            <img src="/heleket.webp" alt="Heleket" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Crypto (Heleket)</div>
                                            <div className="text-sm text-muted-foreground">Fast Crypto Payments</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* Promo / Affiliate Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="w-5 h-5" />
                                Promo Code
                            </CardTitle>
                            <CardDescription>Have a promo or affiliate code? Apply it for a discount</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {promoApplied ? (
                                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{promoApplied.code}</span>
                                        <span className="text-sm text-muted-foreground">
                                            ({promoApplied.discount_type === 'percentage' ? `${promoApplied.discount_value}% off` : `$${promoApplied.discount_value} off`})  
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleRemovePromo} className="text-destructive hover:text-destructive">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter promo or affiliate code"
                                            value={promoInput}
                                            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                                            disabled={promoValidating}
                                            className="font-mono"
                                        />
                                        <Button onClick={handleApplyPromo} disabled={promoValidating || !promoInput.trim()} variant="outline">
                                            {promoValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </Button>
                                    </div>
                                    {promoError && (
                                        <p className="text-xs text-destructive flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {promoError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Order Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                                    <span>${orderTotal.toFixed(2)}</span>
                                </div>
                                {promoDiscount > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> Promo ({promoApplied?.code})
                                        </span>
                                        <span>-${promoDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {/* Show NGN estimate if Paystack selected */}
                                {selectedPaymentMethod === "paystack" && exchangeRate && (
                                    <div className="flex justify-between text-cyan-600 dark:text-cyan-400 font-medium">
                                        <span>Est. NGN Total</span>
                                        <span>₦{(finalTotal * exchangeRate).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total</span>
                                    <span>${finalTotal.toFixed(2)}</span>
                                </div>
                                {promoDiscount > 0 && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right mt-1">
                                        You save ${promoDiscount.toFixed(2)}!
                                    </p>
                                )}
                            </div>

                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={isProcessing || (selectedPaymentMethod === "balance" && userBalance < finalTotal)}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        Pay with {selectedPaymentMethod === "balance" ? "Balance" : selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1)}
                                    </>
                                )}
                            </Button>

                            <div className="text-xs text-center text-muted-foreground">
                                By purchasing you agree to our Terms of Service.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
