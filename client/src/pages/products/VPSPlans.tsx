import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Server, X } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { conversionTracker } from '@/utils/redditPixel';
import { VPS_COUNTRIES, normalizeVPSCountry, supportsVPSCountry, useVPSCatalog, vpsMoney, vpsOSLabel, vpsPrice, type VPSPlan } from './vpsCatalog';
import '../UserDashboard/dashboard-home.css';
import './server-purchase.css';

interface VPSPlansProps {
  country?: string;
  onBack?: () => void;
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}
const periods = [{ months: 1, discount: 0 }, { months: 3, discount: .05 }, { months: 6, discount: .1 }, { months: 12, discount: .15 }];

export default function VPSPlans({ country, onBack, isDirectBuy, onDirectBuy }: VPSPlansProps = {}) {
  const dark = useThemeStore(state => state.dark);
  const { pathname } = useLocation();
  const storefront = pathname.startsWith('/dashboard');
  const [params] = useSearchParams();
  const incomingCountry = normalizeVPSCountry(country || params.get('country') || '');
  const [selectedCountry, setSelectedCountry] = useState(incomingCountry);
  const { data: plans = [], isLoading, isError, isFetching, refetch } = useVPSCatalog();
  const [planId, setPlanId] = useState<string | null>(null);
  const [os, setOS] = useState('');
  const [management, setManagement] = useState('unmanaged');
  const [duration, setDuration] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const plan = plans.find(item => item.id === planId);
  const countries = VPS_COUNTRIES.filter(item => plans.some(candidate => supportsVPSCountry(candidate, item.code)));
  const available = selectedCountry ? plans.filter(item => supportsVPSCountry(item, selectedCountry)) : plans;
  const location = VPS_COUNTRIES.find(item => item.code === selectedCountry);
  const basePrice = plan ? vpsPrice(plan, selectedCountry) : 0;
  const multiplier = management === 'managed' ? 1.5 : 1;
  const discount = periods.find(item => item.months === duration)?.discount || 0;
  const total = Number((basePrice * duration * multiplier * (1 - discount)).toFixed(2));
  let restricted = false;
  try { restricted = JSON.parse(localStorage.getItem('resellerUser') || '{}')?.reseller_type === 'infrastructure'; } catch { /* No saved reseller session. */ }
  const ready = plan && location && supportsVPSCountry(plan, selectedCountry) && plan.os_templates.includes(os) && plan.management_types.includes(management);

  useEffect(() => {
    setSelectedCountry(incomingCountry);
    setPlanId(null);
    setOS('');
    setError(null);
  }, [incomingCountry]);

  const choosePlan = (item: VPSPlan) => {
    if (planId === item.id) return;
    setPlanId(item.id);
    setOS(item.os_templates[0] || '');
    setManagement(item.management_types.includes('unmanaged') ? 'unmanaged' : item.management_types[0] || '');
    setDuration(1);
    setError(null);
    setSuccess(false);
    conversionTracker.trackViewContent({ productId: item.slug, productName: item.name, category: 'vps', value: vpsPrice(item, selectedCountry), currency: item.currency_code });
  };

  const purchase = async () => {
    if (!ready || !plan || !location || pending.current || restricted) return;
    pending.current = true;
    setPurchasing(true);
    setError(null);
    const hostname = `vps-${Math.random().toString(36).substring(2, 8)}`;
    try {
      if (isDirectBuy) {
        if (!onDirectBuy) throw new Error('Direct purchase is currently unavailable.');
        await onDirectBuy(plan.id, 1, { os_template: os, country_code: selectedCountry, management_type: management, hostname, period: duration });
      } else {
        const existing = JSON.parse(localStorage.getItem('cartItems') || '[]');
        if (!Array.isArray(existing)) throw new Error('Your cart could not be read. Please check your cart and try again.');
        const item = {
          vpsPlan: plan, osTemplate: os, hostname, username: os.toLowerCase().includes('windows') ? 'Administrator' : 'root',
          duration, managementType: management, productType: 'vps',
          location: { country: location.name, countryCode: selectedCountry },
          effective_base_price: basePrice, total_amount: total,
        };
        localStorage.setItem('cartItems', JSON.stringify([...existing, item]));
        globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: existing.length + 1 } }));
        conversionTracker.trackAddToCart({ productId: plan.slug, productName: plan.name, category: 'vps', value: total, currency: plan.currency_code });
      }
      setSuccess(true);
      setPlanId(null);
      setOS('');
    } catch (failure) {
      const detail = failure as { response?: { data?: { error?: string } }; message?: string };
      setError(detail.response?.data?.error || detail.message || 'We couldn’t complete your purchase. Please try again.');
    } finally {
      pending.current = false;
      setPurchasing(false);
    }
  };

  return <div className={`dashboard-overview server-purchase ${dark ? 'overview-dark' : ''} ${storefront ? '' : 'server-purchase-embedded'}`}>
    <div className="server-back">{onBack ? <button type="button" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" />Back to locations</button> : <Link to="/dashboard/vps"><ArrowLeft size={14} aria-hidden="true" />Back to locations</Link>}</div>
    <header className="overview-heading"><div><span className="overview-eyebrow">Your infrastructure</span><h1>VPS plans</h1><p>Compare resources, then choose your operating system and billing period.</p></div>{storefront && <Link className="overview-button" to="/dashboard/VPS-management">My servers <ArrowUpRight size={14} aria-hidden="true" /></Link>}</header>
    {success && <div className="server-success" role="status"><Check size={18} aria-hidden="true" /><span>{isDirectBuy ? 'VPS purchase completed.' : 'VPS added to cart.'}</span>{storefront && !isDirectBuy && <Link to="/dashboard/cart">View cart <ArrowRight size={14} aria-hidden="true" /></Link>}<button type="button" aria-label="Dismiss confirmation" onClick={() => setSuccess(false)}><X size={16} /></button></div>}
    {isLoading ? <div className="server-loading" role="status">Loading VPS plans…{[0, 1, 2].map(item => <span key={item} className="overview-skeleton" />)}</div>
      : isError ? <div role="alert" className="overview-error"><div><strong>We couldn’t load VPS plans.</strong><p>Try again for current availability.</p></div><button disabled={isFetching} onClick={() => refetch()}>Try again</button></div>
      : <>
        <div className="server-location-filter"><label htmlFor="vps-country">Server location</label><PurchaseSelect id="vps-country" value={selectedCountry} disabled={purchasing} onValueChange={value => { setSelectedCountry(value); setPlanId(null); setOS(''); setError(null); }} emptyLabel="All locations" options={[...(selectedCountry && !countries.some(item => item.code === selectedCountry) ? [{ value: selectedCountry, label: `${location?.name || selectedCountry} — unavailable` }] : []), ...countries.map(item => ({ value: item.code, label: item.name }))]} /></div>
        <div className="server-purchase-grid"><section aria-labelledby="vps-plans-title">
          <div className="overview-section-heading"><h2 id="vps-plans-title">Available plans</h2><span className="server-result-count">{available.length} {available.length === 1 ? 'plan' : 'plans'}</span></div>
          {!available.length ? <div className="server-panel server-empty"><h3>No VPS plans available{selectedCountry ? ' in this location' : ''}</h3><p>{selectedCountry ? 'Choose another location to see available plans.' : 'Please check back soon.'}</p></div> : <div className="server-plan-grid">{available.map(item => <article className="server-plan-card" data-selected={planId === item.id} key={item.id}>
            <h3>{item.name}</h3><div className="server-plan-price"><strong>{vpsMoney(vpsPrice(item, selectedCountry), item.currency_code)}</strong><span>{item.currency_code} / month</span></div>
            <dl className="server-specs"><div><dt>CPU</dt><dd>{item.cpu_cores === null ? 'Not specified' : `${item.cpu_cores} vCPU`}</dd></div><div><dt>Memory</dt><dd>{item.ram_gb === null ? 'Not specified' : `${item.ram_gb} GB`}</dd></div><div><dt>Storage</dt><dd>{item.storage_gb === null ? 'Not specified' : `${item.storage_gb} GB`}</dd></div></dl>
            <p className="server-os-list">{item.os_templates.length ? item.os_templates.map(vpsOSLabel).join(' · ') : 'No operating systems available'}</p>
            <button type="button" className="server-select-plan" aria-label={`Configure ${item.name}`} aria-pressed={planId === item.id} disabled={purchasing} onClick={() => choosePlan(item)}>{planId === item.id ? 'Selected' : 'Configure'}{planId === item.id ? <Check size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}</button>
          </article>)}</div>}
        </section>
        <aside className="server-config server-panel" aria-labelledby="vps-config-title"><h2 id="vps-config-title">Configure your VPS</h2>
          {!plan ? <div className="server-config-empty"><Server size={25} strokeWidth={1.4} aria-hidden="true" /><h3>Select a plan to continue</h3><p>Your operating system, billing options and total will appear here.</p></div> : <>
            <p className="server-selected-name">{plan.name}</p>
            <fieldset className="server-config-fields" disabled={purchasing}><legend className="sr-only">Server configuration</legend>
              <label htmlFor="vps-config-country">Location</label><PurchaseSelect id="vps-config-country" value={selectedCountry} disabled={purchasing} onValueChange={value => { setSelectedCountry(value); setError(null); }} placeholder="Choose a location" options={countries.filter(item => supportsVPSCountry(plan, item.code)).map(item => ({ value: item.code, label: item.name }))} />
              <label htmlFor="vps-os">Operating system</label><PurchaseSelect id="vps-os" value={os} onValueChange={setOS} disabled={purchasing || !plan.os_templates.length} placeholder="No operating systems available" options={plan.os_templates.map(template => ({ value: template, label: vpsOSLabel(template) }))} />
              <label htmlFor="vps-management">Management</label><PurchaseSelect id="vps-management" value={management} onValueChange={setManagement} disabled={purchasing || !plan.management_types.length} placeholder="No management options available" options={plan.management_types.map(type => ({ value: type, label: type === 'managed' ? 'Fully managed (+50%)' : type === 'unmanaged' ? 'Unmanaged' : type }))} />
              <p>{management === 'managed' ? 'Includes server management at a 50% premium.' : 'You manage the operating system, updates and installed software.'}</p>
              <label htmlFor="vps-duration">Billing period</label><PurchaseSelect id="vps-duration" value={String(duration)} disabled={purchasing} onValueChange={value => setDuration(Number(value))} options={periods.map(period => ({ value: String(period.months), label: `${period.months} ${period.months === 1 ? 'month' : 'months'}${period.discount ? ` — save ${Math.round(period.discount * 100)}%` : ''}` }))} />
            </fieldset>
            <dl className="server-price-details"><div><dt>Base monthly price</dt><dd>{vpsMoney(basePrice, plan.currency_code)}</dd></div>{management === 'managed' && <div><dt>Management</dt><dd>+50%</dd></div>}{discount > 0 && <div><dt>Term discount</dt><dd>{Math.round(discount * 100)}%</dd></div>}</dl>
            <div className="server-total"><span>Total for {duration} {duration === 1 ? 'month' : 'months'}</span><strong>{vpsMoney(total, plan.currency_code)}</strong></div><p className="server-billing-note">{plan.currency_code}{duration > 1 ? ` · ${vpsMoney(total / duration, plan.currency_code)} per month equivalent` : ''}</p>
            {restricted ? <p className="server-billing-note">Purchasing is unavailable for this reseller account type.</p> : <button className="server-purchase-button" type="button" disabled={!ready || purchasing || (isDirectBuy && !onDirectBuy)} onClick={purchase}>{purchasing ? 'Processing…' : isDirectBuy ? 'Instantly provision' : 'Add to cart'}<ArrowRight size={14} aria-hidden="true" /></button>}
            {!ready && <p className="server-billing-note">Choose an available location, operating system and management option to continue.</p>}
            {error && <div role="alert" className="server-purchase-error">{error}</div>}
          </>}
        </aside></div>
      </>}
  </div>;
}
