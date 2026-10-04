import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Network, Server, Monitor, Shield, Smartphone, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import api from '@/services/api';
import './dashboard-home.css';

interface DashboardStats {
  total_orders: number;
  active_services: number;
  pending_orders: number;
  total_spent: number;
  monthly_spending: number;
  last_month_spending: number;
  type_stats: Record<string, { active: number }>;
  recent_orders: { id: number; status: string; total_amount: number | string; created_at: string; product_type: string; product_name: string }[];
}

const services = [
  { key: 'proxy', name: 'Proxies', description: 'IPs for your workflows', icon: Network, buy: 'proxies', manage: 'proxy-management' },
  { key: 'vps', name: 'VPS', description: 'Your own computing power', icon: Server, buy: 'vps', manage: 'VPS-management' },
  { key: 'rdp', name: 'RDP', description: 'A desktop, anywhere', icon: Monitor, buy: 'rdp', manage: 'RDP-management' },
  { key: 'vpn', name: 'VPN', description: 'Your private connection', icon: Shield, buy: 'vpn', manage: 'vpn-management' },
  { key: 'esim', name: 'eSIM', description: 'Connectivity on the go', icon: Smartphone, buy: 'esim', manage: 'Esim-management' },
];
const money = (value: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
const statusLabel = (value: string) => value.replace(/_/g, ' ');

export default function DashboardHome() {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const { data, isLoading, isError, isFetching, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-overview', user?.id],
    queryFn: async () => (await api.get('/web/api/orders/stats')).data,
    enabled: Boolean(accessToken && user?.id),
    staleTime: 30_000,
    retry: false,
  });
  const loading = isLoading && Boolean(accessToken && user?.id);
  const freshAccount = data?.total_orders === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const counts = (key: string) => (data?.type_stats?.[key]?.active ?? 0) + (key === 'esim' ? data?.type_stats?.usa_esim?.active ?? 0 : 0);

  if (!accessToken || !user) return <div className="overview-auth"><h1>Sign in to your workspace</h1><Link to="/login">Back to login <ArrowRight size={16} /></Link></div>;

  return (
    <div className={`dashboard-overview ${dark ? 'overview-dark' : ''}`}>
      <header className="overview-heading">
        <div><span className="overview-eyebrow">Your workspace</span><h1>Overview</h1><p>{greeting}, {user.first_name || user.username || 'there'}. Here’s your account at a glance.</p></div>
        <div className="overview-heading-actions"><button className="overview-icon-button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh overview" title="Refresh overview"><RefreshCw size={16} /></button><Link className="overview-button" to="/dashboard/support">Get support <ArrowUpRight size={14} /></Link></div>
      </header>

      {isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your overview.</strong><p>{data ? 'The previous figures are shown below.' : 'Your account information is unavailable right now.'}</p></div><button onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Retrying…' : 'Try again'}</button></div>}

      <section className="overview-welcome" aria-labelledby="welcome-title">
        <div className="overview-welcome-copy"><span className="overview-eyebrow">One account. Every connection.</span><h2 id="welcome-title">{freshAccount ? 'Your next connection starts here.' : 'Everything you need. Connected.'}</h2><p>{freshAccount ? 'Choose a service to get started. Your orders and services will appear here as you build your setup.' : 'Manage your services, follow your orders, and find the right infrastructure for what comes next.'}</p><a className="overview-welcome-link" href="#overview-services">Explore services <ArrowRight size={15} /></a></div>
        <svg className="overview-network" viewBox="0 0 350 210" fill="none" aria-hidden="true"><g stroke="currentColor" strokeOpacity=".2"><circle cx="180" cy="105" r="42" /><circle cx="180" cy="105" r="83" /><path d="M0 165 180 105 330 20M50 5 180 105 340 178M180 105 350 100" /></g><g fill="currentColor"><circle cx="180" cy="105" r="7" /><circle cx="68" cy="142" r="4" /><circle cx="114" cy="54" r="4" /><circle cx="250" cy="65" r="4" /><circle cx="260" cy="142" r="4" /><circle cx="305" cy="101" r="3" /></g><circle cx="180" cy="105" r="15" stroke="currentColor" strokeOpacity=".4" /></svg>
      </section>

      <section className="overview-metrics" aria-label="Account summary" aria-busy={loading}>
        {[
          { title: 'Active services', value: data?.active_services, note: 'Across your account', href: '/dashboard/products' },
          { title: 'Total orders', value: data?.total_orders, note: 'Your complete order history', href: '/dashboard/orders' },
          { title: 'Pending orders', value: data?.pending_orders, note: data?.pending_orders ? 'Check your order status' : 'Nothing awaiting completion', href: '/dashboard/orders' },
          { title: 'Order value this month', value: data ? money(data.monthly_spending) : undefined, note: 'USD · All order statuses', href: '/dashboard/transactions' },
        ].map(metric => <Link to={metric.href} className="overview-metric" key={metric.title}><span>{metric.title}<ArrowUpRight size={14} /></span><strong>{loading ? <span className="overview-skeleton" /> : metric.value ?? '—'}</strong><small>{data ? metric.note : loading ? 'Loading account data…' : 'Currently unavailable'}</small></Link>)}
      </section>

      <section className="overview-services" id="overview-services" aria-labelledby="services-title">
        <div className="overview-section-heading"><div><h2 id="services-title">Your infrastructure</h2><p>A place for every part of your setup.</p></div><Link to="/dashboard/products">Manage services <ArrowUpRight size={14} /></Link></div>
        <div className="overview-service-grid">{services.map(service => {
          const count = counts(service.key);
          return <article className="overview-service" key={service.key}><div className="overview-service-top"><service.icon size={21} strokeWidth={1.5} aria-hidden="true" /><span>{loading ? 'Loading…' : data ? `${count} active` : 'Unavailable'}</span></div><h3>{service.name}</h3><p>{service.description}</p><Link to={`/dashboard/${data && count ? service.manage : service.buy}`} aria-label={`${data && count ? 'Manage' : 'Explore'} ${service.name}`}>{data && count ? 'Manage' : 'Explore'} {data && count ? <ArrowRight size={15} /> : <Plus size={15} />}</Link></article>;
        })}</div>
      </section>

      <div className="overview-bottom-grid">
        <section className="overview-orders" aria-labelledby="recent-orders-title" aria-busy={loading}>
          <div className="overview-section-heading"><h2 id="recent-orders-title">Recent orders</h2><Link to="/dashboard/orders">View all <ArrowUpRight size={14} /></Link></div>
          {loading ? <div className="overview-orders-loading" role="status">Loading recent orders…{[0,1,2].map(i => <span key={i} className="overview-skeleton" />)}</div> : !data ? <div className="overview-empty"><h3>Orders are unavailable</h3><p>Try refreshing your overview to load your order history.</p></div> : data.recent_orders.length === 0 ? <div className="overview-empty"><span className="overview-empty-mark" aria-hidden="true"><Network size={26} strokeWidth={1.3} /></span><h3>Your first order belongs here.</h3><p>Once you place an order, you can follow its status and find it again here.</p><Link className="overview-button" to="/dashboard/proxies">Explore proxies <ArrowRight size={14} /></Link></div> : <div className="overview-table-scroll"><table><caption className="sr-only">Your five most recent orders</caption><thead><tr><th>Order</th><th>Status</th><th>Amount</th></tr></thead><tbody>{data.recent_orders.slice(0,5).map(order => <tr key={order.id}><td><strong>{order.product_name || 'Service order'}</strong><span>#{order.id} · {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(order.created_at))}</span></td><td><span className="overview-status" data-status={order.status}>{statusLabel(order.status)}</span></td><td>{money(order.total_amount)}</td></tr>)}</tbody></table></div>}
        </section>
        <aside className="overview-help" aria-labelledby="help-title"><span className="overview-eyebrow">Make yourself at home</span><h2 id="help-title">A little guidance.<br />A lot of possibilities.</h2><p>Find your way around, or talk to us when you need a hand.</p><Link to="/dashboard/products"><span><strong>Manage your connections</strong><small>Access your purchased services</small></span><ArrowUpRight size={16} /></Link><Link to="/dashboard/profile"><span><strong>Make it yours</strong><small>Keep your account details up to date</small></span><ArrowUpRight size={16} /></Link><Link to="/dashboard/support"><span><strong>Let’s work it out</strong><small>Get help from our support team</small></span><ArrowUpRight size={16} /></Link></aside>
      </div>
    </div>
  );
}
