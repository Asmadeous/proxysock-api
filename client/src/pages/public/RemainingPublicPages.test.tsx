import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Privacy from './Privacy';
import Terms from './Terms';
import CookiePolicy from './CookiePolicy';
import ProxyPurpose from './ProxyPurpose';
import NotFound from '../misc/NotFound';
import PaymentFailed from '../payments/PaymentFailed';
import PaymentSuccess from '../payments/PaymentSuccess';
import ResellerLoginPage from '../Reseller/ResellerLoginPage';
import { resellerLogin } from '@/services/resellerApi';
import { conversionTracker } from '@/utils/redditPixel';

vi.mock('@/services/resellerApi', () => ({ resellerLogin: vi.fn() }));
vi.mock('@/utils/redditPixel', () => ({ conversionTracker: { trackPurchase: vi.fn().mockResolvedValue(undefined) } }));
function Location() { return <span aria-label="Current route">{useLocation().pathname}</span>; }
function show(node: ReactNode, path = '/') {
  return render(<HelmetProvider><MemoryRouter initialEntries={[path]}>{node}<Location /></MemoryRouter></HelmetProvider>);
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it.each([[Privacy, 'Privacy Policy', '/privacy', 10], [Terms, 'Terms of Service', '/terms', 12], [CookiePolicy, 'Cookie Policy', '/cookie-policy', 10]] as const)('provides complete section navigation for policy %#', (Page, title, path, count) => {
  const { container } = show(<Page />, path);
  expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  const links = within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link');
  expect(links).toHaveLength(count);
  links.forEach(link => expect(container.querySelector(link.getAttribute('href')!)).toBeInTheDocument());
  expect(within(screen.getByRole('navigation', { name: 'Legal documents' })).getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
});
it('filters use cases without adding duplicate site navigation', () => {
  const { container } = show(<ProxyPurpose />);
  expect(screen.getByRole('status')).toHaveTextContent('9 use cases');
  fireEvent.click(screen.getByRole('button', { name: 'Research & business' }));
  expect(screen.getByRole('status')).toHaveTextContent('3 use cases');
  expect(screen.getByRole('heading', { name: 'Web scraping' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Gaming' })).not.toBeInTheDocument();
  expect(container.querySelector('footer')).toBeNull();
});
it('offers a reliable home destination from a direct 404 visit', () => {
  show(<NotFound />, '/missing');
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByLabelText('Current route')).toHaveTextContent(/^\/$/);
});
it.each([['deposit', 'Back to dashboard', '/dashboard'], ['order', 'Back to cart', '/dashboard/cart']])('keeps the correct recovery destination for a failed %s', (type, label, href) => {
  show(<PaymentFailed />, `/payments/failed?type=${type}`);
  expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
  expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/contact');
});
it('retains purchase details, order history and cart cleanup after a payment', async () => {
  vi.useFakeTimers();
  localStorage.setItem('lastOrder', JSON.stringify({ orderId: 'order-123', totalValue: 12, currency: 'USD', paymentMethod: 'Card', items: [{ id: 'vps', name: 'VPS plan', category: 'vps', price: 12, quantity: 1 }] }));
  const clearCart = vi.fn();
  show(<PaymentSuccess clearCart={clearCart} />, '/payments/success?order_id=order-123');
  expect(screen.getByText('order-123')).toBeInTheDocument();
  expect(screen.getByText('VPS plan')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View order history' })).toHaveAttribute('href', '/dashboard/orders');
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(clearCart).toHaveBeenCalledTimes(1);
  expect(conversionTracker.trackPurchase).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'order-123', value: 12 }));
});
it('keeps deposit history separate from order history', () => {
  vi.useFakeTimers();
  show(<PaymentSuccess clearCart={vi.fn()} />, '/payments/success?type=deposit&amount=25&order_id=deposit-1');
  expect(screen.getByRole('heading', { name: 'Deposit successful.' })).toBeInTheDocument();
  expect(screen.getByText('$25.00 USD')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View transaction history' })).toHaveAttribute('href', '/dashboard/transactions');
});
it('preserves the cart and pending order when returning from a wallet deposit', async () => {
  vi.useFakeTimers();
  const pendingOrder = JSON.stringify({ orderId: 'pending-order', totalValue: 99, currency: 'USD', paymentMethod: 'Card', items: [{ id: 'vpn', name: 'Pending VPN', category: 'vpn', price: 99 }] });
  localStorage.setItem('lastOrder', pendingOrder);
  localStorage.setItem('cartItems', '[{"productType":"vpn"}]');
  const clearCart = vi.fn(() => localStorage.removeItem('cartItems'));
  show(<PaymentSuccess clearCart={clearCart} />, '/payments/success?type=deposit&amount=25&payment=Heleket&order_id=deposit-1');
  expect(screen.getByRole('heading', { name: 'Deposit successful.' })).toBeInTheDocument();
  expect(screen.getByText('$25.00 USD')).toBeInTheDocument();
  expect(screen.getByText('Heleket')).toBeInTheDocument();
  expect(screen.queryByText('Pending VPN')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View transaction history' })).toHaveAttribute('href', '/dashboard/transactions');
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(clearCart).not.toHaveBeenCalled();
  expect(conversionTracker.trackPurchase).not.toHaveBeenCalled();
  expect(localStorage.getItem('lastOrder')).toBe(pendingOrder);
  expect(localStorage.getItem('cartItems')).toBe('[{"productType":"vpn"}]');
});
it('retains reseller terms acceptance, password reveal, login storage and destination', async () => {
  vi.mocked(resellerLogin).mockResolvedValue({ data: { token: 'test-token', reseller: { id: 'partner-1' } } } as never);
  show(<ResellerLoginPage />, '/reseller/login');
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Read Reseller Terms of Service' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('1. Reseller Tier Definitions')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Accept & Close' }));
  await user.type(screen.getByLabelText('Email address'), 'partner@example.com');
  await user.type(screen.getByLabelText('Password'), 'example-password');
  await user.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(resellerLogin).toHaveBeenCalledWith('partner@example.com', 'example-password');
  expect(localStorage.getItem('resellerToken')).toBe('test-token');
  expect(screen.getByLabelText('Current route')).toHaveTextContent('/reseller');
});
it('shows reseller login errors and keeps the entered email for retry', async () => {
  vi.mocked(resellerLogin).mockRejectedValue(new Error('Invalid credentials'));
  show(<ResellerLoginPage />, '/reseller/login');
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email address'), 'partner@example.com');
  await user.type(screen.getByLabelText('Password'), 'wrong-password');
  await user.click(screen.getByLabelText('I agree to the reseller terms.'));
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  expect(screen.getByLabelText('Email address')).toHaveValue('partner@example.com');
  expect(localStorage.getItem('resellerToken')).toBeNull();
});
