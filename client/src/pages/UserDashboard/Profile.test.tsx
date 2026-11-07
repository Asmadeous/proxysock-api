import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Profile from './Profile';
import api from '@/services/api';
const auth = vi.hoisted(() => ({ user: { id: 9, username: 'demo', first_name: 'Demo', last_name: 'User', country: 'United States', city: 'Austin', country_code: 'US', email: 'demo@example.com', status: 'active', profile_picture_url: '/old.png' }, setUser: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/services/api', () => ({ default: { patch: vi.fn() }, formatImageUrl: (url?: string) => url || '' }));
const original = { ...auth.user };
function show() { render(<HelmetProvider><MemoryRouter><Profile /></MemoryRouter></HelmetProvider>); }
beforeEach(() => {
  vi.clearAllMocks(); auth.user = { ...original }; auth.setUser.mockImplementation(user => { auth.user = user; });
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('keeps account details read-only and links to password and wallet settings', () => {
  show();
  expect(screen.getByLabelText('Username', { exact: false })).toHaveAttribute('readonly');
  expect(screen.getByRole('link', { name: 'Change password' })).toHaveAttribute('href', '/dashboard/change-password');
  expect(screen.getByRole('link', { name: 'View wallet activity' })).toHaveAttribute('href', '/dashboard/transactions');
  expect(screen.getByText('demo@example.com')).toBeInTheDocument();
});

it('restores saved values and releases the photo preview when cancelling', async () => {
  show(); fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Draft' } });
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] } });
  expect(await screen.findByRole('img', { name: 'Your profile' })).toHaveAttribute('src', 'blob:preview');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByLabelText('First name')).toHaveValue('Demo');
  expect(screen.getByRole('img', { name: 'Your profile' })).toHaveAttribute('src', '/old.png');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  expect(api.patch).not.toHaveBeenCalled();
});

it('validates usernames before saving and updates the shared account after success', async () => {
  vi.mocked(api.patch).mockResolvedValue({ data: { user: { ...original, username: 'newname' } } });
  show(); fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.change(screen.getByLabelText('Username', { exact: false }), { target: { value: 'a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('at least 3 characters');
  expect(api.patch).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Username', { exact: false }), { target: { value: ' newname ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Your profile has been updated.');
  expect(api.patch).toHaveBeenCalledWith('/web/api/auth/update_profile', expect.objectContaining({ username: 'newname', country_code: 'US' }), { headers: {} });
  expect(screen.getByLabelText('Username', { exact: false })).toHaveValue('newname');
  expect(auth.setUser).toHaveBeenCalled();
});

it('rejects invalid and oversized photos before submitting', () => {
  show(); fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  const input = screen.getByLabelText('Choose photo');
  fireEvent.change(input, { target: { files: [new File(['text'], 'test.txt', { type: 'text/plain' })] } });
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG');
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  const file = new File(['photo'], 'large.png', { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
  fireEvent.change(input, { target: { files: [file] } });
  expect(screen.getByRole('alert')).toHaveTextContent('no larger than 5 MB');
  fireEvent.click(screen.getByRole('button', { name: 'Keep current photo' }));
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  expect(api.patch).not.toHaveBeenCalled();
});

it('uploads an accepted photo with all editable fields as multipart data', async () => {
  vi.mocked(api.patch).mockResolvedValue({ data: { user: { ...original, profile_picture_url: '/new.png' } } });
  show(); fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  const file = new File(['photo'], 'photo.webp', { type: 'image/webp' });
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByRole('status');
  const payload = vi.mocked(api.patch).mock.calls[0][1] as FormData;
  expect(payload.get('avatar')).toBe(file);
  expect(payload.get('username')).toBe('demo');
  expect(payload.get('city')).toBe('Austin');
  expect(screen.getByRole('img', { name: 'Your profile' })).toHaveAttribute('src', '/new.png');
});

it('retains edits and displays structured server validation errors', async () => {
  vi.mocked(api.patch).mockRejectedValue({ response: { data: { errors: { username: ['is already taken'] } } } });
  show(); fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('username is already taken');
  expect(screen.getByLabelText('First name')).toHaveValue('Draft');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
});
