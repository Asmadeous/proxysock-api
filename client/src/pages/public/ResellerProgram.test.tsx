import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api from '@/services/api';
import ResellerProgram from './ResellerProgram';

vi.mock('@/services/api', () => ({ default: { post: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function show() { render(<HelmetProvider><MemoryRouter><ResellerProgram /></MemoryRouter></HelmetProvider>); }
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Full name'), 'Sam Partner');
  await user.type(screen.getByLabelText('Work email'), 'sam@example.com');
  await user.type(screen.getByLabelText('Company name'), 'Example Hosting');
  return user;
}
it('keeps the partnership explanation and application selection in sync in both directions', async () => {
  show();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Infrastructure Partner' }));
  expect(screen.getByLabelText('Partnership type')).toHaveValue('infrastructure');
  expect(screen.getByRole('heading', { name: 'Your customers. A connected backend.' })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Partnership type'), 'api_only');
  expect(screen.getByRole('button', { name: 'API Reseller' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: 'Your platform. Our provisioning.' })).toBeInTheDocument();
});
it('lets specialists select one product while other partnerships allow several', async () => {
  show();
  const user = userEvent.setup();
  await user.click(screen.getByRole('checkbox', { name: 'Proxies' }));
  await user.click(screen.getByRole('checkbox', { name: 'VPS' }));
  await user.click(screen.getByRole('button', { name: 'Single Product Specialist' }));
  expect(screen.getByRole('radio', { name: 'Proxies' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'VPS' })).not.toBeChecked();
  await user.click(screen.getByRole('radio', { name: 'eSIM' }));
  expect(screen.getByRole('radio', { name: 'eSIM' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Proxies' })).not.toBeChecked();
});
it('sends business, partnership, product and volume details once and confirms receipt', async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(api.post).mockReturnValue(new Promise(done => { resolve = done; }));
  show();
  const user = await fill();
  await user.selectOptions(screen.getByLabelText('Partnership type'), 'infrastructure');
  await user.selectOptions(screen.getByLabelText('Monthly volume (optional)'), '1k-5k');
  await user.click(screen.getByRole('checkbox', { name: 'VPS' }));
  await user.click(screen.getByRole('button', { name: 'Submit reseller application' }));
  const form = screen.getByRole('form', { name: 'Reseller application' });
  expect(within(form).getByRole('button', { name: 'Sending application…' })).toBeDisabled();
  fireEvent.submit(form);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith('/api/v1/guest_chats', expect.objectContaining({
    guest_name: 'Sam Partner', guest_email: 'sam@example.com', subject: 'New Reseller Application: Example Hosting',
    message: expect.stringContaining('Reseller Type: infrastructure\nProducts Wanted: vps\nExpected Volume: 1k-5k'),
  }));
  await act(async () => resolve({ data: {} }));
  expect(screen.getByRole('status')).toHaveTextContent('Your application is with us.');
  expect(screen.getByLabelText('Company name')).toHaveValue('');
});
it('keeps the full application after failure and supports retry', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ data: {} });
  show();
  const user = await fill();
  await user.click(screen.getByRole('checkbox', { name: 'VPN' }));
  await user.click(screen.getByRole('button', { name: 'Submit reseller application' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your details are still here.');
  expect(screen.getByLabelText('Company name')).toHaveValue('Example Hosting');
  expect(screen.getByRole('checkbox', { name: 'VPN' })).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Submit reseller application' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Your application is with us.');
  expect(screen.getByRole('link', { name: 'Reseller sign in' })).toHaveAttribute('href', '/reseller/login');
});
