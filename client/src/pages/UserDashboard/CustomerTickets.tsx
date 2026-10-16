import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import api, { createTicket, replyTicket } from '@/services/api';
import { getCableConsumer } from '@/services/cable';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import './dashboard-home.css';
import './support.css';

interface Ticket { id: number; subject: string; status: string; updated_at: string }
interface Message { id: number; body: string; sender_type: string; created_at: string }
const dateLabel = (date: string) => new Date(date).toLocaleString();
function errorText(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { errors?: Record<string, string[]> | string[]; error?: string } } }).response?.data;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors)) return data.errors.join('. ');
  if (data?.errors) return Object.entries(data.errors).map(([key, values]) => `${key === 'base' ? '' : key.replace(/_/g, ' ') + ' '}${Array.isArray(values) ? values.join(', ') : values}`).join('. ');
  return fallback;
}

function TicketThread({ ticket, onChange }: { ticket: Ticket; onChange: () => void }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = ['ticket-thread', user?.id, ticket.id];
  const { data, isLoading, isError, refetch } = useQuery<{ messages: Message[] }>({ queryKey: key, queryFn: async () => (await api.get(`/web/api/tickets/${ticket.id}`)).data, retry: false });
  useEffect(() => {
    const sub = getCableConsumer().subscriptions.create({ channel: 'TicketChannel', ticket_id: ticket.id }, { received: (event: { action: string }) => { if (event.action === 'ticket_message_created') { void client.invalidateQueries({ queryKey: ['ticket-thread', user?.id, ticket.id] }); onChange(); } } });
    return () => sub.unsubscribe();
  }, [client, user?.id, ticket.id]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError('');
    try { await replyTicket(ticket.id, body.trim()); setBody(''); await refetch(); onChange(); }
    catch (err) { setError(errorText(err, 'Couldn’t send your reply. Please try again.')); }
    finally { setBusy(false); }
  }
  return <><DialogTitle>Ticket #{ticket.id}</DialogTitle><DialogDescription>{ticket.subject}</DialogDescription>
    {isLoading && <p role="status">Loading conversation…</p>}
    {isError && <div role="alert" className="support-load-error">Couldn’t load this conversation. <button onClick={() => refetch()}>Try again</button></div>}
    <div className="support-thread" role="log" aria-label="Ticket conversation">{data?.messages.map(message => <article key={message.id} data-own={['You', 'User', 'Reseller'].includes(message.sender_type)}><header><strong>{['You', 'User', 'Reseller'].includes(message.sender_type) ? 'You' : 'Support'}</strong><time dateTime={message.created_at}>{dateLabel(message.created_at)}</time></header><p>{message.body}</p></article>)}</div>
    <form onSubmit={send} className="support-form"><label htmlFor="ticket-reply">Your reply</label><textarea id="ticket-reply" required value={body} onChange={event => setBody(event.target.value)} disabled={busy} rows={4} />{error && <p role="alert">{error}</p>}<button className="support-primary" disabled={!body.trim() || busy}>{busy ? 'Sending…' : 'Send reply'}</button></form>
  </>;
}

