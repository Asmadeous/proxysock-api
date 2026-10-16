import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api from '@/services/api';
import RDPTypes from './RDPTypes';
import RDPPlans from './RDPPlans';
vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/utils/redditPixel', () => ({ conversionTracker: { trackViewContent: vi.fn(), trackAddToCart: vi.fn() } }));
const product = { id: 'rdp-basic', name: 'Basic RDP', price: '20', currency: 'USD', cpu_cores: 1, ram_gb: 2, storage_gb: 40, concurrent_users: 2, session_duration_hours: 8, os_templates: ['ubuntu-desktop-rdp', 'windows-server-2022-rdp'], locations: ['Canada', 'GB'], management_types: ['unmanaged', 'managed'], country_pricing: { Canada: { user: 15, reseller: 10 } } };
function show(element = <RDPPlans />, path = '/dashboard/rdp-plans?country=CA') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>{element}</MemoryRouter></QueryClientProvider>);
}
async function choose(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: option }));
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); vi.mocked(api.get).mockResolvedValue({ data: { products: [product] } }); });
afterEach(cleanup);

it('shows only catalog locations with their actual starting prices and supports keyboard navigation', async () => {
  const onNavigate = vi.fn();
  show(<RDPTypes onNavigate={onNavigate} />, '/dashboard/rdp');
  const canada = await screen.findByRole('button', { name: /Canada/ });
  expect(within(canada).getByText('$15.00')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /United Kingdom/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /United States/ })).not.toBeInTheDocument();
  canada.focus();
  await userEvent.setup().keyboard('{Enter}');
  expect(onNavigate).toHaveBeenCalledWith('CA');
});

it('preserves cart configuration, country pricing, term discounts and management charges', async () => {
  localStorage.setItem('cartItems', JSON.stringify([{ product: 'existing' }]));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Configure Basic RDP' }));
  await choose('Operating system', 'Windows Server 2022');
  await choose('Management', 'Fully managed (+40%)');
  await choose('Billing period', '3 months — save 5%');
  expect(screen.getByText('$59.85')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
  expect(await screen.findByRole('status')).toHaveTextContent('RDP added to cart.');
  const cart = JSON.parse(localStorage.getItem('cartItems')!);
  expect(cart).toHaveLength(2);
  expect(cart[0]).toEqual({ product: 'existing' });
  expect(cart[1]).toMatchObject({ productType: 'rdp', osTemplate: 'windows-server-2022-rdp', duration: 3, managementType: 'managed', location: { country: 'Canada', countryCode: 'CA' }, effective_base_price: 15, total_amount: 59.85, rdpPlan: { id: product.id, country_pricing: product.country_pricing } });
  expect(cart[1].hostname).toMatch(/^rdp-/);
  expect(cart[1].rdpUsername).toBe(cart[1].hostname);
  expect(cart[1].rdpPlan.concurrent_users).toBe(2);
  expect(cart[1].rdpPlan.session_duration_hours).toBe(8);
  expect(screen.getByRole('link', { name: 'View cart' })).toHaveAttribute('href', '/dashboard/cart');
});

it('resets configuration on location changes and handles UK aliases', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Configure Basic RDP' }));
  await choose('Desktop location', 'United Kingdom');
  expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Configure Basic RDP' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('$20.00')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to locations' })).toHaveAttribute('href', '/dashboard/rdp');
});

it('prevents purchases with missing catalog OS options instead of inventing defaults', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { products: [{ ...product, os_templates: [] }] } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Configure Basic RDP' }));
  expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
});

