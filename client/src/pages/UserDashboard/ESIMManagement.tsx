import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, Smartphone, RefreshCw, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EsimTopupDialog from './EsimTopupDialog';
import './esim-management.css';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import './dashboard-home.css';
// Shared service cards and dialogs match Proxy Management.
import './proxy-management.css';

interface EsimProfile {
  id?: string | number;
  iccid?: string;
  qr_code_data?: string;
  qr_code_url?: string;
  qr_code?: string;
  activation_code?: string;
  qr_activation_code?: string;
  phone_number?: string;
  pin1?: string;
  puk1?: string;
  pin2?: string;
  puk2?: string;
  zip_code?: string;
  total_volume?: number;
  used_volume?: number;
  data_label?: string;
  location_name?: string;
  validity_days?: number;
  expired_time?: string;
  status?: string;
}
interface EsimOrder {
  id: string | number;
  order_number: string;
  product_name: string;
  product_type: string;
  status: string;
  country?: string;
  created_at: string;
  reorderable?: boolean;
  topup_eligible?: boolean;
  review_pending?: boolean;
  auto_renew?: boolean;
  profiles?: EsimProfile[];
  credentials_list?: EsimProfile[];
  credentials?: EsimProfile;
}
interface Service extends Omit<EsimOrder, 'id'> {
  id: string;
  orderId: string | number;
  profile: EsimProfile;
}
const profileRows = (orders: EsimOrder[]): Service[] => orders.flatMap(order => {
  const profiles = order.profiles?.length ? order.profiles : order.credentials_list?.length ? order.credentials_list : [order.credentials || {}];
  return profiles.map((profile, index) => ({ ...order, id: `${order.id}-${profile.id ?? index}`, orderId: order.id, profile }));
});
const allowance = (profile: EsimProfile) => profile.data_label || (Number(profile.total_volume) > 0 ? `${(Number(profile.total_volume) / 1024).toFixed(2)} GB` : 'Not specified');
const activationCode = (profile: EsimProfile) => profile.activation_code || profile.qr_activation_code || (profile.qr_code_data?.startsWith('LPA:') ? profile.qr_code_data : '') || '';
const qrValue = (profile: EsimProfile) => [activationCode(profile), profile.qr_code_data].find(value => value?.startsWith('LPA:'));
type Panel = 'details' | 'activation' | 'subscription' | 'reorder';
const titles: Record<Panel, string> = { details: 'eSIM details', activation: 'Install eSIM', subscription: 'Renewal settings', reorder: 'Reorder eSIM' };
const active = (order: EsimOrder) => ['active', 'completed'].includes(order.status);
const closed = (order: EsimOrder) => ['refunded', 'cancelled', 'failed', 'expired', 'suspended'].includes(order.status);
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const errorMessage = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'The change couldn’t be completed. Please try again.';

