import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import VPNManagement from './VPNManagement';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const order = { id: 1, order_number: 'VPN-100', product_name: 'Monthly VPN', status: 'completed', country: 'United States', created_at: '2026-10-01', auto_renew: false, credentials: { username: 'vpn-user', password: 'secret', server: 'vpn.example', endpoints: ['vpn.example · OpenVPN'] }, vpn_details: { protocol: 'openvpn' } };
function show(path = '/dashboard/vpn-management') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><VPNManagement /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { orders: [order], meta: { total_pages: 1 } } }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('loads all API pages and updates search immediately without another request', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { orders: [order], meta: { total_pages: 2 } } }).mockResolvedValueOnce({ data: { orders: [{ ...order, id: 2, order_number: 'VPN-200', product_name: 'Annual VPN' }], meta: { total_pages: 2 } } });
  show('/dashboard/vpn-management?search=VPN-200');
  expect(await screen.findByText('Annual VPN')).toBeInTheDocument();
  expect(screen.queryByText('Monthly VPN')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search VPN services' }), { target: { value: 'VPN-100' } });
  expect(screen.getByText('Monthly VPN')).toBeInTheDocument();
  expect(screen.queryByText('Annual VPN')).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders', expect.objectContaining({ params: { product_type: 'vpn', page: 2, per_page: 100 } }));
});
it('shows load errors separately from empty services and allows retry', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your VPN services.');
  expect(screen.queryByText('No VPN services yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Try again'));
  expect(await screen.findByText('Monthly VPN')).toBeInTheDocument();
});
it('masks passwords and downloads the returned OpenVPN file', async () => {
  const createObjectURL = vi.fn(() => 'blob:vpn');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  expect(screen.queryByText('secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('secret')).toBeInTheDocument();
  expect(screen.getByText('vpn.example')).toBeInTheDocument();
  const blob = new Blob(['client\nremote vpn.example'], { type: 'application/x-openvpn-profile' });
  vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
  fireEvent.click(screen.getByRole('button', { name: 'Download OpenVPN config' }));
  await waitFor(() => expect(anchorClick).toHaveBeenCalledOnce());
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders/1/download_ovpn', { responseType: 'blob' });
  expect(createObjectURL).toHaveBeenCalledWith(blob);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:vpn');
});
it('keeps download errors in the dialog and allows retry', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  vi.mocked(api.get).mockRejectedValueOnce(new Error('unavailable'));
  fireEvent.click(screen.getByRole('button', { name: 'Download OpenVPN config' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t download the OpenVPN configuration.');
  expect(screen.getByRole('button', { name: 'Download OpenVPN config' })).toBeEnabled();
});
it('refreshes renewal settings in the open dialog after saving', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View details' }));
  fireEvent.click(screen.getByRole('button', { name: 'Renewal' }));
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, auto_renew: true }], meta: { total_pages: 1 } } });
  fireEvent.click(screen.getByRole('button', { name: 'Enable wallet auto-renew' }));
  expect(await screen.findByRole('button', { name: 'Turn off auto-renew' })).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/web/api/orders/1/update_subscription', { auto_renew: true, renewal_method: 'wallet' });
});
it('requires confirmation for eligible reorders and hides connection actions for expired services', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, status: 'expired', reorderable: true }], meta: { total_pages: 1 } } });
  vi.mocked(api.post).mockResolvedValue({ status: 201, data: {} });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Reorder' }));
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Connection' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm reorder' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/web/api/orders/1/reorder'));
});
