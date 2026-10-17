import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ClipboardList, Monitor, Network, RefreshCw, Server, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import api from '@/services/api';
import './dashboard-home.css';
import './orders.css';

interface OrdersSummary {
  total_orders: number;
  active_services: number;
  pending_orders: number;
  total_spent: number | string;
  type_stats?: Record<string, { total?: number }>;
  recent_orders?: { id: string | number; product_type: string | null; product_name: string; status: string; total_amount: number | string; created_at: string }[];
}
const categories = [
  { key: 'proxy', name: 'Proxy', icon: Network }, { key: 'vpn', name: 'VPN', icon: Shield },
  { key: 'esim', name: 'eSIM', icon: Smartphone }, { key: 'vps', name: 'VPS', icon: Server },
  { key: 'rdp', name: 'RDP', icon: Monitor },
];
const ranges = [{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: 'all', label: 'All time' }];
const money = (value: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
function categoryFor(type: string | null) {
  if (type === 'usa_esim') return categories.find(category => category.key === 'esim');
  if (['datacenter', 'isp', 'static_residential', 'residential_rotating', 'premium_isp', 'mobile', 'global_isp'].includes(type ?? '')) return categories[0];
  return categories.find(category => category.key === type);
}
function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export default function Orders() {
  const [range, setRange] = useState('30');
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const { data, isLoading, isFetching, isError, refetch } = useQuery<OrdersSummary>({
    queryKey: ['orders-overview', user?.id, range],
    queryFn: async () => (await api.get(`/web/api/orders/stats?range=${range}`)).data,
    enabled: Boolean(accessToken && user?.id), staleTime: 30_000, retry: false,
  });
  const rangeLabel = ranges.find(option => option.value === range)!.label;
  const metrics = [
    { name: 'Total orders', value: data?.total_orders },
    { name: 'Active orders', value: data?.active_services },
    { name: 'Pending orders', value: data?.pending_orders },
    { name: 'Total spent', value: data ? money(data.total_spent) : undefined },
  ];

  return <div className={`dashboard-overview orders-page ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Orders | ProxySock</title></Helmet>
    <header className="overview-heading"><div><h1>Orders</h1><p>Review your purchases and follow their progress.</p></div>
      {accessToken && user && <div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/products">My services <ArrowUpRight size={14} aria-hidden="true" /></Link><button type="button" className="overview-icon-button" disabled={isFetching} onClick={() => refetch()} aria-label="Refresh orders"><RefreshCw size={15} aria-hidden="true" /></button></div>}
    </header>
    {!accessToken || !user ? <section className="overview-auth"><h2>Sign in to view your orders</h2><Link to="/login">Back to login <ArrowRight size={14} aria-hidden="true" /></Link></section> : <>
      <div className="orders-toolbar"><p>Orders placed in the selected period</p><div><label htmlFor="order-period">Date range</label><PurchaseSelect id="order-period" value={range} onValueChange={setRange} options={ranges} /></div></div>
      {isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your orders.</strong><p>{data ? 'Showing the last loaded orders for this period.' : 'Try again to load your order history.'}</p></div><button type="button" disabled={isFetching} onClick={() => refetch()}>Try again</button></div>}
      <section className="overview-metrics" aria-label="Order summary" aria-busy={isFetching}>{metrics.map(metric => <div key={metric.name} className="overview-metric"><span>{metric.name}</span><strong>{metric.value ?? '—'}</strong><small>{rangeLabel}</small></div>)}</section>
      <section className="orders-history" aria-labelledby="recent-orders-title" aria-busy={isFetching}>
        <div className="overview-section-heading"><div><h2 id="recent-orders-title">Recent orders</h2><p>Latest 10 orders in this period. Browse by service below for the full history.</p></div></div>
        {isFetching && <p className="orders-loading" role="status">{isLoading ? 'Loading orders…' : 'Updating orders…'}</p>}
        {!data ? (!isLoading && <div className="overview-empty"><h3>Order history is unavailable</h3><p>Use Try again above to reload this period.</p></div>) : !data.recent_orders?.length ? <div className="overview-empty"><span className="overview-empty-mark"><ClipboardList size={24} strokeWidth={1.4} aria-hidden="true" /></span><h3>No orders in this period</h3><p>{range === 'all' ? 'Your purchases will appear here once you place an order.' : 'Choose a wider date range to check earlier purchases.'}</p>{range !== 'all' ? <button type="button" className="overview-button" onClick={() => setRange('all')}>Show all time <ArrowRight size={14} aria-hidden="true" /></button> : <Link className="overview-button" to="/dashboard">Browse services <ArrowRight size={14} aria-hidden="true" /></Link>}</div>
          : <div className="orders-table-scroll"><table><caption className="sr-only">Recent orders — {rangeLabel}</caption><thead><tr><th scope="col">Order</th><th scope="col">Service</th><th scope="col">Placed</th><th scope="col">Status</th><th scope="col">Amount</th><th scope="col"><span className="sr-only">Order history</span></th></tr></thead><tbody>{data.recent_orders.slice(0,10).map(order => {
            const category = categoryFor(order.product_type);
            return <tr key={order.id}><td><strong>{order.product_name || 'Service order'}</strong><span className="orders-reference">#{order.id}</span></td><td>{category?.name ?? 'Other'}</td><td><time dateTime={order.created_at}>{dateLabel(order.created_at)}</time></td><td><span className="overview-status" data-status={order.status}>{order.status.replace(/_/g, ' ')}</span></td><td className="orders-amount">{money(order.total_amount)}</td><td>{category && <Link className="orders-row-link" to={`/dashboard/${category.key}-orders`} aria-label={`View ${category.name} orders for order ${order.id}`}><ArrowUpRight size={16} aria-hidden="true" /></Link>}</td></tr>;
          })}</tbody></table></div>}
      </section>
      <section className="orders-categories" aria-labelledby="order-categories-title"><div className="overview-section-heading"><div><h2 id="order-categories-title">Order history by service</h2><p>Open a service to view its orders and details.</p></div></div><nav aria-label="Order history by service">{categories.map(category => {
        const Icon = category.icon;
        const count = (data?.type_stats?.[category.key]?.total ?? 0) + (category.key === 'esim' ? data?.type_stats?.usa_esim?.total ?? 0 : 0);
        return <Link key={category.key} to={`/dashboard/${category.key}-orders`} aria-label={`${category.name} order history`}><Icon size={19} strokeWidth={1.4} aria-hidden="true" /><strong>{category.name}</strong><span>{data ? `${count} in period` : 'View history'}</span><ArrowRight size={14} aria-hidden="true" /></Link>;
      })}</nav></section>
    </>}
  </div>;
}
