import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { walletMoney } from '@/hooks/useWalletBalance';

interface DepositPaymentProps {
  paymentUrl: string;
  depositAmount: number;
  paymentAmount?: number;
  paymentCurrency?: string;
  reference?: string;
  gateway: string;
  onBack: () => void;
}
export default function DepositPayment({ paymentUrl, depositAmount, paymentAmount, paymentCurrency, reference, gateway, onBack }: DepositPaymentProps) {
  return <section className="checkout-panel deposit-session">
    <h2>Continue to payment</h2><p className="proxy-note">Your payment session is ready. Your wallet will be credited after payment is confirmed.</p>
    <dl className="proxy-facts"><div><dt>Wallet deposit</dt><dd>{walletMoney(depositAmount)}</dd></div><div><dt>Payment method</dt><dd>{gateway}</dd></div><div><dt>Gateway amount</dt><dd>{paymentAmount != null && paymentCurrency ? walletMoney(paymentAmount, paymentCurrency) : 'Shown at checkout'}</dd></div>{reference && <div><dt>Reference</dt><dd>{reference}</dd></div>}</dl>
    <p className="proxy-note">Review the final payment details with the provider before paying.</p>
    <div className="deposit-actions"><a className="proxy-primary" href={paymentUrl}>Continue to {gateway}<ArrowUpRight size={14} /></a><Link className="proxy-secondary" to="/dashboard/transactions">View deposit history</Link></div>
    <button type="button" className="deposit-back" onClick={onBack}>Start a different deposit</button>
    <p className="proxy-note">Starting another deposit does not cancel this payment session.</p>
  </section>;
}
