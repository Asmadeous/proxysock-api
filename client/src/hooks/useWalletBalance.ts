import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchBalance } from '@/services/api';

export function useWalletBalance() {
  const { user, accessToken } = useAuth();
  return useQuery({
    queryKey: ['wallet-balance', user?.id],
    enabled: Boolean(user?.id && accessToken),
    retry: false,
    queryFn: async () => {
      const { data } = await fetchBalance();
      const value = data.available_balance;
      if (value == null || value === '' || !Number.isFinite(Number(value))) throw new Error('Balance unavailable');
      return { amount: Number(value), currency: data.currency || 'USD' };
    },
  });
}
export function walletMoney(amount: number, currency = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
}
