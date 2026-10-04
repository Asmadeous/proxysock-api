import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardHome from './DashboardHome';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 9, first_name: 'Demo' }, accessToken: 'test-token' }) }));
const empty = { total_orders: 0, active_services: 0, pending_orders: 0, monthly_spending: 0, last_month_spending: 0, total_spent: 0, type_stats: {}, recent_orders: [] };
let client: QueryClient;
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } }, logger: { log: console.log, warn: console.warn, error: () => {} } });
  render(<QueryClientProvider client={client}><MemoryRouter><DashboardHome /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); client.clear(); });
describe('Dashboard overview', () => {
  it('provides useful starting points for an empty account without fabricated usage metrics', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: empty });
    show();
    expect(await screen.findByText('Your first order belongs here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore VPS' })).toHaveAttribute('href', '/dashboard/vps');
    expect(screen.getByRole('link', { name: 'Explore VPN' })).toHaveAttribute('href', '/dashboard/vpn');
    expect(screen.queryByText('Data Usage')).not.toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
  it('shows actual orders, formats decimal strings and links active services to management', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...empty, total_orders: 4, active_services: 3, monthly_spending: '24.90', type_stats: { vps: { active: 1 }, esim: { active: 1 }, usa_esim: { active: 1 } }, recent_orders: [{ id: 42, product_name: 'Residential VPS', product_type: 'vps', total_amount: '12.45', status: 'awaiting_payment', created_at: '2026-10-04T12:00:00Z' }] } });
    show();
    expect(await screen.findByText('Residential VPS')).toBeInTheDocument();
    expect(screen.getByText('$12.45')).toBeInTheDocument();
    expect(screen.getByText('$24.90')).toBeInTheDocument();
    expect(screen.getByText('awaiting payment')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage VPS' })).toHaveAttribute('href', '/dashboard/VPS-management');
    expect(screen.getByText('2 active')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage eSIM' })).toHaveAttribute('href', '/dashboard/Esim-management');
  });
  it('shows an error rather than empty account data and supports retry', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: empty });
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your overview.');
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
    expect(screen.queryByText('Your first order belongs here.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Your first order belongs here.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
  it('keeps loading distinct from a genuine empty account', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    show();
    expect(screen.getByRole('status')).toHaveTextContent('Loading recent orders');
    expect(screen.queryByText('0 active')).not.toBeInTheDocument();
    expect(screen.queryByText('Your first order belongs here.')).not.toBeInTheDocument();
  });
});
