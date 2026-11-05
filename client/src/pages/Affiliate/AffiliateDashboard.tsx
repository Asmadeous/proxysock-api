import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Copy, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import PurchaseSelect from '@/components/dashboard/PurchaseSelect';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { enrollAffiliate, fetchAffiliateProfile, fetchReferrals, fetchPayouts, requestPayout } from '@/services/affiliateApi';
import '../UserDashboard/dashboard-home.css';
import '../UserDashboard/proxy-management.css';
import '../UserDashboard/orders.css';
import './affiliate-dashboard.css';

interface Profile {
  enrolled?: boolean;
  referral_code?: string;
  referral_url?: string;
  status?: string;
  commission_rate?: string | number;
  discount_rate?: string | number;
  total_earned?: string | number;
  total_paid_out?: string | number;
  pending_balance?: string | number;
  total_referrals?: number;
  converted?: number;
}
interface HistoryRow {
  id: string;
  status: string;
  created_at: string;
  commission?: string | number;
  discount?: string | number;
  amount?: string | number;
  payment_method?: string;
  paid_at?: string;
}
type Method = 'wallet' | 'crypto' | 'manual';
const methods = [{ value: 'wallet', label: 'Wallet balance' }, { value: 'crypto', label: 'Crypto withdrawal' }, { value: 'manual', label: 'Bank / other' }];
const money = (value?: string | number) => value != null && Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value)) : 'Not available';
const rate = (value?: string | number) => value != null ? `${value}%` : 'Not specified';
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const errorMessage = (error: unknown, fallback: string) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

