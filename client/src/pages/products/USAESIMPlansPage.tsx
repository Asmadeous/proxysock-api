import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Globe, MessageSquare, Phone, Signal, Smartphone, type LucideIcon } from 'lucide-react';
import { conversionTracker } from '@/utils/redditPixel';
import { DeviceDetails, deviceDetailsMetadata } from '@/utils/esim/deviceDetails';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import api from '../../services/api';
import PhonePlanDialog from './PhonePlanDialog';
import {
  BackButton,
  COUNTRIES,
  CarrierLogo,
  CountryFlag,
  LineCountry,
  PHONE_LINES,
  Pill,
  USAESIMPlan,
  carrierOf,
  filterGroups,
  planPills,
  priceSuffix,
  toUsaEsimPlan,
} from './phoneLines';

export * from './phoneLines';

interface CartItem {
  usaEsimPlan?: USAESIMPlan;
  deviceDetails?: DeviceDetails;
  quantity?: number;
  productType: string;
}

// Each pill carries an icon in our brand red; text uses the theme colour, so pills read in
// both light and dark mode (this project themes through CSS variables, not dark: classes).
const PILL_ICONS: Record<Pill['kind'], LucideIcon> = {
  number: Smartphone,
  data: Signal,
  days: CalendarDays,
  calls: Phone,
  texts: MessageSquare,
  intl: Globe,
};

const USAESIMCardSkeleton = () => (
  <div className="space-y-4 rounded-xl border border-border p-5" aria-hidden="true">
    <Skeleton className="h-9 w-40" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-11 w-full" />
  </div>
);

interface USAESIMPlansPageProps {
  // The country picked on the Voice, Data + Text country page.
  country?: LineCountry;
  onBack?: () => void;
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}

export default function USAESIMPlansPage({ country = 'US', onBack, isDirectBuy, onDirectBuy }: USAESIMPlansPageProps = {}) {
  const [plans, setPlans] = useState<USAESIMPlan[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [openPlan, setOpenPlan] = useState<USAESIMPlan | null>(null);
  const [provisioningPkgId, setProvisioningPkgId] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/web/api/products?product_type=esim&per_page=all');
        const products = (data.products || []).filter((p: any) => PHONE_LINES.includes(p.meisim_line));
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
  const addLine = async (plan: USAESIMPlan, details?: DeviceDetails) => {
    if (isDirectBuy && onDirectBuy) {
      setProvisioningPkgId(plan.id);
      try {
        await onDirectBuy(plan.id, 1, deviceDetailsMetadata(details));
        setOpenPlan(null);
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
    setOpenPlan(null);
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

  const countryPlans = useMemo(() => plans.filter((plan) => plan.country === country), [plans, country]);
  const groups = useMemo(() => filterGroups(country, countryPlans), [country, countryPlans]);
  const shownPlans = useMemo(() => {
    const selected = groups.flatMap((group) => {
      const option = group.options.find((o) => o.value === filters[group.id]);
      return option ? [option.test] : [];
    });
    return countryPlans
      .filter((plan) => selected.every((test) => test(plan)))
      .sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));
  }, [countryPlans, groups, filters, sort]);

  const toggleFilter = (groupId: string, value: string) =>
    setFilters((prev) => ({ ...prev, [groupId]: prev[groupId] === value ? '' : value }));

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
        <BackButton label="Back to countries" to="/dashboard/phone-esim" onBack={onBack} />
        <div className="flex items-center gap-3">
          <CountryFlag country={country} />
          <h1 className="text-3xl font-semibold tracking-tight">{COUNTRIES[country].name} phone-number eSIM</h1>
        </div>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Calls, texts and data on a {COUNTRIES[country].name} number. {COUNTRIES[country].facts.join('. ')}.
          {country === 'US' ? ' Your phone must be unlocked and compatible with the carrier.' : ' Your phone must be unlocked.'}
        </p>
      </header>


      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-5">
        <h2 className="text-xl font-semibold">{COUNTRIES[country].heading}</h2>
        {!isLoading && !error && (
          <p role="status" className="text-sm text-muted-foreground">
            {shownPlans.length === countryPlans.length
              ? `${countryPlans.length} ${countryPlans.length === 1 ? 'plan' : 'plans'} available`
              : `${shownPlans.length} of ${countryPlans.length} plans`}
          </p>
        )}
      </div>

      {!isLoading && !error && countryPlans.length > 0 && (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} role="group" aria-label={group.label} className="flex flex-wrap items-center gap-2">
              <span className="mr-1 w-full text-sm font-medium sm:w-36">{group.label}</span>
              {group.options.map((option) => {
                const on = filters[group.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFilter(group.id, option.value)}
                    className={`min-h-9 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground/40'}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="phone-plan-sort" className="mr-1 w-full text-sm font-medium sm:w-36">Sort</Label>
            <select
              id="phone-plan-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
              className="min-h-9 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="asc">Price: low to high</option>
              <option value="desc">Price: high to low</option>
            </select>
          </div>
        </div>
      )}

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
      ) : countryPlans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h3 className="font-semibold">{COUNTRIES[country].name} plans are currently unavailable</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please check back soon.</p>
        </div>
      ) : shownPlans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h3 className="font-semibold">No plans match these filters</h3>
          <Button variant="outline" className="mt-4" onClick={() => setFilters({})}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shownPlans.map((plan) => {
            const inCart = linesInCart(plan);
            const carrier = carrierOf(plan);
            return (
              <article key={plan.id} aria-label={plan.name} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-2">
                    <CarrierLogo carrier={carrier} className="h-10 w-24" />
                    <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide">
                      <CountryFlag country={plan.country} className="h-3.5 w-5" />
                      {plan.provider}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-extrabold tracking-tight">{formatPrice(plan.price, plan.currency_code)}</p>
                    <p className="text-xs text-muted-foreground">{priceSuffix(plan)}</p>
                  </div>
                </div>
                <h3 className="mt-3 text-[15px] font-bold leading-6">{plan.name}</h3>
                <ul aria-label="Plan includes" className="mt-3 flex flex-wrap gap-1.5">
                  {planPills(plan).map((pill, i) => {
                    const Icon = PILL_ICONS[pill.kind];
                    return (
                      <li key={`${pill.label}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                        <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {pill.label}
                      </li>
                    );
                  })}
                </ul>
                {plan.description && (
                  <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{plan.description.replace(/\s*\n+\s*/g, ' ')}</p>
                )}
                <div className="mt-auto space-y-2 pt-4">
                  {inCart > 0 && <p className="text-sm font-medium">{inCart} {inCart === 1 ? 'line' : 'lines'} in cart</p>}
                  {canBuy && (
                    <Button onClick={() => setOpenPlan(plan)} className="min-h-11 w-full rounded-full font-bold">
                      Get {plan.country === 'GB' ? 'UK' : 'US'} Number — {formatPrice(plan.price, plan.currency_code)}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PhonePlanDialog
        plan={openPlan}
        submitLabel={isDirectBuy ? "Instantly Provision" : "Add to Cart"}
        isSubmitting={!!openPlan && provisioningPkgId === openPlan.id}
        onClose={() => setOpenPlan(null)}
        onSubmit={(plan, details) => addLine(plan, details)}
      />
    </div>
  );
}
