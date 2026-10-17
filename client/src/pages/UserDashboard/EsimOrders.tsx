import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, RefreshCw, Search, ClipboardList } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { countryName } from '@/hooks/useESIMPackages';
import EsimTopupDialog from './EsimTopupDialog';
import './esim-management.css';
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

interface EsimOrder {
  id: string | number;
  order_number: string;
  product_name: string;
  status: string;
  total_amount?: number | string | null;
  amount?: number | string | null;
  currency?: string;
  payment_method?: string;
  created_at: string;
  currency_code?: string;
  country?: string;
  product_type?: string;
  package_name?: string;
  quantity?: number;
  has_invoice?: boolean;
  review_pending?: boolean;
  topup_eligible?: boolean;
  reorderable?: boolean;
  metadata?: { meisim_line?: string };
  profiles?: EsimProfile[];
  credentials_list?: EsimProfile[];
  credentials?: EsimProfile;
}
interface EsimProfile {
  id?: string | number;
  iccid?: string;
  phone_number?: string;
  activation_code?: string;
  qr_activation_code?: string;
  qr_code_data?: string;
  qr_code_url?: string;
  qr_code?: string;
  install_links?: { ios?: string; android?: string };
  pin1?: string;
  puk1?: string;
  total_volume?: number;
  data_label?: string;
  location_name?: string;
  expired_time?: string;
  validity_days?: number;
  status?: string;
}
const profiles = (order: EsimOrder) => order.profiles?.length ? order.profiles : order.credentials_list?.length ? order.credentials_list : order.credentials ? [order.credentials] : [];
const planName = (order: EsimOrder) => order.package_name || order.product_name || 'eSIM plan';
const category = (order: EsimOrder) => order.product_type === 'usa_esim' || ['us_prepaid', 'uk_prepaid'].includes(order.metadata?.meisim_line || '') ? 'phone' : 'data';
const categoryLabel = (order: EsimOrder) => category(order) === 'phone' ? 'Phone-number eSIM' : 'Data eSIM';
const profileLocation = (value?: string) => !value ? 'Not specified' : /^[a-z]{2}$/i.test(value) ? countryName(value.toUpperCase()) : value;
const allowance = (profile: EsimProfile) => profile.data_label || (Number(profile.total_volume) > 0 ? `${Number(profile.total_volume) / 1024} GB` : 'Not specified');
const activationCode = (profile: EsimProfile) => profile.activation_code || profile.qr_activation_code || (profile.qr_code_data?.startsWith('LPA:') ? profile.qr_code_data : '') || '';
const expiry = (profile: EsimProfile) => profile.expired_time ? date(profile.expired_time) : profile.validity_days ? `Valid ${profile.validity_days} days from activation` : 'Not available';

const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const label = (value?: string) => value ? value.replace(/[-_]/g, ' ').replace(/\bisp\b/gi, 'ISP') : 'Not specified';
function amount(order: EsimOrder) {
  const value = order.total_amount ?? order.amount;
  if (value == null || value === '' || !Number.isFinite(Number(value))) return 'Not available';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || order.currency_code || 'USD' }).format(Number(value)); }
  catch { return `${order.currency || order.currency_code || 'USD'} ${Number(value).toFixed(2)}`; }
}
const active = (order: EsimOrder) => ['active', 'completed', 'allocated', 'delivered'].includes(order.status);
const canInstall = (order: EsimOrder) => active(order) && !order.review_pending;
const managePath = (order: EsimOrder) => `/dashboard/Esim-management?search=${encodeURIComponent(order.order_number)}`;

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try { anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); }
  finally { anchor.remove(); URL.revokeObjectURL(url); }
}

