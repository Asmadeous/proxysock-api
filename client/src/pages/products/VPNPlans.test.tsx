import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuyVPN from './VPNPlans';
import { fetchVPNCategory, type VPNCategory } from '@/services/myProxyService';

vi.mock('@/services/myProxyService', () => ({ fetchVPNCategory: vi.fn() }));
const city = { id: 12, name: 'Toronto', state: 'ON', ips_available: 5 };
const isp = { id: 3, name: 'Example ISP', slug: 'example', locations: { CA: { name: 'Canada', cities: [city, { id: 13, name: 'Ottawa', state: 'ON', ips_available: 0 }] } } };
const category: VPNCategory = { id: 'vpn', slug: 'vpn', name: 'VPN Services', vpn_plans: [
  { id: '7', plan_id: 7, name: 'VPN 30 days', price: '12.50', currency: 'USD', bandwidth_gb: 0, features: [], locations: ['Canada'], is_active: true, isp: [isp] },
  { id: '8', plan_id: 8, name: 'VPN 7 days', price: '4.00', currency: 'USD', bandwidth_gb: 10, features: [], locations: ['Canada'], is_active: true, isp: [] },
] };
function show(props: Parameters<typeof BuyVPN>[0] = {}) { return render(<MemoryRouter initialEntries={['/dashboard/vpn']}><BuyVPN {...props} /></MemoryRouter>); }
async function select() {
  fireEvent.click(await screen.findByRole('button', { name: 'Select VPN 30 days' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Toronto ON' }));
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); vi.mocked(fetchVPNCategory).mockResolvedValue(category); });
afterEach(cleanup);

describe('VPN purchase', () => {
  it('supports keyboard selection and preserves the cart payload and existing items', async () => {
    localStorage.setItem('cartItems', JSON.stringify([{ product: 'existing' }]));
    const updated = vi.fn();
    window.addEventListener('cart-updated', updated);
    const user = userEvent.setup();
    show();
    const plan = await screen.findByRole('button', { name: 'Select VPN 30 days' });
    plan.focus();
    await user.keyboard('{Enter}');
    expect(plan).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    expect(screen.queryByRole('radio', { name: /Ottawa/ })).not.toBeInTheDocument();
    screen.getByRole('radio', { name: 'Toronto ON' }).focus();
    await user.keyboard(' ');
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(screen.getByRole('status')).toHaveTextContent('Added to cart.');
    expect(JSON.parse(localStorage.getItem('cartItems')!)).toEqual([{ product: 'existing' }, expect.objectContaining({ product: '7', productType: 'vpn', categorySlug: 'vpn', vpnPlan: category.vpn_plans![0], locations: { isp, city }, locationId: 12, locationsString: 'Example ISP - Toronto, ON (Canada)', period: 30, protocol: 'http', totalPrice: 12.5 })]);
    expect(updated).toHaveBeenCalledWith(expect.objectContaining({ detail: { count: 2 } }));
    window.removeEventListener('cart-updated', updated);
    expect(screen.getByRole('link', { name: 'View cart' })).toHaveAttribute('href', '/dashboard/cart');
  });

  it('clears the location when changing plans and prevents unavailable purchases', async () => {
    show();
    await select();
    fireEvent.click(screen.getByRole('button', { name: 'Select VPN 7 days' }));
    expect(screen.getByText('No locations available for this plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Select VPN 30 days' }));
    expect(screen.getByRole('radio', { name: 'Toronto ON' })).not.toBeChecked();
  });

  it('distinguishes loading, failure with retry, and an empty catalog', async () => {
    let reject: (reason: Error) => void = () => {};
    vi.mocked(fetchVPNCategory).mockReturnValueOnce(new Promise((_, fail) => { reject = fail; })).mockResolvedValueOnce(null);
    show();
    expect(screen.getByRole('status')).toHaveTextContent('Loading VPN plans');
    expect(screen.queryByText('No VPN plans available')).not.toBeInTheDocument();
    await act(async () => reject(new Error('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load VPN plans.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No VPN plans available')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits direct purchases once and reports success without writing a cart', async () => {
    let finish: () => void = () => {};
    const onDirectBuy = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    show({ isDirectBuy: true, onDirectBuy });
    await select();
    fireEvent.click(screen.getByRole('button', { name: 'Instantly provision' }));
    expect(screen.getByRole('button', { name: 'Processing…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Select VPN 7 days' })).toBeDisabled();
    expect(onDirectBuy).toHaveBeenCalledExactlyOnceWith(7, 1, { period: 30, locationId: 12, locationsString: 'Example ISP - Toronto, ON (Canada)' });
    await act(async () => finish());
    expect(screen.getByRole('status')).toHaveTextContent('VPN purchase completed.');
    expect(localStorage.getItem('cartItems')).toBeNull();
  });

  it('retains selections after a failed direct purchase so it can be retried', async () => {
    const onDirectBuy = vi.fn().mockRejectedValueOnce({ response: { data: { error: 'Insufficient balance' } } }).mockResolvedValueOnce(undefined);
    show({ isDirectBuy: true, onDirectBuy });
    await select();
    fireEvent.click(screen.getByRole('button', { name: 'Instantly provision' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient balance');
    expect(screen.getByRole('radio', { name: 'Toronto ON' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Instantly provision' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('VPN purchase completed.'));
  });

  it('preserves a malformed cart and displays a recoverable error', async () => {
    localStorage.setItem('cartItems', '{}');
    show();
    await select();
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your cart could not be read.');
    expect(localStorage.getItem('cartItems')).toBe('{}');
  });

  it('preserves the infrastructure reseller purchase restriction', async () => {
    localStorage.setItem('resellerUser', JSON.stringify({ reseller_type: 'infrastructure' }));
    show();
    await select();
    expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
    expect(screen.getByText('Purchasing is unavailable for this reseller account type.')).toBeInTheDocument();
  });
});
