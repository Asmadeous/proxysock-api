import { AxiosHeaders } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AddFunds from './AddFunds';
import UserBalance from '@/components/UserBalance';
import api, { fetchBalance } from '@/services/api';
vi.mock('@/services/api', () => ({ default: { post: vi.fn() }, fetchBalance: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const http = { status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } };
function show(content = <AddFunds />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter>{content}</MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchBalance).mockResolvedValue({ ...http, data: { available_balance: '42.25', currency: 'USD' } });
  vi.mocked(api.post).mockResolvedValue({ ...http, data: { payment_url: 'https://payments.example.com/session', payment_amount: '16500', payment_currency: 'NGN', transaction_ref: 'DEP123' } });
});
afterEach(cleanup);
it('shows decimal wallet balances and accessible payment choices', async () => {
  show();
  expect(await screen.findByText('$42.25')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /RexPay/ })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: /Heleket/ }));
  expect(screen.getByRole('radio', { name: /Heleket/ })).toBeChecked();
});
it('rejects invalid amounts, excess precision, and limits without initiating payments', async () => {
  show();
  for (const value of ['9.99', '10000.01', '12abc', 'Infinity', '1e3', '10.001']) {
    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  }
  expect(api.post).not.toHaveBeenCalled();
});
it('shows the actual gateway quote before redirecting and does not claim payment succeeded', async () => {
  show();
  fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '10.25' } });
  fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
  const link = await screen.findByRole('link', { name: 'Continue to RexPay' });
  expect(link).toHaveAttribute('href', 'https://payments.example.com/session');
  expect(api.post).toHaveBeenCalledWith('/web/api/wallet/deposit', { amount: 10.25, gateway: 'rexpay', currency: 'USD' });
  expect(screen.getByText(/16,500.00/)).toBeInTheDocument();
  expect(screen.getByText('DEP123')).toBeInTheDocument();
  expect(screen.getByText(/credited after payment is confirmed/)).toBeInTheDocument();
  expect(screen.queryByText('Deposit successful')).not.toBeInTheDocument();
});
it('submits the chosen crypto provider and prevents duplicate requests', async () => {
  let finish!: (value: unknown) => void;
  vi.mocked(api.post).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  show();
  fireEvent.click(screen.getByRole('button', { name: '$25.00' }));
  fireEvent.click(screen.getByRole('radio', { name: /Plisio/ }));
  fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
  expect(screen.getByRole('button', { name: 'Creating payment session…' })).toBeDisabled();
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/web/api/wallet/deposit', { amount: 25, gateway: 'plisio', currency: 'USD' });
  finish({ data: { payment_url: 'https://payments.example.com/crypto' } });
  expect(await screen.findByRole('link', { name: 'Continue to Plisio' })).toBeInTheDocument();
  expect(screen.getByText('Shown at checkout')).toBeInTheDocument();
});
it('keeps failed sessions retryable without clearing the amount', async () => {
  vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { error: 'Gateway unavailable' } } });
  show();
  fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gateway unavailable');
  expect(screen.getByLabelText('Amount (USD)')).toHaveValue('20');
  fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
  expect(await screen.findByRole('link', { name: 'Continue to RexPay' })).toBeInTheDocument();
});
it('does not present an unsafe payment link', async () => {
  vi.mocked(api.post).mockResolvedValueOnce({ ...http, data: { payment_url: 'javascript:alert(1)' } });
  show();
  fireEvent.click(screen.getByRole('button', { name: '$10.00' }));
  fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('unsupported payment link');
  expect(screen.queryByRole('link', { name: 'Continue to RexPay' })).not.toBeInTheDocument();
});
it('distinguishes a missing balance from zero and allows a retry', async () => {
  vi.mocked(fetchBalance).mockResolvedValueOnce({ ...http, data: { available_balance: null } });
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Balance unavailable');
  expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry balance' }));
  expect(await screen.findByText('$42.25')).toBeInTheDocument();
});
it('connects both wallet entry points to the reviewable deposit page', async () => {
  show(<><UserBalance variant="sidebar" /><UserBalance variant="sidebar-collapsed" /></>);
  expect(screen.getByRole('link', { name: 'Deposit funds' })).toHaveAttribute('href', '/dashboard/add-funds');
  expect(screen.getByRole('link', { name: 'Add funds to wallet' })).toHaveAttribute('href', '/dashboard/add-funds');
  await waitFor(() => expect(fetchBalance).toHaveBeenCalledOnce());
  expect(await screen.findByText('$42.25')).toBeInTheDocument();
});
