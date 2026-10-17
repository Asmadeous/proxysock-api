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

interface VPNOrder {
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
  has_ovpn_config?: boolean;
  credentials?: { username?: string; password?: string; server?: string; endpoints?: string[] };
  vpn_details?: { protocol?: string; locations?: string[] };
}
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const label = (value?: string) => value ? value.replace(/[-_]/g, ' ').replace(/\bisp\b/gi, 'ISP') : 'Not specified';
function amount(order: VPNOrder) {
  const value = order.total_amount ?? order.amount;
  if (value == null || value === '' || !Number.isFinite(Number(value))) return 'Not available';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(Number(value)); }
  catch { return `${order.currency || 'USD'} ${Number(value).toFixed(2)}`; }
}
const active = (order: VPNOrder) => ['active', 'completed'].includes(order.status);
const hasCredentials = (order: VPNOrder) => Boolean(order.credentials?.username || order.credentials?.password || order.credentials?.server || order.credentials?.endpoints?.length);
const canAccess = (order: VPNOrder) => active(order) && hasCredentials(order);
const managePath = (order: VPNOrder) => `/dashboard/vpn-management?search=${encodeURIComponent(order.order_number)}`;

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try { anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); }
  finally { anchor.remove(); URL.revokeObjectURL(url); }
}

