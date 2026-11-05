import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProxyOrders from './ProxyOrders';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const order = { id: 1, order_number: 'PX-100', product_name: 'Proxy plan', proxy_type: 'isp', status: 'completed', total_amount: '12.50', currency: 'USD', created_at: '2026-10-01', expires_at: '2020-01-01', has_invoice: true, credentials: { username: 'proxy-user', password: 'secret', endpoints: ['host:8080'] } };
function show(path = '/dashboard/proxy-orders') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><ProxyOrders /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { orders: [order], meta: { total_pages: 1 } } }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('searches all API pages and paginates the resulting order history', async () => {
  const firstPage = Array.from({ length: 10 }, (_, i) => ({ ...order, id: i + 1, order_number: `PX-${i + 1}` }));
  vi.mocked(api.get).mockResolvedValueOnce({ data: { orders: firstPage, meta: { total_pages: 2 } } }).mockResolvedValueOnce({ data: { orders: [{ ...order, id: 11, order_number: 'PX-11' }], meta: { total_pages: 2 } } });
  show('/dashboard/proxy-orders?search=PX-11');
  expect(await screen.findByText('PX-11')).toBeInTheDocument();
  expect(screen.queryByText('PX-1')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Clear filters'));
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(screen.queryByText('PX-11')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('PX-11')).toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders', expect.objectContaining({ params: { product_type: 'proxy', page: 2, per_page: 100 } }));
});
it('shows failed order details and currency without calling the amount paid or overwriting status with expiry', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, status: 'failed', currency: 'EUR' }], meta: { total_pages: 1 } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order PX-100' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByText('failed')).toBeInTheDocument();
  expect(dialog.getByText('€12.50')).toBeInTheDocument();
  expect(screen.queryByText('Total Paid')).not.toBeInTheDocument();
  expect(dialog.queryByRole('button', { name: 'Download credentials' })).not.toBeInTheDocument();
  expect(dialog.getByRole('link', { name: 'Get order support' })).toHaveAttribute('href', '/dashboard/support?tab=tickets&order_id=PX-100');
});
it('masks the password and opens management with the selected order reference', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order PX-100' }));
  expect(screen.queryByText('secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('secret')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage service' })).toHaveAttribute('href', '/dashboard/proxy-management?search=PX-100');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('link', { name: 'Browse proxies' })).toHaveAttribute('href', '/dashboard/proxies');
});
it('does not offer an empty credential download', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, credentials: {} }], meta: { total_pages: 1 } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order PX-100' }));
  expect(screen.queryByRole('button', { name: 'Download credentials' })).not.toBeInTheDocument();
  expect(screen.getByText(/Connection details are not available yet/)).toBeInTheDocument();
});
it('keeps invoice failures visible and retries the selected order download', async () => {
  const createObjectURL = vi.fn(() => 'blob:invoice');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order PX-100' }));
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Download invoice' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t download the invoice');
  const blob = new Blob(['pdf'], { type: 'application/pdf' });
  vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
  fireEvent.click(screen.getByRole('button', { name: 'Download invoice' }));
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders/1/download_invoice', { responseType: 'blob' });
  expect(createObjectURL).toHaveBeenCalledWith(blob);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:invoice');
});
it('reports load errors separately from an empty history and retries', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your proxy orders.');
  expect(screen.queryByText('No proxy orders yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('PX-100')).toBeInTheDocument();
});