it('supports direct purchases and locks configuration until completion', async () => {
  let finish = () => {};
  const onDirectBuy = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  show(<RDPPlans country="GB" isDirectBuy onDirectBuy={onDirectBuy} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Configure Basic RDP' }));
  fireEvent.click(screen.getByRole('button', { name: 'Instantly provision' }));
  expect(onDirectBuy).toHaveBeenCalledExactlyOnceWith('rdp-basic', 1, expect.objectContaining({ os_template: 'ubuntu-desktop-rdp', country_code: 'UK', management_type: 'unmanaged', period: 1 }));
  expect(screen.getByLabelText('Operating system')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Processing…' })).toBeDisabled();
  await act(async () => finish());
  expect(screen.getByRole('status')).toHaveTextContent('RDP purchase completed.');
  expect(localStorage.getItem('cartItems')).toBeNull();
});

it('retains configuration when direct purchasing fails and allows retry', async () => {
  const onDirectBuy = vi.fn().mockRejectedValueOnce({ response: { data: { error: 'Insufficient balance' } } }).mockResolvedValueOnce(undefined);
  show(<RDPPlans isDirectBuy onDirectBuy={onDirectBuy} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Configure Basic RDP' }));
  fireEvent.click(screen.getByRole('button', { name: 'Instantly provision' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient balance');
  expect(screen.getByLabelText('Operating system')).toHaveTextContent('Ubuntu Desktop');
  fireEvent.click(screen.getByRole('button', { name: 'Instantly provision' }));
  expect(await screen.findByRole('status')).toHaveTextContent('RDP purchase completed.');
});

it('distinguishes loading, failed requests and an empty catalog with retry', async () => {
  let fail: (error: Error) => void = () => {};
  vi.mocked(api.get).mockReturnValueOnce(new Promise((_, reject) => { fail = reject; })).mockResolvedValueOnce({ data: { products: [] } });
  show();
  expect(screen.getByRole('status')).toHaveTextContent('Loading RDP plans');
  await act(async () => fail(new Error('offline')));
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load RDP plans.');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'No RDP plans available in this location' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('preserves the infrastructure reseller purchase restriction', async () => {
  localStorage.setItem('resellerUser', JSON.stringify({ reseller_type: 'infrastructure' }));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Configure Basic RDP' }));
  expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
  expect(screen.getByText('Purchasing is unavailable for this reseller account type.')).toBeInTheDocument();
});


it('shows RDP access limits and storage from the catalog', async () => {
  show();
  const configure = await screen.findByRole('button', { name: 'Configure Basic RDP' });
  const card = configure.closest('article')!;
  expect(within(card).getByText('Concurrent users')).toBeInTheDocument();
  expect(within(card).getByText('2')).toBeInTheDocument();
  expect(within(card).getByText('8 hours')).toBeInTheDocument();
  expect(within(card).getByText('40 GB')).toBeInTheDocument();
  fireEvent.click(configure);
  expect(within(screen.getByRole('complementary')).getByText('8 hours')).toBeInTheDocument();
});

it('keeps unlimited sessions distinct from missing session information', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { products: [
    { ...product, session_duration_hours: 0 },
    { ...product, id: 'unknown', name: 'Unknown session RDP', session_duration_hours: null },
  ] } });
  show();
  const unlimited = (await screen.findByRole('button', { name: 'Configure Basic RDP' })).closest('article')!;
  const unknown = screen.getByRole('button', { name: 'Configure Unknown session RDP' }).closest('article')!;
  expect(within(unlimited).getByText('Unlimited')).toBeInTheDocument();
  expect(within(unknown).getByText('Not specified')).toBeInTheDocument();
  expect(within(unknown).queryByText('Unlimited')).not.toBeInTheDocument();
});

it('links country cards to the customer RDP route and calls embedded back navigation', async () => {
  show(<RDPTypes />, '/dashboard/rdp');
  expect(await screen.findByRole('link', { name: /Canada/ })).toHaveAttribute('href', '/dashboard/rdp-plans?country=CA');
  expect(screen.getByRole('link', { name: 'My desktops' })).toHaveAttribute('href', '/dashboard/RDP-management');
  cleanup();
  const onBack = vi.fn();
  show(<RDPPlans onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back to locations' }));
  expect(onBack).toHaveBeenCalledOnce();
});
