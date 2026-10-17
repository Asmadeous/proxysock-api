import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import api from '@/services/api';
import './dashboard-home.css';
import './transactions.css';

interface Transaction {
  id: string | number;
  amount: number | string;
  description?: string;
  transaction_type: string;
  status: string;
  created_at: string;
}
interface TransactionPage {
  transactions: Transaction[];
  meta: { current_page: number; total_pages: number; total_count: number };
}
const money = (amount: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(Number(amount)));
const typeLabel = (type: string) => ({ credit: 'Wallet credit', debit: 'Wallet debit', payment: 'Purchase', deposit: 'Deposit', refund: 'Refund' }[type] ?? type.replace(/_/g, ' '));
const isCredit = (transaction: Transaction) => ['credit', 'deposit'].includes(transaction.transaction_type);
const isDebit = (transaction: Transaction) => ['debit', 'payment'].includes(transaction.transaction_type);
const depositId = (transaction: Transaction) => String(transaction.id).startsWith('dep_') ? String(transaction.id).slice(4) : null;
const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

function TransactionDetails({ transaction, onVerified }: { transaction: Transaction; onVerified: () => void }) {
  const dark = useThemeStore(state => state.dark);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ message: string; error: boolean } | null>(null);
  const [verified, setVerified] = useState(false);
  const id = depositId(transaction);
  const canVerify = id !== null && transaction.status !== 'completed' && !verified;
  async function verify() {
    if (!canVerify || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post('/web/api/billing/verify_and_sync', { deposit_id: id });
      setResult({ message: data.message || 'Payment status checked.', error: false });
      if (data.status === 'completed') { setVerified(true); onVerified(); }
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setResult({ message: message || 'Verification failed. Please try again.', error: true });
    } finally { setBusy(false); }
  }
  return <Dialog><DialogTrigger asChild><button type="button" className="transactions-view" aria-label={`View transaction ${transaction.id}`}><Eye size={16} aria-hidden="true" /></button></DialogTrigger>
    <DialogContent className={`transaction-dialog ${dark ? 'transaction-dialog-dark' : ''}`}>
      <DialogTitle>Transaction details</DialogTitle><DialogDescription>{transaction.description || typeLabel(transaction.transaction_type)}</DialogDescription>
      <dl><div><dt>Reference</dt><dd>{transaction.id}</dd></div><div><dt>Type</dt><dd>{typeLabel(transaction.transaction_type)}</dd></div><div><dt>Amount</dt><dd>{money(transaction.amount)} USD</dd></div><div><dt>Status</dt><dd>{verified ? 'completed' : transaction.status.replace(/_/g, ' ')}</dd></div><div><dt>Date</dt><dd>{dateLabel(transaction.created_at)}</dd></div></dl>
      {result && <p className="transaction-verification" role={result.error ? 'alert' : 'status'}>{result.message}</p>}
      {canVerify && <><p className="transaction-dialog-note">Check the payment gateway for an updated deposit status.</p><button type="button" className="transaction-verify" onClick={verify} disabled={busy}>{busy ? 'Verifying payment…' : 'Verify payment status'}</button></>}
      <Link className="transaction-support" to={id !== null ? `/dashboard/tickets?${new URLSearchParams({ deposit_id: id, subject: `Issue with Deposit ${id}` })}` : `/dashboard/tickets?${new URLSearchParams({ subject: `Question about transaction ${transaction.id}` })}`}>Open support ticket <ArrowUpRight size={14} aria-hidden="true" /></Link>
    </DialogContent>
  </Dialog>;
}

