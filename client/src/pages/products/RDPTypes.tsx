import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { RDP_COUNTRIES, supportsRDPCountry, useRDPCatalog, rdpMoney, rdpPrice } from './rdpCatalog';
import '../UserDashboard/dashboard-home.css';
import './server-purchase.css';

interface RDPTypesProps { onNavigate?: (countryCode: string) => void }

export default function RDPTypes({ onNavigate }: RDPTypesProps = {}) {
  const dark = useThemeStore(state => state.dark);
  const { pathname } = useLocation();
  const storefront = pathname.startsWith('/dashboard');
  const { data: plans = [], isLoading, isError, isFetching, refetch } = useRDPCatalog();
  const countries = RDP_COUNTRIES.filter(country => plans.some(plan => supportsRDPCountry(plan, country.code)));

  return <div className={`dashboard-overview server-purchase ${dark ? 'overview-dark' : ''} ${storefront ? '' : 'server-purchase-embedded'}`}>
    <header className="overview-heading"><div><span className="overview-eyebrow">Your infrastructure</span><h1>RDP Access</h1><p>Choose a location to compare remote desktop plans.</p></div>{storefront && <Link className="overview-button" to="/dashboard/RDP-management">My desktops <ArrowUpRight size={14} aria-hidden="true" /></Link>}</header>
    <section aria-labelledby="rdp-locations-title" aria-busy={isLoading}>
      <div className="overview-section-heading"><h2 id="rdp-locations-title">Choose your location</h2></div>
      {isLoading ? <div className="server-loading" role="status">Loading RDP locations…{[0, 1, 2].map(item => <span className="overview-skeleton" key={item} />)}</div>
        : isError ? <div className="overview-error" role="alert"><div><strong>We couldn’t load RDP locations.</strong><p>Try again for current availability.</p></div><button type="button" disabled={isFetching} onClick={() => refetch()}>Try again</button></div>
        : !countries.length ? <div className="server-panel server-empty"><h3>No RDP locations available</h3><p>Check back soon for available plans.</p><button className="overview-button" disabled={isFetching} onClick={() => refetch()}>Check availability</button></div>
        : <div className="server-country-grid">{countries.map(country => {
          const available = plans.filter(plan => supportsRDPCountry(plan, country.code));
          const cheapest = available.reduce((best, plan) => rdpPrice(plan, country.code) < rdpPrice(best, country.code) ? plan : best);
          const body = <><span className="server-country-flag" aria-hidden="true">{country.flag}</span><h3>{country.name}</h3><p>{available.length} {available.length === 1 ? 'plan' : 'plans'} available</p><div className="server-country-price">From <strong>{rdpMoney(rdpPrice(cheapest, country.code), cheapest.currency_code)}</strong><span> / month</span></div><span className="server-country-action">View plans <ArrowRight size={15} aria-hidden="true" /></span></>;
          return onNavigate ? <button className="server-country-card" key={country.code} onClick={() => onNavigate(country.code)}>{body}</button> : <Link className="server-country-card" key={country.code} to={`/dashboard/rdp-plans?country=${country.code}`}>{body}</Link>;
        })}</div>}
    </section>
  </div>;
}
