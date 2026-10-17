import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { VPS_COUNTRIES, supportsVPSCountry, useVPSCatalog, vpsMoney, vpsPrice } from './vpsCatalog';
import '../UserDashboard/dashboard-home.css';
import './server-purchase.css';

interface VPSTypesProps { onNavigate?: (countryCode: string) => void }

export default function VPSTypes({ onNavigate }: VPSTypesProps = {}) {
  const dark = useThemeStore(state => state.dark);
  const { pathname } = useLocation();
  const storefront = pathname.startsWith('/dashboard');
  const { data: plans = [], isLoading, isError, isFetching, refetch } = useVPSCatalog();
  const countries = VPS_COUNTRIES.filter(country => plans.some(plan => supportsVPSCountry(plan, country.code)));

  return <div className={`dashboard-overview server-purchase ${dark ? 'overview-dark' : ''} ${storefront ? '' : 'server-purchase-embedded'}`}>
    <header className="overview-heading"><div><h1>VPS hosting</h1><p>Choose a server location to compare plans and configure your VPS.</p></div>{storefront && <Link className="overview-button" to="/dashboard/VPS-management">My servers <ArrowUpRight size={14} aria-hidden="true" /></Link>}</header>
    <section aria-labelledby="vps-locations-title" aria-busy={isLoading}>
      <div className="overview-section-heading"><h2 id="vps-locations-title">Choose your location</h2></div>
      {isLoading ? <div className="server-loading" role="status">Loading VPS locations…{[0, 1, 2].map(item => <span className="overview-skeleton" key={item} />)}</div>
        : isError ? <div className="overview-error" role="alert"><div><strong>We couldn’t load VPS locations.</strong><p>Try again for current availability.</p></div><button type="button" disabled={isFetching} onClick={() => refetch()}>Try again</button></div>
        : !countries.length ? <div className="server-panel server-empty"><h3>No VPS locations available</h3><p>Check back soon for available plans.</p><button className="overview-button" disabled={isFetching} onClick={() => refetch()}>Check availability</button></div>
        : <div className="server-country-grid">{countries.map(country => {
          const available = plans.filter(plan => supportsVPSCountry(plan, country.code));
          const cheapest = available.reduce((best, plan) => vpsPrice(plan, country.code) < vpsPrice(best, country.code) ? plan : best);
          const body = <><span className="server-country-flag" aria-hidden="true">{country.flag}</span><h3>{country.name}</h3><p>{available.length} {available.length === 1 ? 'plan' : 'plans'} available</p><div className="server-country-price">From <strong>{vpsMoney(vpsPrice(cheapest, country.code), cheapest.currency_code)}</strong><span> / month</span></div><span className="server-country-action">View plans <ArrowRight size={15} aria-hidden="true" /></span></>;
          return onNavigate ? <button className="server-country-card" key={country.code} onClick={() => onNavigate(country.code)}>{body}</button> : <Link className="server-country-card" key={country.code} to={`/dashboard/vps-plans/residential?country=${country.code}`}>{body}</Link>;
        })}</div>}
    </section>
  </div>;
}
