import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import api from '../../services/api';
import Cart from './Cart';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));
const vpn = { productType: 'vpn', vpnPlan: { id: 'vpn-1', name: 'Monthly VPN', price: 5, currency_code: 'USD' }, totalPrice: 5 };
const esim = { productType: 'esim', quantity: 1, esimPackage: { name: 'Travel data', price: 10, location_code: 'US', duration: 7 }, totalPrice: 10 };
const saved = () => JSON.parse(localStorage.getItem('cartItems')!);
const open = (items: unknown[] = [vpn]) => {
  localStorage.setItem('cartItems', JSON.stringify(items));
  return render(<HelmetProvider><MemoryRouter><Cart /></MemoryRouter></HelmetProvider>);
};
beforeEach(() => { localStorage.clear(); vi.mocked(api.get).mockReset().mockResolvedValue({ data: { available_balance: '100.50' } }); });
afterEach(cleanup);

it('updates the summary and saved cart when quantities change or items are removed', async () => {
  open([vpn, esim]);
  const summary = screen.getByRole('complementary', { name: 'Order summary' });
  expect(within(summary).getAllByText('$15.00')).toHaveLength(2);
  expect(await screen.findByText('$100.50')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Increase eSIM quantity' }));
  expect(saved()[1].quantity).toBe(2);
  expect(within(summary).getAllByText('$25.00')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Monthly VPN from cart' }));
  expect(saved()).toHaveLength(1);
  expect(within(summary).getAllByText('$20.00')).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Proceed to checkout' })).toHaveAttribute('href', '/dashboard/checkout');
  fireEvent.click(screen.getByRole('button', { name: 'Clear cart' }));
  expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  expect(localStorage.getItem('cartItems')).toBeNull();
  expect(screen.getByRole('link', { name: 'VPS hosting' })).toHaveAttribute('href', '/dashboard/vps');
});

it('requires confirmation before saving auto renewal', async () => {
  open();
  await screen.findByText('$100.50');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Auto-Renew Subscription' }));
  expect(screen.getByRole('dialog', { name: 'Enable Auto-Renewal?' })).toBeInTheDocument();
  expect(saved()[0].auto_renew).not.toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(saved()[0].auto_renew).not.toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Auto-Renew Subscription' }));
  fireEvent.click(screen.getByRole('button', { name: 'I Understand, Enable' }));
  expect(saved()[0].auto_renew).toBe(true);
});

it('shows a failed balance request honestly and lets the customer retry', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('Offline'));
  open();
  expect(await screen.findByText('Balance unavailable.')).toBeInTheDocument();
  expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry balance' }));
  expect(await screen.findByText('$100.50')).toBeInTheDocument();
});

it('allows recovery from malformed saved data without silently clearing it', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.setItem('cartItems', '{"invalid":true}');
  render(<HelmetProvider><MemoryRouter><Cart /></MemoryRouter></HelmetProvider>);
  expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load your saved cart.');
  expect(localStorage.getItem('cartItems')).toBe('{"invalid":true}');
  expect(screen.queryByRole('link', { name: 'Proceed to checkout' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear saved cart' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument());
  log.mockRestore();
});
