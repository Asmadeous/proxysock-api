import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, Eye, EyeOff, RefreshCw, Search, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import './dashboard-home.css';
import './proxy-management.css';
import './orders.css';
import './proxy-orders.css';

interface RDPOrder {
  id: string | number;
  order_number: string;
  product_name: string;
  status: string;
  total_amount?: number | string | null;
  amount?: number | string | null;
  currency?: string;
  payment_method?: string;
  created_at: string;
  expires_at?: string;
  country?: string;
  bandwidth_gb?: number;
  has_invoice?: boolean;
  has_rdp_config?: boolean;
  concurrent_users?: number;
  vm_details?: { rdp_username?: string; root_password?: string; rdp_password_encrypted?: string };
  currency_code?: string;
  vm_id?: number;
  hostname?: string;
  connection_host?: string;
  dns_name?: string;
  ip_address?: string;
  os_template?: string;
  ssh_port?: number | null;
  rdp_port?: number | null;
  username?: string;
  password?: string;
  cpu_cores?: number;
  ram_gb?: number;
  storage_gb?: number;
  credentials?: { username?: string; password?: string };
  metadata?: Resources & { plan_details?: Resources };
}
interface Resources {
  cpu_cores?: number;
  ram_gb?: number;
  storage_gb?: number;
  bandwidth_gb?: number;
}
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const label = (value?: string) => value ? value.replace(/[-_]/g, ' ').replace(/\bisp\b/gi, 'ISP') : 'Not specified';
function amount(order: RDPOrder) {
  const value = order.total_amount ?? order.amount;
  if (value == null || value === '' || !Number.isFinite(Number(value))) return 'Not available';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || order.currency_code || 'USD' }).format(Number(value)); }
  catch { return `${order.currency || order.currency_code || 'USD'} ${Number(value).toFixed(2)}`; }
}
const active = (order: RDPOrder) => ['active', 'completed'].includes(order.status);
const host = (order: RDPOrder) => order.connection_host || order.dns_name || '';
const username = (order: RDPOrder) => order.vm_details?.rdp_username || order.username || order.credentials?.username || '';
const password = (order: RDPOrder) => order.vm_details?.root_password || order.vm_details?.rdp_password_encrypted || order.password || order.credentials?.password || '';
const hasCredentials = (order: RDPOrder) => Boolean(host(order) || username(order) || password(order));
const canAccess = (order: RDPOrder) => active(order) && hasCredentials(order);
const managePath = (order: RDPOrder) => `/dashboard/RDP-management${order.vm_id ? `?search=${encodeURIComponent(String(order.vm_id))}` : order.hostname ? `?search=${encodeURIComponent(order.hostname)}` : ''}`;
const resource = (order: RDPOrder, key: keyof Resources, unit: string) => {
  const value = order[key] ?? order.metadata?.plan_details?.[key] ?? order.metadata?.[key];
  return value != null && Number.isFinite(Number(value)) && Number(value) > 0 ? `${value} ${unit}` : 'Not specified';
};
const connection = (order: RDPOrder) => {
  if (!host(order) || !order.rdp_port) return null;
  const address = host(order).includes(':') && !host(order).startsWith('[') ? `[${host(order)}]` : host(order);
  return { label: 'Remote Desktop address', value: `${address}:${order.rdp_port}` };
};

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try { anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); }
  finally { anchor.remove(); URL.revokeObjectURL(url); }
}