export default function AffiliateDashboard() {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const client = useQueryClient();
  const [tab, setTab] = useState<'referrals' | 'payouts'>('referrals');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>('wallet');
  const [currency, setCurrency] = useState('USDT');
  const [gateway, setGateway] = useState('plisio');
  const [address, setAddress] = useState('');
  const [bank, setBank] = useState({ account_name: '', account_number: '', bank_name: '', country: '' });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const profileKey = ['affiliate-profile', user?.id];
  const profile = useQuery<Profile>({ queryKey: profileKey, enabled: Boolean(user?.id && accessToken), retry: false, cacheTime: 0, queryFn: async () => (await fetchAffiliateProfile()).data });
  const affiliate = profile.data;
  const enrolled = Boolean(affiliate && affiliate.enrolled !== false && affiliate.referral_code);
  const history = useQuery<{ rows: HistoryRow[]; total: number }>({
    queryKey: ['affiliate-history', user?.id, tab, page], enabled: enrolled, retry: false, cacheTime: 0,
    queryFn: async () => {
      const { data } = await (tab === 'referrals' ? fetchReferrals(page) : fetchPayouts(page));
      return { rows: data[tab] || [], total: data.total ?? 0 };
    },
  });
  const balance = Number(affiliate?.pending_balance ?? 0);
  const canPayout = enrolled && affiliate?.status !== 'suspended' && Number.isFinite(balance) && balance > 0 && !profile.isError;
  const referralLink = affiliate?.referral_url || (affiliate?.referral_code ? `${window.location.origin}/register?ref=${encodeURIComponent(affiliate.referral_code)}` : '');
  const pages = Math.max(1, Math.ceil((history.data?.total || 0) / 20));
  async function enroll() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setActionError('');
    try { const { data } = await enrollAffiliate(); client.setQueryData(profileKey, data); toast.success('Affiliate account created'); }
    catch (error) { setActionError(errorMessage(error, 'Couldn’t enroll. Please try again.')); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(referralLink); toast.success('Referral link copied'); }
    catch { toast.error('Couldn’t copy. Select the link and copy it manually.'); }
  }
  function validate() {
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return 'Enter an amount greater than zero with no more than two decimal places.';
    if (!canPayout || Number(amount) > balance) return 'The amount exceeds your available balance, or payouts are unavailable. Refresh your account and try again.';
    if (method === 'crypto' && !address.trim()) return 'Enter your crypto wallet address.';
    if (method === 'manual' && Object.values(bank).some(value => !value.trim())) return 'Complete all bank account details.';
    return '';
  }
  async function submit() {
    if (busyRef.current) return;
    const error = validate();
    if (error) { setActionError(error); setReview(false); return; }
    if (!review) { setActionError(''); setReview(true); return; }
    busyRef.current = true; setBusy(true); setActionError('');
    try {
      const details = method === 'crypto' ? { crypto_currency: currency, crypto_address: address.trim(), crypto_gateway: gateway } : method === 'manual' ? Object.fromEntries(Object.entries(bank).map(([key, value]) => [key, value.trim()])) : {};
      const { data } = await requestPayout(Number(amount), method, details);
      toast.success(data.status === 'paid' ? 'Payout completed' : 'Payout request submitted');
      setOpen(false); setAmount(''); setAddress(''); setBank({ account_name: '', account_number: '', bank_name: '', country: '' }); setReview(false); setTab('payouts'); setPage(1);
      await client.invalidateQueries(profileKey);
      await client.invalidateQueries(['affiliate-history', user?.id]);
    } catch (error) { setActionError(errorMessage(error, 'Couldn’t complete the payout request. Check payout history before retrying.')); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function openPayout() { setOpen(true); setReview(false); setActionError(''); }
  return <div className={`dashboard-overview proxy-management affiliate-dashboard ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Affiliate Dashboard | ProxySock</title></Helmet>
    <header className="overview-heading"><div><h1>Affiliate dashboard</h1><p>Track referrals, earnings, and payouts.</p></div><div className="overview-heading-actions">{enrolled && <button className="overview-button" disabled={!canPayout || busy} onClick={openPayout}>Request payout</button>}<button className="overview-icon-button" aria-label="Refresh affiliate account" disabled={profile.isFetching || history.isFetching || busy} onClick={() => { profile.refetch(); if (enrolled) history.refetch(); }}><RefreshCw size={15} /></button></div></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to view your affiliate account</h2><Link to="/login">Back to login</Link></div> : <>
      {profile.isError && <div className="overview-error" role="alert"><div><strong>We couldn’t load your affiliate account.</strong><p>{affiliate ? 'Showing the last loaded details.' : 'Try again to load your account.'}</p></div><button onClick={() => profile.refetch()}>Try again</button></div>}
      {profile.isFetching && <p className="proxy-note" role="status">{affiliate ? 'Updating affiliate account…' : 'Loading affiliate account…'}</p>}
      {!open && actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
      {affiliate?.enrolled === false && !profile.isError && <section className="proxy-empty"><Users size={25} /><h2>Join the affiliate program</h2><p>Create your referral code to track referrals and eligible commissions.</p><button className="overview-button" disabled={busy} onClick={enroll}>{busy ? 'Enrolling…' : 'Join program'}</button><Link className="affiliate-program-link" to="/affiliate-program">View program details</Link></section>}
      {enrolled && affiliate && <>
        <section className="affiliate-link"><label htmlFor="affiliate-link">Your referral link</label><div><input id="affiliate-link" readOnly value={referralLink} onFocus={event => event.target.select()} /><button className="overview-button" onClick={copyLink}><Copy size={14} />Copy link</button></div></section>
        <div className="overview-metrics">{[['Total referrals', affiliate.total_referrals ?? '—'], ['Converted referrals', affiliate.converted ?? '—'], ['Total earned', money(affiliate.total_earned)], ['Available for payout', money(affiliate.pending_balance)]].map(([label, value]) => <div className="overview-metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <dl className="affiliate-account"><div><dt>Referral code</dt><dd>{affiliate.referral_code}</dd></div><div><dt>Commission rate</dt><dd>{rate(affiliate.commission_rate)}</dd></div><div><dt>Referral discount</dt><dd>{rate(affiliate.discount_rate)}</dd></div><div><dt>Total paid out</dt><dd>{money(affiliate.total_paid_out)}</dd></div><div><dt>Account status</dt><dd><span className="overview-status" data-status={affiliate.status}>{affiliate.status}</span></dd></div></dl>
        {affiliate.status === 'suspended' && <p className="proxy-note">Payouts are unavailable while your affiliate account is suspended. <Link to="/dashboard/support">Contact support</Link> for help.</p>}
        <div className="affiliate-tabs" role="group" aria-label="Affiliate history">{(['referrals', 'payouts'] as const).map(value => <button key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setPage(1); }}>{value === 'referrals' ? 'Referrals' : 'Payouts'}</button>)}</div>
        {history.isError && <div className="overview-error" role="alert"><strong>We couldn’t load your {tab}.</strong><button onClick={() => history.refetch()}>Retry history</button></div>}
        {history.isFetching && <p className="proxy-note" role="status">Loading {tab}…</p>}
        {history.data && (history.data.rows.length ? <section className="orders-history"><div className="orders-table-scroll" role="region" aria-label={`${tab} history`} tabIndex={0}><table><caption className="sr-only">{tab === 'referrals' ? 'Referral history' : 'Payout history'}</caption><thead><tr>{(tab === 'referrals' ? ['Referral', 'Status', 'Commission', 'Discount applied', 'Date'] : ['Amount', 'Method', 'Status', 'Requested', 'Paid']).map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{history.data.rows.map(row => <tr key={row.id}>{tab === 'referrals' ? <><td className="affiliate-reference">{row.id}</td><td><span className="overview-status" data-status={row.status}>{row.status}</span></td><td>{money(row.commission)}</td><td>{money(row.discount)}</td><td>{date(row.created_at)}</td></> : <><td>{money(row.amount)}</td><td>{methods.find(method => method.value === row.payment_method)?.label || row.payment_method || 'Not specified'}</td><td><span className="overview-status" data-status={row.status}>{row.status}</span></td><td>{date(row.created_at)}</td><td>{date(row.paid_at)}</td></>}</tr>)}</tbody></table></div></section> : <div className="proxy-empty"><h2>No {tab} yet</h2><p>{tab === 'referrals' ? 'Share your referral link to get started.' : 'Your payout requests will appear here.'}</p></div>)}
        {history.data && pages > 1 && <nav className="proxy-pagination" aria-label="Affiliate history pages"><button disabled={page === 1 || history.isFetching} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page === pages || history.isFetching} onClick={() => setPage(page + 1)}>Next</button></nav>}
      </>}
    </>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent className={`proxy-dialog affiliate-payout ${dark ? 'proxy-dialog-dark' : ''}`}><DialogTitle>{review ? 'Review payout' : 'Request payout'}</DialogTitle><DialogDescription>Available balance: {money(affiliate?.pending_balance)} USD</DialogDescription>
      {actionError && <p className="proxy-action-error" role="alert">{actionError}</p>}
      <form onSubmit={event => { event.preventDefault(); submit(); }}><fieldset disabled={busy} className="proxy-panel">
        {review ? <><dl className="proxy-facts"><div><dt>Amount</dt><dd>{money(amount)}</dd></div><div><dt>Method</dt><dd>{methods.find(item => item.value === method)?.label}</dd></div>{method === 'crypto' && <><div><dt>Currency</dt><dd>{currency}</dd></div><div><dt>Gateway</dt><dd>{gateway}</dd></div><div><dt>Wallet address</dt><dd>{address}</dd></div></>}{method === 'manual' && Object.entries(bank).map(([key, value]) => <div key={key}><dt>{key.replace(/_/g, ' ')}</dt><dd>{value}</dd></div>)}</dl><p className="proxy-note">{method === 'wallet' ? 'Confirm to transfer this amount to your main wallet.' : method === 'crypto' ? 'Confirm the currency, network, and destination address before sending. Crypto payouts are dispatched automatically.' : 'This submits a payout request for the team to review.'}</p></> : <>
          <label htmlFor="payout-amount">Amount (USD)</label><input id="payout-amount" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" />
          <label htmlFor="payout-method">Payout method</label><PurchaseSelect id="payout-method" value={method} onValueChange={value => setMethod(value as Method)} options={methods} />
          {method === 'crypto' && <><label htmlFor="payout-gateway">Gateway</label><PurchaseSelect id="payout-gateway" value={gateway} onValueChange={setGateway} options={[{ value: 'plisio', label: 'Plisio' }, { value: 'heleket', label: 'Heleket' }]} /><label htmlFor="payout-currency">Currency</label><PurchaseSelect id="payout-currency" value={currency} onValueChange={setCurrency} options={['BTC', 'USDC', 'ETH', 'USDT'].map(value => ({ value, label: value }))} /><label htmlFor="payout-address">Wallet address</label><input id="payout-address" value={address} onChange={event => setAddress(event.target.value)} autoComplete="off" /></>}
          {method === 'manual' && Object.entries({ account_name: 'Account holder name', account_number: 'Account number / IBAN', bank_name: 'Bank name', country: 'Country' }).map(([key, label]) => <div className="affiliate-field" key={key}><label htmlFor={`payout-${key}`}>{label}</label><input id={`payout-${key}`} value={bank[key as keyof typeof bank]} onChange={event => setBank({ ...bank, [key]: event.target.value })} /></div>)}
        </>}
        <div className="affiliate-form-actions">{review && <button type="button" className="proxy-secondary" onClick={() => setReview(false)}>Edit details</button>}<button className="proxy-primary" type="submit">{busy ? 'Submitting…' : review ? 'Confirm payout' : 'Review payout'}</button></div>
      </fieldset></form>
    </DialogContent></Dialog>
  </div>;
}