export default function ESIMManagement() {
  const dark = useThemeStore(state => state.dark);
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryKey = ['esim-management', user?.id];
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [topup, setTopup] = useState<Service | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('details');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const query = useQuery<EsimOrder[]>({
    queryKey,
    enabled: Boolean(user?.id && accessToken),
    retry: false,
    cacheTime: 0,
    queryFn: async ({ signal }) => {
      const orders: EsimOrder[] = [];
      let nextPage = 1;
      let totalPages = 1;
      do {
        const { data } = await api.get('/web/api/orders', { params: { product_type: 'esim,usa_esim', page: nextPage, per_page: 100 }, signal });
        orders.push(...data.orders);
        totalPages = data.meta?.total_pages ?? 1;
        nextPage += 1;
      } while (nextPage <= totalPages);
      return orders;
    },
  });
  useEffect(() => { setSearch(new URLSearchParams(location.search).get('search') || ''); setPage(1); }, [location.search]);
  const orders = profileRows(query.data || []);
  const selected = orders.find(order => order.id === selectedId);
  const filtered = orders.filter(order => (!type || order.product_type === type)
    && (!status || (status === 'active' ? active(order) : status === 'inactive' ? closed(order) : !active(order) && !closed(order)))
    && [order.order_number, order.product_name, order.profile.iccid, order.profile.phone_number, order.profile.location_name, order.country].some(value => value?.toLowerCase().includes(search.toLowerCase().trim())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 9));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 9, currentPage * 9);
  function open(order: Service, next: Panel) {
    setSelectedId(order.id); setPanel(next); setActionError(''); setQrFailed(false);
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
  return <div className={`dashboard-overview proxy-management ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>eSIM Management | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/products"><ArrowLeft size={14} /> My services</Link>
    <header className="overview-heading"><div><h1>eSIM management</h1><p>View your profiles, installation details, and data plans.</p></div><div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/esim">Browse eSIM plans <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label="Refresh eSIM services" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your eSIM services</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your eSIM services.</strong><p>{query.data ? 'Showing the last loaded details. Refresh before making changes.' : 'Try again to load your services.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? query.data.length : '—'}</strong> Orders</span><span><strong>{query.data ? (query.data || []).filter(active).length : '—'}</strong> Active orders</span><span><strong>{query.data ? (query.data || []).filter(order => active(order) && order.auto_renew).length : '—'}</strong> Auto-renew on</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search eSIM services</span><input value={search} placeholder="Search plan, order, ICCID, or phone" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="esim-type">Service type</label><PurchaseSelect id="esim-type" value={type} onValueChange={value => { setType(value); setPage(1); }} emptyLabel="All eSIMs" options={[{ value: 'esim', label: 'eSIM' }, { value: 'usa_esim', label: 'USA eSIM' }]} /></div><div><label htmlFor="esim-status">Order status</label><PurchaseSelect id="esim-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending / processing' }, { value: 'inactive', label: 'Inactive' }]} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? 'Loading eSIM services…' : 'Updating eSIM details…'}</p>}
      {!query.isLoading && query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'service' : 'services'}</p>{(search || type || status) && <button onClick={() => { setSearch(''); setType(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <div className="proxy-grid">{shown.map(order => <article className="proxy-service" key={order.id}>
          <div className="proxy-service-top"><span><Smartphone size={16} />eSIM</span><span className="overview-status" data-status={active(order) ? 'active' : order.status}>{active(order) ? 'Order active' : order.status.replace(/_/g, ' ')}</span></div>
          <h2>{order.product_name}</h2><p className="proxy-order">{order.order_number}</p>
          <dl className="proxy-facts"><div><dt>Location</dt><dd>{order.profile.location_name || order.country || 'Not available'}</dd></div><div><dt>Expires</dt><dd>{date(order.profile.expired_time)}</dd></div><div><dt>Data allowance</dt><dd>{allowance(order.profile)}</dd></div><div><dt>Profile status</dt><dd>{order.profile.status || 'Awaiting profile'}</dd></div></dl>
          {order.profile.iccid && <p className="proxy-usage">ICCID {order.profile.iccid}</p>}
          {order.review_pending && <p className="proxy-note">Your order is being reviewed. Installation details will appear when ready.</p>}
          <div className="proxy-card-actions">{order.topup_eligible && <button onClick={() => setTopup(order)}>Top up line</button>}<button onClick={() => open(order, 'details')}>View details <ArrowUpRight size={13} /></button>{!closed(order) && <button onClick={() => open(order, 'activation')}>Install eSIM</button>}{order.status === 'expired' && order.reorderable && !order.topup_eligible && <button onClick={() => open(order, 'reorder')}>Reorder</button>}</div>
        </article>)}</div> : <div className="proxy-empty"><Smartphone size={25} /><h2>{orders.length ? 'No matching eSIM services' : 'No eSIM services yet'}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your eSIM subscriptions and connection details will appear here.'}</p>{!orders.length && <Link className="overview-button" to="/dashboard/esim">Browse eSIM plans <ArrowUpRight size={14} /></Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label="eSIM pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
        <DialogTitle>{titles[panel]}</DialogTitle><DialogDescription>{selected?.product_name} · {selected?.order_number}</DialogDescription>
        {selected && <><div className="proxy-dialog-nav">{(['details', ...(!closed(selected) ? ['activation'] : []), ...(active(selected) && !selected.topup_eligible ? ['subscription'] : [])] as Panel[]).map(next => <button disabled={busy} aria-pressed={panel === next} key={next} onClick={() => { setPanel(next); setActionError(''); }}>{next === 'activation' ? 'Install eSIM' : next === 'subscription' ? 'Renewal' : 'Details'}</button>)}</div>
          {query.isError && <p className="proxy-action-error" role="alert">Refresh the service list to load current details before making changes.</p>}
          {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
          <fieldset disabled={busy || query.isError} className="proxy-panel">
            {panel === 'details' && <>
              <dl className="proxy-facts">
                <div><dt>Order status</dt><dd>{active(selected) ? 'Active' : selected.status}</dd></div>
                <div><dt>Profile status</dt><dd>{selected.profile.status || 'Awaiting profile'}</dd></div>
                <div><dt>Data allowance</dt><dd>{allowance(selected.profile)}</dd></div>
                <div><dt>Recorded usage</dt><dd>{selected.profile.used_volume != null ? `${(selected.profile.used_volume / 1024).toFixed(2)} GB` : 'Not available'}</dd></div>
                <div><dt>Purchased</dt><dd>{date(selected.created_at)}</dd></div>
                <div><dt>Profile expiry</dt><dd>{date(selected.profile.expired_time)}</dd></div>
                <div><dt>Plan validity</dt><dd>{selected.profile.validity_days ? `${selected.profile.validity_days} days` : 'Not specified'}</dd></div>
                <div><dt>Location</dt><dd>{selected.profile.location_name || selected.country || 'Not available'}</dd></div>
              </dl>
              {!selected.profile.expired_time && selected.profile.validity_days && <p className="proxy-note">Validity begins when the eSIM is activated. An expiry date has not been reported yet.</p>}
              {selected.profile.iccid && <CopyField label="ICCID" value={selected.profile.iccid} copy={copy} />}
              {selected.profile.phone_number && <CopyField label="Phone number" value={selected.profile.phone_number} copy={copy} />}
              <Link className="proxy-help" to="/dashboard/support">Need help with this service? <ArrowUpRight size={13} /></Link>
            </>}
            {panel === 'activation' && <>
              {qrValue(selected.profile) ? <div className="esim-install-qr"><QRCodeSVG value={qrValue(selected.profile)!} size={220} marginSize={4} aria-label="eSIM installation QR code" /></div> : (selected.profile.qr_code_url || selected.profile.qr_code) && !qrFailed ? <div className="esim-install-qr"><img src={selected.profile.qr_code_url || selected.profile.qr_code} alt="eSIM installation QR code" onError={() => setQrFailed(true)} /></div> : <p className="proxy-note">{qrFailed ? 'The QR image could not be loaded. Use the activation details below or contact support.' : 'An installation QR code is not available yet.'}</p>}
              {activationCode(selected.profile) && <CopyField label="Activation code" value={activationCode(selected.profile)} copy={copy} />}
              {selected.profile.iccid && <CopyField label="ICCID" value={selected.profile.iccid} copy={copy} />}
              {(['pin1', 'puk1', 'pin2', 'puk2', 'zip_code'] as const).map(key => selected.profile[key] ? <CopyField key={key} label={key === 'zip_code' ? 'ZIP code' : key.toUpperCase()} value={selected.profile[key]!} copy={copy} /> : null)}
              <p className="proxy-note">On your device, open cellular or mobile settings, choose Add eSIM, and scan the QR code. Follow the device’s prompts to finish installation.</p>
            </>}
            {panel === 'subscription' && <><div className="proxy-renewal"><div><h3>Automatic renewal</h3><p className="proxy-note">{selected.auto_renew ? 'On' : 'Off'} · Paid from your wallet</p></div><span className="overview-status">{selected.auto_renew ? 'Enabled' : 'Disabled'}</span></div><p className="proxy-note">This setting applies to the whole order, including any other profiles in it. When enabled, renewal charges are taken from your wallet at the end of the service term. Keep enough balance available to avoid interruption.</p><p className="proxy-note">Profile expiry: {date(selected.profile.expired_time)}</p><button className={selected.auto_renew ? 'proxy-secondary' : 'proxy-primary'} onClick={() => change(() => api.post(`/web/api/orders/${selected.orderId}/update_subscription`, { auto_renew: !selected.auto_renew, renewal_method: 'wallet' }), 'Renewal settings updated')}>{selected.auto_renew ? 'Turn off auto-renew' : 'Enable wallet auto-renew'}</button></>}
            {panel === 'reorder' && <><p className="proxy-note">This creates a new order for the same product using its current price. If your wallet has enough balance, payment and provisioning start automatically.</p><p className="proxy-note">To review available plans and prices first, <Link to="/dashboard/esim">browse eSIM plans</Link>.</p><button className="proxy-primary" onClick={() => change(async () => { const response = await api.post(`/web/api/orders/${selected.orderId}/reorder`); if (response.status === 202) toast.info('Order created. Top up your wallet to complete payment.'); }, 'New order created', true)}>Confirm reorder</button></>}
          </fieldset>
          {busy && <p className="proxy-note" role="status">Please wait…</p>}
        </>}
      </DialogContent>
    </Dialog>
    {topup && <EsimTopupDialog key={topup.orderId} orderId={String(topup.orderId)} lineName={topup.product_name} contentClassName={`proxy-dialog esim-topup ${dark ? 'proxy-dialog-dark' : ''}`} open onOpenChange={value => { if (!value) setTopup(null); }} />}
  </div>;
}

function CopyField({ label, value, copy }: { label: string; value: string; copy: (value: string) => Promise<void> }) {
  return <div className="proxy-secret"><span>{label}</span><div><code>{value}</code><button aria-label={`Copy ${label}`} onClick={() => copy(value)}><Copy size={15} /></button></div></div>;
}
