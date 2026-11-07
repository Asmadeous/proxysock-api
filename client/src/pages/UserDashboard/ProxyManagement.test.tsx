import { AxiosHeaders } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProxyManagement from './ProxyManagement';
import api, { updateProxyCredentials, whitelistAdd } from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() }, updateProxyCredentials: vi.fn(), rotateProxyIp: vi.fn(), whitelistAdd: vi.fn(), whitelistDelete: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
vi.mock('@/lib/actionCable', () => ({ subscribeToNotifications: vi.fn(), unsubscribe: vi.fn() }));
const order = { id: 1, order_number: 'PX-100', product_name: 'US datacenter', proxy_type: 'datacenter', status: 'completed', provider_order_id: 'provider-1', created_at: '2026-10-01', expires_at: '2026-11-01', auto_renew: false, credentials: { username: 'proxy-user', password: 'secret', endpoints: ['host:8080'] }, proxy_details: { protocol: 'http', whitelist_ips: [] } };
function show(path = '/dashboard/proxy-management') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><ProxyManagement /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { orders: [order], meta: { total_pages: 1 } } }); });
afterEach(cleanup);
it('loads every API page and searches orders from the URL', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { orders: [order], meta: { total_pages: 2 } } }).mockResolvedValueOnce({ data: { orders: [{ ...order, id: 2, order_number: 'PX-200', product_name: 'Mobile plan', proxy_type: 'mobile' }], meta: { total_pages: 2 } } });
  show('/dashboard/proxy-management?search=PX-200');
  expect(await screen.findByText('Mobile plan')).toBeInTheDocument();
  expect(screen.queryByText('US datacenter')).not.toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders', expect.objectContaining({ params: { product_type: 'proxy', page: 2, per_page: 100 } }));
  expect(screen.getByRole('link', { name: 'My services' })).toHaveAttribute('href', '/dashboard/products');
});
it('shows a retryable fetch error instead of an empty service list', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your proxies.');
  expect(screen.queryByText('No proxies yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Try again'));
  expect(await screen.findByText('US datacenter')).toBeInTheDocument();
});
it('keeps credential failures visible and sends the edited credentials', async () => {
  vi.mocked(updateProxyCredentials).mockRejectedValueOnce({ response: { data: { error: 'Password rejected' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  expect(screen.queryByText('secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('secret')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'new-user' } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save credentials' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Password rejected');
  expect(updateProxyCredentials).toHaveBeenCalledWith(1, { username: 'new-user', password: 'new-password' });
  expect(screen.getByLabelText('New password')).toHaveValue('new-password');
});
it('saves allowed IPs and refreshes the open dialog', async () => {
  vi.mocked(whitelistAdd).mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View details' }));
  fireEvent.click(screen.getByRole('button', { name: 'Allowed IPs' }));
  fireEvent.change(screen.getByLabelText('IP address'), { target: { value: '203.0.113.10' } });
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, proxy_details: { protocol: 'http', whitelist_ips: ['203.0.113.10'] } }], meta: { total_pages: 1 } } });
  fireEvent.click(screen.getByRole('button', { name: 'Add IP address' }));
  expect(await screen.findByRole('button', { name: 'Remove 203.0.113.10' })).toBeInTheDocument();
  expect(whitelistAdd).toHaveBeenCalledWith(1, '203.0.113.10', undefined);
});
it('requires explicit reorder confirmation', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, status: 'expired', reorderable: true }], meta: { total_pages: 1 } } });
  vi.mocked(api.post).mockResolvedValue({ status: 201, data: {} });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Reorder' }));
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Connection' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm reorder' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/web/api/orders/1/reorder'));
});
it('enables auto-renew through the wallet subscription endpoint', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View details' }));
  fireEvent.click(screen.getByRole('button', { name: 'Renewal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enable wallet auto-renew' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/web/api/orders/1/update_subscription', { auto_renew: true, renewal_method: 'wallet' }));
});
