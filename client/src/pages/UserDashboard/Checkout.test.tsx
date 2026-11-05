import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Checkout from './Checkout';
import api from '@/services/api';
const handlers = vi.hoisted(() => ({ handleBalancePayment: vi.fn(), handleRexpayCheckout: vi.fn() }));
vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/utils/redditPixel', () => ({ useRedditTracking: () => ({ trackPurchase: vi.fn() }) }));
vi.mock('@/components/dashboard/Cart/hook/usePaymentCheckoutHandlers', () => ({ usePaymentCheckoutHandlers: () => handlers }));
const item = { productType: 'vpn', vpnPlan: { id: 'v1', name: 'Monthly VPN', price: 20 }, totalPrice: 20 };
function show() { render(<HelmetProvider><MemoryRouter><Checkout /></MemoryRouter></HelmetProvider>); }
beforeEach(() => { vi.clearAllMocks(); localStorage.setItem('cartItems', JSON.stringify([item])); vi.mocked(api.get).mockResolvedValue({ data: { available_balance: '30.50' } }); });
afterEach(() => { cleanup(); localStorage.clear(); });
it('shows items, accepts decimal balance strings, and preserves payment choices', async () => {
  show();
  expect(await screen.findByText('Available: $30.50')).toBeInTheDocument();
  expect(screen.getByText('Monthly VPN')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to cart' })).toHaveAttribute('href', '/dashboard/cart');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Pay with wallet' })); });
  expect(handlers.handleBalancePayment).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('radio', { name: /Card · RexPay/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue to RexPay' }));
  await waitFor(() => expect(handlers.handleRexpayCheckout).toHaveBeenCalledTimes(1));
});
it('retries a failed balance without disabling card payment', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load your wallet balance.');
  expect(screen.getByRole('button', { name: 'Pay with wallet' })).toBeDisabled();
  fireEvent.click(screen.getByRole('radio', { name: /Card · RexPay/ }));
  expect(screen.getByRole('button', { name: 'Continue to RexPay' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry balance' }));
  expect(await screen.findByText('Available: $30.50')).toBeInTheDocument();
});
it('applies and removes a promo and checks wallet funds against the discounted preview', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { available_balance: 15 } });
  vi.mocked(api.post).mockResolvedValue({ data: { valid: true, code: 'SAVE', discount_type: 'percentage', discount_value: 50 } });
  show();
  await screen.findByText('Available: $15.00');
  expect(screen.getByRole('button', { name: 'Pay with wallet' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Promo or affiliate code'), { target: { value: 'save' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(await screen.findByText('SAVE applied')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pay with wallet' })).toBeEnabled();
  expect(screen.getByText('$10.00')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove promo code' }));
  expect(screen.getByRole('button', { name: 'Pay with wallet' })).toBeDisabled();
});
it('keeps an invalid promo visible for correction', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { valid: false, error: 'Code expired' } });
  show();
  await screen.findByText('Available: $30.50');
  fireEvent.change(screen.getByLabelText('Promo or affiliate code'), { target: { value: 'OLD' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Code expired');
  expect(screen.getByLabelText('Promo or affiliate code')).toHaveValue('OLD');
});
