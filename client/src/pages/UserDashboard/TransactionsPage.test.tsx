import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import TransactionsPage from './TransactionsPage';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 9 }, accessToken: 'test-token' }) }));
const items = [
  { id: 1, amount: '100.50', description: 'Wallet funding', transaction_type: 'credit', status: 'completed', created_at: new Date().toISOString() },
  { id: 2, amount: '-12.25', description: 'VPN purchase', transaction_type: 'debit', status: 'completed', created_at: '2020-01-01T12:00:00Z' },
  { id: 'dep_73', amount: '25', description: 'Deposit via card', transaction_type: 'deposit', status: 'pending', created_at: new Date().toISOString() },
];
const data = { transactions: items, meta: { current_page: 1, total_pages: 2, total_count: 51 } };
let client: QueryClient;
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } }, logger: { log: console.log, warn: console.warn, error: () => {} } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter><TransactionsPage /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
async function choose(name: string, option: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: option }));
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data }); });
afterEach(() => { cleanup(); client.clear(); });

it('shows page-scoped completed totals and makes older history reachable', async () => {
  show();
  await screen.findByText('Wallet funding');
  const summary = within(screen.getByRole('region', { name: 'Transaction summary' }));
  expect(summary.getByText('$100.50')).toBeInTheDocument();
  expect(summary.getByText('$12.25')).toBeInTheDocument();
  expect(summary.queryByText('$125.50')).not.toBeInTheDocument();
  expect(screen.getByText('3 shown · 51 transactions total')).toBeInTheDocument();
  vi.mocked(api.get).mockResolvedValueOnce({ data: { transactions: [], meta: { current_page: 2, total_pages: 2, total_count: 51 } } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith('/web/api/billing/transactions?page=2');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(await screen.findByText('Wallet funding')).toBeInTheDocument();
});

it('combines accessible search, type, status and date filters and resets them', async () => {
  show();
  await screen.findByText('VPN purchase');
  await choose('Type', 'Credits & deposits');
  expect(screen.queryByText('VPN purchase')).not.toBeInTheDocument();
  await choose('Status', 'Pending');
  expect(screen.queryByText('Wallet funding')).not.toBeInTheDocument();
  expect(screen.getByText('Deposit via card')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'missing' } });
  expect(screen.getByText('No matching transactions on this page')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
  await choose('Date range', 'Last 7 days');
  expect(screen.queryByText('VPN purchase')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByText('VPN purchase')).toBeInTheDocument();
});

it('opens transaction details without offering deposit verification for ledger entries', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View transaction 1' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Transaction details' }));
  expect(dialog.getByText('$100.50 USD')).toBeInTheDocument();
  expect(dialog.queryByRole('button', { name: 'Verify payment status' })).not.toBeInTheDocument();
  expect(dialog.getByRole('link', { name: 'Open support ticket' })).toHaveAttribute('href', '/dashboard/tickets?subject=Question+about+transaction+1');
});

it('verifies a deposit with its real ID, refreshes history and prevents repeated completed verification', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { status: 'completed', message: 'Deposit successfully synced.' } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View transaction dep_73' }));
  expect(screen.getByRole('link', { name: 'Open support ticket' })).toHaveAttribute('href', '/dashboard/tickets?deposit_id=73&subject=Issue+with+Deposit+73');
  fireEvent.click(screen.getByRole('button', { name: 'Verify payment status' }));
  expect(api.post).toHaveBeenCalledWith('/web/api/billing/verify_and_sync', { deposit_id: '73' });
  expect(await screen.findByText('Deposit successfully synced.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Verify payment status' })).not.toBeInTheDocument();
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
});

it('shows verification failures and permits retry', async () => {
  vi.mocked(api.post).mockRejectedValue({ response: { data: { error: 'Gateway unavailable' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View transaction dep_73' }));
  fireEvent.click(screen.getByRole('button', { name: 'Verify payment status' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gateway unavailable');
  expect(screen.getByRole('button', { name: 'Verify payment status' })).toBeEnabled();
});

it('does not turn load failures into an empty wallet and allows retry', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your transactions.');
  expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Wallet funding')).toBeInTheDocument();
});
