import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api from '@/services/api';
import AffiliateProgram from './AffiliateProgram';

vi.mock('@/services/api', () => ({ default: { post: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function show() {
  render(<HelmetProvider><MemoryRouter><AffiliateProgram /></MemoryRouter></HelmetProvider>);
}
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Full name'), 'Sam Partner');
  await user.type(screen.getByLabelText('Email address'), 'sam@example.com');
  await user.type(screen.getByLabelText('About your audience & project'), 'I publish tutorials at example.com.');
  return user;
}
it('submits the existing inquiry payload once and confirms success without enrolling the visitor', async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(api.post).mockReturnValue(new Promise(done => { resolve = done; }));
  show();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Submit partnership inquiry' }));
  expect(screen.getByRole('button', { name: 'Sending inquiry…' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'Affiliate partnership application' }));
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith('/api/v1/guest_chats', expect.objectContaining({
    guest_name: 'Sam Partner', guest_email: 'sam@example.com',
    subject: 'New Affiliate Application: Sam Partner',
    message: expect.stringContaining('I publish tutorials at example.com.'),
  }));
  await act(async () => resolve({ data: {} }));
  expect(screen.getByRole('status')).toHaveTextContent('Your inquiry is with us.');
  expect(screen.getByLabelText('Full name')).toHaveValue('');
});
it('preserves the application after a failure and lets the visitor retry', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce({ data: {} });
  show();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Submit partnership inquiry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t send your inquiry.');
  expect(screen.getByLabelText('Email address')).toHaveValue('sam@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit partnership inquiry' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your inquiry is with us.'));
  expect(api.post).toHaveBeenCalledTimes(2);
});
it('keeps application anchors, account access and program explanations available', async () => {
  show();
  screen.getAllByRole('link', { name: /Apply for partnership/ }).forEach(link => expect(link).toHaveAttribute('href', '#apply-form'));
  expect(screen.getByRole('link', { name: 'Affiliate dashboard' })).toHaveAttribute('href', '/dashboard/affiliate');
  expect(screen.getByRole('button', { name: 'Submit partnership inquiry' })).toBeDisabled();
  fireEvent.click(screen.getByText('What commission will I earn?'));
  expect(screen.getByRole('button', { name: 'What commission will I earn?' })).toHaveAttribute('aria-expanded', 'true');
});