export default function VPNOrders() {
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
  const query = useQuery<VPNOrder[]>({
    queryKey: ['vpn-order-history', user?.id],
    enabled: Boolean(accessToken && user?.id), retry: false, cacheTime: 0,
    queryFn: async ({ signal }) => {
      const orders: VPNOrder[] = [];
      let nextPage = 1;
      let totalPages = 1;
      do {
        const { data } = await api.get('/web/api/orders', { params: { product_type: 'vpn', page: nextPage, per_page: 100 }, signal });
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
    && [order.order_number, order.product_name, order.country].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  function open(order: VPNOrder) { setSelectedId(order.id); setShowPassword(false); setDownloadError(''); }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Copied to clipboard'); }
    catch { toast.error('Couldn’t copy. Select the text and copy it manually.'); }
  }
  async function download(order: VPNOrder, kind: 'invoice' | 'config') {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setDownloadError('');
    try {
      if (kind === 'invoice') {
        const { data } = await api.get(`/web/api/orders/${order.id}/download_invoice`, { responseType: 'blob' });
        saveFile(data, `invoice-${order.order_number}.pdf`);
      } else {
        const { data } = await api.get(`/web/api/orders/${order.id}/download_ovpn`, { responseType: 'blob' });
        saveFile(data, `vpn-order-${order.order_number}.ovpn`);
      }
      toast.success(`${kind === 'invoice' ? 'Invoice' : 'OpenVPN config'} downloaded`);
    } catch { setDownloadError(`Couldn’t download ${kind === 'invoice' ? 'the invoice' : 'the OpenVPN config'}. Please try again.`); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <div className={`dashboard-overview proxy-management proxy-orders ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>VPN Orders | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/orders"><ArrowLeft size={14} /> All orders</Link>
    <header className="overview-heading"><div><h1>VPN orders</h1><p>Review purchases, order details, and invoices.</p></div><div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/vpn">Browse VPN plans <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label="Refresh VPN orders" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your orders</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your VPN orders.</strong><p>{query.data ? 'Showing the last loaded orders.' : 'Try again to load your order history.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? orders.length : '—'}</strong> Orders</span><span><strong>{query.data ? orders.filter(active).length : '—'}</strong> Active / completed</span><span><strong>{query.data ? orders.filter(order => ['pending', 'processing', 'provisioning', 'awaiting_payment'].includes(order.status)).length : '—'}</strong> Pending / processing</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search VPN orders</span><input placeholder="Search order, plan, or location" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="vpn-order-location">Location</label><PurchaseSelect id="vpn-order-location" value={country} onValueChange={value => { setCountry(value); setPage(1); }} emptyLabel="All locations" options={[...new Set(orders.map(order => order.country).filter((value): value is string => Boolean(value)))].map(value => ({ value, label: value }))} /></div><div><label htmlFor="vpn-order-status">Order status</label><PurchaseSelect id="vpn-order-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[...new Set(orders.map(order => order.status))].map(value => ({ value, label: label(value) }))} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? 'Loading orders…' : 'Updating orders…'}</p>}
      {query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'order' : 'orders'}</p>{(search || country || status) && <button onClick={() => { setSearch(''); setCountry(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <section className="orders-history"><div className="orders-table-scroll" tabIndex={0} role="region" aria-label="VPN order history"><table><caption className="sr-only">VPN purchases, newest first</caption><thead><tr>{['Order', 'Plan', 'Date', 'Status', 'Order amount', ''].map((heading, index) => <th key={index} scope="col">{heading || <span className="sr-only">Actions</span>}</th>)}</tr></thead><tbody>{shown.map(order => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td><strong>{order.product_name}</strong><span>{order.country || 'Location not specified'}</span></td><td>{date(order.created_at)}</td><td><span className="overview-status" data-status={order.status}>{label(order.status)}</span></td><td>{amount(order)}</td><td><button className="history-details" aria-label={`View order ${order.order_number}`} onClick={() => open(order)}>View details <ArrowUpRight size={13} /></button></td></tr>)}</tbody></table></div></section> : <div className="proxy-empty"><ClipboardList size={25} /><h2>{orders.length ? 'No matching orders' : 'No VPN orders yet'}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your VPN purchases will appear here.'}</p>{!orders.length && <Link className="overview-button" to="/dashboard/vpn">Browse VPN plans</Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label="Order pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`}>
        <DialogTitle>VPN order details</DialogTitle><DialogDescription>{selected?.order_number} · {selected?.product_name}</DialogDescription>
        {selected && <>
          {downloadError && <p className="proxy-action-error" role="alert">{downloadError}</p>}
          <dl className="proxy-facts"><div><dt>Order status</dt><dd>{label(selected.status)}</dd></div><div><dt>Order amount</dt><dd>{amount(selected)}</dd></div><div><dt>Payment method</dt><dd>{label(selected.payment_method)}</dd></div><div><dt>Purchased</dt><dd>{date(selected.created_at)}</dd></div><div><dt>Service expiry</dt><dd>{date(selected.expires_at)}</dd></div><div><dt>Location</dt><dd>{selected.vpn_details?.locations?.join(', ') || selected.country || 'Not specified'}</dd></div><div><dt>Protocol</dt><dd>{selected.vpn_details?.protocol?.toUpperCase() || 'Not available'}</dd></div><div><dt>Data allowance</dt><dd>{Number(selected.bandwidth_gb) > 0 ? `${selected.bandwidth_gb} GB` : 'Not specified'}</dd></div></dl>
          {canAccess(selected) && <div className="proxy-panel"><h3>Connection details</h3>{selected.credentials?.username && <CopyField label="Username" value={selected.credentials.username} copy={copy} />}{selected.credentials?.password && <div className="proxy-secret"><span>Password</span><div><code>{showPassword ? selected.credentials.password : '••••••••••••'}</code><button aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button aria-label="Copy password" onClick={() => copy(selected.credentials!.password!)}><Copy size={15} /></button></div></div>}{selected.credentials?.server && <CopyField label="Server" value={selected.credentials.server} copy={copy} />}{selected.credentials?.endpoints?.map((endpoint, index) => <CopyField key={`${endpoint}-${index}`} label={`Endpoint ${index + 1}`} value={endpoint} copy={copy} />)}</div>}
          {active(selected) && !hasCredentials(selected) && <p className="proxy-note">Connection details are not available yet. Check service management or contact support.</p>}
          <div className="history-dialog-actions">{selected.has_invoice && <button className="proxy-secondary" disabled={busy} onClick={() => download(selected, 'invoice')}>Download invoice</button>}{active(selected) && selected.has_ovpn_config && <button className="proxy-primary" disabled={busy} onClick={() => download(selected, 'config')}>Download OpenVPN config</button>}</div>
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
