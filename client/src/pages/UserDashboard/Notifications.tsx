import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Bell, ArrowUpRight, RefreshCw, Search, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getNotifications, markAsRead, markAllAsRead } from '@/services/notificationService';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import './dashboard-home.css';
import './proxy-management.css';
import './notifications.css';

interface Notice {
  id: number;
  title: string;
  message: string;
  category: string;
  created_at: string;
  read_at: string | null;
  metadata?: Record<string, unknown>;
}
const categories: Record<string, string> = { info: 'Information', warning: 'Warning', error: 'Error', success: 'Success', system_alert: 'System alert' };
const date = (value: string) => Number.isNaN(Date.parse(value)) ? 'Date unavailable' : new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
function destination(notice: Notice): string | null {
  const meta = notice.metadata || {};
  for (const value of [meta.link, meta.url]) {
    if (typeof value !== 'string') continue;
    if (/^\/(?!\/)/.test(value) && !value.includes('\\')) return value;
    try { const url = new URL(value); if (['https:', 'http:'].includes(url.protocol)) return url.href; } catch { /* Fall back to the notification subject. */ }
  }
  const subject = `${notice.category} ${notice.title} ${notice.message}`.toLowerCase();
  const search = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? `?search=${encodeURIComponent(String(value))}` : '';
  if (/ticket/.test(subject)) return '/dashboard/support?tab=tickets';
  if (/support/.test(subject)) return '/dashboard/support?tab=chat';
  if (/transaction|payment|deposit|refund|billing/.test(subject)) return '/dashboard/transactions';
  if (/\brdp\b/.test(subject)) return `/dashboard/RDP-management${search(meta.hostname || meta.rdp_host)}`;
  if (/\b(vps|vm)\b/.test(subject)) return `/dashboard/VPS-management${search(meta.hostname || meta.vps_host)}`;
  if (/esim/.test(subject)) return `/dashboard/Esim-management${search(meta.iccid || meta.order_number || meta.order_no)}`;
  if (/proxy|proxies/.test(subject)) return `/dashboard/proxy-management${search(meta.order_number || meta.order_no)}`;
  if (/\bvpn\b/.test(subject)) return `/dashboard/vpn-management${search(meta.order_number || meta.order_no)}`;
  if (/order/.test(subject)) return '/dashboard/orders';
  return null;
}

