import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, Eye, EyeOff, Shield, RefreshCw, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import './dashboard-home.css';
// Shared service cards and dialogs match Proxy Management.
import './proxy-management.css';

interface VPNOrder {
  id: number;
  order_number: string;
  product_name: string;
  status: string;
  country?: string;
  expires_at?: string;
  created_at: string;
  bandwidth_gb?: number;
  reorderable?: boolean;
  auto_renew?: boolean;
  credentials?: { username?: string; password?: string; server?: string; endpoints?: string[] };
  vpn_details?: { protocol?: string; locations?: string[] };
}
type Panel = 'details' | 'credentials' | 'subscription' | 'reorder';
const titles: Record<Panel, string> = { details: 'VPN details', credentials: 'Connection details', subscription: 'Renewal settings', reorder: 'Reorder VPN' };
const active = (order: VPNOrder) => ['active', 'completed'].includes(order.status);
const closed = (order: VPNOrder) => ['refunded', 'cancelled', 'failed', 'expired', 'suspended'].includes(order.status);
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const errorMessage = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'The change couldn’t be completed. Please try again.';

export default function VPNManagement() {
  const dark = useThemeStore(state => state.dark);
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryKey = ['vpn-management', user?.id];
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>('details');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const query = useQuery<VPNOrder[]>({
    queryKey,
    enabled: Boolean(user?.id && accessToken),
    retry: false,
    cacheTime: 0,
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
  const filtered = orders.filter(order => (!country || order.country === country)
    && (!status || (status === 'active' ? active(order) : status === 'inactive' ? closed(order) : !active(order) && !closed(order)))
    && [order.order_number, order.product_name, order.credentials?.username, order.country].some(value => value?.toLowerCase().includes(search.toLowerCase().trim())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 9));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 9, currentPage * 9);
  function open(order: VPNOrder, next: Panel) {
    setSelectedId(order.id); setPanel(next); setActionError(''); setVisiblePassword(false);
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Copied to clipboard'); }
    catch { toast.error('Couldn’t copy. Select the text and copy it manually.'); }
  }
  async function change(operation: () => Promise<unknown>, message: string, close = false) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setActionError('');
    try {
      await operation();
      toast.success(message);
      if (close) setSelectedId(null);
      await query.refetch();
      queryClient.invalidateQueries(['my-services']);
    } catch (error) { setActionError(errorMessage(error)); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function download(order: VPNOrder) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setActionError('');
    try {
      const { data } = await api.get(`/web/api/orders/${order.id}/download_ovpn`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      try {
        anchor.href = url;
        anchor.download = `vpn-${order.order_number}.ovpn`;
        document.body.appendChild(anchor);
        anchor.click();
      } finally { anchor.remove(); URL.revokeObjectURL(url); }
      toast.success('VPN configuration downloaded');
    } catch {
      setActionError('Couldn’t download the OpenVPN configuration. Try again, or contact support if the file is not available yet.');
    } finally { busyRef.current = false; setBusy(false); }
  }
  return <div className={`dashboard-overview proxy-management ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>VPN Management | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/products"><ArrowLeft size={14} /> My services</Link>
    <header className="overview-heading"><div><h1>VPN management</h1><p>Manage your connections, credentials, and renewals.</p></div><div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/vpn">Browse VPN plans <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label="Refresh VPN services" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your VPN services</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your VPN services.</strong><p>{query.data ? 'Showing the last loaded details. Refresh before making changes.' : 'Try again to load your services.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? orders.length : '—'}</strong> Total services</span><span><strong>{query.data ? orders.filter(active).length : '—'}</strong> Active</span><span><strong>{query.data ? orders.filter(order => active(order) && order.auto_renew).length : '—'}</strong> Auto-renew on</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search VPN services</span><input value={search} placeholder="Search name, order, or username" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="vpn-country">Location</label><PurchaseSelect id="vpn-country" value={country} onValueChange={value => { setCountry(value); setPage(1); }} emptyLabel="All locations" options={[...new Set(orders.map(order => order.country).filter((value): value is string => Boolean(value)))].map(value => ({ value, label: value }))} /></div><div><label htmlFor="vpn-status">Status</label><PurchaseSelect id="vpn-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending / processing' }, { value: 'inactive', label: 'Inactive' }]} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? 'Loading VPN services…' : 'Updating VPN details…'}</p>}
      {!query.isLoading && query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'service' : 'services'}</p>{(search || country || status) && <button onClick={() => { setSearch(''); setCountry(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <div className="proxy-grid">{shown.map(order => <article className="proxy-service" key={order.id}>
          <div className="proxy-service-top"><span><Shield size={16} />VPN</span><span className="overview-status" data-status={active(order) ? 'active' : order.status}>{active(order) ? 'Active' : order.status.replace(/_/g, ' ')}</span></div>
          <h2>{order.product_name}</h2><p className="proxy-order">{order.order_number}</p>
          <dl className="proxy-facts"><div><dt>Location</dt><dd>{order.vpn_details?.locations?.join(', ') || order.country || 'Not available'}</dd></div><div><dt>Expires</dt><dd>{date(order.expires_at)}</dd></div><div><dt>Protocol</dt><dd>{order.vpn_details?.protocol?.toUpperCase() || 'Not available'}</dd></div><div><dt>Auto-renew</dt><dd>{order.auto_renew ? 'On' : 'Off'}</dd></div></dl>
          <div className="proxy-card-actions"><button onClick={() => open(order, 'details')}>View details <ArrowUpRight size={13} /></button>{!closed(order) && <button onClick={() => open(order, 'credentials')}>Connection details</button>}{order.status === 'expired' && order.reorderable && <button onClick={() => open(order, 'reorder')}>Reorder</button>}</div>
        </article>)}</div> : <div className="proxy-empty"><Shield size={25} /><h2>{orders.length ? 'No matching VPN services' : 'No VPN services yet'}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your VPN subscriptions and connection details will appear here.'}</p>{!orders.length && <Link className="overview-button" to="/dashboard/vpn">Browse VPN plans <ArrowUpRight size={14} /></Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label="VPN pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
        <DialogTitle>{titles[panel]}</DialogTitle><DialogDescription>{selected?.product_name} · {selected?.order_number}</DialogDescription>
        {selected && <><div className="proxy-dialog-nav">{(['details', ...(!closed(selected) ? ['credentials'] : []), ...(active(selected) ? ['subscription'] : [])] as Panel[]).map(next => <button disabled={busy} aria-pressed={panel === next} key={next} onClick={() => { setPanel(next); setActionError(''); }}>{next === 'credentials' ? 'Connection' : next === 'subscription' ? 'Renewal' : 'Details'}</button>)}</div>
          {query.isError && <p className="proxy-action-error" role="alert">Refresh the service list to load current details before making changes.</p>}
          {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
          <fieldset disabled={busy || query.isError} className="proxy-panel">
            {panel === 'details' && <><dl className="proxy-facts"><div><dt>Status</dt><dd>{active(selected) ? 'Active' : selected.status}</dd></div><div><dt>Data allowance</dt><dd>{Number(selected.bandwidth_gb) > 0 ? `${selected.bandwidth_gb} GB` : 'Not specified'}</dd></div><div><dt>Created</dt><dd>{date(selected.created_at)}</dd></div><div><dt>Expires</dt><dd>{date(selected.expires_at)}</dd></div><div><dt>Location</dt><dd>{selected.vpn_details?.locations?.join(', ') || selected.country || 'Not available'}</dd></div><div><dt>Protocol</dt><dd>{selected.vpn_details?.protocol?.toUpperCase() || 'Not available'}</dd></div></dl><Link className="proxy-help" to="/dashboard/support">Need help with this service? <ArrowUpRight size={13} /></Link></>}
            {panel === 'credentials' && <><div className="proxy-secret"><span>Username</span><div><code>{selected.credentials?.username || 'Not available yet'}</code>{selected.credentials?.username && <button aria-label="Copy username" onClick={() => copy(selected.credentials!.username!)}><Copy size={15} /></button>}</div></div><div className="proxy-secret"><span>Password</span><div><code>{selected.credentials?.password ? visiblePassword ? selected.credentials.password : '••••••••••••' : 'Not available yet'}</code>{selected.credentials?.password && <><button aria-label={visiblePassword ? 'Hide password' : 'Show password'} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button aria-label="Copy password" onClick={() => copy(selected.credentials!.password!)}><Copy size={15} /></button></>}</div></div>
              <div className="proxy-endpoints"><h3>Connection endpoints</h3>{selected.credentials?.endpoints?.length ? selected.credentials.endpoints.map((endpoint, index) => <div className="proxy-endpoint" key={`${endpoint}-${index}`}><code>{endpoint}</code><button aria-label={`Copy endpoint ${index + 1}`} onClick={() => copy(endpoint)}><Copy size={15} /></button></div>) : <p className="proxy-note">{active(selected) ? 'Connection details are not available yet. Refresh or contact support if this continues.' : 'Connection details will appear when provisioning is complete.'}</p>}</div>
              {selected.credentials?.server && <div className="proxy-secret"><span>Server</span><div><code>{selected.credentials.server}</code><button aria-label="Copy server" onClick={() => copy(selected.credentials!.server!)}><Copy size={15} /></button></div></div>}
              {active(selected) && <div><button className="proxy-primary" onClick={() => download(selected)}><Download size={14} aria-hidden="true" style={{ display: 'inline', marginRight: 8 }} />Download OpenVPN config</button><p className="proxy-note">Import the .ovpn file into your OpenVPN client to connect.</p></div>}
            </>}
            {panel === 'subscription' && <><div className="proxy-renewal"><div><h3>Automatic renewal</h3><p className="proxy-note">{selected.auto_renew ? 'On' : 'Off'} · Paid from your wallet</p></div><span className="overview-status">{selected.auto_renew ? 'Enabled' : 'Disabled'}</span></div><p className="proxy-note">When enabled, renewal charges are taken from your wallet at the end of the service term. Keep enough balance available to avoid interruption.</p><p className="proxy-note">Current expiry: {date(selected.expires_at)}</p><button className={selected.auto_renew ? 'proxy-secondary' : 'proxy-primary'} onClick={() => change(() => api.post(`/web/api/orders/${selected.id}/update_subscription`, { auto_renew: !selected.auto_renew, renewal_method: 'wallet' }), 'Renewal settings updated')}>{selected.auto_renew ? 'Turn off auto-renew' : 'Enable wallet auto-renew'}</button></>}
            {panel === 'reorder' && <><p className="proxy-note">This creates a new order for the same product using its current price. If your wallet has enough balance, payment and provisioning start automatically.</p><p className="proxy-note">To review available plans and prices first, <Link to="/dashboard/vpn">browse VPN plans</Link>.</p><button className="proxy-primary" onClick={() => change(async () => { const response = await api.post(`/web/api/orders/${selected.id}/reorder`); if (response.status === 202) toast.info('Order created. Top up your wallet to complete payment.'); }, 'New order created', true)}>Confirm reorder</button></>}
          </fieldset>
          {busy && <p className="proxy-note" role="status">Please wait…</p>}
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}
