import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuyProxies from './BuyProxies';
import * as service from '@/services/myProxyService';
vi.mock('@/services/myProxyService', () => ({ fetchProductCategories: vi.fn(), fetchProxiesByCategorySlug: vi.fn(), fetchMobileProxiesByLocation: vi.fn(), fetchResidentialRotatingCountries: vi.fn(), fetchResidentialRotatingStates: vi.fn(), fetchResidentialRotatingCities: vi.fn(), fetchResidentialRotatingIsps: vi.fn() }));
vi.mock('@/utils/redditPixel', () => ({ conversionTracker: { trackViewContent: vi.fn(), trackAddToCart: vi.fn() } }));
vi.mock('@/components/dashboard/Purchase-Products/buy-proxies/RenderISPOptionsWithCountries', () => ({ renderISPOptionsWithCountries: ({ handleISPSelection, handleCitySelection }: { handleISPSelection: (id: number) => void; handleCitySelection: (id: number) => void }) => <><button onClick={() => handleISPSelection(1)}>Choose ISP</button><button onClick={() => handleCitySelection(2)}>Choose city</button></> }));
const category = { id: 1, name: 'Datacenter', slug: 'datacenter', proxy_plans: [{ id: 12, name: 'Starter', price: 3, billing_type: 'monthly', ips_included: 1, isp: [{ id: 1, name: 'Test ISP', locations: { US: { cities: [{ id: 2, name: 'New York', state: 'NY' }] } } }] }] };
function show() { render(<MemoryRouter><BuyProxies /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); vi.mocked(service.fetchProductCategories).mockResolvedValue([category] as never); vi.mocked(service.fetchProxiesByCategorySlug).mockResolvedValue(category as never); });
afterEach(cleanup);
describe('Proxy purchase', () => {
  it('preserves selection, pricing and adding the selected plan to the cart', async () => {
    show();
    const plan = await screen.findByRole('button', { name: 'Select Starter' });
    fireEvent.keyDown(plan, { key: 'Enter' });
    expect(plan).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Choose ISP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose city' }));
    const add = screen.getByRole('button', { name: 'Add to Cart' });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    expect(await screen.findByRole('status')).toHaveTextContent('Added to cart');
    const cart = JSON.parse(localStorage.getItem('cartItems')!);
    expect(cart).toHaveLength(1);
    expect(cart[0].plan.id).toBe(12);
    expect(cart[0].totalPrice).toBe(3);
    expect(cart[0].locationId).toBe(2);
    expect(cart[0].protocol).toBe('http');
    expect(screen.getByRole('link', { name: 'View cart' })).toHaveAttribute('href', '/dashboard/cart');
  });
  it('can retry a failed category request', async () => {
    vi.mocked(service.fetchProductCategories).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([category] as never);
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load proxy categories');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Select Starter' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('does not replace a newly selected category with a late response', async () => {
    const other = { id: 2, name: 'ISP', slug: 'isp', proxy_plans: [{ id: 20, name: 'ISP Starter', price: 5 }] };
    let finish: (data: never) => void = () => {};
    vi.mocked(service.fetchProductCategories).mockResolvedValue([category, other] as never);
    vi.mocked(service.fetchProxiesByCategorySlug).mockImplementation(slug => slug === 'datacenter' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(other as never));
    show();
    fireEvent.click(await screen.findByRole('button', { name: 'ISP' }));
    expect(await screen.findByRole('button', { name: 'Select ISP Starter' })).toBeInTheDocument();
    await act(async () => finish(category as never));
    expect(screen.queryByRole('button', { name: 'Select Starter' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select ISP Starter' })).toBeInTheDocument();
  });
});
