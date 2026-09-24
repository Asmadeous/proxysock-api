import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { conversionTracker } from '@/utils/redditPixel';

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import api from '../../services/api';


interface USAESIMPlan {
  id: string;
  provider: string;
  country: 'US' | 'GB';
  sms_label: string;
  name: string;
  price: number;
  currency_code: string;
  voice_minutes: string;
  sms_included: boolean;
  data_amount: string;
  duration: number;
  duration_unit: string;
  features: string[];
  phone_number_included: boolean;
  moq: number;
}

interface CartItem {
  usaEsimPlan?: USAESIMPlan;
  quantity?: number;
  productType: 'usa-esim';
}

const USAESIMCardSkeleton = () => (
  <div className="space-y-5 rounded-xl border border-border p-6" aria-hidden="true">
    <Skeleton className="h-5 w-24" />
    <Skeleton className="h-7 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

interface USAESIMPlansPageProps {
  onBack?: () => void;
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}

export default function USAESIMPlansPage({ onBack, isDirectBuy, onDirectBuy }: USAESIMPlansPageProps = {}) {
  const [country, setCountry] = useState<'US' | 'GB'>('US');
  const [plans, setPlans] = useState<USAESIMPlan[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [provisioningPkgId, setProvisioningPkgId] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/web/api/products?product_type=usa_esim');

        const products = data.products || [];
        const mappedPlans: USAESIMPlan[] = products.map((p: any) => ({
          id: p.id.toString(),
          provider: p.provider || 'Mobile network',
          country: ['GB', 'UK'].includes(String(p.country_code || p.metadata?.country_code || 'US').toUpperCase()) ? 'GB' : 'US',
          sms_label: p.sms_quota === null || p.features?.some((feature: string) => /unlimited.*(sms|text)/i.test(feature)) ? 'Unlimited' : p.sms_quota != null ? String(p.sms_quota) : 'Not specified',
          name: p.name,
          price: p.price || 0,
          currency_code: p.currency || 'USD',
          voice_minutes: p.calling_minutes === null || p.features?.some((feature: string) => /unlimited.*(voice|call)/i.test(feature)) ? "Unlimited" : p.calling_minutes != null ? `${p.calling_minutes} min` : "Not specified",
          sms_included: p.sms_quota === null || (p.sms_quota && p.sms_quota > 0),
          data_amount: p.data_gb ? `${p.data_gb} GB` : "Unlimited Data",
          duration: p.duration_days || 30,
          duration_unit: "Days",
          features: p.features || ['4G/5G Coverage', 'Instant QR Activation'],
          phone_number_included: p.esim_type === 'voice_data_sms',
          moq: p.moq || 1
        }));

        setPlans(mappedPlans);
      } catch (err: any) {
        setError(err.message || 'Error loading plans. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();

    const loadCartFromStorage = () => {
      try {
        const storedCart = localStorage.getItem('cartItems');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            const usaEsimItems = parsedCart.filter(item => item.productType === 'usa-esim');
            setCartItems(usaEsimItems);
          }
        }
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    };

    loadCartFromStorage();

    const handleCartUpdate = () => loadCartFromStorage();
    globalThis.addEventListener('cart-updated', handleCartUpdate);
    return () => globalThis.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const addToCart = async (plan: USAESIMPlan) => {
    if (isDirectBuy && onDirectBuy) {
        setProvisioningPkgId(plan.id);
        try {
            await onDirectBuy(plan.id, plan.moq || 1, {});
        } finally {
            setProvisioningPkgId(null);
        }
        return;
    }

    const storedCart = localStorage.getItem('cartItems');
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const existingItemIndex = currentCart.findIndex(
      (item: CartItem) => item.productType === 'usa-esim' && item.usaEsimPlan?.id === plan.id
    );

    if (existingItemIndex >= 0) {
      currentCart[existingItemIndex].quantity = (currentCart[existingItemIndex].quantity || 0) + 1;
    } else {
      currentCart.push({ usaEsimPlan: plan, quantity: plan.moq || 1, productType: 'usa-esim' });
    }

    localStorage.setItem('cartItems', JSON.stringify(currentCart));
    setCartItems(currentCart.filter((item: CartItem) => item.productType === 'usa-esim'));
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);

    const totalItems = currentCart.reduce((total: number, item: CartItem) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));

    // Track AddToCart
    conversionTracker.trackAddToCart({
      productId: plan.id,
      productName: plan.name,
      category: "usa-esim",
      value: plan.price / 100,
      currency: plan.currency_code
    });
  };

  const removeFromCart = (planId: string) => {
    const storedCart = localStorage.getItem('cartItems');
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const updatedCart = currentCart.filter(
      (item: CartItem) => !(item.productType === 'usa-esim' && item.usaEsimPlan?.id === planId)
    );

    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    setCartItems(updatedCart.filter((item: CartItem) => item.productType === 'usa-esim'));

    const totalItems = updatedCart.reduce((total: number, item: CartItem) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
  };

  const updateQuantity = (planId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(planId);
      return;
    }

    // Enforce MOQ
    const plan = plans.find(p => p.id === planId);
    if (plan && plan.moq > 1 && quantity < plan.moq) {
      return;
    }

    const storedCart = localStorage.getItem('cartItems');
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const updatedCart = currentCart.map((item: CartItem) =>
      item.productType === 'usa-esim' && item.usaEsimPlan?.id === planId ? { ...item, quantity } : item
    );

    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    setCartItems(updatedCart.filter((item: CartItem) => item.productType === 'usa-esim'));

    const totalItems = updatedCart.reduce((total: number, item: CartItem) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
  };

  const getCartItemForPlan = (plan: USAESIMPlan) => {
    return cartItems.find(item => item.usaEsimPlan?.id === plan.id);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const visiblePlans = plans.filter((plan) => plan.country === country);
  const countryLabel = country === 'US' ? 'USA' : 'UK';

  return (
    <div className="w-full space-y-7">
      <header>
        {onBack ? (
          <button type="button" onClick={onBack} className="mb-4 rounded py-2 text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All eSIM services</button>
        ) : (
          <Link to="/dashboard/esim" className="mb-4 inline-block rounded py-2 text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All eSIM services</Link>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">Voice, Data + Text eSIM</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Choose your number’s country, then compare the available plans.</p>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-5">
        <span className="text-sm font-semibold">Choose your number’s country</span>
        <div role="group" aria-label="Phone number country" className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-80">
          {(['US', 'GB'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={country === value} onClick={() => setCountry(value)}
              className={`min-h-12 rounded-lg border px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background ${country === value ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/30 bg-card hover:border-primary hover:bg-primary/10'}`}>
              {value === 'US' ? 'USA' : 'UK'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{countryLabel} phone-number plans</h2>
        {!isLoading && !error && <p role="status" className="text-sm text-muted-foreground">{visiblePlans.length} {visiblePlans.length === 1 ? 'plan' : 'plans'} available</p>}
      </div>

      {showSuccessAlert && (
        <div role="status" className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium">Your eSIM plan has been added to the cart.</p>
          <Button variant="ghost" size="sm" onClick={() => setShowSuccessAlert(false)}>Dismiss</Button>
        </div>
      )}

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading phone-number plans" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <USAESIMCardSkeleton key={item} />)}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-border bg-card p-8">
          <h3 className="font-semibold">We couldn’t load the plans</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h3 className="font-semibold">{countryLabel} plans are currently unavailable</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please check back or choose another country to view available plans.</p>
          {country === 'GB' && <Button variant="outline" className="mt-5" onClick={() => setCountry('US')}>View USA plans</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visiblePlans.map((plan) => {
            const cartItem = getCartItemForPlan(plan);
            const inCart = !!cartItem;
            return (
              <article key={plan.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 sm:p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="mb-1 text-sm capitalize text-muted-foreground">{plan.provider}</p>
                    <h3 className="text-lg font-semibold leading-7">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight">{formatPrice(plan.price, plan.currency_code)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.duration} {plan.duration_unit.toLowerCase()}</p>
                  </div>
                </div>
                <dl className="mb-5 divide-y divide-border border-y border-border">
                  {[['Data', plan.data_amount], ['Calls', plan.voice_minutes], ['Texts', plan.sms_label]].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-5 py-3 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                {plan.features.length > 0 && (
                  <details className="mb-5 text-sm">
                    <summary className="w-fit cursor-pointer rounded py-2 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Plan details</summary>
                    <ul className="mt-2 list-disc space-y-2 pl-5 leading-6 text-muted-foreground">
                      {plan.features.map((feature, index) => <li key={index}>{feature}</li>)}
                    </ul>
                  </details>
                )}
                {plan.moq > 1 && <p className="mb-5 text-sm text-muted-foreground">Minimum order: {plan.moq} eSIMs. Price shown is per eSIM.</p>}
                <div className="mt-auto">
                  {JSON.parse(localStorage.getItem("resellerUser") || "{}").reseller_type !== "infrastructure" && (
                    inCart ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                          <Button aria-label={`Decrease quantity for ${plan.name}`} onClick={() => updateQuantity(plan.id, (cartItem?.quantity || 1) - 1)} variant="outline" className="h-11 w-11 p-0">−</Button>
                          <span className="text-sm font-medium">{cartItem?.quantity || 0} in cart</span>
                          <Button aria-label={`Increase quantity for ${plan.name}`} onClick={() => updateQuantity(plan.id, (cartItem?.quantity || 0) + 1)} variant="outline" className="h-11 w-11 p-0">+</Button>
                        </div>
                        <Button onClick={() => removeFromCart(plan.id)} variant="outline" className="w-full">Remove from cart</Button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(plan)} disabled={provisioningPkgId === plan.id} className="min-h-12 w-full gap-2">
                        {provisioningPkgId === plan.id && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                        {provisioningPkgId === plan.id ? "Provisioning..." : isDirectBuy ? "Instantly Provision" : "Add to Cart"}
                      </Button>
                    )
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
