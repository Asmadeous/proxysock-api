import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Shield, X } from 'lucide-react';
import { fetchVPNCategory, type VPNCategory, type VPNPlan } from '@/services/myProxyService';
import type { City, ISP } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import '../UserDashboard/dashboard-home.css';
import './vpn-plans.css';

interface VPNPlansProps {
  isDirectBuy?: boolean;
  onDirectBuy?: (productId: string | number, quantity: number, metadata: any) => Promise<void>;
}
interface VPNLocation { isp: ISP; country: string; city: City }
const duration = (plan: VPNPlan) => Number(plan.name.match(/(\d+)\s*day/i)?.[1] || 30);
const price = (plan: VPNPlan) => new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency || 'USD' }).format(Number(plan.price));
const bandwidth = (plan: VPNPlan) => plan.bandwidth_gb === 0 ? 'Unlimited bandwidth' : `${plan.bandwidth_gb} GB bandwidth`;

export default function BuyVPN({ isDirectBuy, onDirectBuy }: VPNPlansProps = {}) {
  const dark = useThemeStore(state => state.dark);
  const { pathname } = useLocation();
  const storefront = pathname.startsWith('/dashboard');
  const [category, setCategory] = useState<VPNCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [planId, setPlanId] = useState<string | null>(null);
  const [location, setLocation] = useState<VPNLocation | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const purchasePending = useRef(false);
  const plan = category?.vpn_plans?.find(item => item.id === planId);
  const locations = plan?.isp?.flatMap(isp => Object.entries(isp.locations || {}).flatMap(([code, country]) => {
    const cities = (country.cities || []).filter(city => city.ips_available > 0).sort((a, b) => a.name.localeCompare(b.name));
    return cities.length ? [{ isp, code, country: country.name, cities }] : [];
  })) || [];
  let infrastructureReseller = false;
  try { infrastructureReseller = JSON.parse(localStorage.getItem('resellerUser') || '{}')?.reseller_type === 'infrastructure'; } catch { /* No saved reseller session. */ }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchVPNCategory().then(data => {
      if (!cancelled) setCategory(data);
    }).catch(() => {
      if (!cancelled) setLoadError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [retry]);

  const choosePlan = (id: string) => {
    if (id === planId) return;
    setPlanId(id);
    setLocation(null);
    setPurchaseError(null);
    setSuccess(false);
  };

  const purchase = async () => {
    if (!plan || !category || !location || purchasePending.current || infrastructureReseller) return;
    purchasePending.current = true;
    setPurchasing(true);
    setPurchaseError(null);
    const locationsString = `${location.isp.name} - ${location.city.name}, ${location.city.state} (${location.country})`;
    const metadata = { period: duration(plan), locationId: location.city.id, locationsString };
    try {
      if (isDirectBuy) {
        if (!onDirectBuy) throw new Error('Direct purchase is unavailable. Please try again later.');
        await onDirectBuy(plan.plan_id, 1, metadata);
      } else {
        const existing = JSON.parse(localStorage.getItem('cartItems') || '[]');
        if (!Array.isArray(existing)) throw new Error('Your cart could not be read. Please check your cart and try again.');
        const cart = [...existing, {
          product: String(plan.plan_id), productType: 'vpn', categorySlug: category.slug,
          categoryName: category.name, vpnPlan: plan,
          locations: { isp: location.isp, city: location.city }, ...metadata,
          protocol: 'http', totalPrice: Number(plan.price),
        }];
        localStorage.setItem('cartItems', JSON.stringify(cart));
        globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: cart.length } }));
      }
      setSuccess(true);
      setPlanId(null);
      setLocation(null);
    } catch (error) {
      const failure = error as { response?: { data?: { error?: string } }; message?: string };
      setPurchaseError(failure.response?.data?.error || failure.message || 'Your purchase could not be completed. Please try again.');
    } finally {
      purchasePending.current = false;
      setPurchasing(false);
    }
  };

  return (
    <div className={`dashboard-overview vpn-purchase ${dark ? 'overview-dark' : ''} ${!storefront ? 'vpn-purchase-embedded' : ''}`}>
      <header className="overview-heading">
        <div><h1>VPN</h1><p>Choose a plan and a location for your next connection.</p></div>
        {storefront && <Link className="overview-button" to="/dashboard/vpn-management">My VPNs <ArrowUpRight size={14} aria-hidden="true" /></Link>}
      </header>

      {success && <div className="vpn-success" role="status"><Check size={18} aria-hidden="true" /><div><strong>{isDirectBuy ? 'VPN purchase completed.' : 'Added to cart.'}</strong><p>{isDirectBuy ? 'Your VPN purchase was submitted successfully.' : 'Your plan and location are saved. Continue to your cart when you’re ready.'}</p></div>{storefront && !isDirectBuy && <Link to="/dashboard/cart">View cart <ArrowRight size={14} aria-hidden="true" /></Link>}<button type="button" aria-label="Dismiss confirmation" onClick={() => setSuccess(false)}><X size={17} /></button></div>}

      <div className="vpn-purchase-grid">
        <div className="vpn-options">
          <section aria-labelledby="vpn-plans-title" aria-busy={loading}>
            <div className="overview-section-heading"><div><h2 id="vpn-plans-title">Choose your plan</h2><p>Find the duration and bandwidth you need.</p></div></div>
            {loading ? <div className="vpn-loading" role="status">Loading VPN plans…{[0, 1, 2].map(item => <span key={item} className="overview-skeleton" />)}</div>
              : loadError ? <div className="overview-error" role="alert"><div><strong>We couldn’t load VPN plans.</strong><p>Try again to see the latest availability.</p></div><button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></div>
              : !category?.vpn_plans?.length ? <div className="vpn-panel vpn-empty"><Shield size={24} strokeWidth={1.4} aria-hidden="true" /><h3>No VPN plans available</h3><p>Check back soon for available plans.</p><button className="overview-button" type="button" onClick={() => setRetry(value => value + 1)}>Check availability</button></div>
              : <div className="vpn-plan-list" role="group" aria-label="VPN plans">{category.vpn_plans.map(item => (
                <button key={item.id} type="button" className="vpn-plan" aria-pressed={planId === item.id} aria-label={`Select ${item.name}`} disabled={purchasing} onClick={() => choosePlan(item.id)}>
                  <span className="vpn-plan-heading"><strong>{item.name}</strong><span className="vpn-selection-mark" aria-hidden="true">{planId === item.id && <Check size={12} />}</span></span>
                  <span className="vpn-plan-details">{duration(item)} days <span aria-hidden="true">·</span> {bandwidth(item)}</span>
                  {item.locations?.length > 0 && <span className="vpn-plan-coverage">{item.locations.join(' · ')}</span>}
                  <span className="vpn-plan-price"><strong>{price(item)}</strong><span>{item.currency || 'USD'} / {duration(item)} days</span></span>
                </button>
              ))}</div>}
          </section>

          {plan && <section className="vpn-location-section" aria-labelledby="vpn-location-title">
            <div className="overview-section-heading"><div><h2 id="vpn-location-title">Choose your location</h2><p>Available cities, grouped by provider and country.</p></div></div>
            {locations.length ? <div className="vpn-panel vpn-locations">{locations.map(group => <fieldset key={`${group.isp.id}-${group.code}`} disabled={purchasing}>
              <legend>{group.isp.name}{' '}<span>{group.country}</span></legend>
              <div className="vpn-city-grid">{group.cities.map(city => <label className="vpn-city" key={city.id}>
                <input type="radio" name="vpn-location" checked={location?.isp.id === group.isp.id && location?.country === group.country && location?.city.id === city.id} onChange={() => { setLocation({ isp: group.isp, country: group.country, city }); setPurchaseError(null); }} />
                <span><strong>{city.name}</strong>{' '}<small>{city.state}</small></span>
              </label>)}</div>
            </fieldset>)}</div> : <div className="vpn-panel vpn-empty"><h3>No locations available for this plan</h3><p>Choose another plan to check its available cities.</p></div>}
          </section>}
        </div>

        <aside className="vpn-summary" aria-labelledby="vpn-summary-title">
          <div className="vpn-panel vpn-summary-panel"><h2 id="vpn-summary-title">Your VPN plan</h2>
            {plan ? <>
              <dl><div><dt>Plan</dt><dd>{plan.name}</dd></div><div><dt>Duration</dt><dd>{duration(plan)} days</dd></div><div><dt>Bandwidth</dt><dd>{plan.bandwidth_gb === 0 ? 'Unlimited' : `${plan.bandwidth_gb} GB`}</dd></div><div><dt>Provider</dt><dd>{location?.isp.name || 'Choose a location'}</dd></div><div><dt>Location</dt><dd>{location ? `${location.city.name}, ${location.city.state} · ${location.country}` : 'Not selected'}</dd></div></dl>
              <div className="vpn-total"><span>Total<strong>{price(plan)}</strong></span><small>{plan.currency || 'USD'} · {duration(plan)} days · One-time payment</small></div>
              {infrastructureReseller ? <p className="vpn-summary-note">Purchasing is unavailable for this reseller account type.</p> : <><button type="button" className="vpn-purchase-button" onClick={purchase} disabled={!location || purchasing || (isDirectBuy && !onDirectBuy)}>{purchasing ? 'Processing…' : isDirectBuy ? 'Instantly provision' : 'Add to cart'}<ArrowRight size={15} aria-hidden="true" /></button>{!location && <p className="vpn-summary-note">{locations.length ? 'Choose a location to continue.' : 'Select a plan with available locations to continue.'}</p>}</>}
              {purchaseError && <div role="alert" className="vpn-purchase-error">{purchaseError}</div>}
            </> : <div className="vpn-summary-empty"><Shield size={28} strokeWidth={1.3} aria-hidden="true" /><h3>Your connection starts here.</h3><p>Select a plan to see its locations and review your total.</p></div>}
          </div>
          {storefront && <div className="vpn-help"><h3>A little help getting connected.</h3><p>Find setup instructions or talk to our support team.</p><Link to="/HowToConnect">Browse setup guides <ArrowUpRight size={14} aria-hidden="true" /></Link><Link to="/dashboard/support">Get support <ArrowUpRight size={14} aria-hidden="true" /></Link></div>}
        </aside>
      </div>
    </div>
  );
}
