import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, RefreshCw, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import { useWalletBalance, walletMoney } from '@/hooks/useWalletBalance';
import api from '@/services/api';
import DepositPayment from '@/pages/payments/DepositPayments';
import './dashboard-home.css';
import './proxy-management.css';
import './checkout.css';
import './add-funds.css';

const methods = [
  { value: 'rexpay', name: 'RexPay', description: 'Pay by card. RexPay charges in NGN.', image: '/rexpay.svg' },
  { value: 'heleket', name: 'Heleket', description: 'Pay with cryptocurrency.', image: '/heleket.webp' },
  { value: 'plisio', name: 'Plisio', description: 'Pay with cryptocurrency.', image: '/plisio.webp' },
];
interface Session {
  url: string;
  amount: number;
  charge?: number;
  currency?: string;
  reference?: string;
  gateway: string;
}
export default function AddFunds() {
  const { user, accessToken } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const balance = useWalletBalance();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('rexpay');
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  async function createSession() {
    if (busyRef.current) return;
    const value = amount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(value) || !Number.isFinite(Number(value))) { setError('Enter a valid amount with no more than two decimal places.'); return; }
    const total = Number(value);
    if (total < 10 || total > 10000) { setError('Enter an amount between $10 and $10,000.'); return; }
    if (!user || !accessToken) { setError('Sign in to add funds.'); return; }
    busyRef.current = true; setBusy(true); setError('');
    try {
      const { data } = await api.post('/web/api/wallet/deposit', { amount: total, gateway: method, currency: 'USD' });
      let url: URL;
      try { url = new URL(data.payment_url); } catch { throw new Error('The provider did not return a valid payment link. Check deposit history before trying again.'); }
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('The provider returned an unsupported payment link. Check deposit history before trying again.');
      const rawCharge = data.payment_amount;
      setSession({ url: url.href, amount: total, gateway: methods.find(item => item.value === method)!.name, charge: rawCharge != null && rawCharge !== '' && Number.isFinite(Number(rawCharge)) ? Number(rawCharge) : undefined, currency: data.payment_currency, reference: data.transaction_ref });
    } catch (error) {
      const failure = error as { response?: { data?: { error?: string } }; message?: string };
      setError(failure.response?.data?.error || failure.message || 'Couldn’t create the payment session. Check deposit history before trying again.');
    } finally { busyRef.current = false; setBusy(false); }
  }
  return <div className={`dashboard-overview proxy-management add-funds ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Add Funds | ProxySock</title></Helmet>
    <Link className="proxy-back" to="/dashboard/transactions"><ArrowLeft size={14} />Transactions</Link>
    <header className="overview-heading"><div><h1>Add funds</h1><p>Choose an amount and payment method to fund your wallet.</p></div><Link className="overview-button" to="/dashboard/transactions">Deposit history <ArrowUpRight size={14} /></Link></header>
    {!user || !accessToken ? <div className="overview-auth"><h2>Sign in to add funds</h2><Link to="/login">Back to login</Link></div> : <div className="checkout-layout">
      <div className="checkout-main">{session ? <DepositPayment paymentUrl={session.url} depositAmount={session.amount} paymentAmount={session.charge} paymentCurrency={session.currency} reference={session.reference} gateway={session.gateway} onBack={() => { setSession(null); setError(''); }} /> : <form className="checkout-panel deposit-form" onSubmit={event => { event.preventDefault(); createSession(); }} noValidate>
        <fieldset disabled={busy}><legend>Deposit amount</legend><label htmlFor="deposit-amount">Amount (USD)</label><input id="deposit-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} aria-describedby="deposit-limits" /><p id="deposit-limits" className="proxy-note">Minimum $10 · Maximum $10,000</p>
          <div className="deposit-presets" aria-label="Suggested deposit amounts">{[10, 25, 50, 100].map(value => <button type="button" key={value} aria-pressed={Number(amount) === value} onClick={() => { setAmount(String(value)); setError(''); }}>{walletMoney(value)}</button>)}</div>
        </fieldset>
        <fieldset disabled={busy} className="checkout-methods"><legend>Payment method</legend>{methods.map(item => <label className="checkout-method" data-selected={method === item.value} key={item.value}><input type="radio" name="deposit-method" value={item.value} checked={method === item.value} onChange={() => setMethod(item.value)} /><img src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.description}</small></span></label>)}</fieldset>
        <p className="proxy-note">{method === 'rexpay' ? 'The next step shows the NGN charge returned by RexPay, including its processing fee.' : 'Choose an available cryptocurrency and network on the provider’s payment page.'}</p>
        {error && <div className="overview-error" role="alert"><p>{error}</p></div>}
        <button className="proxy-primary" disabled={busy} type="submit">{busy ? 'Creating payment session…' : 'Continue'}</button>
      </form>}</div>
      <aside className="checkout-panel deposit-wallet"><div className="deposit-wallet-heading"><Wallet size={18} /><h2>Wallet balance</h2><button className="overview-icon-button" aria-label="Refresh wallet balance" disabled={balance.isFetching} onClick={() => balance.refetch()}><RefreshCw size={14} /></button></div>
        {balance.isError ? <div className="overview-error" role="alert"><p>Balance unavailable.</p><button disabled={balance.isFetching} onClick={() => balance.refetch()}>Retry balance</button></div> : balance.data ? <strong className="deposit-balance">{walletMoney(balance.data.amount, balance.data.currency)}</strong> : <p className="proxy-note" role="status">Loading balance…</p>}
        <p className="proxy-note">Deposits are added after the provider confirms payment. Check Transactions for the latest status.</p><Link className="deposit-help" to="/dashboard/support">Need help with a deposit? <ArrowUpRight size={14} /></Link>
      </aside>
    </div>}
  </div>;
}
