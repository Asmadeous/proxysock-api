"use client";
import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wallet, CreditCard, X } from 'lucide-react';
import { usePaymentCheckoutHandlers } from '@/components/dashboard/Cart/hook/usePaymentCheckoutHandlers';
import { useCalculateOrderItems } from '@/components/dashboard/Cart/hook/useCalculateOrderTotalSync';
import { CartItem } from '@/types';
import { useRedditTracking } from '@/utils/redditPixel';
import { useThemeStore } from '@/store/themeStore';
import api from '@/services/api';
import './dashboard-home.css';
import './checkout.css';

export default function Checkout() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [userBalance, setUserBalance] = useState(0);
    const exchangeRate = null;
    const dark = useThemeStore(state => state.dark);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState(false);
    const paymentPending = useRef(false);
    const promoPending = useRef(false);
    const fetchBalance = async () => {
        setBalanceLoading(true); setBalanceError(false);
        try {
            const { data } = await api.get('/web/api/billing/balance');
            const amount = Number(data.available_balance);
            if (data.available_balance == null || !Number.isFinite(amount)) throw new Error('Balance unavailable');
            setUserBalance(amount);
        } catch { setBalanceError(true); }
        finally { setBalanceLoading(false); }
    };
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("balance");
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingPlisio, setIsLoadingPlisio] = useState(false);

    const [isLoadingRexpay, setIsLoadingRexpay] = useState(false);
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

        void fetchBalance();
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
                name: item.product || item.plan?.name || item.esimPackage?.name || item.vpsPlan?.name || item.rdpPlan?.name || item.vpnPlan?.name || item.usaEsimPlan?.name || 'Service',
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
        calculateOrderTotalSync, calculateItemTotalSync,
    } = useCalculateOrderItems({ cartItems, exchangeRate });

    const {
        handleBalancePayment,
        handleRexpayCheckout,
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
        setIsLoadingHeleket,
        clearCart: () => {
            localStorage.removeItem("cartItems");
            setCartItems([]);
            globalThis.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: 0 } }));
        },
        promoCode: promoApplied?.code,
    });

    const handleCheckout = async () => {
        if (paymentPending.current || isProcessing || promoValidating || !cartItems.length || (selectedPaymentMethod === 'balance' && (balanceLoading || balanceError || userBalance < finalTotal))) return;
        paymentPending.current = true;
        try {
            if (selectedPaymentMethod === 'balance') await handleBalancePayment();
            else if (selectedPaymentMethod === 'rexpay') await handleRexpayCheckout();
        } finally { paymentPending.current = false; }
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
        if (!promoInput.trim() || promoPending.current || paymentPending.current) return;
        promoPending.current = true;
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
            promoPending.current = false;
            setPromoValidating(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoApplied(null);
        setPromoInput("");
        setPromoError(null);
    };


    const isProcessing =
        isLoadingBalance || isLoadingRexpay || isLoadingHundredpay || isLoadingPlisio || isLoadingFastspring || isLoadingHeleket || isAnyPaymentProcessing;

    const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const walletUnavailable = balanceLoading || balanceError || userBalance < finalTotal;
    const nameFor = (item: CartItem) => item.product || item.plan?.name || item.esimPackage?.name || item.vpsPlan?.name || item.rdpPlan?.name || item.vpnPlan?.name || item.usaEsimPlan?.name || 'Service';

    return <div className={`dashboard-overview checkout-page ${dark ? 'overview-dark' : ''}`}>
      <Helmet><title>Checkout | ProxySock</title></Helmet>
      <header className="overview-heading"><div><h1>Checkout</h1><p>Review your order and choose how to pay.</p></div><Link className="overview-button" to="/dashboard/cart"><ArrowLeft size={14} aria-hidden="true" />Back to cart</Link></header>
      {error && <div className="overview-error" role="alert">{error}</div>}
      <div className="checkout-layout"><div className="checkout-main">
        <section className="checkout-panel" aria-labelledby="payment-title"><div className="overview-section-heading"><div><h2 id="payment-title">Payment method</h2><p>Your order is priced in USD.</p></div></div>
          <fieldset className="checkout-methods" disabled={isProcessing}><legend className="sr-only">Choose payment method</legend>
            <label className="checkout-method" data-selected={selectedPaymentMethod === 'balance'}><input type="radio" name="payment-method" value="balance" checked={selectedPaymentMethod === 'balance'} onChange={() => { setSelectedPaymentMethod('balance'); setError(null); }} /><Wallet size={20} aria-hidden="true" /><span><strong>Wallet balance</strong><small>{balanceLoading ? 'Loading balance…' : balanceError ? 'Balance unavailable' : `Available: ${money(userBalance)}`}</small></span></label>
            <label className="checkout-method" data-selected={selectedPaymentMethod === 'rexpay'}><input type="radio" name="payment-method" value="rexpay" checked={selectedPaymentMethod === 'rexpay'} onChange={() => { setSelectedPaymentMethod('rexpay'); setError(null); }} /><CreditCard size={20} aria-hidden="true" /><span><strong>Card · RexPay</strong><small>Continue to RexPay to review the NGN charge and pay.</small></span></label>
          </fieldset>
          {balanceError && <div className="checkout-balance-message" role="alert">Couldn’t load your wallet balance. <button type="button" onClick={fetchBalance} disabled={balanceLoading || isProcessing}>Retry balance</button></div>}
          {!balanceLoading && !balanceError && selectedPaymentMethod === 'balance' && userBalance < finalTotal && <p className="checkout-balance-message" role="status">Your wallet needs {money(finalTotal - userBalance)} more. Add funds using the wallet button in the sidebar, then <button type="button" onClick={fetchBalance} disabled={isProcessing}>refresh your balance</button>, or choose card payment.</p>}
          <p className="checkout-payment-note">To pay with crypto, add funds to your wallet first using the wallet button in the sidebar.</p>
        </section>
        <section className="checkout-panel" aria-labelledby="checkout-items-title"><div className="overview-section-heading"><h2 id="checkout-items-title">Your order <span className="checkout-count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span></h2><Link to="/dashboard/cart">Edit cart <ArrowRight size={14} aria-hidden="true" /></Link></div><ul className="checkout-items">{cartItems.map((item, index) => <li key={index}><div><strong>{nameFor(item)}</strong><small>{['usa-esim', 'esim'].includes(item.productType) ? `Quantity: ${item.quantity || 1}` : item.productType.toUpperCase()}{item.auto_renew ? ' · Auto-renew enabled' : ''}</small></div><span>{money(calculateItemTotalSync(item))}</span></li>)}</ul></section>
      </div><aside className="checkout-panel checkout-summary" aria-labelledby="checkout-summary-title"><h2 id="checkout-summary-title">Order summary</h2><dl><div><dt>Subtotal</dt><dd>{money(orderTotal)}</dd></div>{promoApplied && <div className="checkout-discount"><dt>Discount ({promoApplied.code})</dt><dd>−{money(promoDiscount)}</dd></div>}</dl>
        <div className="checkout-promo"><label htmlFor="checkout-promo">Promo or affiliate code</label>{promoApplied ? <div className="checkout-applied" role="status"><span>{promoApplied.code} applied</span><button type="button" aria-label="Remove promo code" disabled={isProcessing} onClick={handleRemovePromo}><X size={15} aria-hidden="true" /></button></div> : <form onSubmit={event => { event.preventDefault(); void handleApplyPromo(); }}><div><input id="checkout-promo" value={promoInput} onChange={event => { setPromoInput(event.target.value.toUpperCase()); setPromoError(null); }} disabled={promoValidating || isProcessing} autoComplete="off" aria-invalid={Boolean(promoError)} aria-describedby={promoError ? 'checkout-promo-error' : undefined} /><button type="submit" disabled={!promoInput.trim() || promoValidating || isProcessing}>{promoValidating ? 'Applying…' : 'Apply'}</button></div>{promoError && <p id="checkout-promo-error" role="alert">{promoError}</p>}</form>}</div>
        <div className="checkout-total"><span>Total</span><strong>{money(finalTotal)}</strong></div><p className="checkout-note">USD · Final pricing and discounts are confirmed when your order is submitted.</p>
        <button className="checkout-pay" type="button" onClick={handleCheckout} disabled={!cartItems.length || isProcessing || promoValidating || (selectedPaymentMethod === 'balance' && walletUnavailable)}>{isProcessing ? 'Processing payment…' : selectedPaymentMethod === 'balance' ? 'Pay with wallet' : 'Continue to RexPay'}<ArrowRight size={15} aria-hidden="true" /></button>
        <p className="checkout-terms">By purchasing, you agree to our <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>.</p>
      </aside></div>
    </div>;
}
