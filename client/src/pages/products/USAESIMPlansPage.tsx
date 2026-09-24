import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { conversionTracker } from '@/utils/redditPixel';
import {
  DeviceAddress,
  DeviceDetails,
  DeviceDetailsErrors,
  deviceDetailsMetadata,
  validateDeviceDetails,
} from '@/utils/esim/deviceDetails';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import api from '../../services/api';


// A MeiSIM US prepaid line: a US phone number with talk, text and data.
export interface USAESIMPlan {
  id: string;
  provider: string;
  name: string;
  price: number;
  currency_code: string;
  data_amount: string;
  duration: number;
  duration_unit: string;
  requires_imei: boolean;
  requires_eid: boolean;
}

interface CartItem {
  usaEsimPlan?: USAESIMPlan;
  deviceDetails?: DeviceDetails;
  quantity?: number;
  productType: string;
}

const EMPTY_ADDRESS: DeviceAddress = { address_line_1: '', city: '', state: '', zip_code: '' };

export const toUsaEsimPlan = (p: any): USAESIMPlan => {
  const dataLimit = String(p.data_limit ?? '').trim();
  const hasNumber = /^\d+(\.\d+)?$/.test(dataLimit);
  return {
    id: String(p.id),
    provider: p.network || 'Mobile network',
    name: p.name,
    price: Number(p.price) || 0,
    currency_code: p.currency || 'USD',
    data_amount: hasNumber ? `${dataLimit} ${p.data_unit || 'GB'}` : dataLimit && !/see plan/i.test(dataLimit) ? dataLimit : 'See plan details',
    duration: Number(p.validity_days) || 30,
    duration_unit: 'Days',
    requires_imei: p.requires_imei !== false,
    requires_eid: p.requires_eid !== false,
  };
};