export default function RDPOrders() {
  const dark = useThemeStore(state => state.dark);
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [downloadError, setDownloadError] = useState('');
  const query = useQuery<RDPOrder[]>({
    queryKey: ['rdp-order-history', user?.id],
    enabled: Boolean(accessToken && user?.id), retry: false, cacheTime: 0,
    queryFn: async ({ signal }) => {
      const orders: RDPOrder[] = [];
      let nextPage = 1;
      let totalPages = 1;
      do {
        const { data } = await api.get('/web/api/orders', { params: { product_type: 'rdp', page: nextPage, per_page: 100 }, signal });
        orders.push(...data.orders);
        totalPages = data.meta?.total_pages ?? 1;
        nextPage += 1;
      } while (nextPage <= totalPages);
      return orders;
    },
  });
  useEffect(() => { setSearch(new URLSearchParams(location.search).get('search') || ''); setPage(1); }, [location.search]);
  const orders = query.data || [];
  const selected = orders.find(order => order.id === selectedId);
  const filtered = orders.filter(order => (!country || order.country === country) && (!status || order.status === status)
    && [order.order_number, order.product_name, order.country, order.hostname, host(order), order.ip_address, String(order.vm_id || '')].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  function open(order: RDPOrder) { setSelectedId(order.id); setShowPassword(false); setDownloadError(''); }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Copied to clipboard'); }
    catch { toast.error('Couldn’t copy. Select the text and copy it manually.'); }
  }
  async function download(order: RDPOrder, kind: 'invoice' | 'details' | 'config') {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setDownloadError('');
    try {
      if (kind === 'invoice') {
        const { data } = await api.get(`/web/api/orders/${order.id}/download_invoice`, { responseType: 'blob' });
        saveFile(data, `invoice-${order.order_number}.pdf`);
      } else if (kind === 'config') {
        const { data } = await api.get(`/web/api/orders/${order.id}/download_rdp_config`, { responseType: 'blob' });
        saveFile(data, `rdp-${order.order_number}.rdp`);
      } else {
        const content = [
          `Order: ${order.order_number}`, `Plan: ${order.product_name}`, `Order status: ${order.status}`, `Order amount: ${amount(order)}`,
          `Purchased: ${date(order.created_at)}`, `Expires: ${date(order.expires_at)}`, `VM ID: ${order.vm_id || 'Not assigned'}`,
          `Hostname: ${order.hostname || 'Not assigned'}`, `Operating system: ${order.os_template || 'Not specified'}`,
          `CPU: ${resource(order, 'cpu_cores', 'vCPU')}`, `Memory: ${resource(order, 'ram_gb', 'GB')}`, `Storage: ${resource(order, 'storage_gb', 'GB')}`,
          `Bandwidth: ${resource(order, 'bandwidth_gb', 'GB')}`,
          ...(canAccess(order) ? [`Server address: ${host(order) || 'Not available'}`, `Username: ${username(order) || 'Not available'}`, `Password: ${password(order) || 'Not available'}`, ...(connection(order) ? [`${connection(order)!.label}: ${connection(order)!.value}`] : [])] : []),
        ].join('\n');
        saveFile(new Blob([content], { type: 'text/plain;charset=utf-8' }), `rdp-order-${order.order_number}.txt`);
      }
      toast.success(`${kind === 'invoice' ? 'Invoice' : kind === 'config' ? 'RDP connection file' : 'Order details'} downloaded`);
    } catch { setDownloadError(`Couldn’t download ${kind === 'invoice' ? 'the invoice' : kind === 'config' ? 'the RDP connection file' : 'the order details'}. Please try again.`); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <div className={`dashboard-overview proxy-management proxy-orders ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>RDP Orders | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/orders"><ArrowLeft size={14} /> All orders</Link>
    <header className="overview-heading"><div><h1>RDP orders</h1><p>Review purchases, order details, and invoices.</p></div><div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/rdp">Browse RDP plans <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label="Refresh RDP orders" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your orders</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your RDP orders.</strong><p>{query.data ? 'Showing the last loaded orders.' : 'Try again to load your order history.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? orders.length : '—'}</strong> Orders</span><span><strong>{query.data ? orders.filter(active).length : '—'}</strong> Active / completed</span><span><strong>{query.data ? orders.filter(order => ['pending', 'processing', 'provisioning', 'awaiting_payment'].includes(order.status)).length : '—'}</strong> Pending / processing</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search RDP orders</span><input placeholder="Search order, plan, hostname, or VM ID" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="rdp-order-location">Location</label><PurchaseSelect id="rdp-order-location" value={country} onValueChange={value => { setCountry(value); setPage(1); }} emptyLabel="All locations" options={[...new Set(orders.map(order => order.country).filter((value): value is string => Boolean(value)))].map(value => ({ value, label: value }))} /></div><div><label htmlFor="rdp-order-status">Order status</label><PurchaseSelect id="rdp-order-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[...new Set(orders.map(order => order.status))].map(value => ({ value, label: label(value) }))} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? 'Loading orders…' : 'Updating orders…'}</p>}
      {query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'order' : 'orders'}</p>{(search || country || status) && <button onClick={() => { setSearch(''); setCountry(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <section className="orders-history"><div className="orders-table-scroll" tabIndex={0} role="region" aria-label="RDP order history"><table><caption className="sr-only">RDP purchases, newest first</caption><thead><tr>{['Order', 'Plan', 'Date', 'Status', 'Order amount', ''].map((heading, index) => <th key={index} scope="col">{heading || <span className="sr-only">Actions</span>}</th>)}</tr></thead><tbody>{shown.map(order => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td><strong>{order.product_name}</strong><span>{order.country || 'Location not specified'}</span></td><td>{date(order.created_at)}</td><td><span className="overview-status" data-status={order.status}>{label(order.status)}</span></td><td>{amount(order)}</td><td><button className="history-details" aria-label={`View order ${order.order_number}`} onClick={() => open(order)}>View details <ArrowUpRight size={13} /></button></td></tr>)}</tbody></table></div></section> : <div className="proxy-empty"><ClipboardList size={25} /><h2>{orders.length ? 'No matching orders' : 'No RDP orders yet'}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your RDP purchases will appear here.'}</p>{!orders.length && <Link className="overview-button" to="/dashboard/rdp">Browse RDP plans</Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label="Order pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`}>
        <DialogTitle>RDP order details</DialogTitle><DialogDescription>{selected?.order_number} · {selected?.product_name}</DialogDescription>
        {selected && <>
          {downloadError && <p className="proxy-action-error" role="alert">{downloadError}</p>}
          <dl className="proxy-facts">
            <div><dt>Order status</dt><dd>{label(selected.status)}</dd></div><div><dt>Order amount</dt><dd>{amount(selected)}</dd></div>
            <div><dt>Payment method</dt><dd>{label(selected.payment_method)}</dd></div><div><dt>Purchased</dt><dd>{date(selected.created_at)}</dd></div>
            <div><dt>Service expiry</dt><dd>{date(selected.expires_at)}</dd></div><div><dt>Location</dt><dd>{selected.country || 'Not specified'}</dd></div>
            <div><dt>Hostname</dt><dd>{selected.hostname || 'Not assigned'}</dd></div><div><dt>VM ID</dt><dd>{selected.vm_id || 'Not assigned'}</dd></div>
            <div><dt>Operating system</dt><dd>{selected.os_template || 'Not specified'}</dd></div><div><dt>CPU</dt><dd>{resource(selected, 'cpu_cores', 'vCPU')}</dd></div>
            <div><dt>Memory</dt><dd>{resource(selected, 'ram_gb', 'GB')}</dd></div><div><dt>Storage</dt><dd>{resource(selected, 'storage_gb', 'GB')}</dd></div>
            <div><dt>Concurrent users</dt><dd>{selected.concurrent_users || 'Not specified'}</dd></div><div><dt>Bandwidth</dt><dd>{resource(selected, 'bandwidth_gb', 'GB')}</dd></div>
          </dl>
          {canAccess(selected) && <div className="proxy-panel"><h3>Connection details</h3>
            {host(selected) && <CopyField label="Server address" value={host(selected)} copy={copy} />}
            {username(selected) && <CopyField label="Username" value={username(selected)} copy={copy} />}
            {password(selected) && <div className="proxy-secret"><span>Password</span><div><code>{showPassword ? password(selected) : '••••••••••••'}</code><button aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button aria-label="Copy password" onClick={() => copy(password(selected))}><Copy size={15} /></button></div></div>}
            {connection(selected) ? <CopyField label={connection(selected)!.label} value={connection(selected)!.value} copy={copy} /> : <p className="proxy-note">A complete connection address is not available yet. Check service management for the latest details.</p>}
          </div>}
          {active(selected) && !hasCredentials(selected) && <p className="proxy-note">Connection details are not available yet. Check service management or contact support.</p>}
          <div className="history-dialog-actions">{active(selected) && selected.has_rdp_config && connection(selected) && <button className="proxy-primary" disabled={busy} onClick={() => download(selected, 'config')}>Download RDP connection file</button>}{selected.has_invoice && <button className="proxy-secondary" disabled={busy} onClick={() => download(selected, 'invoice')}>Download invoice</button>}<button className="proxy-primary" disabled={busy} onClick={() => download(selected, 'details')}>Download order details</button></div>
          {busy && <p className="proxy-note" role="status">Preparing download…</p>}
          <div className="proxy-card-actions"><Link to={managePath(selected)}>Manage service <ArrowUpRight size={13} /></Link><Link to={`/dashboard/support?tab=tickets&order_id=${encodeURIComponent(selected.order_number)}`}>Get order support <ArrowUpRight size={13} /></Link></div>
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}

function CopyField({ label, value, copy }: { label: string; value: string; copy: (value: string) => Promise<void> }) {
  return <div className="proxy-secret"><span>{label}</span><div><code>{value}</code><button aria-label={`Copy ${label}`} onClick={() => copy(value)}><Copy size={15} /></button></div></div>;
}
