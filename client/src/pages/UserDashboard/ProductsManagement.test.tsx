import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProductManagementPage from './ProductsManagement';
import api from '@/services/api';

vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 9 }, accessToken: 'test-token' }) }));
let client: QueryClient;
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } }, logger: { log: console.log, warn: console.warn, error: () => {} } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter><ProductManagementPage /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); client.clear(); });
const stats = { type_stats: { vps: { total: 6, active: 2, pending: 1, expired: 2, failed: 1 }, esim: { total: 2, active: 1 }, usa_esim: { total: 3, active: 2 } } };

it('shows status counts, combines phone and data eSIMs, and preserves management routes', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: stats });
  show();
  expect(await screen.findByText('6 service orders')).toBeInTheDocument();
  const esim = within(screen.getByRole('article', { name: 'eSIM' }));
  expect(esim.getByText('5 service orders')).toBeInTheDocument();
  expect(esim.getByText('Active').nextElementSibling).toHaveTextContent('3');
  const vps = within(screen.getByRole('article', { name: 'VPS hosting' }));
  expect(vps.getByText('Inactive').nextElementSibling).toHaveTextContent('2');
  expect(vps.getByText('Issues').nextElementSibling).toHaveTextContent('1');
  expect(screen.queryByText('Running')).not.toBeInTheDocument();
  for (const [name, route] of [['Proxies', 'proxy-management'], ['VPN', 'vpn-management'], ['eSIM', 'Esim-management'], ['VPS hosting', 'VPS-management'], ['RDP Access', 'RDP-management']]) {
    expect(screen.getByRole('link', { name: `Manage ${name}` })).toHaveAttribute('href', `/dashboard/${route}`);
  }
});

it('offers purchase links for all five service types on an empty account', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { type_stats: {} } });
  show();
  expect(await screen.findByText('No services yet. Choose a service below to browse plans.')).toBeInTheDocument();
  for (const [name, route] of [['Proxies', 'proxies'], ['VPN', 'vpn'], ['eSIM', 'esim'], ['VPS hosting', 'vps'], ['RDP Access', 'rdp']]) {
    expect(screen.getByRole('link', { name: `Browse ${name} plans` })).toHaveAttribute('href', `/dashboard/${route}`);
  }
});

it('does not show empty counts while loading', () => {
  vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
  show();
  expect(screen.getByRole('status')).toHaveTextContent('Loading your services');
  expect(screen.queryByText('No services yet')).not.toBeInTheDocument();
  expect(screen.queryByText('0')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh services' })).toBeDisabled();
});

it('keeps management available on failure and retries without fabricating zero counts', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: stats });
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your services.');
  expect(screen.queryByText('0')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage VPN' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('6 service orders')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('retains previous counts and explains a failed refresh', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: stats }).mockRejectedValueOnce(new Error('offline'));
  show();
  await screen.findByText('6 service orders');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh services' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Showing the last loaded counts.');
  expect(screen.getByText('6 service orders')).toBeInTheDocument();
});
