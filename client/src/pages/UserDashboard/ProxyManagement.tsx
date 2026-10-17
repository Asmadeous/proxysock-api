import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, Eye, EyeOff, Network, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api, { updateProxyCredentials, rotateProxyIp, whitelistAdd, whitelistDelete } from '@/services/api';
import { subscribeToNotifications, unsubscribe } from '@/lib/actionCable';
import './dashboard-home.css';
import './proxy-management.css';

interface ProxyOrder {
  id: number;
  order_number: string;
  product_name: string;
  proxy_type: string;
  status: string;
  country?: string;
  expires_at?: string;
  created_at: string;
  bandwidth_gb?: number;
  provider_order_id?: string | number;
  reorderable?: boolean;
  auto_renew?: boolean;
  credentials?: { username?: string; password?: string; endpoints?: string[] };
  proxy_details?: { protocol?: string; whitelist_ips?: string[]; locations?: string[]; traffic_used?: number };
}
type Panel = 'details' | 'credentials' | 'whitelist' | 'subscription' | 'reorder' | 'rotate';
const titles: Record<Panel, string> = { details: 'Proxy details', credentials: 'Connection details', whitelist: 'Allowed IP addresses', subscription: 'Renewal settings', reorder: 'Reorder proxy', rotate: 'Rotate IP address' };
const active = (order: ProxyOrder) => ['active', 'completed'].includes(order.status);
const closed = (order: ProxyOrder) => ['refunded', 'cancelled', 'failed', 'expired', 'suspended'].includes(order.status);
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const typeLabel = (value: string) => (value || 'proxy').split(/[-_]/).map(word => ['isp'].includes(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const errorMessage = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'The change couldn’t be completed. Please try again.';

export default function ProxyManagement() {
  const dark = useThemeStore(state => state.dark);
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryKey = ['proxy-management', user?.id];
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>('details');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ip, setIp] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const query = useQuery<ProxyOrder[]>({
    queryKey,
    enabled: Boolean(user?.id && accessToken),
    retry: false,
    cacheTime: 0,
    queryFn: async ({ signal }) => {
      const orders: ProxyOrder[] = [];
      let nextPage = 1;
      let totalPages = 1;
      do {
        const { data } = await api.get('/web/api/orders', { params: { product_type: 'proxy', page: nextPage, per_page: 100 }, signal });
        orders.push(...data.orders);
        totalPages = data.meta?.total_pages ?? 1;
        nextPage += 1;
      } while (nextPage <= totalPages);
      return orders;
    },
  });
  useEffect(() => { setSearch(new URLSearchParams(location.search).get('search') || ''); setPage(1); }, [location.search]);
  useEffect(() => {
    if (!accessToken || !user?.id) return;
    const subscription = subscribeToNotifications((event: unknown) => {
      if ((event as { type?: string })?.type === 'bandwidth_update') queryClient.invalidateQueries(['proxy-management', user.id]);
    });
    return () => unsubscribe(subscription);
  }, [accessToken, user?.id, queryClient]);
  const orders = query.data || [];
  const selected = orders.find(order => order.id === selectedId);
  const filtered = orders.filter(order => (!type || order.proxy_type === type)
    && (!status || (status === 'active' ? active(order) : status === 'inactive' ? closed(order) : !active(order) && !closed(order)))
    && [order.order_number, order.product_name, order.credentials?.username, order.country].some(value => value?.toLowerCase().includes(search.toLowerCase().trim())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 9));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 9, currentPage * 9);
  const canManage = selected && active(selected) && Boolean(selected.provider_order_id);
  function open(order: ProxyOrder, next: Panel) {
    setSelectedId(order.id); setPanel(next); setActionError(''); setVisiblePassword(false);
    setUsername(order.credentials?.username || ''); setPassword(''); setIp(''); setDescription('');
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
      setPassword(''); setIp(''); setDescription('');
      if (close) setSelectedId(null);
      await query.refetch();
      queryClient.invalidateQueries(['my-services']);
    } catch (error) { setActionError(errorMessage(error)); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <div className={`dashboard-overview proxy-management ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Proxy Management | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/products"><ArrowLeft size={14} /> My services</Link>
    <header className="overview-heading"><div><h1>Proxy management</h1><p>Manage your connections, credentials, and renewals.</p></div><div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/proxies">Browse proxies <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label="Refresh proxies" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your proxies</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your proxies.</strong><p>{query.data ? 'Showing the last loaded details. Refresh before making changes.' : 'Try again to load your services.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? orders.length : '—'}</strong> Total services</span><span><strong>{query.data ? orders.filter(active).length : '—'}</strong> Active</span><span><strong>{query.data ? orders.filter(order => active(order) && order.auto_renew).length : '—'}</strong> Auto-renew on</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search proxies</span><input value={search} placeholder="Search name, order, or username" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="proxy-type">Proxy type</label><PurchaseSelect id="proxy-type" value={type} onValueChange={value => { setType(value); setPage(1); }} emptyLabel="All types" options={[...new Set(orders.map(order => order.proxy_type).filter(Boolean))].map(value => ({ value, label: typeLabel(value) }))} /></div><div><label htmlFor="proxy-status">Status</label><PurchaseSelect id="proxy-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending / processing' }, { value: 'inactive', label: 'Inactive' }]} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? 'Loading proxies…' : 'Updating proxy details…'}</p>}
      {!query.isLoading && query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'service' : 'services'}</p>{(search || type || status) && <button onClick={() => { setSearch(''); setType(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <div className="proxy-grid">{shown.map(order => <article className="proxy-service" key={order.id}>
          <div className="proxy-service-top"><span><Network size={16} />{typeLabel(order.proxy_type)}</span><span className="overview-status" data-status={active(order) ? 'active' : order.status}>{active(order) ? 'Active' : order.status.replace(/_/g, ' ')}</span></div>
          <h2>{order.product_name}</h2><p className="proxy-order">{order.order_number}</p>
          <dl className="proxy-facts"><div><dt>Location</dt><dd>{order.proxy_details?.locations?.join(', ') || order.country || 'Not available'}</dd></div><div><dt>Expires</dt><dd>{date(order.expires_at)}</dd></div><div><dt>Protocol</dt><dd>{order.proxy_details?.protocol?.toUpperCase() || 'Not available'}</dd></div><div><dt>Auto-renew</dt><dd>{order.auto_renew ? 'On' : 'Off'}</dd></div></dl>
          {order.proxy_details?.traffic_used != null && <p className="proxy-usage">{(order.proxy_details.traffic_used / 1024 ** 3).toFixed(2)} GB used{Number(order.bandwidth_gb) > 0 ? ` of ${order.bandwidth_gb} GB` : ''}</p>}
          <div className="proxy-card-actions"><button onClick={() => open(order, 'details')}>View details <ArrowUpRight size={13} /></button>{!closed(order) && <button onClick={() => open(order, 'credentials')}>Connection details</button>}{order.status === 'expired' && order.reorderable && <button onClick={() => open(order, 'reorder')}>Reorder</button>}</div>
        </article>)}</div> : <div className="proxy-empty"><Network size={25} /><h2>{orders.length ? 'No matching proxies' : 'No proxies yet'}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your purchased proxies and connection details will appear here.'}</p>{!orders.length && <Link className="overview-button" to="/dashboard/proxies">Browse proxies <ArrowUpRight size={14} /></Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label="Proxy pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
        <DialogTitle>{titles[panel]}</DialogTitle><DialogDescription>{selected?.product_name} · {selected?.order_number}</DialogDescription>
        {selected && <><div className="proxy-dialog-nav">{(['details', ...(!closed(selected) ? ['credentials'] : []), ...(canManage ? ['whitelist'] : []), ...(active(selected) ? ['subscription'] : [])] as Panel[]).map(next => <button disabled={busy} aria-pressed={panel === next} key={next} onClick={() => { setPanel(next); setActionError(''); }}>{next === 'credentials' ? 'Connection' : next === 'whitelist' ? 'Allowed IPs' : next === 'subscription' ? 'Renewal' : 'Details'}</button>)}</div>
          {query.isError && <p className="proxy-action-error" role="alert">Refresh the service list to load current details before making changes.</p>}
          {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
          <fieldset disabled={busy || query.isError} className="proxy-panel">
            {panel === 'details' && <><dl className="proxy-facts"><div><dt>Status</dt><dd>{active(selected) ? 'Active' : selected.status}</dd></div><div><dt>Proxy type</dt><dd>{typeLabel(selected.proxy_type)}</dd></div><div><dt>Created</dt><dd>{date(selected.created_at)}</dd></div><div><dt>Expires</dt><dd>{date(selected.expires_at)}</dd></div><div><dt>Location</dt><dd>{selected.proxy_details?.locations?.join(', ') || selected.country || 'Not available'}</dd></div><div><dt>Protocol</dt><dd>{selected.proxy_details?.protocol?.toUpperCase() || 'Not available'}</dd></div></dl><Link className="proxy-help" to="/dashboard/support">Need help with this service? <ArrowUpRight size={13} /></Link></>}
            {panel === 'credentials' && <><div className="proxy-secret"><span>Username</span><div><code>{selected.credentials?.username || 'Not available yet'}</code>{selected.credentials?.username && <button aria-label="Copy username" onClick={() => copy(selected.credentials!.username!)}><Copy size={15} /></button>}</div></div><div className="proxy-secret"><span>Password</span><div><code>{selected.credentials?.password ? visiblePassword ? selected.credentials.password : '••••••••••••' : 'Not available yet'}</code>{selected.credentials?.password && <><button aria-label={visiblePassword ? 'Hide password' : 'Show password'} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button aria-label="Copy password" onClick={() => copy(selected.credentials!.password!)}><Copy size={15} /></button></>}</div></div>
              <div className="proxy-endpoints"><h3>Connection endpoints</h3>{selected.credentials?.endpoints?.length ? selected.credentials.endpoints.map((endpoint, index) => <div className="proxy-endpoint" key={`${endpoint}-${index}`}><code>{endpoint}</code><button aria-label={`Copy endpoint ${index + 1}`} onClick={() => copy(endpoint)}><Copy size={15} /></button></div>) : <p className="proxy-note">{active(selected) ? 'Connection details are not available yet. Refresh or contact support if this continues.' : 'Connection details will appear when provisioning is complete.'}</p>}</div>
              {canManage && <form onSubmit={event => { event.preventDefault(); change(() => updateProxyCredentials(selected.id, { username: username.trim(), password }), 'Credentials updated'); }}><h3>Update credentials</h3><p className="proxy-note">Update your applications after changing these details.</p><label htmlFor="proxy-username">Username</label><input id="proxy-username" required value={username} onChange={event => setUsername(event.target.value)} autoComplete="off" /><label htmlFor="proxy-password">New password</label><input id="proxy-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" /><button className="proxy-primary" disabled={!username.trim() || !password} type="submit">Save credentials</button></form>}
              {canManage && selected.proxy_type === 'mobile' && <button className="proxy-secondary" onClick={() => { setPanel('rotate'); setActionError(''); }}>Rotate IP address</button>}
            </>}
            {panel === 'whitelist' && <><p className="proxy-note">Manage the IP addresses allowed to connect to this proxy.</p><div className="proxy-ip-list">{selected.proxy_details?.whitelist_ips?.length ? selected.proxy_details.whitelist_ips.map(value => <div className="proxy-endpoint" key={value}><code>{value}</code><button aria-label={`Remove ${value}`} onClick={() => change(() => whitelistDelete(selected.id, value), 'IP address removed')}><Trash2 size={15} /></button></div>) : <p className="proxy-note">No allowed IP addresses saved.</p>}</div><form onSubmit={event => { event.preventDefault(); change(() => whitelistAdd(selected.id, ip.trim(), description.trim() || undefined), 'IP address added'); }}><label htmlFor="proxy-ip">IP address</label><input id="proxy-ip" placeholder="e.g. 203.0.113.10" required value={ip} onChange={event => setIp(event.target.value)} /><label htmlFor="proxy-ip-description">Description (optional)</label><input id="proxy-ip-description" value={description} onChange={event => setDescription(event.target.value)} /><button className="proxy-primary" disabled={!ip.trim()} type="submit">Add IP address</button></form></>}
            {panel === 'subscription' && <><div className="proxy-renewal"><div><h3>Automatic renewal</h3><p className="proxy-note">{selected.auto_renew ? 'On' : 'Off'} · Paid from your wallet</p></div><span className="overview-status">{selected.auto_renew ? 'Enabled' : 'Disabled'}</span></div><p className="proxy-note">When enabled, renewal charges are taken from your wallet at the end of the service term. Keep enough balance available to avoid interruption.</p><p className="proxy-note">Current expiry: {date(selected.expires_at)}</p><button className={selected.auto_renew ? 'proxy-secondary' : 'proxy-primary'} onClick={() => change(() => api.post(`/web/api/orders/${selected.id}/update_subscription`, { auto_renew: !selected.auto_renew, renewal_method: 'wallet' }), 'Renewal settings updated')}>{selected.auto_renew ? 'Turn off auto-renew' : 'Enable wallet auto-renew'}</button></>}
            {panel === 'rotate' && <><p className="proxy-note">Rotating replaces your mobile proxy’s IP address and may interrupt active connections.</p><button className="proxy-primary" onClick={() => change(() => rotateProxyIp(selected.id), 'IP rotation requested', true)}>Confirm IP rotation</button></>}
            {panel === 'reorder' && <><p className="proxy-note">This creates a new order for the same product using its current price. If your wallet has enough balance, payment and provisioning start automatically.</p><p className="proxy-note">To review available plans and prices first, <Link to="/dashboard/proxies">browse proxies</Link>.</p><button className="proxy-primary" onClick={() => change(async () => { const response = await api.post(`/web/api/orders/${selected.id}/reorder`); if (response.status === 202) toast.info('Order created. Top up your wallet to complete payment.'); }, 'New order created', true)}>Confirm reorder</button></>}
          </fieldset>
          {busy && <p className="proxy-note" role="status">Saving changes…</p>}
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}