export default function EsimOrders() {
  const dark = useThemeStore(state => state.dark);
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const [type, setType] = useState('');
  const [topup, setTopup] = useState<EsimOrder | null>(null);
  const [confirmReorder, setConfirmReorder] = useState(false);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const query = useQuery<EsimOrder[]>({
    queryKey: ['esim-order-history', user?.id],
    enabled: Boolean(accessToken && user?.id), retry: false, cacheTime: 0,
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
  const orders = query.data || [];
  const selected = orders.find(order => order.id === selectedId);
  const filtered = orders.filter(order => (!type || category(order) === type) && (!status || order.status === status)
    && [order.order_number, planName(order), order.country, ...profiles(order).flatMap(profile => [profile.iccid, profile.phone_number, profile.location_name])].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  function open(order: EsimOrder) { setSelectedId(order.id); setConfirmReorder(false); setActionError(''); }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Copied to clipboard'); }
    catch { toast.error('Couldn’t copy. Select the text and copy it manually.'); }
  }
  async function download(order: EsimOrder, kind: 'invoice' | 'details') {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setActionError('');
    try {
      if (kind === 'invoice') {
        const { data } = await api.get(`/web/api/orders/${order.id}/download_invoice`, { responseType: 'blob' });
        saveFile(data, `invoice-${order.order_number}.pdf`);
      } else {
        const content = [
          `Order: ${order.order_number}`, `Plan: ${planName(order)}`, `Status: ${order.status}`, `Order amount: ${amount(order)}`,
          ...profiles(order).map(profile => [
            '', `ICCID: ${profile.iccid || 'Not available'}`, `Phone number: ${profile.phone_number || 'Not available'}`,
            `Location: ${profileLocation(profile.location_name)}`, `Data allowance: ${allowance(profile)}`, `Expiry: ${expiry(profile)}`,
            `Activation code: ${activationCode(profile) || 'Not available'}`, `PIN: ${profile.pin1 || 'Not available'}`, `PUK: ${profile.puk1 || 'Not available'}`,
          ].join('\n')),
        ].join('\n');
        saveFile(new Blob([content], { type: 'text/plain;charset=utf-8' }), `esim-order-${order.order_number}.txt`);
      }
      toast.success(`${kind === 'invoice' ? 'Invoice' : 'Installation details'} downloaded`);
    } catch { setActionError(`Couldn’t download ${kind === 'invoice' ? 'the invoice' : 'the installation details'}. Please try again.`); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function reorder(order: EsimOrder) {
    if (busyRef.current || query.isError || !order.reorderable || order.review_pending) return;
    busyRef.current = true; setBusy(true); setActionError('');
    try {
      const response = await api.post(`/web/api/orders/${order.id}/reorder`);
      toast.success(response.status === 202 ? 'Order created. Top up your wallet to complete payment.' : 'New order created');
      setSelectedId(null); setConfirmReorder(false);
      await query.refetch();
      queryClient.invalidateQueries(['my-services']);
    } catch (error) {
      setActionError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Couldn’t reorder this eSIM. Please try again.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  return <div className={`dashboard-overview proxy-management proxy-orders ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>eSIM Orders | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/orders"><ArrowLeft size={14} /> All orders</Link>
    <header className="overview-heading"><div><h1>eSIM orders</h1><p>Review purchases, order details, and invoices.</p></div><div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/esim">Browse eSIM plans <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label="Refresh eSIM orders" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your orders</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your eSIM orders.</strong><p>{query.data ? 'Showing the last loaded orders.' : 'Try again to load your order history.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? orders.length : '—'}</strong> Orders</span><span><strong>{query.data ? orders.filter(active).length : '—'}</strong> Fulfilled orders</span><span><strong>{query.data ? orders.filter(order => ['pending', 'processing', 'provisioning', 'awaiting_payment'].includes(order.status)).length : '—'}</strong> Pending / processing</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search eSIM orders</span><input placeholder="Search order, plan, ICCID, or phone" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="esim-order-type">Service type</label><PurchaseSelect id="esim-order-type" value={type} onValueChange={value => { setType(value); setPage(1); }} emptyLabel="All eSIMs" options={[{ value: 'data', label: 'Data eSIM' }, { value: 'phone', label: 'Phone-number eSIM' }]} /></div><div><label htmlFor="esim-order-status">Order status</label><PurchaseSelect id="esim-order-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[...new Set(orders.map(order => order.status))].map(value => ({ value, label: label(value) }))} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? 'Loading orders…' : 'Updating orders…'}</p>}
      {query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'order' : 'orders'}</p>{(search || type || status) && <button onClick={() => { setSearch(''); setType(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <section className="orders-history"><div className="orders-table-scroll" tabIndex={0} role="region" aria-label="eSIM order history"><table><caption className="sr-only">eSIM purchases, newest first</caption><thead><tr>{['Order', 'Plan', 'Date', 'Status', 'Order amount', ''].map((heading, index) => <th key={index} scope="col">{heading || <span className="sr-only">Actions</span>}</th>)}</tr></thead><tbody>{shown.map(order => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td><strong>{planName(order)}</strong><span>{categoryLabel(order)}</span></td><td>{date(order.created_at)}</td><td><span className="overview-status" data-status={order.status}>{label(order.status)}</span></td><td>{amount(order)}</td><td><button className="history-details" aria-label={`View order ${order.order_number}`} onClick={() => open(order)}>View details <ArrowUpRight size={13} /></button></td></tr>)}</tbody></table></div></section> : <div className="proxy-empty"><ClipboardList size={25} /><h2>{orders.length ? 'No matching orders' : 'No eSIM orders yet'}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your eSIM purchases will appear here.'}</p>{!orders.length && <Link className="overview-button" to="/dashboard/esim">Browse eSIM plans</Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label="Order pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`}>
        <DialogTitle>{confirmReorder ? 'Reorder eSIM' : 'eSIM order details'}</DialogTitle>
        <DialogDescription>{selected?.order_number} · {selected && planName(selected)}</DialogDescription>
        {selected && <>
          {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
          {confirmReorder ? <div className="proxy-panel">
            <p className="proxy-note">This creates a new order for the same plan at its current price. If your wallet has enough balance, payment and provisioning start automatically.</p>
            <p className="proxy-note">To check current prices first, <Link to="/dashboard/esim">browse eSIM plans</Link>.</p>
            {query.isError && <p className="proxy-action-error" role="alert">Refresh your orders before reordering.</p>}
            <div className="history-dialog-actions"><button className="proxy-secondary" disabled={busy} onClick={() => { setConfirmReorder(false); setActionError(''); }}>Back to details</button><button className="proxy-primary" disabled={busy || query.isError} onClick={() => reorder(selected)}>Confirm reorder</button></div>
          </div> : <>
            <dl className="proxy-facts">
              <div><dt>Order status</dt><dd>{label(selected.status)}</dd></div>
              <div><dt>Order amount</dt><dd>{amount(selected)}</dd></div>
              <div><dt>Payment method</dt><dd>{label(selected.payment_method)}</dd></div>
              <div><dt>Purchased</dt><dd>{date(selected.created_at)}</dd></div>
              <div><dt>Service type</dt><dd>{categoryLabel(selected)}</dd></div>
              <div><dt>Profiles available</dt><dd>{profiles(selected).length}</dd></div>
            </dl>
            {selected.review_pending ? <p className="proxy-note" role="status">We're confirming your eSIM with the carrier. Support will follow up shortly.</p> : profiles(selected).length ? profiles(selected).map((profile, index) => <ProfileDetails key={`${selected.id}-${profile.id ?? index}`} profile={profile} install={canInstall(selected)} copy={copy} />) : <p className="proxy-note">No profiles are available yet. Check service management or contact support for an update.</p>}
            <div className="history-dialog-actions">
              {selected.has_invoice && <button className="proxy-secondary" disabled={busy} onClick={() => download(selected, 'invoice')}>Download invoice</button>}
              {canInstall(selected) && profiles(selected).length > 0 && <button className="proxy-secondary" disabled={busy} onClick={() => download(selected, 'details')}>Download installation details</button>}
              {selected.topup_eligible && !selected.review_pending && <button className="proxy-primary" disabled={busy || query.isError} onClick={() => { setTopup(selected); setSelectedId(null); }}>Top up line</button>}
              {selected.reorderable && !selected.topup_eligible && !selected.review_pending && <button className="proxy-primary" disabled={busy || query.isError} onClick={() => { setConfirmReorder(true); setActionError(''); }}>Reorder</button>}
            </div>
          </>}
          {busy && <p className="proxy-note" role="status">Please wait…</p>}
          <div className="proxy-card-actions"><Link to={managePath(selected)}>Manage service <ArrowUpRight size={13} /></Link><Link to={`/dashboard/support?tab=tickets&order_id=${encodeURIComponent(selected.order_number)}`}>Get order support <ArrowUpRight size={13} /></Link></div>
        </>}
      </DialogContent>
    </Dialog>
    {topup && <EsimTopupDialog key={topup.id} orderId={String(topup.id)} lineName={planName(topup)} contentClassName={`proxy-dialog esim-topup ${dark ? 'proxy-dialog-dark' : ''}`} open onOpenChange={value => { if (!value) setTopup(null); }} />}
  </div>;
}

function CopyField({ label, value, copy }: { label: string; value: string; copy: (value: string) => Promise<void> }) {
  return <div className="proxy-secret"><span>{label}</span><div><code>{value}</code><button aria-label={`Copy ${label}`} onClick={() => copy(value)}><Copy size={15} /></button></div></div>;
}

function ProfileDetails({ profile, install, copy }: { profile: EsimProfile; install: boolean; copy: (value: string) => Promise<void> }) {
  const [qrFailed, setQrFailed] = useState(false);
  const qrValue = [activationCode(profile), profile.qr_code_data].find(value => value?.startsWith('LPA:'));
  const qrImage = profile.qr_code_url || profile.qr_code;
  return <section className="proxy-panel">
    <h3>{profile.iccid ? `ICCID ${profile.iccid}` : 'eSIM profile'}</h3>
    <dl className="proxy-facts">
      <div><dt>Location</dt><dd>{profileLocation(profile.location_name)}</dd></div>
      <div><dt>Data allowance</dt><dd>{allowance(profile)}</dd></div>
      <div><dt>Profile expiry</dt><dd>{expiry(profile)}</dd></div>
      <div><dt>Profile status</dt><dd>{label(profile.status)}</dd></div>
    </dl>
    {profile.phone_number && <CopyField label="Phone number" value={profile.phone_number} copy={copy} />}
    {install && <>
      {qrValue ? <div className="esim-install-qr"><QRCodeSVG value={qrValue} size={220} marginSize={4} aria-label="eSIM installation QR code" /></div> : qrImage && !qrFailed ? <div className="esim-install-qr"><img src={qrImage} alt="eSIM installation QR code" onError={() => setQrFailed(true)} /></div> : <p className="proxy-note">{qrFailed ? 'The QR image could not be loaded. Use the activation details below or contact support.' : 'An installation QR code is not available yet.'}</p>}
      <div className="proxy-card-actions">
        {profile.install_links?.ios && <a href={profile.install_links.ios} target="_blank" rel="noopener noreferrer">Install on iPhone <ArrowUpRight size={13} /></a>}
        {profile.install_links?.android && <a href={profile.install_links.android} target="_blank" rel="noopener noreferrer">Install on Android <ArrowUpRight size={13} /></a>}
      </div>
      {activationCode(profile) && <CopyField label="Activation code" value={activationCode(profile)} copy={copy} />}
      {profile.pin1 && <CopyField label="PIN" value={profile.pin1} copy={copy} />}
      {profile.puk1 && <CopyField label="PUK" value={profile.puk1} copy={copy} />}
      <p className="proxy-note">In your device’s cellular or mobile settings, choose Add eSIM and follow the prompts to scan the QR code or enter the activation details.</p>
    </>}
  </section>;
}
