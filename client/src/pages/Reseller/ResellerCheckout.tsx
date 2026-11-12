"use client";
import { useState, useEffect } from "react";

import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, CreditCard, Wallet, X } from "lucide-react";
import "../UserDashboard/dashboard-home.css";
import "../UserDashboard/checkout.css";
import { usePaymentCheckoutHandlers } from "@/components/dashboard/Cart/hook/usePaymentCheckoutHandlers";
import { useCalculateOrderItems } from "@/components/dashboard/Cart/hook/useCalculateOrderTotalSync";
import { CartItem } from "@/types";
import { useRedditTracking } from "@/utils/redditPixel";
import api from "../../services/api";

import { fetchResellerBalance } from "../../services/resellerApi";


export interface ResellerCheckoutProps {
    onSuccess: (orderId: string) => void;
    onCancel: () => void;
}

export default function ResellerCheckout({ onSuccess, onCancel }: ResellerCheckoutProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [userBalance, setUserBalance] = useState(0);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("balance");
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingPlisio, setIsLoadingPlisio] = useState(false);

    const [isLoadingRexpay, setIsLoadingRexpay] = useState(false);
    const [isLoadingHundredpay, setIsLoadingHundredpay] = useState(false);
    const [isLoadingFastspring, setIsLoadingFastspring] = useState(false);
    const [isLoadingBachs, setIsLoadingBachs] = useState(false);

    const [isAnyPaymentProcessing, setIsAnyPaymentProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Promo code state
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
                    onCancel(); // Use onCancel for redirecting back to cart
                }
            } catch (e) {
                console.error("Error parsing cart:", e);
                onCancel();
            }
        } else {
            onCancel();
        }

        // 3. Fetch Balance & Exchange Rate
        const fetchData = async () => {
            try {
                const { data } = await fetchResellerBalance();
                if (data && (data.available_balance !== undefined || data.balance !== undefined)) {
                    setUserBalance(data.available_balance || data.balance || 0);
                }
                setExchangeRate(1500); // 1 USD = 1500 NGN default
            } catch (err) {
                console.error("Error fetching checkout data:", err);
            }
        };
        fetchData();
    }, []);

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
        calculateItemTotalSync,
    } = useCalculateOrderItems({ cartItems, exchangeRate });

    const {
        handleBalancePayment,
        handleRexpayCheckout,
        handleHundredpayCheckout,

        handlePlisioCheckout,
        handleFastSpringCheckout,
        handleHeleketCheckout,
        handleBachsCheckout,
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

        setIsLoadingRexpay,
        setIsLoadingHundredpay,
        setIsLoadingFastspring,
        setIsLoadingBachs,

        clearCart: () => {
            localStorage.removeItem("cartItems");
            localStorage.removeItem("enterprise_customer_email");
            setCartItems([]);
            globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 0 } }));
        },

        onSuccess,
        promoCode: promoApplied?.code,
    });

    const handleCheckout = () => {
        if (selectedPaymentMethod === "balance") handleBalancePayment();
        else if (selectedPaymentMethod === "rexpay") handleRexpayCheckout();
        else if (selectedPaymentMethod === "hundredpay") handleHundredpayCheckout();
        else if (selectedPaymentMethod === "plisio") handlePlisioCheckout();
        else if (selectedPaymentMethod === "fastspring") handleFastSpringCheckout();
        else if (selectedPaymentMethod === "heleket") handleHeleketCheckout();
        else if (selectedPaymentMethod === "bachs") handleBachsCheckout();
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
        isLoadingBalance || isLoadingRexpay || isLoadingHundredpay || isLoadingPlisio || isLoadingFastspring || isLoadingBachs || isAnyPaymentProcessing;

    const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    const nameFor = (item: CartItem) => item.product || item.plan?.name || item.esimPackage?.name || item.vpsPlan?.name || item.rdpPlan?.name || item.vpnPlan?.name || item.usaEsimPlan?.name || "Service";
    const methods: { value: string; name: string; description: string; image?: string; icon?: typeof Wallet }[] = [
        { value: "balance", name: "Wallet balance", description: `Available: ${money(userBalance)}`, icon: Wallet },
        { value: "rexpay", name: "Card · RexPay", description: "Continue to RexPay to review the NGN charge and pay.", image: "/rexpay.svg" },
        { value: "bachs", name: "Bachs", description: "Card, bank transfer, mobile money or crypto. Charged in USD.", icon: CreditCard },
        { value: "plisio", name: "Crypto · Plisio", description: "BTC, ETH, USDT and more.", image: "/plisio.webp" },
        { value: "heleket", name: "Crypto · Heleket", description: "Pay with cryptocurrency.", image: "/heleket.webp" },
    ];
    const payLabel = selectedPaymentMethod === "balance" ? "Pay with wallet" : `Continue to ${methods.find(m => m.value === selectedPaymentMethod)?.name.split(" · ").pop() ?? "payment"}`;

    return (
        <div className="checkout-page">
            <Helmet><title>Checkout | ProxySock</title></Helmet>
            <header className="overview-heading">
                <div><h1>Checkout</h1><p>Review your order and choose how to pay.</p></div>
                <button type="button" className="overview-button" onClick={onCancel}><ArrowLeft size={14} aria-hidden="true" />Back to store</button>
            </header>
            {error && <div className="overview-error" role="alert">{error}</div>}
            <div className="checkout-layout">
                <div className="checkout-main">
                    <section className="checkout-panel" aria-labelledby="payment-title">
                        <div className="overview-section-heading"><div><h2 id="payment-title">Payment method</h2><p>Your order is priced in USD.</p></div></div>
                        <fieldset className="checkout-methods" disabled={isProcessing}>
                            <legend className="sr-only">Choose payment method</legend>
                            {methods.map(m => (
                                <label key={m.value} className="checkout-method" data-selected={selectedPaymentMethod === m.value}>
                                    <input type="radio" name="reseller-payment-method" value={m.value} checked={selectedPaymentMethod === m.value} onChange={() => { setSelectedPaymentMethod(m.value); setError(null); }} />
                                    {m.image ? <img src={m.image} alt="" style={{ width: 35, height: 30, objectFit: "contain", background: "#fff", borderRadius: 3, padding: 3, flexShrink: 0 }} /> : m.icon ? <m.icon size={20} aria-hidden="true" /> : null}
                                    <span><strong>{m.name}</strong><small>{m.description}</small></span>
                                </label>
                            ))}
                        </fieldset>
                        {selectedPaymentMethod === "balance" && userBalance < finalTotal && (
                            <p className="checkout-balance-message" role="status">Your wallet needs {money(finalTotal - userBalance)} more. Add credits from the Wallet page or choose another payment method.</p>
                        )}
                    </section>
                    <section className="checkout-panel" aria-labelledby="checkout-items-title">
                        <div className="overview-section-heading"><h2 id="checkout-items-title">Your order <span className="checkout-count">{cartItems.length} {cartItems.length === 1 ? "item" : "items"}</span></h2></div>
                        <ul className="checkout-items">
                            {cartItems.map((item, index) => (
                                <li key={index}>
                                    <div><strong>{nameFor(item)}</strong><small>{["usa-esim", "esim"].includes(item.productType) ? `Quantity: ${item.quantity || 1}` : item.productType.toUpperCase()}{item.auto_renew ? " · Auto-renew enabled" : ""}</small></div>
                                    <span>{money(calculateItemTotalSync(item))}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
                <aside className="checkout-panel checkout-summary" aria-labelledby="checkout-summary-title">
                    <h2 id="checkout-summary-title">Order summary</h2>
                    <dl>
                        <div><dt>Subtotal</dt><dd>{money(orderTotal)}</dd></div>
                        {promoApplied && <div className="checkout-discount"><dt>Discount ({promoApplied.code})</dt><dd>−{money(promoDiscount)}</dd></div>}
                    </dl>
                    <div className="checkout-promo">
                        <label htmlFor="reseller-checkout-promo">Promo code</label>
                        {promoApplied ? (
                            <div className="checkout-applied" role="status">
                                <span>{promoApplied.code} applied</span>
                                <button type="button" aria-label="Remove promo code" disabled={isProcessing} onClick={handleRemovePromo}><X size={15} aria-hidden="true" /></button>
                            </div>
                        ) : (
                            <form onSubmit={event => { event.preventDefault(); void handleApplyPromo(); }}>
                                <div>
                                    <input id="reseller-checkout-promo" value={promoInput} onChange={event => { setPromoInput(event.target.value.toUpperCase()); setPromoError(null); }} disabled={promoValidating || isProcessing} autoComplete="off" aria-invalid={Boolean(promoError)} aria-describedby={promoError ? "reseller-checkout-promo-error" : undefined} />
                                    <button type="submit" disabled={!promoInput.trim() || promoValidating || isProcessing}>{promoValidating ? "Applying…" : "Apply"}</button>
                                </div>
                                {promoError && <p id="reseller-checkout-promo-error" role="alert">{promoError}</p>}
                            </form>
                        )}
                    </div>
                    <div className="checkout-total"><span>Total</span><strong>{money(finalTotal)}</strong></div>
                    <p className="checkout-note">USD · Final pricing and discounts are confirmed when your order is submitted.</p>
                    <button className="checkout-pay" type="button" onClick={handleCheckout} disabled={!cartItems.length || isProcessing || promoValidating || (selectedPaymentMethod === "balance" && userBalance < finalTotal)}>
                        {isProcessing ? "Processing payment…" : payLabel}<ArrowRight size={15} aria-hidden="true" />
                    </button>
                    <p className="checkout-terms">By purchasing, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>.</p>
                </aside>
            </div>
        </div>
    );
}
