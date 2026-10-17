import { AxiosHeaders, type AxiosResponse } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AffiliateDashboard from './AffiliateDashboard';
import { fetchAffiliateProfile, enrollAffiliate, fetchReferrals, fetchPayouts, requestPayout } from '@/services/affiliateApi';
vi.mock('@/services/affiliateApi', () => ({ fetchAffiliateProfile: vi.fn(), enrollAffiliate: vi.fn(), fetchReferrals: vi.fn(), fetchPayouts: vi.fn(), requestPayout: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const http = { status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } };
const profile = { referral_code: 'MYCODE', referral_url: 'https://proxysock.com/register?ref=MYCODE', status: 'active', commission_rate: '0', discount_rate: '0', total_earned: '45.50', total_paid_out: '5', pending_balance: '40.50', total_referrals: 12, converted: 3 };
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter><AffiliateDashboard /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchAffiliateProfile).mockResolvedValue({ ...http, data: profile });
  vi.mocked(fetchReferrals).mockResolvedValue({ ...http, data: { referrals: [], total: 0 } });
  vi.mocked(fetchPayouts).mockResolvedValue({ ...http, data: { payouts: [], total: 0 } });
});
afterEach(cleanup);
it('recognizes an unenrolled account and enrolls it', async () => {
  vi.mocked(fetchAffiliateProfile).mockResolvedValueOnce({ ...http, data: { enrolled: false } });
  vi.mocked(enrollAffiliate).mockResolvedValueOnce({ ...http, data: profile });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Join program' }));
  expect(await screen.findByDisplayValue(profile.referral_url)).toBeInTheDocument();
  expect(enrollAffiliate).toHaveBeenCalledOnce();
});
it('shows real earnings and preserves zero commission and discount rates', async () => {
  show();
  expect(await screen.findByText('$45.50')).toBeInTheDocument();
  expect(screen.getByText('$40.50')).toBeInTheDocument();
  expect(screen.getAllByText('0%')).toHaveLength(2);
  expect(screen.getByText('3')).toBeInTheDocument();
});
it('does not mistake a load error for an unenrolled account', async () => {
  vi.mocked(fetchAffiliateProfile).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your affiliate account');
  expect(screen.queryByRole('button', { name: 'Join program' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByDisplayValue(profile.referral_url)).toBeInTheDocument();
});
it('uses referral commission fields and loads later pages', async () => {
  vi.mocked(fetchReferrals).mockResolvedValueOnce({ ...http, data: { referrals: [{ id: 'ref-one', status: 'converted', commission: '7.25', discount: '2', created_at: '2026-10-17' }], total: 21 } }).mockResolvedValueOnce({ ...http, data: { referrals: [{ id: 'ref-last', status: 'pending', commission: 0, created_at: '2026-10-17' }], total: 21 } });
  show();
  expect(await screen.findByText('$7.25')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByText('ref-last')).toBeInTheDocument();
  expect(fetchReferrals).toHaveBeenLastCalledWith(2);
});
it('validates balance and decimal precision before reviewing a payout', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Request payout' }));
  fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '41' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
  expect(screen.getByRole('alert')).toHaveTextContent('exceeds your available balance');
  fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '1.234' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
  expect(screen.getByRole('alert')).toHaveTextContent('two decimal places');
  expect(requestPayout).not.toHaveBeenCalled();
});
it('requires confirmation, prevents duplicate submits, and loads payout history after success', async () => {
  let finish!: (value: AxiosResponse) => void;
  vi.mocked(requestPayout).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Request payout' }));
  fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '12.50' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
  expect(requestPayout).not.toHaveBeenCalled();
  expect(within(screen.getByRole('dialog')).getByText('$12.50')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm payout' }));
  expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
  finish({ ...http, data: { status: 'pending' } });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(requestPayout).toHaveBeenCalledExactlyOnceWith(12.5, 'wallet', {});
  expect(await screen.findByText('No payouts yet')).toBeInTheDocument();
});
it('preserves crypto details and shows server errors inline', async () => {
  vi.mocked(requestPayout).mockRejectedValueOnce({ response: { data: { error: 'Gateway unavailable' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Request payout' }));
  fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('combobox', { name: 'Payout method' }));
  fireEvent.click(screen.getByRole('option', { name: 'Crypto withdrawal' }));
  fireEvent.change(screen.getByLabelText('Wallet address'), { target: { value: ' test-address ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm payout' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gateway unavailable');
  expect(requestPayout).toHaveBeenCalledWith(10, 'crypto', { crypto_currency: 'USDT', crypto_address: 'test-address', crypto_gateway: 'plisio' });
});
it('shows payout history errors separately from empty history', async () => {
  vi.mocked(fetchPayouts).mockRejectedValueOnce(new Error('offline'));
  show();
  await screen.findByText('$45.50');
  fireEvent.click(screen.getByRole('button', { name: /^Payouts$/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your payouts');
  expect(screen.queryByText('No payouts yet')).not.toBeInTheDocument();
});