const USAESIMCardSkeleton = () => (
  <div className="space-y-5 rounded-xl border border-border p-6" aria-hidden="true">
    <Skeleton className="h-5 w-24" />
    <Skeleton className="h-7 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

interface DeviceDetailsFormProps {
  plan: USAESIMPlan;
  submitLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (details: DeviceDetails) => void;
}

function DeviceDetailsForm({ plan, submitLabel, isSubmitting, onCancel, onSubmit }: DeviceDetailsFormProps) {
  const [imei, setImei] = useState('');
  const [eid, setEid] = useState('');
  const [address, setAddress] = useState<DeviceAddress>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<DeviceDetailsErrors>({});
  const idPrefix = `device-${plan.id}`;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateDeviceDetails({ imei, eid, address }, plan.requires_eid);
    setErrors(result.errors);
    if (result.details) onSubmit(result.details);
  };

  const field = (
    id: string, label: string, value: string, onChange: (value: string) => void,
    error?: string, props: React.ComponentProps<'input'> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${id}`}>{label}</Label>
      <Input
        id={`${idPrefix}-${id}`} value={value} onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error} aria-describedby={error ? `${idPrefix}-${id}-error` : undefined} {...props}
      />
      {error && <p id={`${idPrefix}-${id}-error`} className="text-sm text-destructive">{error}</p>}
    </div>
  );

  const setAddressField = (key: keyof DeviceAddress) => (value: string) => setAddress((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={submit} noValidate aria-label={`Phone details for ${plan.name}`} className="space-y-4 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        The carrier activates the line on one phone. Dial <span className="font-medium text-foreground">*#06#</span> on that phone to see its IMEI{plan.requires_eid ? ' and EID' : ''}.
      </p>
      {field('imei', 'IMEI', imei, setImei, errors.imei, { inputMode: 'numeric', autoComplete: 'off', placeholder: '15 digits' })}
      {plan.requires_eid && field('eid', 'EID', eid, setEid, errors.eid, { inputMode: 'numeric', autoComplete: 'off', placeholder: '32 digits' })}
      <details className="text-sm">
        <summary className="w-fit cursor-pointer rounded py-1 font-medium underline underline-offset-4">US address for 911 (optional)</summary>
        <div className="mt-3 space-y-3">
          {field('address_line_1', 'Street address', address.address_line_1, setAddressField('address_line_1'), errors.address_line_1, { autoComplete: 'address-line1' })}
          <div className="grid grid-cols-3 gap-3">
            {field('city', 'City', address.city, setAddressField('city'), errors.city, { autoComplete: 'address-level2' })}
            {field('state', 'State', address.state, setAddressField('state'), errors.state, { autoComplete: 'address-level1', maxLength: 2 })}
            {field('zip_code', 'ZIP', address.zip_code, setAddressField('zip_code'), errors.zip_code, { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 5 })}
          </div>
        </div>
      </details>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="min-h-11 flex-1 gap-2">
          {isSubmitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Provisioning...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-11">Cancel</Button>
      </div>
    </form>
  );
}

interface USAESIMPlansPageProps {
  onBack?: () => void;
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}

export default function USAESIMPlansPage({ onBack, isDirectBuy, onDirectBuy }: USAESIMPlansPageProps = {}) {
  const [plans, setPlans] = useState<USAESIMPlan[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [formPlanId, setFormPlanId] = useState<string | null>(null);
  const [provisioningPkgId, setProvisioningPkgId] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/web/api/products?product_type=esim&per_page=all');
        const products = (data.products || []).filter((p: any) => p.meisim_line === 'us_prepaid');
        setPlans(products.map(toUsaEsimPlan).sort((a: USAESIMPlan, b: USAESIMPlan) => a.price - b.price));
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
            setCartItems(parsedCart.filter(item => item.productType === 'usa-esim'));
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

  // Each line belongs to one phone, so every add is its own cart item with quantity 1.
  const addLine = async (plan: USAESIMPlan, details: DeviceDetails) => {
    if (isDirectBuy && onDirectBuy) {
      setProvisioningPkgId(plan.id);
      try {
        await onDirectBuy(plan.id, 1, deviceDetailsMetadata(details));
        setFormPlanId(null);
      } finally {
        setProvisioningPkgId(null);
      }
      return;
    }

    let currentCart: CartItem[] = [];
    try {
      currentCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    } catch (e) {
      currentCart = [];
    }

    currentCart.push({ usaEsimPlan: plan, deviceDetails: details, quantity: 1, productType: 'usa-esim' });

    localStorage.setItem('cartItems', JSON.stringify(currentCart));
    setCartItems(currentCart.filter((item) => item.productType === 'usa-esim'));
    setFormPlanId(null);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);

    const totalItems = currentCart.reduce((total, item) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));

    conversionTracker.trackAddToCart({
      productId: plan.id,
      productName: plan.name,
      category: "usa-esim",
      value: plan.price,
      currency: plan.currency_code
    });
  };

  const linesInCart = (plan: USAESIMPlan) =>
    cartItems.filter((item) => item.usaEsimPlan?.id === plan.id).length;

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const canBuy = JSON.parse(localStorage.getItem("resellerUser") || "{}").reseller_type !== "infrastructure";

  return (
    <div className="w-full space-y-7">
      <header>
        {onBack ? (
          <button type="button" onClick={onBack} className="mb-4 rounded py-2 text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All eSIM services</button>
        ) : (
          <Link to="/dashboard/esim" className="mb-4 inline-block rounded py-2 text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All eSIM services</Link>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">Voice, Data + Text eSIM</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">US phone-number plans with calls, texts and data. Each line is activated on one phone.</p>
      </header>

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-5">
        <h2 className="text-xl font-semibold">USA phone-number plans</h2>
        {!isLoading && !error && <p role="status" className="text-sm text-muted-foreground">{plans.length} {plans.length === 1 ? 'plan' : 'plans'} available</p>}
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
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h3 className="font-semibold">USA plans are currently unavailable</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {plans.map((plan) => {
            const inCart = linesInCart(plan);
            const submitLabel = isDirectBuy ? "Instantly Provision" : "Add to Cart";
            return (
              <article key={plan.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 sm:p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="mb-1 text-sm text-muted-foreground">{plan.provider}</p>
                    <h3 className="text-lg font-semibold leading-7">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight">{formatPrice(plan.price, plan.currency_code)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.duration} {plan.duration_unit.toLowerCase()}</p>
                  </div>
                </div>
                <dl className="mb-5 divide-y divide-border border-y border-border">
                  {[['Phone number', 'US number included'], ['Data', plan.data_amount]].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-5 py-3 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto space-y-3">
                  {canBuy && (formPlanId === plan.id ? (
                    <DeviceDetailsForm
                      plan={plan}
                      submitLabel={submitLabel}
                      isSubmitting={provisioningPkgId === plan.id}
                      onCancel={() => setFormPlanId(null)}
                      onSubmit={(details) => addLine(plan, details)}
                    />
                  ) : (
                    <>
                      {inCart > 0 && <p className="text-sm font-medium">{inCart} {inCart === 1 ? 'line' : 'lines'} in cart</p>}
                      <Button onClick={() => setFormPlanId(plan.id)} className="min-h-12 w-full">
                        {inCart > 0 ? 'Add another line' : submitLabel}
                      </Button>
                    </>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