export default function CustomerTickets({ embedded = false }: { embedded?: boolean }) {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const location = useLocation();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [referenceType, setReferenceType] = useState('order');
  const [reference, setReference] = useState('');
  const refresh = () => { void client.invalidateQueries({ queryKey: ['support-tickets', user?.id] }); };
  const { data, isLoading, isFetching, isError, refetch } = useQuery<{ tickets: Ticket[]; meta: { total_pages: number; total_count: number } }>({ queryKey: ['support-tickets', user?.id, page], queryFn: async () => (await api.get(`/web/api/tickets?page=${page}`)).data, enabled: Boolean(user && accessToken), retry: false });
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const order = params.get('order_id'); const deposit = params.get('deposit_id'); const title = params.get('subject');
    if (order || deposit || title) { setSubject(title || `Issue with ${order ? 'order' : 'deposit'} ${order || deposit}`); setReferenceType(order ? 'order' : deposit ? 'deposit' : 'order'); setReference(order || deposit || ''); setBody(order || deposit ? `I need help with my ${order ? 'order' : 'deposit'} ${order || deposit}.` : ''); setCreating(true); }
  }, [location.search]);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      await createTicket({ subject: subject.trim(), body: body.trim(), priority, order_id: referenceType === 'order' ? reference.trim() : null, deposit_id: referenceType === 'deposit' ? reference.trim() : null });
      setCreating(false); setSubject(''); setBody(''); setReference(''); setPriority('normal'); setPage(1); refresh();
    } catch (err) { setError(errorText(err, 'Couldn’t create your ticket. Please try again.')); }
    finally { setBusy(false); }
  }
  const dialogClass = `support-dialog ${dark ? 'support-dark' : ''}`;
  return <div className={`${embedded ? '' : 'dashboard-overview'} support-page ${dark ? 'overview-dark support-dark' : ''}`}>
    {!embedded && <><Helmet><title>Support Tickets | ProxySock</title></Helmet><header className="overview-heading"><div><span className="overview-eyebrow">Your workspace</span><h1>Support tickets</h1><p>Track help with your orders and deposits.</p></div><Link className="overview-button" to="/dashboard/support">Live chat</Link></header></>}
    {!user || !accessToken ? <p>Sign in to view your tickets.</p> : <section className="support-ticket-panel"><div className="overview-section-heading"><div><h2>Your tickets</h2><p>For general questions, use live chat. Tickets need an order or deposit reference.</p></div><div className="support-ticket-actions"><button type="button" className="overview-icon-button" aria-label="Refresh tickets" disabled={isFetching} onClick={() => refetch()}><RefreshCw size={15} /></button><button type="button" className="support-primary" onClick={() => { setError(''); setCreating(true); }}><Plus size={14} />New ticket</button></div></div>
      {isError && <div className="support-load-error" role="alert">Couldn’t update your tickets. <button onClick={() => refetch()}>Try again</button></div>}
      {isFetching && <p className="support-loading" role="status">Loading tickets…</p>}
      {data && (data.tickets.length ? <div className="support-table-scroll"><table><thead><tr><th>Ticket</th><th>Status</th><th>Last updated</th><th><span className="sr-only">Conversation</span></th></tr></thead><tbody>{data.tickets.map(ticket => <tr key={ticket.id}><td><strong>{ticket.subject}</strong><small>#{ticket.id}</small></td><td><span className="overview-status" data-status={ticket.status}>{ticket.status.replace(/_/g, ' ')}</span></td><td>{dateLabel(ticket.updated_at)}</td><td><button className="overview-button" onClick={() => setActive(ticket)} aria-label={`View ticket ${ticket.id}`}>View / reply</button></td></tr>)}</tbody></table></div> : <div className="overview-empty"><h3>No tickets yet</h3><p>Open a ticket above for help with an order or deposit.</p></div>)}
      {!data && !isLoading && !isError && <p>No ticket history available.</p>}
      {data && data.meta.total_pages > 1 && <div className="support-pagination"><button className="overview-button" disabled={page === 1 || isFetching} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {data.meta.total_pages}</span><button className="overview-button" disabled={page >= data.meta.total_pages || isFetching} onClick={() => setPage(page + 1)}>Next</button></div>}
    </section>}
    <Dialog open={creating} onOpenChange={open => { if (!busy) setCreating(open); }}><DialogContent className={dialogClass}><DialogTitle>New support ticket</DialogTitle><DialogDescription>Include a reference and describe what you need help with.</DialogDescription><form className="support-form" onSubmit={create}>
      <label htmlFor="ticket-subject">Subject</label><input id="ticket-subject" required value={subject} disabled={busy} onChange={e => setSubject(e.target.value)} />
      <div className="support-form-grid"><div><label htmlFor="ticket-reference-type">Reference type</label><PurchaseSelect id="ticket-reference-type" value={referenceType} onValueChange={setReferenceType} disabled={busy} options={[{ value: 'order', label: 'Order' }, { value: 'deposit', label: 'Deposit' }]} /></div><div><label htmlFor="ticket-reference">{referenceType === 'order' ? 'Order ID or number' : 'Deposit ID'}</label><input id="ticket-reference" required value={reference} disabled={busy} onChange={e => setReference(e.target.value)} /></div></div>
      <label htmlFor="ticket-priority">Priority</label><PurchaseSelect id="ticket-priority" value={priority} onValueChange={setPriority} disabled={busy} options={['low', 'normal', 'high'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
      <label htmlFor="ticket-message">Message</label><textarea id="ticket-message" required rows={4} value={body} disabled={busy} onChange={e => setBody(e.target.value)} />{error && <p role="alert">{error}</p>}<button className="support-primary" disabled={busy || !subject.trim() || !reference.trim() || !body.trim()}>{busy ? 'Submitting…' : 'Submit ticket'}</button>
    </form></DialogContent></Dialog>
    <Dialog open={Boolean(active)} onOpenChange={open => { if (!open) setActive(null); }}><DialogContent className={dialogClass}>{active && <TicketThread key={active.id} ticket={active} onChange={refresh} />}</DialogContent></Dialog>
  </div>;
}
