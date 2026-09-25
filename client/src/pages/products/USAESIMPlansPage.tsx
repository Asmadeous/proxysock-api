import { useState, useEffect, useMemo } from 'react';
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


export type LineCountry = 'US' | 'GB';

// A MeiSIM phone-number line (US or UK): a local number with talk, text and data.
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
  voice: string;
  sms: string;
  coverage: string;
  description: string;
  activation_note: string;
  warnings: string;
  country: LineCountry;
  // Activated by MeiSIM's team onto the phone's EID within 24 hours, with no QR code.
  manual: boolean;
  // MeiSIM only takes an E911/area-code address on some US carriers.
  accepts_address: boolean;
}

interface CartItem {
  usaEsimPlan?: USAESIMPlan;
  deviceDetails?: DeviceDetails;
  quantity?: number;
  productType: string;
}

const EMPTY_ADDRESS: DeviceAddress = { address_line_1: '', city: '', state: '', zip_code: '' };

// MeiSIM sends "See plan" for many US lines; the allowance is then only in the name, e.g. "Prepaid · 1GB".
const dataFromName = (name: unknown): string => {
  const match = String(name ?? '').match(/(\d+(?:\.\d+)?)\s*(GB|MB)s?\b/i);
  return match ? `${match[1]} ${match[2].toUpperCase()}` : '';
};

// "Moxee 2 Prepaid · Talk & Text" -> "Talk & Text"; the carrier is already shown above the title.
const planTitle = (plan: USAESIMPlan) => {
  const [first, ...rest] = plan.name.split(' · ');
  return rest.length ? rest.join(' · ') : first;
};

export const toUsaEsimPlan = (p: any): USAESIMPlan => {
  const dataLimit = String(p.data_limit ?? '').trim();
  const hasNumber = /^\d+(\.\d+)?$/.test(dataLimit);
  return {
    id: String(p.id),
    provider: p.network || 'Mobile network',
    name: p.name,
    price: Number(p.price) || 0,
    currency_code: p.currency || 'USD',
    data_amount: hasNumber ? `${dataLimit} ${p.data_unit || 'GB'}` : dataLimit && !/see plan/i.test(dataLimit) ? dataLimit : dataFromName(p.name),
    duration: Number(p.validity_days) || 30,
    duration_unit: 'Days',
    requires_imei: p.requires_imei !== false,
    requires_eid: p.requires_eid !== false,
    voice: p.voice || '',
    sms: p.sms || '',
    coverage: p.coverage || '',
    description: p.description || '',
    activation_note: p.activation_note || '',
    warnings: p.warnings || '',
    country: p.number_country === 'GB' || p.meisim_line === 'uk_prepaid' ? 'GB' : 'US',
    manual: p.manual_fulfilment === true,
    accepts_address: p.accepts_address === true,
  };
};

const PHONE_LINES = ['us_prepaid', 'uk_prepaid'];

const COUNTRIES: Record<LineCountry, { name: string; heading: string; facts: string[] }> = {
  US: { name: 'USA', heading: 'USA phone-number plans', facts: ["Needs your phone's IMEI (and EID on most carriers)", 'Mobile data works inside the US only'] },
  GB: { name: 'UK', heading: 'UK phone-number plans', facts: ['No IMEI or EID needed', 'EU roaming included · activate in the UK first'] },
};

type Option = { value: string; label: string; test: (plan: USAESIMPlan) => boolean };

// MeiSIM names some networks with and without "Prepaid" ("AT&T" / "AT&T Prepaid"); group them.
const carrierOf = (plan: USAESIMPlan) => plan.provider.replace(/\s+prepaid$/i, '');

