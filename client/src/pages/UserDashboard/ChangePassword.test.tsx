import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ChangePassword from './ChangePassword';
import api from '@/services/api';
vi.mock('@/services/api', () => ({ default: { post: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'demo', email: 'demo@example.com' } }) }));
function show() { render(<HelmetProvider><MemoryRouter><ChangePassword /></MemoryRouter></HelmetProvider>); }
function fill(current = 'Current123!', next = 'NextPassword123!', confirm = next) {
  for (const [label, value] of [['Current password', current], ['New password', next], ['Confirm new password', confirm]]) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
}
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('provides password-manager hints, independent visibility controls, and recovery links', () => {
  show();
  const current = screen.getByLabelText('Current password', { exact: true });
  expect(current).toHaveAttribute('autocomplete', 'current-password');
  expect(screen.getByLabelText('New password', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
  fireEvent.click(screen.getByRole('button', { name: 'Show current password' }));
  expect(current).toHaveAttribute('type', 'text');
  expect(screen.getByLabelText('New password', { exact: true })).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Hide current password' }));
  expect(current).toHaveAttribute('type', 'password');
  expect(screen.getByRole('link', { name: 'Forgot your current password?' })).toHaveAttribute('href', '/forgot-password');
});

it('blocks empty, short and mismatched passwords and focuses the first invalid field', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(screen.getByLabelText('Current password', { exact: true })).toHaveFocus();
  expect(screen.getAllByRole('alert')).toHaveLength(3);
  fill('old-password', 'short', 'different');
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(screen.getByLabelText('New password', { exact: true })).toHaveFocus();
  expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

it('revalidates confirmation when the new password changes', () => {
  show(); fill();
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: 'DifferentPassword123!' } });
  expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: 'DifferentPassword123!' } });
  expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument();
});

it('sends exact password values and clears and hides fields after success', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { message: 'Password changed successfully' } });
  show(); fill(' Current123! ', ' NextPassword123! ');
  fireEvent.click(screen.getByRole('button', { name: 'Show new password' }));
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Your password has been changed.');
  expect(api.post).toHaveBeenCalledWith('/web/api/auth/change_password', { current_password: ' Current123! ', new_password: ' NextPassword123! ', password_confirmation: ' NextPassword123! ' });
  for (const label of ['Current password', 'New password', 'Confirm new password']) {
    expect(screen.getByLabelText(label, { exact: true })).toHaveValue('');
    expect(screen.getByLabelText(label, { exact: true })).toHaveAttribute('type', 'password');
  }
});

it('prevents repeated submissions while a request is pending', async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(api.post).mockReturnValue(new Promise(done => { resolve = done; }));
  show(); fill();
  const button = screen.getByRole('button', { name: 'Update password' });
  fireEvent.click(button); fireEvent.click(button);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Current password', { exact: true })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Updating password…' })).toBeDisabled();
  await act(async () => resolve({ data: {} }));
});

it('shows server errors and retains entries for correction and retry', async () => {
  vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { error: 'Current password is incorrect' } } }).mockResolvedValueOnce({ data: {} });
  show(); fill();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
  expect(screen.getByLabelText('New password', { exact: true })).toHaveValue('NextPassword123!');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Current password', { exact: true }), { target: { value: 'CorrectPassword123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('status')).toBeInTheDocument();
});