export default function Notifications() {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const soundEnabled = useNotificationStore(state => state.soundEnabled);
  const toggleSound = useNotificationStore(state => state.toggleSound);
  const realtime = useNotificationStore(state => state.notifications);
  const previousRealtime = useRef(realtime);
  const client = useQueryClient();
  const key = ['customer-notifications', user?.id];
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const query = useQuery<Notice[]>({
    queryKey: key, enabled: Boolean(user?.id && accessToken), retry: false, cacheTime: 0,
    queryFn: async () => {
      const notices: Notice[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const data = await getNotifications(page);
        notices.push(...data.notifications);
        totalPages = data.meta?.total_pages ?? 1;
        page += 1;
      } while (page <= totalPages);
      return notices;
    },
  });
  useEffect(() => {
    if (previousRealtime.current !== realtime) {
      previousRealtime.current = realtime;
      client.invalidateQueries(['customer-notifications', user?.id]);
    }
  }, [realtime, client, user?.id]);
  const notices = query.data || [];
  const unread = notices.filter(notice => !notice.read_at).length;
  const filtered = notices.filter(notice => (!status || (status === 'read' ? Boolean(notice.read_at) : !notice.read_at)) && (!category || notice.category === category) && `${notice.title} ${notice.message}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pages);
  async function markRead(id?: number) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setActionError('');
    try {
      if (id == null) await markAllAsRead(); else await markAsRead(id);
      const now = new Date().toISOString();
      client.setQueryData<Notice[]>(key, current => current?.map(notice => id == null || notice.id === id ? { ...notice, read_at: notice.read_at || now } : notice));
      useNotificationStore.setState(state => ({ notifications: state.notifications.map(notice => id == null || notice.id === id ? { ...notice, read: true, read_at: notice.read_at || now } : notice) }));
      await useNotificationStore.getState().fetchUnreadCount();
    } catch { setActionError('Couldn’t mark notifications as read. Please try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <div className={`dashboard-overview proxy-management notifications-page ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Notifications | ProxySock</title></Helmet>
    <header className="overview-heading"><div><h1>Notifications</h1><p>Updates about your services, orders, and account.</p></div><div className="overview-heading-actions">
      <button className="overview-button" aria-pressed={soundEnabled} onClick={toggleSound}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}Sound {soundEnabled ? 'on' : 'off'}</button>
      <button className="overview-button" disabled={!unread || busy || !query.data || query.isError} onClick={() => markRead()}>Mark all read</button>
      <button className="overview-icon-button" aria-label="Refresh notifications" disabled={query.isFetching || busy} onClick={() => query.refetch()}><RefreshCw size={15} /></button>
    </div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view notifications</h2><Link to="/login">Back to login</Link></div> : <>
      {query.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your notifications.</strong><p>{query.data ? 'Showing the last loaded notifications.' : 'Try again to load your notifications.'}</p></div><button disabled={query.isFetching} onClick={() => query.refetch()}>Try again</button></div>}
      {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
      <div className="proxy-summary"><span><strong>{query.data ? notices.length : '—'}</strong> Notifications</span><span><strong>{query.data ? unread : '—'}</strong> Unread</span></div>
      <div className="proxy-filters"><label className="proxy-search"><Search size={16} /><span className="sr-only">Search notifications</span><input placeholder="Search notifications" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
        <div><label htmlFor="notification-read-status">Read status</label><PurchaseSelect id="notification-read-status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} emptyLabel="All notifications" options={[{ value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]} /></div>
        <div><label htmlFor="notification-category">Category</label><PurchaseSelect id="notification-category" value={category} onValueChange={value => { setCategory(value); setPage(1); }} emptyLabel="All categories" options={Object.entries(categories).map(([value, label]) => ({ value, label }))} /></div>
      </div>
      {query.isFetching && <p className="proxy-note" role="status">{query.data ? 'Updating notifications…' : 'Loading notifications…'}</p>}
      {query.data && <><div className="proxy-results"><p>{filtered.length} {filtered.length === 1 ? 'notification' : 'notifications'}</p>{(search || status || category) && <button onClick={() => { setSearch(''); setStatus(''); setCategory(''); setPage(1); }}>Clear filters</button>}</div>
        {filtered.length ? <ul className="notification-list">{filtered.slice((currentPage - 1) * 15, currentPage * 15).map(notice => {
          const link = destination(notice);
          return <li key={notice.id} className="notification-row" data-unread={!notice.read_at}>
            <div className="notification-meta"><span>{categories[notice.category] || notice.category}</span><time dateTime={notice.created_at}>{date(notice.created_at)}</time></div>
            <h2>{notice.title}{!notice.read_at && <span className="notification-unread">Unread</span>}</h2><p className="notification-message">{notice.message}</p>
            <div className="notification-actions">{link && (/^https?:/.test(link) ? <a href={link} target="_blank" rel="noopener noreferrer">View details <ArrowUpRight size={13} /></a> : <Link to={link}>View details <ArrowUpRight size={13} /></Link>)}{!notice.read_at && <button disabled={busy} onClick={() => markRead(notice.id)}>Mark as read<span className="sr-only">: {notice.title}</span></button>}</div>
          </li>;
        })}</ul> : <div className="proxy-empty"><Bell size={25} /><h2>{notices.length ? 'No matching notifications' : 'No notifications yet'}</h2><p>{notices.length ? 'Try a different search or clear your filters.' : 'Updates about your account and services will appear here.'}</p></div>}
        {pages > 1 && <nav className="proxy-pagination" aria-label="Notification pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>}
      </>}
    </>}
  </div>;
}
