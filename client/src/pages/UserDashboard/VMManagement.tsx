import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, Eye, EyeOff, Server, Monitor, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api, { fetchVms, fetchVmStatus, startVm, stopVm, rebootVm, deleteVm, changeVmPassword } from '@/services/api';
import './dashboard-home.css';
// Shared service cards and dialogs match Proxy Management.
import './proxy-management.css';

interface Instance {
  id: string | number;
  order_id?: string | number;
  hostname?: string;
  plan_name?: string;
  vm_id?: number;
  status: string;
  os_template?: string;
  cpu_cores?: number;
  ram_gb?: number;
  storage_gb?: number;
  ip_address?: string;
  dns_name?: string;
  connection_host?: string;
  ssh_port?: number;
  rdp_port?: number;
  ssh_username?: string;
  rdp_username?: string;
  username?: string;
  root_password?: string;
  rdp_password?: string;
  auto_renew?: boolean;
  created_at?: string;
  expires_at?: string;
}
interface LiveStatus { status: string; resource_usage?: { cpu_percent?: number; ram_percent?: number; disk_percent?: number } | null }
type Panel = 'details' | 'credentials' | 'subscription' | 'password' | 'start' | 'stop' | 'reboot' | 'delete';
const titles: Record<Panel, string> = { details: 'Server details', credentials: 'Connection details', subscription: 'Renewal settings', password: 'Change server password', start: 'Start server', stop: 'Stop server', reboot: 'Restart server', delete: 'Delete server' };
const name = (vm: Instance) => vm.hostname || vm.plan_name || 'Server instance';
const windows = (vm: Instance) => /windows|rdp/i.test(vm.os_template || '') || Boolean(vm.rdp_port && !vm.ssh_port);
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available';
const errorMessage = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'The change couldn’t be completed. Please try again.';
const quantity = (value: number | undefined, unit: string) => value == null ? 'Not available' : `${value} ${unit}`;
const percent = (value?: number) => value != null && Number.isFinite(value) ? `${value.toFixed(1)}%` : 'Not available';