export default function TransactionsPage() {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const { data, isLoading, isFetching, isError, refetch } = useQuery<TransactionPage>({
    queryKey: ['transactions', user?.id, page],
    queryFn: async () => (await api.get(`/web/api/billing/transactions?page=${page}`)).data,
    enabled: Boolean(accessToken && user?.id), staleTime: 30_000, retry: false,
  });
  const transactions = data?.transactions ?? [];
  const filtered = transactions.filter(transaction => {
    if (type === 'credits' && !isCredit(transaction)) return false;
    if (type === 'debits' && !isDebit(transaction)) return false;
    if (type === 'refunds' && transaction.transaction_type !== 'refund') return false;
    if (status !== 'all' && transaction.status !== status) return false;
    if (period !== 'all') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - Number(period));
      if (!(new Date(transaction.created_at) >= threshold)) return false;
    }
    return `${transaction.id} ${transaction.description ?? ''} ${typeLabel(transaction.transaction_type)}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const sum = (predicate: (transaction: Transaction) => boolean) => transactions.filter(t => t.status === 'completed' && predicate(t)).reduce((total, t) => total + Math.abs(Number(t.amount)), 0);
  const metrics = [
    { name: 'Credits', value: money(sum(isCredit)), note: 'Completed · this page' },
    { name: 'Debits', value: money(sum(isDebit)), note: 'Completed · this page' },
    { name: 'Transactions', value: transactions.length, note: 'All statuses · this page' },
    { name: 'Pending', value: transactions.filter(t => ['pending', 'processing'].includes(t.status)).length, note: 'Pending or processing · this page' },
  ];
  const hasFilters = Boolean(search || type !== 'all' || status !== 'all' || period !== 'all');
  const resetFilters = () => { setSearch(''); setType('all'); setStatus('all'); setPeriod('all'); };
  const onVerified = () => { void client.invalidateQueries({ queryKey: ['transactions', user?.id] }); };

  return <div className={`dashboard-overview transactions-page ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Transactions | ProxySock</title></Helmet>
    <header className="overview-heading"><div><h1>Transactions</h1><p>Review wallet activity and check deposit payments.</p></div>{user && accessToken && <div className="overview-heading-actions"><Link className="overview-button" to="/dashboard/orders">Order history <ArrowUpRight size={14} aria-hidden="true" /></Link><button type="button" className="overview-icon-button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh transactions"><RefreshCw size={15} aria-hidden="true" /></button></div>}</header>
    {!accessToken || !user ? <section className="overview-auth"><h2>Sign in to view your transactions</h2><Link to="/login">Back to login</Link></section> : <>
      {isError && <div className="overview-error" role="alert"><div><strong>We couldn’t update your transactions.</strong><p>{data ? 'Showing the last loaded activity for this page.' : 'Try again to load your wallet activity.'}</p></div><button type="button" onClick={() => refetch()} disabled={isFetching}>Try again</button></div>}
      <section className="overview-metrics" aria-label="Transaction summary" aria-busy={isFetching}>{metrics.map(metric => <div className="overview-metric" key={metric.name}><span>{metric.name}</span><strong>{data ? metric.value : '—'}</strong><small>{metric.note}</small></div>)}</section>
      <section className="transactions-history" aria-labelledby="transactions-title" aria-busy={isFetching}>
        <div className="overview-section-heading"><div><h2 id="transactions-title">Transaction history</h2><p>Amounts are in USD. Search and filters apply to the current page.</p></div>{hasFilters && <button type="button" className="transactions-clear" onClick={resetFilters}>Clear filters</button>}</div>
        <div className="transactions-filters"><div className="transactions-search"><label htmlFor="transaction-search">Search</label><div><Search size={15} aria-hidden="true" /><input id="transaction-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Reference or description" /></div></div>
          <div><label htmlFor="transaction-type">Type</label><PurchaseSelect id="transaction-type" value={type} onValueChange={setType} options={[{ value: 'all', label: 'All types' }, { value: 'credits', label: 'Credits & deposits' }, { value: 'debits', label: 'Debits & purchases' }, { value: 'refunds', label: 'Refunds' }]} /></div>
          <div><label htmlFor="transaction-status">Status</label><PurchaseSelect id="transaction-status" value={status} onValueChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...['completed', 'pending', 'processing', 'failed', 'cancelled'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} /></div>
          <div><label htmlFor="transaction-period">Date range</label><PurchaseSelect id="transaction-period" value={period} onValueChange={setPeriod} options={[{ value: 'all', label: 'All time' }, ...['7', '30', '90'].map(value => ({ value, label: `Last ${value} days` }))]} /></div>
        </div>
        {isFetching && <p className="transactions-loading" role="status">{isLoading ? 'Loading transactions…' : 'Updating transactions…'}</p>}
        {!data ? (!isLoading && <div className="overview-empty"><h3>Transaction history is unavailable</h3><p>Try again above to reload your activity.</p></div>) : !filtered.length ? <div className="overview-empty"><h3>{transactions.length || hasFilters ? 'No matching transactions on this page' : 'No transactions yet'}</h3><p>{transactions.length || hasFilters ? 'Clear the filters or check another page of your history.' : 'Wallet activity and deposit payments will appear here.'}</p>{hasFilters && <button className="overview-button" type="button" onClick={resetFilters}>Clear all filters</button>}</div> : <div className="transactions-table-scroll"><table><caption className="sr-only">Wallet transactions on page {page}</caption><thead><tr><th scope="col">Transaction</th><th scope="col">Type</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Amount</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{filtered.map(transaction => <tr key={transaction.id}><td><strong>{transaction.description || typeLabel(transaction.transaction_type)}</strong><span className="transaction-reference">#{transaction.id}</span></td><td>{typeLabel(transaction.transaction_type)}</td><td><time dateTime={transaction.created_at}>{dateLabel(transaction.created_at)}</time></td><td><span className="overview-status" data-status={transaction.status}>{transaction.status.replace(/_/g, ' ')}</span></td><td className="transaction-amount">{money(transaction.amount)}</td><td><TransactionDetails transaction={transaction} onVerified={onVerified} /></td></tr>)}</tbody></table></div>}
        <div className="transactions-pagination"><p>{data ? `${filtered.length} shown · ${data.meta.total_count} transactions total` : 'Transaction count unavailable'}</p><div><button type="button" disabled={page <= 1 || isFetching} onClick={() => setPage(current => current - 1)}>Previous</button><span>Page {page}{data ? ` of ${Math.max(1, data.meta.total_pages)}` : ''}</span><button type="button" disabled={!data || page >= data.meta.total_pages || isFetching} onClick={() => setPage(current => current + 1)}>Next</button></div></div>
      </section>
    </>}
  </div>;
}