// Carrier logos served from /public/carriers (official files from Wikimedia Commons or
// the carrier's own site). MeiSIM sends none for phone-number lines, so a carrier
// without an entry here shows its name only. `dark` logos have white lettering.
const CARRIER_LOGOS: Record<string, { src: string; dark?: boolean }> = {
  'AT&T': { src: '/carriers/att.svg' },
  'T-Mobile': { src: '/carriers/t-mobile.svg' },
  Lycamobile: { src: '/carriers/lycamobile.svg' },
  'Moxee 2': { src: '/carriers/moxee.svg' },
  Moxee: { src: '/carriers/moxee.svg' },
  'LinkUp Mobile': { src: '/carriers/linkup.png', dark: true },
  MobileX: { src: '/carriers/mobilex.svg', dark: true },
  'O2 UK': { src: '/carriers/o2.svg' },
  'Three UK': { src: '/carriers/three.svg' },
};

function CarrierLogo({ carrier, className = 'h-9 max-w-28' }: { carrier: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const logo = CARRIER_LOGOS[carrier];
  if (!logo || failed) return null;
  return (
    <img
      src={logo.src}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className={`${className} w-auto shrink-0 rounded-md object-contain px-1.5 py-1 ${logo.dark ? 'bg-neutral-900' : 'bg-white'}`}
    />
  );
}

const flagUrl = (country: LineCountry, width: number) => `https://flagcdn.com/w${width}/${country.toLowerCase()}.png`;

function CountryFlag({ country }: { country: LineCountry }) {
  return (
    <img
      src={flagUrl(country, 80)}
      srcSet={`${flagUrl(country, 160)} 2x`}
      width={40}
      height={30}
      alt=""
      aria-hidden="true"
      className="h-[30px] w-10 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-border"
    />
  );
}

const planText = (plan: USAESIMPlan) => `${plan.name} ${plan.description}`.toLowerCase();

const isSmsOnly = (plan: USAESIMPlan) => /sms only|sms verification|incoming sms/.test(planText(plan));
const isTalkAndText = (plan: USAESIMPlan) =>
  !isSmsOnly(plan) && !plan.data_amount && /talk\s*(&|and)\s*text/i.test(plan.name);
const hasIntlCalling = (plan: USAESIMPlan) => /international|intl/i.test(`${plan.name} ${plan.voice}`);
const months = (plan: USAESIMPlan) => Math.max(1, Math.round(plan.duration / 30));

// "8GB UK · 8GB roaming" -> 8; "Unlimited UK · 30GB roaming" -> Infinity.
const ukDataGb = (plan: USAESIMPlan) => {
  if (/^unlimited/i.test(plan.data_amount)) return Infinity;
  const match = plan.data_amount.match(/(\d+(?:\.\d+)?)\s*GB/i);
  return match ? Number(match[1]) : NaN;
};

// Each country gets filters that fit its own plans; options no plan matches are hidden.
const filterGroups = (country: LineCountry, plans: USAESIMPlan[]): { id: string; label: string; options: Option[] }[] => {
  const carriers = Array.from(new Set(plans.map(carrierOf))).sort();
  const carrier = {
    id: 'carrier', label: 'Carrier',
    options: carriers.map((name) => ({ value: name, label: name, test: (plan: USAESIMPlan) => carrierOf(plan) === name })),
  };
  const groups = country === 'US'
    ? [
        carrier,
        {
          id: 'includes', label: "What's included",
          options: [
            { value: 'all', label: 'Calls, texts + data', test: (plan: USAESIMPlan) => !isSmsOnly(plan) && !isTalkAndText(plan) },
            { value: 'talk', label: 'Talk & text only', test: isTalkAndText },
            { value: 'sms', label: 'SMS only', test: isSmsOnly },
            { value: 'intl', label: 'International calling', test: hasIntlCalling },
          ],
        },
        {
          id: 'length', label: 'Length',
          options: Array.from(new Set(plans.map(months))).sort((a, b) => a - b).map((m) => ({
            value: String(m), label: `${m} ${m === 1 ? 'month' : 'months'}`, test: (plan: USAESIMPlan) => months(plan) === m,
          })),
        },
      ]
    : [
        carrier,
        {
          id: 'data', label: 'UK data',
          options: [
            { value: 'upto25', label: 'Up to 25 GB', test: (plan: USAESIMPlan) => ukDataGb(plan) <= 25 },
            { value: 'mid', label: '40–125 GB', test: (plan: USAESIMPlan) => ukDataGb(plan) > 25 && ukDataGb(plan) <= 125 },
            { value: 'big', label: '200 GB+', test: (plan: USAESIMPlan) => ukDataGb(plan) > 125 && Number.isFinite(ukDataGb(plan)) },
            { value: 'unlimited', label: 'Unlimited', test: (plan: USAESIMPlan) => ukDataGb(plan) === Infinity },
          ],
        },
        {
          id: 'intl', label: 'International minutes',
          options: [{ value: 'yes', label: 'Included', test: hasIntlCalling }],
        },
      ];
  return groups
    .map((group) => ({ ...group, options: group.options.filter((option) => plans.some(option.test)) }))
    .filter((group) => group.options.length > 1 || (group.id === 'intl' && group.options.length === 1));
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
      {plan.manual && (
        <p className="text-sm font-medium">Enter the EID of the phone you'll actually use. The line is tied to that phone and can't be moved to another one later.</p>
      )}
      {plan.accepts_address && <details className="text-sm">
        <summary className="w-fit cursor-pointer rounded py-1 font-medium underline underline-offset-4">US address (optional): used for 911 and your number's area code</summary>
        <div className="mt-3 space-y-3">
          {field('address_line_1', 'Street address', address.address_line_1, setAddressField('address_line_1'), errors.address_line_1, { autoComplete: 'address-line1' })}
          <div className="grid grid-cols-3 gap-3">
            {field('city', 'City', address.city, setAddressField('city'), errors.city, { autoComplete: 'address-level2' })}
            {field('state', 'State', address.state, setAddressField('state'), errors.state, { autoComplete: 'address-level1', maxLength: 2 })}
            {field('zip_code', 'ZIP', address.zip_code, setAddressField('zip_code'), errors.zip_code, { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 5 })}
          </div>
          <p className="text-muted-foreground">Leave it empty and the carrier assigns the number's location.</p>
        </div>
      </details>}
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
  initialCountry?: LineCountry;
  onBack?: () => void;
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}

export default function USAESIMPlansPage({ initialCountry, onBack, isDirectBuy, onDirectBuy }: USAESIMPlansPageProps = {}) {
  const [plans, setPlans] = useState<USAESIMPlan[]>([]);
  const [country, setCountry] = useState<LineCountry>(
    initialCountry ?? (new URLSearchParams(globalThis.location?.search).get('country') === 'uk' ? 'GB' : 'US'),
  );
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
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

  const chooseCountry = (next: LineCountry) => {
    setCountry(next);
    setFilters({});
    setFormPlanId(null);
  };

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
        {onBack ? (
          <button type="button" onClick={onBack} className="mb-4 rounded py-2 text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All eSIM services</button>
        ) : (
          <Link to="/dashboard/esim" className="mb-4 inline-block rounded py-2 text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All eSIM services</Link>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">Voice, Data + Text eSIM</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Phone-number plans with calls, texts and data. Each line is activated on one phone.</p>
      </header>

      <div role="group" aria-label="Phone number country" className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(COUNTRIES) as LineCountry[]).map((code) => {
          const info = COUNTRIES[code];
          const linePlans = plans.filter((plan) => plan.country === code);
          const carriers = Array.from(new Set(linePlans.map(carrierOf))).sort();
          const kinds = filterGroups(code, linePlans).find((group) => group.id === (code === 'US' ? 'includes' : 'data'))?.options ?? [];
          const fromPrice = linePlans.length ? Math.min(...linePlans.map((plan) => plan.price)) : null;
          const active = code === country;
          return (
            <button
              key={code}
              type="button"
              aria-pressed={active}
              onClick={() => chooseCountry(code)}
              className={`rounded-xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-foreground/40'}`}
            >
              <span className="flex items-center gap-3">
                <CountryFlag country={code} />
                <span className="text-xl font-bold tracking-tight">{info.name} phone number</span>
                {!isLoading && (
                  <span className="ml-auto text-right text-sm text-foreground/75">
                    {linePlans.length} {linePlans.length === 1 ? 'plan' : 'plans'}
                    {fromPrice !== null && <span className="block font-semibold text-foreground">from {formatPrice(fromPrice)}</span>}
                  </span>
                )}
              </span>
              {carriers.length > 0 && (
                <span className="mt-4 flex flex-wrap items-center gap-2">
                  {carriers.map((name) => (
                    <span key={name} title={name} className="inline-flex min-h-8 items-center">
                      {CARRIER_LOGOS[name] ? (
                        <>
                          <CarrierLogo carrier={name} className="h-8 max-w-28" />
                          <span className="sr-only">{name}</span>
                        </>
                      ) : (
                        <span className="rounded-md border border-border px-2 py-1 text-sm font-medium">{name}</span>
                      )}
                    </span>
                  ))}
                </span>
              )}
              {kinds.length > 0 && (
                <span className="mt-3 block text-sm">
                  <span className="font-medium">{code === 'US' ? 'Plans: ' : 'UK data: '}</span>
                  <span className="text-foreground/80">{kinds.map((kind) => kind.label).join(' · ')}</span>
                </span>
              )}
              <span className="mt-3 block space-y-1 text-sm text-foreground/70">
                {info.facts.map((fact) => <span key={fact} className="block">{fact}</span>)}
              </span>
            </button>
          );
        })}
      </div>

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
            const submitLabel = isDirectBuy ? "Instantly Provision" : "Add to Cart";
            return (
              <article key={plan.id} aria-label={plan.name} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 sm:p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="flex items-center gap-2.5">
                      <CarrierLogo carrier={carrierOf(plan)} />
                      <h3 className="text-2xl font-bold leading-8 tracking-tight">{plan.provider}</h3>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-6 text-foreground/75">{planTitle(plan)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight">{formatPrice(plan.price, plan.currency_code)}</p>
                    <p className="mt-1 text-sm text-foreground/75">{plan.duration} {plan.duration_unit.toLowerCase()}</p>
                  </div>
                </div>
                <dl className="mb-5 divide-y divide-border border-y border-border">
                  {([
                    ['Data', plan.data_amount],
                    ['Calls', plan.voice],
                    ['Texts', plan.sms],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-5 py-3 text-sm">
                      <dt className="text-foreground/75">{label}</dt>
                      <dd className={value ? 'text-right font-semibold' : 'text-right text-foreground/50'}>
                        {value || <><span aria-hidden="true">—</span><span className="sr-only">Not listed</span></>}
                      </dd>
                    </div>
                  ))}
                  {plan.coverage && plan.coverage !== 'United States' && (
                    <div className="flex justify-between gap-5 py-3 text-sm">
                      <dt className="text-foreground/75">Coverage</dt>
                      <dd className="text-right font-semibold">{plan.coverage}</dd>
                    </div>
                  )}
                </dl>
                {plan.manual && (
                  <p className="mb-5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
                    Activated by the carrier within 24 hours, straight onto your phone. No QR code needed.
                  </p>
                )}
                {plan.warnings && (
                  <p className="mb-5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium">{plan.warnings}</p>
                )}
                {plan.description && (
                  <ul className="mb-5 space-y-1.5 text-sm leading-6 text-foreground/85">
                    {plan.description.split('\n').map((line) => line.trim()).filter(Boolean).map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-foreground/60" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {plan.activation_note && <p className="mb-5 text-sm leading-6 text-foreground/70">{plan.activation_note}</p>}
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
                      <Button
                        onClick={() => (plan.requires_imei ? setFormPlanId(plan.id) : addLine(plan))}
                        disabled={provisioningPkgId === plan.id}
                        className="min-h-12 w-full"
                      >
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
