import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare, Ticket, ArrowUpRight } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import SupportChat from './SupportChat';
import Tickets from './Tickets';
import './dashboard-home.css';
import './support.css';

export default function SupportHub() {
  const [params, setParams] = useSearchParams();
  const dark = useThemeStore(state => state.dark);
  const tab = params.get('tab') === 'tickets' || params.has('order_id') || params.has('deposit_id') || params.has('subject') ? 'tickets' : 'chat';
  return <div className={`dashboard-overview support-page ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Support | ProxySock</title></Helmet>
    <header className="overview-heading"><div><span className="overview-eyebrow">Your workspace</span><h1>Support</h1><p>Ask a question or follow up on an order or deposit.</p></div><Link className="overview-button" to="/dashboard/orders">Order history <ArrowUpRight size={14} aria-hidden="true" /></Link></header>
    <nav className="support-tabs" aria-label="Support channels">{[{ key: 'chat', label: 'Live chat', icon: MessageSquare }, { key: 'tickets', label: 'Support tickets', icon: Ticket }].map(item => <button key={item.key} type="button" aria-pressed={tab === item.key} onClick={() => { const next = new URLSearchParams(params); next.set('tab', item.key); if (item.key === 'chat') { next.delete('order_id'); next.delete('deposit_id'); next.delete('subject'); } setParams(next, { replace: true }); }}><item.icon size={16} aria-hidden="true" />{item.label}</button>)}</nav>
    {tab === 'chat' ? <SupportChat role="User" /> : <Tickets role="User" embedded />}
  </div>;
}
