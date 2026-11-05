import { renderHook, act } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { usePaymentCheckoutHandlers } from './usePaymentCheckoutHandlers';
import api from '@/services/api';
import type { CartItem } from '@/types';
vi.mock('@/services/api', () => ({ default: { post: vi.fn() } }));
function props(promoCode?: string) {
  return { cartItems: [{ productType: 'vpn', vpnPlan: { id: 'vpn-1', price: 20 }, totalPrice: 20 }] as CartItem[], userBalance: 15, exchangeRate: null, promoCode,
    setIsLoadingBalance: vi.fn(), setIsAnyPaymentProcessing: vi.fn(), setError: vi.fn(), storeOrderDataForSuccess: vi.fn(() => 'order-1'), setUserBalance: vi.fn(), setIsLoadingPlisio: vi.fn(), setIsLoadingRexpay: vi.fn(), setIsLoadingHundredpay: vi.fn(), setIsLoadingFastspring: vi.fn(), clearCart: vi.fn(), onSuccess: vi.fn() };
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
it('allows server validation of discounted wallet checkout and uses returned order totals', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { orders: [{ total_amount: '10.00' }], available_balance: '5.00' } });
  const options = props('SAVE');
  const { result } = renderHook(() => usePaymentCheckoutHandlers(options));
  await act(async () => result.current.handleBalancePayment());
  expect(api.post).toHaveBeenCalledWith('/web/api/orders/checkout_cart', expect.objectContaining({ payment_method: 'wallet', promo_code: 'SAVE' }));
  expect(options.storeOrderDataForSuccess).toHaveBeenCalledWith(options.cartItems, 10, 'balance');
  expect(options.setUserBalance).toHaveBeenCalledWith(5);
  expect(options.clearCart).toHaveBeenCalledOnce();
  expect(options.onSuccess).toHaveBeenCalledWith('order-1');
});
it('rejects insufficient wallet funds without a promo before sending a request', async () => {
  const options = props();
  const { result } = renderHook(() => usePaymentCheckoutHandlers(options));
  await act(async () => result.current.handleBalancePayment());
  expect(api.post).not.toHaveBeenCalled();
  expect(options.setError).toHaveBeenLastCalledWith(expect.stringContaining('Insufficient balance'));
  expect(options.clearCart).not.toHaveBeenCalled();
});
it('retains the cart when the server rejects a promo checkout', async () => {
  vi.mocked(api.post).mockRejectedValue({ response: { data: { error: 'Promo code has expired' } } });
  const options = props('OLD');
  const { result } = renderHook(() => usePaymentCheckoutHandlers(options));
  await act(async () => result.current.handleBalancePayment());
  expect(options.setError).toHaveBeenLastCalledWith('Promo code has expired');
  expect(options.clearCart).not.toHaveBeenCalled();
  expect(options.onSuccess).not.toHaveBeenCalled();
});
