import { AxiosHeaders } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import VPSManagement from './VPSManagement';
import api, { fetchVms, fetchVmStatus, startVm, stopVm, rebootVm, deleteVm, changeVmPassword } from '@/services/api';
vi.mock('@/services/api', () => ({ default: { post: vi.fn() }, fetchVms: vi.fn(), fetchVmStatus: vi.fn(), startVm: vi.fn(), stopVm: vi.fn(), rebootVm: vi.fn(), deleteVm: vi.fn(), changeVmPassword: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const vm = { id: 'vm-1', order_id: 'order-1', hostname: 'app-server', plan_name: 'VPS plan', status: 'active', os_template: 'ubuntu', ssh_username: 'actual-login', username: 'wrong-fallback', connection_host: 'app.example.com', ip_address: '10.0.0.1', ssh_port: 2222, root_password: 'secret', cpu_cores: 2, ram_gb: 4, storage_gb: 50, auto_renew: false };
const response = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
function show(path = '/dashboard/VPS-management') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><VPSManagement /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchVms).mockResolvedValue(response({ vms: [vm] }));
  vi.mocked(fetchVmStatus).mockResolvedValue(response({ status: 'running', resource_usage: { cpu_percent: 12.5, ram_percent: 25, disk_percent: 0 } }));
  for (const fn of [startVm, stopVm, rebootVm, deleteVm, changeVmPassword]) vi.mocked(fn).mockResolvedValue(response({}));
});
afterEach(cleanup);
it('searches by IP from the URL and shows real SSH credentials', async () => {
  show('/dashboard/VPS-management?search=10.0.0.1');
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  expect(screen.getByText('ssh -p 2222 actual-login@app.example.com')).toBeInTheDocument();
  expect(screen.queryByText('secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('secret')).toBeInTheDocument();
});
it('shows RDP access without suggesting SSH for Windows servers', async () => {
  vi.mocked(fetchVms).mockResolvedValue(response({ vms: [{ ...vm, os_template: 'windows', ssh_port: null, rdp_port: 33890, rdp_username: 'Administrator' }] }));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  expect(screen.getByText('RDP port')).toBeInTheDocument();
  expect(screen.getByText('33890')).toBeInTheDocument();
  expect(screen.queryByText('SSH command')).not.toBeInTheDocument();
});
it('confirms restart before sending the control request', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Restart server' })).toBeEnabled());
  expect(screen.getByText('12.5%')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Restart server' }));
  expect(rebootVm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm restart' }));
  await waitFor(() => expect(rebootVm).toHaveBeenCalledWith('vm-1'));
});
it('requires the hostname before deleting a server', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete server' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Delete server' }));
  expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Type app-server to confirm deletion'), { target: { value: 'app-server' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
  await waitFor(() => expect(deleteVm).toHaveBeenCalledWith('vm-1'));
});
it('uses one password dialog with matching confirmation and shows update errors', async () => {
  vi.mocked(changeVmPassword).mockRejectedValueOnce({ response: { data: { error: 'Server unavailable' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Change password' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
  expect(screen.getByRole('button', { name: 'Update password' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
  expect(changeVmPassword).toHaveBeenCalledWith('vm-1', 'new-password');
});
it('disables server actions if the live status request fails', async () => {
  vi.mocked(fetchVmStatus).mockRejectedValue(new Error('offline'));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Live status is unavailable');
  expect(screen.getByRole('button', { name: 'Delete server' })).toBeDisabled();
});
it('updates renewal using the order ID rather than the VM ID', async () => {
  vi.mocked(api.post).mockResolvedValue(response({}));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Renewal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enable wallet auto-renew' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/web/api/orders/order-1/update_subscription', { auto_renew: true, renewal_method: 'wallet' }));
});
it('shows a retryable error rather than claiming there are no servers', async () => {
  vi.mocked(fetchVms).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your VPS services.');
  fireEvent.click(screen.getByText('Try again'));
  expect(await screen.findByRole('button', { name: 'Manage server' })).toBeInTheDocument();
  expect(within(screen.getByRole('article')).getByText('app-server')).toBeInTheDocument();
});
it('keeps expired services disabled even if the hypervisor still reports running', async () => {
  vi.mocked(fetchVms).mockResolvedValue(response({ vms: [{ ...vm, status: 'expired' }] }));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  await screen.findByText('12.5%');
  expect(screen.getByRole('button', { name: 'Restart server' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Delete server' })).toBeDisabled();
});
