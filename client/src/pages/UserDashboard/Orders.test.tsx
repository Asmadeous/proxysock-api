import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Orders from './Orders';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 9 }, accessToken: 'test-token' }) }));
const empty = { total_orders: 0, active_services: 0, pending_orders: 0, total_spent: 0, type_stats: {}, recent_orders: [] };
const populated = { ...empty, total_orders: 8, active_services: 5, pending_orders: 3, total_spent: '123.45', type_stats: { esim: { total: 2 }, usa_esim: { total: 1 } }, recent_orders: [
  { id: 42, product_type: 'global_isp', product_name: 'Global proxy', status: 'awaiting_payment', total_amount: '12.45', created_at: '2026-10-04T12:00:00Z' },
  { id: 43, product_type: 'usa_esim', product_name: 'Phone line', status: 'active', total_amount: 15, created_at: '2026-10-05T12:00:00Z' },
] };
let client: QueryClient;
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } }, logger: { log: console.log, warn: console.warn, error: () => {} } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter><Orders /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); client.clear(); });

it('uses aggregate totals, formats prices and routes product subtypes to the right histories', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: populated });
  show();
  expect(await screen.findByText('$123.45')).toBeInTheDocument();
  const summary = within(screen.getByRole('region', { name: 'Order summary' }));
  expect(summary.getByText('8')).toBeInTheDocument();
  expect(screen.getByText('$12.45')).toBeInTheDocument();
  expect(screen.getByText('awaiting payment')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View Proxy orders for order 42' })).toHaveAttribute('href', '/dashboard/proxy-orders');
  expect(screen.getByRole('link', { name: 'View eSIM orders for order 43' })).toHaveAttribute('href', '/dashboard/esim-orders');
  expect(screen.getByRole('link', { name: 'eSIM order history' })).toHaveTextContent('3 in period');
  for (const [name, key] of [['Proxy', 'proxy'], ['VPN', 'vpn'], ['eSIM', 'esim'], ['VPS', 'vps'], ['RDP', 'rdp']]) {
    expect(screen.getByRole('link', { name: `${name} order history` })).toHaveAttribute('href', `/dashboard/${key}-orders`);
  }
});

it('changes the server date filter with the shadcn select and clears old-period rows', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: populated }).mockReturnValueOnce(new Promise(() => {}));
  show();
  await screen.findByText('Global proxy');
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Date range' }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Last 7 days' }));
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders/stats?range=7');
  expect(screen.queryByText('Global proxy')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Loading orders');
});

it('lets customers expand an empty period to all time', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: empty });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Show all time' }));
  expect(await screen.findByRole('link', { name: 'Browse services' })).toHaveAttribute('href', '/dashboard');
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders/stats?range=all');
});

it('distinguishes errors from empty history and supports retry', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: populated });
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your orders.');
  expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  expect(screen.queryByText('No orders in this period')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Global proxy')).toBeInTheDocument();
});

it('retains loaded history with a warning when refreshing fails', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: populated }).mockRejectedValueOnce(new Error('offline'));
  show();
  await screen.findByText('Global proxy');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh orders' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Showing the last loaded orders for this period.');
  expect(screen.getByText('Global proxy')).toBeInTheDocument();
});
