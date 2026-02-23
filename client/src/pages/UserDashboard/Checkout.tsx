"use client";
import { useState, useEffect } from "react";

import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
    Wallet,
    CreditCard,
    Bitcoin,
    AlertCircle,
    Loader2,
    Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { usePaymentCheckoutHandlers } from "@/components/dashboard/Cart/hook/usePaymentCheckoutHandlesrs";
import { useCalculateOrderItems } from "@/components/dashboard/Cart/hook/useCalculateOrderTotalSync";
import { CartItem } from "./Cart";
import { useRedditTracking } from "@/utils/redditPixel";

import api from "@/services/api";


export default function Checkout() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [userBalance, setUserBalance] = useState(0);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("balance");
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingPlisio, setIsLoadingPlisio] = useState(false);
    const [isLoadingPayvra, setIsLoadingPayvra] = useState(false);
    const [isLoadingPaystack, setIsLoadingPaystack] = useState(false);
    const [isAnyPaymentProcessing, setIsAnyPaymentProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const usaEsimInCart = cartItems.some(
        (item) => item.productType === "usa-esim"
    );

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
        // Simple version of data storage for success page
        localStorage.setItem("lastOrder", JSON.stringify({
            orderId,
            totalValue: totalUsd,
            paymentMethod,
            timestamp: Date.now()
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
        handlePayvraCheckout,
        handlePlisioCheckout,
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
        setIsLoadingPayvra,
        setIsLoadingPaystack,
        clearCart: () => {
            localStorage.removeItem("cartItems");
            setCartItems([]);
            globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 0 } }));
        },
        usaEsimInCart,
    });

    const handleCheckout = () => {
        if (selectedPaymentMethod === "balance") handleBalancePayment();
        else if (selectedPaymentMethod === "paystack") handlePaystackCheckout();
        else if (selectedPaymentMethod === "plisio") handlePlisioCheckout();
        else if (selectedPaymentMethod === "payvra") handlePayvraCheckout();
    };

    const orderTotal = calculateOrderTotalSync();


    const isProcessing =
        isLoadingBalance || isLoadingPaystack || isLoadingPlisio || isLoadingPayvra || isAnyPaymentProcessing;

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
                                        <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Paystack (Card)</div>
                                            <div className="text-sm text-muted-foreground">Pay with NGN</div>
                                        </div>
                                    </Label>
                                </div>

                                {/* Plisio Option */}
                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "plisio" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="plisio" id="plisio" className="sr-only" />
                                    <Label htmlFor="plisio" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                                            <Bitcoin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Crypto (Plisio)</div>
                                            <div className="text-sm text-muted-foreground">BTC, ETH, USDT</div>
                                        </div>
                                    </Label>
                                </div>

                                {/* Payvra Option */}
                                <div className={`relative px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === "payvra" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
                                    <RadioGroupItem value="payvra" id="payvra" className="sr-only" />
                                    <Label htmlFor="payvra" className="flex items-center gap-4 w-full cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <Bitcoin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Crypto (Payvra)</div>
                                            <div className="text-sm text-muted-foreground">Alternative Crypto Gateway</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
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
                                    <span className="text-muted-foreground">Items ({cartItems.length})</span>
                                    <span>${orderTotal.toFixed(2)}</span>
                                </div>
                                {/* Show NGN estimate if Paystack selected */}
                                {selectedPaymentMethod === "paystack" && exchangeRate && (
                                    <div className="flex justify-between text-cyan-600 dark:text-cyan-400 font-medium">
                                        <span>Est. NGN Total</span>
                                        <span>₦{(orderTotal * exchangeRate).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total</span>
                                    <span>${orderTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={isProcessing || (selectedPaymentMethod === "balance" && userBalance < orderTotal)}
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
