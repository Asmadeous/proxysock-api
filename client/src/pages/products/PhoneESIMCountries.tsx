import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import {
  BackButton,
  CARRIER_LOGOS,
  COUNTRIES,
  CarrierLogo,
  CountryFlag,
  LineCountry,
  PHONE_LINES,
  USAESIMPlan,
  carrierOf,
  filterGroups,
  toUsaEsimPlan,
} from './phoneLines';

// Where each country's plans live in the customer dashboard.
export const COUNTRY_PATHS: Record<LineCountry, string> = { US: '/dashboard/usa-esim', GB: '/dashboard/uk-esim' };

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

interface PhoneESIMCountriesProps {
  onBack?: () => void;
  // Reseller and admin views switch tabs instead of routing.
  onSelect?: (country: LineCountry) => void;
}

// Voice, Data + Text step two: pick the country of the phone number, then see its plans.
export default function PhoneESIMCountries({ onBack, onSelect }: PhoneESIMCountriesProps = {}) {
  const [plans, setPlans] = useState<USAESIMPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/web/api/products?product_type=esim&per_page=all')
      .then(({ data }) => setPlans((data.products || []).filter((p: any) => PHONE_LINES.includes(p.meisim_line)).map(toUsaEsimPlan)))
      .catch((err) => setError(err.message || 'Error loading plans. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const cardClass = 'flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="w-full space-y-7">
      <header>
        <BackButton label="Back to eSIM services" to="/dashboard/esim" onBack={onBack} />
        <h1 className="text-3xl font-semibold tracking-tight">Voice, Data + Text eSIM</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Choose the country for your phone number. Each line comes with calls, texts and data and is activated on one phone.</p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">We couldn’t load the plans</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {(Object.keys(COUNTRIES) as LineCountry[]).map((code) => {
          const info = COUNTRIES[code];
          const linePlans = plans.filter((plan) => plan.country === code);
          const carriers = Array.from(new Set(linePlans.map(carrierOf))).sort();
          const kinds = filterGroups(code, linePlans).find((group) => group.id === (code === 'US' ? 'includes' : 'data'))?.options ?? [];
          const fromPrice = linePlans.length ? Math.min(...linePlans.map((plan) => plan.price)) : null;

          const body = (
            <>
              <span className="flex items-center gap-3">
                <CountryFlag country={code} />
                <span className="text-2xl font-bold tracking-tight">{info.name} phone number</span>
                <span className="ml-auto text-right text-sm text-foreground/75">
                  {isLoading ? <span aria-hidden="true" className="block h-10 w-20 animate-pulse rounded bg-muted" /> : (
                    <>
                      {linePlans.length} {linePlans.length === 1 ? 'plan' : 'plans'}
                      {fromPrice !== null && <span className="block font-semibold text-foreground">from {formatPrice(fromPrice)}</span>}
                    </>
                  )}
                </span>
              </span>
              {carriers.length > 0 && (
                <span className="mt-5 flex flex-wrap items-center gap-2">
                  {carriers.map((name) => (
                    <span key={name} title={name} className="inline-flex min-h-8 items-center">
                      {CARRIER_LOGOS[name] ? (
                        <>
                          <CarrierLogo carrier={name} className="h-11 w-24" />
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
                <span className="mt-4 block text-sm">
                  <span className="font-medium">{code === 'US' ? 'Plans: ' : 'UK data: '}</span>
                  <span className="text-foreground/80">{kinds.map((kind) => kind.label).join(' · ')}</span>
                </span>
              )}
              <span className="mb-6 mt-3 block space-y-1 text-sm text-foreground/70">
                {info.facts.map((fact) => <span key={fact} className="block">{fact}</span>)}
              </span>
              <span className="mt-auto inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                View {info.name} plans
              </span>
            </>
          );

          return onSelect ? (
            <button key={code} type="button" onClick={() => onSelect(code)} className={cardClass}>{body}</button>
          ) : (
            <Link key={code} to={COUNTRY_PATHS[code]} className={cardClass}>{body}</Link>
          );
        })}
      </div>
    </div>
  );
}
