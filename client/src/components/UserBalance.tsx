import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useWalletBalance, walletMoney } from '@/hooks/useWalletBalance';

interface BalanceProps {
  className?: string;
  variant?: 'default' | 'sidebar' | 'sidebar-collapsed';
}
export default function UserBalance({ className, variant = 'default' }: BalanceProps) {
  const balance = useWalletBalance();
  const label = balance.data ? walletMoney(balance.data.amount, balance.data.currency) : balance.isError ? 'Balance unavailable' : 'Loading…';
  return <div className={className}>
    {variant === 'sidebar-collapsed' ? <Link to="/dashboard/add-funds" className="workspace-icon-button" aria-label="Add funds to wallet" title={`${label} · Add funds`}><Wallet aria-hidden="true" /></Link> : variant === 'sidebar' ? <div className="workspace-wallet-content"><div className="workspace-wallet-amount"><Wallet className="h-4 w-4" /><span className="font-medium">{label}</span></div><Link className="workspace-deposit-button inline-flex items-center justify-center shrink-0" to="/dashboard/add-funds">Deposit funds</Link></div> : <Link to="/dashboard/add-funds" className="overview-button" aria-label="Add funds to wallet"><Wallet size={16} />{label}</Link>}
  </div>;
}