export default function VMManagement({ serviceType }: { serviceType: 'vps' | 'rdp' }) {
  const label = serviceType.toUpperCase();
  const Icon = serviceType === 'rdp' ? Monitor : Server;
  const dark = useThemeStore(state => state.dark);
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryKey = [`${serviceType}-management`, user?.id];
  const [search, setSearch] = useState('');
  const [os, setOs] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [panel, setPanel] = useState<Panel>('details');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const query = useQuery<Instance[]>({
    queryKey,
    enabled: Boolean(user?.id && accessToken),
    retry: false,
    cacheTime: 0,
    queryFn: async () => (await fetchVms({ vm_type: serviceType })).data.vms,
  });
  useEffect(() => { setSearch(new URLSearchParams(location.search).get('search') || ''); setPage(1); }, [location.search]);
  const orders = query.data || [];
  const selected = orders.find(order => order.id === selectedId);
  const live = useQuery<LiveStatus>({
    queryKey: [`${serviceType}-status`, user?.id, selectedId],
    enabled: Boolean(selected && accessToken && !['terminated', 'failed'].includes(selected.status)),
    queryFn: async () => (await fetchVmStatus(selectedId!)).data,
    retry: false,
    cacheTime: 0,
    refetchInterval: selected ? 15_000 : false,
  });
  const currentStatus = live.data?.status || selected?.status;
  const controllable = Boolean(selected && !['expired', 'suspended', 'terminated', 'failed'].includes(selected.status)) && !live.isError && !live.isFetching && Boolean(live.data) && ['running', 'stopped'].includes(currentStatus || '');
  const host = selected?.connection_host || selected?.dns_name || selected?.ip_address;
  const usesRdp = serviceType === 'rdp' || Boolean(selected && windows(selected));
  const savedPassword = usesRdp ? selected?.rdp_password || selected?.root_password : selected?.root_password;
  const username = selected && (usesRdp ? selected.rdp_username || selected.username : selected.ssh_username || selected.username);
  const port = selected && (usesRdp ? selected.rdp_port : selected.ssh_port);

  const filtered = orders.filter(order => (!os || order.os_template === os)
    && (!status || order.status === status)
    && [order.hostname, order.plan_name, order.ip_address, order.dns_name, order.connection_host, order.rdp_username, order.ssh_username, order.username, String(order.vm_id || '')].some(value => value?.toLowerCase().includes(search.toLowerCase().trim())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 9));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * 9, currentPage * 9);
  function open(order: Instance, next: Panel) {
    setSelectedId(order.id); setPanel(next); setActionError(''); setVisiblePassword(false); setPassword(''); setConfirmation('');
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
      if (!close) await live.refetch();
      setPassword('');
      queryClient.invalidateQueries(['my-services']);
    } catch (error) { setActionError(errorMessage(error)); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <div className={`dashboard-overview proxy-management ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>{label} Management | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/products"><ArrowLeft size={14} /> My services</Link>
    <header className="overview-heading"><div><h1>{label} management</h1><p>{serviceType === 'rdp' ? 'Manage your remote desktops, access details, and renewals.' : 'Manage your servers, access details, and renewals.'}</p></div><div className="overview-heading-actions"><Link className="overview-button" to={`/dashboard/${serviceType}`}>Browse {label} plans <ArrowUpRight size={14} /></Link><button className="overview-icon-button" aria-label={`Refresh ${label} services`} disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your {label} services</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your {label} services.</strong><p>{query.data ? 'Showing the last loaded details. Refresh before making changes.' : 'Try again to load your services.'}</p></div><button onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div>}
      <div className="proxy-summary"><span><strong>{query.data ? orders.length : '—'}</strong> Total services</span><span><strong>{query.data ? orders.filter(order => ['active', 'running'].includes(order.status)).length : '—'}</strong> Active</span><span><strong>{query.data ? orders.filter(order => order.auto_renew).length : '—'}</strong> Auto-renew on</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search {label} services</span><input value={search} placeholder="Search hostname, IP, username, or VM ID" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><div><label htmlFor="vm-os">Operating system</label><PurchaseSelect id="vm-os" value={os} onValueChange={value => { setOs(value); setPage(1); }} emptyLabel="All systems" options={[...new Set(orders.map(order => order.os_template).filter((value): value is string => Boolean(value)))].map(value => ({ value, label: value }))} /></div><div><label htmlFor="vm-status">Status</label><PurchaseSelect id="vm-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All statuses" options={[...new Set(orders.map(order => order.status))].map(value => ({ value, label: value }))} /></div></div>
      {query.isFetching && <p className="proxy-note" role="status">{query.isLoading ? `Loading ${label} services…` : `Updating ${label} details…`}</p>}
      {!query.isLoading && query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'service' : 'services'}</p>{(search || os || status) && <button onClick={() => { setSearch(''); setOs(''); setStatus(''); setPage(1); }}>Clear filters</button>}</div>
        {shown.length ? <div className="proxy-grid">{shown.map(order => <article className="proxy-service" key={order.id}>
          <div className="proxy-service-top"><span><Icon size={16} />{label}</span><span className="overview-status" data-status={order.status === 'running' ? 'active' : order.status}>{order.status}</span></div>
          <h2>{name(order)}</h2><p className="proxy-order">{order.plan_name || `${label} hosting`}{order.vm_id ? ` · VM ${order.vm_id}` : ''}</p>
          <dl className="proxy-facts"><div><dt>CPU</dt><dd>{quantity(order.cpu_cores, 'vCPU')}</dd></div><div><dt>Memory</dt><dd>{quantity(order.ram_gb, 'GB')}</dd></div><div><dt>Storage</dt><dd>{quantity(order.storage_gb, 'GB')}</dd></div><div><dt>Expires</dt><dd>{date(order.expires_at)}</dd></div></dl>
          <p className="proxy-usage">{order.os_template || 'Operating system not available'}</p>
          <div className="proxy-card-actions"><button onClick={() => open(order, 'details')}>Manage server <ArrowUpRight size={13} /></button>{!['terminated', 'failed'].includes(order.status) && <button onClick={() => open(order, 'credentials')}>Connection details</button>}</div>
        </article>)}</div> : <div className="proxy-empty"><Icon size={25} /><h2>{orders.length ? `No matching ${label} services` : `No ${label} services yet`}</h2><p>{orders.length ? 'Try a different search or clear your filters.' : 'Your provisioned servers and connection details will appear here.'}</p>{!orders.length && <Link className="overview-button" to={`/dashboard/${serviceType}`}>Browse {label} plans <ArrowUpRight size={14} /></Link>}</div>}
        {pageCount > 1 && <nav className="proxy-pagination" aria-label={`${label} pages`}><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !busy) setSelectedId(null); }}>
      <DialogContent className={`proxy-dialog ${dark ? 'proxy-dialog-dark' : ''}`} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
        <DialogTitle>{titles[panel]}</DialogTitle><DialogDescription>{selected ? name(selected) : ''}</DialogDescription>
        {selected && <>
          <div className="proxy-dialog-nav">{(['details', ...(!['terminated', 'failed'].includes(selected.status) ? ['credentials'] : []), ...(selected.order_id && !['terminated', 'failed', 'expired'].includes(selected.status) ? ['subscription'] : [])] as Panel[]).map(next => <button key={next} disabled={busy} aria-pressed={panel === next} onClick={() => { setPanel(next); setActionError(''); setPassword(''); setConfirmation(''); }}>{next === 'credentials' ? 'Connection' : next === 'subscription' ? 'Renewal' : 'Details'}</button>)}</div>
          {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
          {query.isError && <p className="proxy-action-error" role="alert">Refresh the server list before making changes.</p>}
          {live.isError && <div className="proxy-action-error" role="alert">Live status is unavailable. Server controls are paused. <button onClick={() => live.refetch()}>Retry status</button></div>}
          <fieldset disabled={busy || query.isError} className="proxy-panel">
            {panel === 'details' && <>
              <dl className="proxy-facts"><div><dt>Status</dt><dd>{currentStatus}</dd></div><div><dt>Operating system</dt><dd>{selected.os_template || 'Not available'}</dd></div><div><dt>CPU</dt><dd>{quantity(selected.cpu_cores, 'vCPU')}</dd></div><div><dt>Memory</dt><dd>{quantity(selected.ram_gb, 'GB')}</dd></div><div><dt>Storage</dt><dd>{quantity(selected.storage_gb, 'GB')}</dd></div><div><dt>Expires</dt><dd>{date(selected.expires_at)}</dd></div><div><dt>Created</dt><dd>{date(selected.created_at)}</dd></div><div><dt>Plan</dt><dd>{selected.plan_name || 'Not available'}</dd></div></dl>
              <div><h3>Live resource usage</h3><p className="proxy-note">{live.isFetching ? 'Refreshing status…' : 'Updates every 15 seconds while this dialog is open.'}</p><dl className="proxy-facts"><div><dt>CPU usage</dt><dd>{percent(live.data?.resource_usage?.cpu_percent)}</dd></div><div><dt>Memory usage</dt><dd>{percent(live.data?.resource_usage?.ram_percent)}</dd></div><div><dt>Disk usage</dt><dd>{percent(live.data?.resource_usage?.disk_percent)}</dd></div></dl></div>
              <div className="proxy-card-actions"><button disabled={!controllable || currentStatus !== 'stopped'} onClick={() => setPanel('start')}>Start server</button><button disabled={!controllable || currentStatus !== 'running'} onClick={() => setPanel('stop')}>Stop server</button><button disabled={!controllable || currentStatus !== 'running'} onClick={() => setPanel('reboot')}>Restart server</button><button disabled={!controllable} onClick={() => setPanel('delete')}>Delete server</button></div>
              <Link className="proxy-help" to="/dashboard/support">Get help with this server <ArrowUpRight size={13} /></Link>
            </>}
            {panel === 'credentials' && <>
              <CopyField label={usesRdp ? 'Remote desktop host' : 'SSH host'} value={host} copy={copy} />
              <CopyField label={usesRdp ? 'RDP port' : 'SSH port'} value={port ? String(port) : undefined} copy={copy} />
              <CopyField label="Username" value={username || undefined} copy={copy} />
              <div className="proxy-secret"><span>Password</span><div><code>{savedPassword ? visiblePassword ? savedPassword : '••••••••••••' : 'Not available yet'}</code>{savedPassword && <><button aria-label={visiblePassword ? 'Hide password' : 'Show password'} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button aria-label="Copy password" onClick={() => copy(savedPassword!)}><Copy size={15} /></button></>}</div></div>
              {!usesRdp && host && username && port && <CopyField label="SSH command" value={`ssh -p ${port} ${username}@${host}`} copy={copy} />}
              {usesRdp && host && port && <CopyField label="Remote desktop address" value={`${host.includes(':') && !host.startsWith('[') ? `[${host}]` : host}:${port}`} copy={copy} />}
              {usesRdp && <p className="proxy-note">Use the host and RDP port in your remote desktop client, then sign in with the credentials above.</p>}
              <button className="proxy-secondary" disabled={!controllable || currentStatus !== 'running'} onClick={() => setPanel('password')}>Change password</button>
            </>}
            {panel === 'password' && <form onSubmit={event => { event.preventDefault(); if (controllable && currentStatus === 'running' && password && password === confirmation) change(() => changeVmPassword(selected.id, password), 'Server password updated', true); }}>
              <p className="proxy-note">The server must be running. Update saved connection credentials after changing this password.</p>
              <label htmlFor="vm-password">New password</label><input id="vm-password" type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} />
              <label htmlFor="vm-confirm-password">Confirm password</label><input id="vm-confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
              {confirmation && confirmation !== password && <p className="proxy-note">Passwords do not match.</p>}
              <button type="submit" className="proxy-primary" disabled={!controllable || currentStatus !== 'running' || !password.trim() || password !== confirmation}>Update password</button>
            </form>}
            {panel === 'subscription' && <><h3>Automatic renewal</h3><p className="proxy-note">{selected.auto_renew ? 'On' : 'Off'} · Paid from your wallet. When enabled, renewal charges are taken at the end of the service term. Keep enough balance available to avoid interruption.</p><p className="proxy-note">Current expiry: {date(selected.expires_at)}</p><button className="proxy-primary" onClick={() => change(() => api.post(`/web/api/orders/${selected.order_id}/update_subscription`, { auto_renew: !selected.auto_renew, renewal_method: 'wallet' }), 'Renewal settings updated')}>{selected.auto_renew ? 'Turn off auto-renew' : 'Enable wallet auto-renew'}</button></>}
            {(['start', 'stop', 'reboot', 'delete'] as Panel[]).includes(panel) && <>
              <p className="proxy-note">{panel === 'delete' ? 'This permanently deletes the server and its data. Make sure you have saved anything you need.' : panel === 'stop' ? 'Stopping this server interrupts active connections and applications. Save your work before continuing.' : panel === 'reboot' ? 'Restarting interrupts active connections while the server reboots.' : 'Start this server to make its applications and connections available.'}</p>
              {panel === 'delete' && <><label htmlFor="vm-delete-confirm">Type {name(selected)} to confirm deletion</label><input id="vm-delete-confirm" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" /></>}
              <button className="proxy-primary" disabled={!controllable || (panel === 'delete' ? confirmation !== name(selected) : panel === 'start' ? currentStatus !== 'stopped' : currentStatus !== 'running')} onClick={() => { const action = panel as 'start' | 'stop' | 'reboot' | 'delete'; const operations = { start: startVm, stop: stopVm, reboot: rebootVm, delete: deleteVm }; change(() => operations[action](selected.id), `${titles[action]} requested. Refresh to check progress.`, true); }}>Confirm {panel === 'reboot' ? 'restart' : panel}</button>
            </>}
          </fieldset>
          {busy && <p className="proxy-note" role="status">Please wait…</p>}
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}

function CopyField({ label, value, copy }: { label: string; value?: string; copy: (value: string) => Promise<void> }) {
  return <div className="proxy-secret"><span>{label}</span><div><code>{value || 'Not available yet'}</code>{value && <button aria-label={`Copy ${label}`} onClick={() => copy(value)}><Copy size={15} /></button>}</div></div>;
}
