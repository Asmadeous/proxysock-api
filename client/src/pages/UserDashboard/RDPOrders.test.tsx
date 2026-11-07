import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RDPOrders from './RDPOrders';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const order = { id: 1, order_number: 'RDP-100', product_name: 'RDP plan', country: 'Germany', vm_id: 101, hostname: 'my-server', connection_host: 'my-server.example.com', ssh_port: 2222, rdp_port: 51577, has_rdp_config: true, cpu_cores: 4, ram_gb: 8, storage_gb: 80, status: 'completed', total_amount: '12.50', currency: 'USD', created_at: '2026-10-01', expires_at: '2020-01-01', has_invoice: true, credentials: { username: 'proxy-user', password: 'secret', endpoints: ['host:8080'] } };
function show(path = '/dashboard/rdp-orders') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><RDPOrders /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { orders: [order], meta: { total_pages: 1 } } }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('searches all API pages and paginates the resulting order history', async () => {
  const firstPage = Array.from({ length: 10 }, (_, i) => ({ ...order, id: i + 1, order_number: `RDP-${i + 1}` }));
  vi.mocked(api.get).mockResolvedValueOnce({ data: { orders: firstPage, meta: { total_pages: 2 } } }).mockResolvedValueOnce({ data: { orders: [{ ...order, id: 11, order_number: 'RDP-11' }], meta: { total_pages: 2 } } });
  show('/dashboard/rdp-orders?search=RDP-11');
  expect(await screen.findByText('RDP-11')).toBeInTheDocument();
  expect(screen.queryByText('RDP-1')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Clear filters'));
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(screen.queryByText('RDP-11')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('RDP-11')).toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders', expect.objectContaining({ params: { product_type: 'rdp', page: 2, per_page: 100 } }));
});
it('shows failed order details and currency without calling the amount paid or overwriting status with expiry', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, status: 'failed', currency: 'EUR' }], meta: { total_pages: 1 } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByText('failed')).toBeInTheDocument();
  expect(dialog.getByText('€12.50')).toBeInTheDocument();
  expect(screen.queryByText('Total Paid')).not.toBeInTheDocument();
  expect(dialog.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument();
  expect(dialog.getByRole('link', { name: 'Get order support' })).toHaveAttribute('href', '/dashboard/support?tab=tickets&order_id=RDP-100');
});
it('masks the password and opens management with the selected order reference', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  expect(screen.queryByText('secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('secret')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage service' })).toHaveAttribute('href', '/dashboard/RDP-management?search=101');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('link', { name: 'Browse RDP plans' })).toHaveAttribute('href', '/dashboard/rdp');
});
it('does not invent a connection or unlimited bandwidth when details are missing', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, credentials: {}, connection_host: null, dns_name: null, ssh_port: null, rdp_port: null, bandwidth_gb: null }] } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  expect(screen.getByText(/Connection details are not available yet/)).toBeInTheDocument();
  expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
  expect(screen.queryByText('SSH command')).not.toBeInTheDocument();
});
it('keeps invoice failures visible and retries the selected order download', async () => {
  const createObjectURL = vi.fn(() => 'blob:invoice');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
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
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your RDP orders.');
  expect(screen.queryByText('No RDP orders yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('RDP-100')).toBeInTheDocument();
});


it('shows RDP connection details even when SSH is also available', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  expect(screen.getByText('my-server.example.com:51577')).toBeInTheDocument();
  expect(screen.getByText('4 vCPU')).toBeInTheDocument();
  expect(screen.getByText('8 GB')).toBeInTheDocument();
  expect(screen.getByText('80 GB')).toBeInTheDocument();
});
it('uses Remote Desktop for an RDP-backed RDP without inventing SSH access', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, ssh_port: null, rdp_port: 51577 }] } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  expect(screen.getByText('Remote Desktop address')).toBeInTheDocument();
  expect(screen.getByText('my-server.example.com:51577')).toBeInTheDocument();
  expect(screen.queryByText('SSH command')).not.toBeInTheDocument();
});
it('downloads a readable order file with the assigned connection and cleans up the URL', async () => {
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:details');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download order details' }));
  expect(createObjectURL).toHaveBeenCalledOnce();
  const blob = createObjectURL.mock.calls[0][0] as Blob;
  const text = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob); });
  expect(text).toContain('Server address: my-server.example.com');
  expect(text).toContain('CPU: 4 vCPU');
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:details');
});

it('reports RDP file failures without substituting a text file and allows retry', async () => {
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:rdp');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Download RDP connection file' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t download the RDP connection file');
  expect(click).not.toHaveBeenCalled();
  const blob = new Blob(['full address:s:my-server.example.com:51577'], { type: 'application/rdp' });
  vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
  fireEvent.click(screen.getByRole('button', { name: 'Download RDP connection file' }));
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(api.get).toHaveBeenLastCalledWith('/web/api/orders/1/download_rdp_config', { responseType: 'blob' });
  expect(createObjectURL).toHaveBeenCalledWith(blob);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:rdp');
});
it('prefers the assigned RDP login and brackets IPv6 addresses', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { orders: [{ ...order, connection_host: '2001:db8::1', vm_details: { rdp_username: 'desktop-user', root_password: 'desktop-secret' } }] } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View order RDP-100' }));
  expect(screen.getByText('desktop-user')).toBeInTheDocument();
  expect(screen.getByText('[2001:db8::1]:51577')).toBeInTheDocument();
  expect(screen.queryByText('desktop-secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('desktop-secret')).toBeInTheDocument();
});
