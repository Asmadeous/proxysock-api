import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Monitor, Network, RefreshCw, Server, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import api from '@/services/api';
import './dashboard-home.css';
import './my-services.css';

type Status = 'total' | 'active' | 'pending' | 'expired' | 'failed';
interface ServiceStats { type_stats?: Record<string, Partial<Record<Status, number>>> }
const services = [
  { key: 'proxy', name: 'Proxies', icon: Network, description: 'Connection details and proxy credentials.', manage: 'proxy-management', buy: 'proxies' },
  { key: 'vpn', name: 'VPN', icon: Shield, description: 'Subscriptions and connection settings.', manage: 'vpn-management', buy: 'vpn' },
  { key: 'esim', name: 'eSIM', icon: Smartphone, description: 'Data packages, phone lines, and activation details.', manage: 'Esim-management', buy: 'esim' },
  { key: 'vps', name: 'VPS hosting', icon: Server, description: 'Server access and instance controls.', manage: 'VPS-management', buy: 'vps' },
  { key: 'rdp', name: 'RDP Access', icon: Monitor, description: 'Remote desktops and access details.', manage: 'RDP-management', buy: 'rdp' },
];
const statuses: { key: Status; label: string }[] = [
  { key: 'active', label: 'Active' }, { key: 'pending', label: 'Pending' },
  { key: 'expired', label: 'Inactive' }, { key: 'failed', label: 'Issues' },
];

export default function ProductManagementPage() {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const { data, isLoading, isFetching, isError, refetch } = useQuery<ServiceStats>({
    queryKey: ['my-services', user?.id],
    queryFn: async () => (await api.get('/web/api/orders/stats')).data,
    enabled: Boolean(accessToken && user?.id),
    staleTime: 30_000,
    retry: false,
  });
  const count = (key: string, status: Status) => (data?.type_stats?.[key]?.[status] ?? 0)
    + (key === 'esim' ? data?.type_stats?.usa_esim?.[status] ?? 0 : 0);
  const total = services.reduce((sum, service) => sum + count(service.key, 'total'), 0);

  return <div className={`dashboard-overview my-services ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>My Services | ProxySock</title></Helmet>
    <header className="overview-heading">
      <div><h1>My services</h1><p>Access your services, connection details, and management tools.</p></div>
      {accessToken && user && <div className="overview-heading-actions">
        <Link className="overview-button" to="/dashboard/orders">Order history <ArrowUpRight size={14} aria-hidden="true" /></Link>
        <button className="overview-icon-button" type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh services"><RefreshCw size={15} aria-hidden="true" /></button>
      </div>}
    </header>
    {!accessToken || !user ? <section className="overview-auth"><h2>Sign in to view your services</h2><Link to="/login">Back to login <ArrowRight size={14} aria-hidden="true" /></Link></section> : <>
      {isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your services.</strong><p>{data ? 'Showing the last loaded counts. Try refreshing for the latest status.' : 'Try again to load your service counts. You can still open the management pages below.'}</p></div><button type="button" onClick={() => refetch()} disabled={isFetching}>Try again</button></div>}
      <section aria-labelledby="services-title" aria-busy={isFetching}>
        <div className="overview-section-heading"><div><h2 id="services-title">Your services</h2><p>{data && total === 0 ? 'No services yet. Choose a service below to browse plans.' : 'Counts reflect service order statuses. Open a service to see its current details.'}</p></div></div>
        {isFetching && <p className="services-loading" role="status">{isLoading ? 'Loading your services…' : 'Updating service counts…'}</p>}
        <div className="services-list">{services.map(service => {
          const Icon = service.icon;
          const empty = data && count(service.key, 'total') === 0;
          return <article className="services-row" key={service.key} aria-labelledby={`service-${service.key}`}>
            <div className="services-identity"><Icon size={22} strokeWidth={1.4} aria-hidden="true" /><div><h3 id={`service-${service.key}`}>{service.name}</h3><p>{service.description}</p><span>{!data ? (isLoading ? 'Loading counts…' : 'Counts unavailable') : empty ? 'No services yet' : `${count(service.key, 'total')} service ${count(service.key, 'total') === 1 ? 'order' : 'orders'}`}</span></div></div>
            <dl className="services-counts">{statuses.map(status => <div key={status.key} data-status={status.key} data-highlight={Boolean(data && count(service.key, status.key) > 0)}><dt>{status.label}</dt><dd>{data ? count(service.key, status.key) : '—'}</dd></div>)}</dl>
            <div className="services-actions"><Link className={empty ? 'services-secondary' : 'services-manage'} to={`/dashboard/${service.manage}`} aria-label={`Manage ${service.name}`}>Manage <ArrowRight size={14} aria-hidden="true" /></Link><Link className={empty ? 'services-manage' : 'services-secondary'} to={`/dashboard/${service.buy}`} aria-label={`Browse ${service.name} plans`}>Browse plans <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
          </article>;
        })}</div>
        <div className="services-footnote"><p>Inactive includes expired, suspended, and cancelled orders. Issues includes failed, errored, and stopped orders.</p><Link to="/dashboard/support">Get support <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
      </section>
    </>}
  </div>;
}
