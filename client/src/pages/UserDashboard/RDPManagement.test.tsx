import { AxiosHeaders } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RDPManagement from './RDPManagement';
import api, { fetchVms, fetchVmStatus, startVm, stopVm, changeVmPassword } from '@/services/api';
vi.mock('@/services/api', () => ({ default: { post: vi.fn() }, fetchVms: vi.fn(), fetchVmStatus: vi.fn(), startVm: vi.fn(), stopVm: vi.fn(), rebootVm: vi.fn(), deleteVm: vi.fn(), changeVmPassword: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const vm = { id: 'desktop-1', order_id: 'order-5', hostname: 'work-desktop', status: 'active', os_template: 'ubuntu', rdp_username: 'desktop-user', ssh_username: 'ssh-user', username: 'fallback-user', connection_host: 'desktop.example.com', ip_address: '10.0.0.1', rdp_port: 55120, ssh_port: 22, rdp_password: 'desktop-secret', root_password: 'root-secret' };
const response = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
function show(path = '/dashboard/RDP-management') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}><RDPManagement /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchVms).mockResolvedValue(response({ vms: [vm] }));
  vi.mocked(fetchVmStatus).mockResolvedValue(response({ status: 'running', resource_usage: null }));
  vi.mocked(startVm).mockResolvedValue(response({}));
  vi.mocked(stopVm).mockResolvedValue(response({}));
});
afterEach(cleanup);
it('requests only RDP instances and searches by the remote desktop username', async () => {
  show('/dashboard/RDP-management?search=desktop-user');
  expect(await screen.findByText('work-desktop')).toBeInTheDocument();
  expect(fetchVms).toHaveBeenCalledWith({ vm_type: 'rdp' });
  expect(screen.getByRole('link', { name: 'Browse RDP plans' })).toHaveAttribute('href', '/dashboard/rdp');
  fireEvent.change(screen.getByRole('textbox', { name: 'Search RDP services' }), { target: { value: 'missing-desktop' } });
  expect(screen.getByText('No matching RDP services')).toBeInTheDocument();
});
it('uses RDP credentials for Linux desktops even when SSH is also available', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  expect(screen.getByText('desktop.example.com:55120')).toBeInTheDocument();
  expect(screen.getByText('desktop-user')).toBeInTheDocument();
  expect(screen.queryByText('SSH command')).not.toBeInTheDocument();
  expect(screen.queryByText('desktop-secret')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByText('desktop-secret')).toBeInTheDocument();
  expect(screen.queryByText('root-secret')).not.toBeInTheDocument();
});
it('requires confirmation before stopping a desktop', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stop server' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Stop server' }));
  expect(stopVm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm stop' }));
  await waitFor(() => expect(stopVm).toHaveBeenCalledWith('desktop-1'));
});
it('allows starting a stopped desktop and disables restart', async () => {
  vi.mocked(fetchVmStatus).mockResolvedValue(response({ status: 'stopped', resource_usage: null }));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start server' })).toBeEnabled());
  expect(screen.getByRole('button', { name: 'Restart server' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Start server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm start' }));
  await waitFor(() => expect(startVm).toHaveBeenCalledWith('desktop-1'));
});
it('submits matching passwords against the selected desktop', async () => {
  vi.mocked(changeVmPassword).mockResolvedValue(response({}));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Connection details' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Change password' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-secret' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  await waitFor(() => expect(changeVmPassword).toHaveBeenCalledWith('desktop-1', 'new-secret'));
});
it('retains renewal failures in the dialog and targets the parent order', async () => {
  vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { error: 'Unable to update renewal' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Manage server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Renewal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enable wallet auto-renew' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to update renewal');
  expect(api.post).toHaveBeenCalledWith('/web/api/orders/order-5/update_subscription', { auto_renew: true, renewal_method: 'wallet' });
});
