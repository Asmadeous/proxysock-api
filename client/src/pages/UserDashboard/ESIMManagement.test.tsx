import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ESIMManagement from './ESIMManagement';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
vi.mock('./EsimTopupDialog', () => ({ default: ({ orderId }: { orderId: string }) => <div role="dialog">Top-up order {orderId}</div> }));
const profile = { id: 10, iccid: '8900100', activation_code: 'LPA:1$example.com$activation-token', data_label: 'Unlimited', used_volume: 512, validity_days: 7, status: 'available', location_name: 'United States' };
const order = { id: 1, order_number: 'ES-100', product_name: 'Travel eSIM', product_type: 'esim', status: 'completed', created_at: '2026-10-01', expires_at: '2026-10-31', auto_renew: false, profiles: [profile] };
function show(path = '/dashboard/Esim-management') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><ESIMManagement /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { orders: [order], meta: { total_pages: 1 } } }); });
afterEach(cleanup);
it('preserves multiple profiles and searches across every page', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { orders: [order], meta: { total_pages: 2 } } }).mockResolvedValueOnce({ data: { orders: [{ ...order, id: 2, order_number: 'ES-200', profiles: [profile, { ...profile, id: 11, iccid: '8900200' }] }], meta: { total_pages: 2 } } });
  show('/dashboard/Esim-management?search=8900200');
  expect(await screen.findByText('ICCID 8900200')).toBeInTheDocument();
  expect(screen.queryByText('ICCID 8900100')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Clear filters'));
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders', expect.objectContaining({ params: { product_type: 'esim,usa_esim', page: 2, per_page: 100 } }));
});
it('shows actual allowance and usage without inventing a profile expiry', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View details' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByText('Unlimited')).toBeInTheDocument();
  expect(dialog.getByText('0.50 GB')).toBeInTheDocument();
  expect(dialog.getByText('7 days')).toBeInTheDocument();
  expect(dialog.getByText('Not available')).toBeInTheDocument();
  expect(dialog.getByText('available')).toBeInTheDocument();
});
it('draws a QR code from activation data when no image URL is supplied', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Install eSIM' }));
  expect(screen.getByLabelText('eSIM installation QR code').tagName.toLowerCase()).toBe('svg');
  expect(screen.getByText(profile.activation_code)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Copy Activation code' })).toBeInTheDocument();
});
it('keeps pending orders visible when there are no profiles', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, status: 'processing', profiles: [], review_pending: true }], meta: { total_pages: 1 } } });
  show();
  expect(await screen.findByText('Awaiting profile')).toBeInTheDocument();
  expect(screen.getByText(/Your order is being reviewed/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View details' }));
  expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Renewal' })).not.toBeInTheDocument();
});
it('uses the parent order ID for renewal and refreshes the dialog', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View details' }));
  fireEvent.click(screen.getByRole('button', { name: 'Renewal' }));
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, auto_renew: true }], meta: { total_pages: 1 } } });
  fireEvent.click(screen.getByRole('button', { name: 'Enable wallet auto-renew' }));
  expect(await screen.findByRole('button', { name: 'Turn off auto-renew' })).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/web/api/orders/1/update_subscription', { auto_renew: true, renewal_method: 'wallet' });
});
it('opens top-ups only for eligible lines, using the parent order ID', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, topup_eligible: true }], meta: { total_pages: 1 } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Top up line' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Top-up order 1');
  expect(api.post).not.toHaveBeenCalled();
});
it('shows retryable errors rather than an empty service list', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your eSIM services.');
  expect(screen.queryByText('No eSIM services yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Try again'));
  await waitFor(() => expect(screen.getByText('Travel eSIM')).toBeInTheDocument());
});
