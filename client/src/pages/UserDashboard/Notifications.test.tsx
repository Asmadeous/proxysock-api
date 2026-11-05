import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Notifications from './Notifications';
import { getNotifications, markAsRead, markAllAsRead } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
vi.mock('@/services/notificationService', () => ({ getNotifications: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(), getUnreadCount: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/actionCable', () => ({ subscribeToNotifications: vi.fn(), unsubscribe: vi.fn(), disconnectConsumer: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, accessToken: 'token' }) }));
const notice = { id: 1, category: 'info', title: 'RDP ready', message: 'Your server is ready.', metadata: { hostname: 'server one' }, read_at: null, created_at: '2026-10-17T12:00:00Z' };
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter><Notifications /></MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  useNotificationStore.setState({ notifications: [], unreadCount: 1, soundEnabled: false });
  vi.mocked(getNotifications).mockResolvedValue({ notifications: [notice], meta: { total_pages: 1 } });
});
afterEach(cleanup);
it('uses read_at and applies shadcn read filters', async () => {
  vi.mocked(getNotifications).mockResolvedValue({ notifications: [notice, { ...notice, id: 2, title: 'Already read', read_at: '2026-10-17' }] });
  show();
  await screen.findByText('Already read');
  expect(screen.getAllByRole('button', { name: /Mark as read:/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole('combobox', { name: 'Read status' }));
  fireEvent.click(screen.getByRole('option', { name: /^Read$/ }));
  expect(screen.queryByText('RDP ready')).not.toBeInTheDocument();
  expect(screen.getByText('Already read')).toBeInTheDocument();
});
it('loads every API page and paginates search results', async () => {
  vi.mocked(getNotifications).mockResolvedValueOnce({ notifications: Array.from({ length: 15 }, (_, i) => ({ ...notice, id: i + 1, title: `Update ${i + 1}` })), meta: { total_pages: 2 } }).mockResolvedValueOnce({ notifications: [{ ...notice, id: 16, title: 'Last update' }], meta: { total_pages: 2 } });
  show();
  await screen.findByText('Page 1 of 2');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Last update')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search notifications' }), { target: { value: 'Update 1' } });
  expect(screen.getByText('Update 1')).toBeInTheDocument();
  expect(getNotifications).toHaveBeenCalledWith(2);
});
it('keeps failed read actions unread and supports retry', async () => {
  show();
  const button = await screen.findByRole('button', { name: 'Mark as read: RDP ready' });
  vi.mocked(markAsRead).mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t mark notifications as read');
  expect(button).toBeInTheDocument();
  vi.mocked(markAsRead).mockResolvedValueOnce({ success: true });
  vi.mocked(getNotifications).mockResolvedValue({ notifications: [{ ...notice, read_at: '2026-10-17' }] });
  fireEvent.click(button);
  await waitFor(() => expect(screen.queryByRole('button', { name: /Mark as read:/ })).not.toBeInTheDocument());
  expect(markAsRead).toHaveBeenLastCalledWith(1);
});
it('marks all read and updates the shared unread count', async () => {
  show();
  await screen.findByText('RDP ready');
  vi.mocked(markAllAsRead).mockResolvedValueOnce({ success: true });
  vi.mocked(getNotifications).mockResolvedValue({ notifications: [{ ...notice, read_at: '2026-10-17' }] });
  fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled());
  expect(markAllAsRead).toHaveBeenCalledOnce();
  await waitFor(() => expect(useNotificationStore.getState().unreadCount).toBe(0));
});
it('uses encoded service searches and real external links', async () => {
  vi.mocked(getNotifications).mockResolvedValue({ notifications: [notice, { ...notice, id: 2, title: 'Documentation', metadata: { link: 'https://example.com/help' } }] });
  show();
  const links = await screen.findAllByRole('link', { name: 'View details' });
  expect(links[0]).toHaveAttribute('href', '/dashboard/RDP-management?search=server%20one');
  expect(links[1]).toHaveAttribute('href', 'https://example.com/help');
  expect(links[1]).toHaveAttribute('rel', 'noopener noreferrer');
});
it('reports fetch failures rather than an empty inbox and retries', async () => {
  vi.mocked(getNotifications).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t update your notifications');
  expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('RDP ready')).toBeInTheDocument();
});
it('toggles the persisted sound preference and refreshes after realtime updates', async () => {
  show();
  await screen.findByText('RDP ready');
  fireEvent.click(screen.getByRole('button', { name: 'Sound off' }));
  expect(screen.getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true');
  vi.mocked(getNotifications).mockResolvedValue({ notifications: [notice, { ...notice, id: 2, title: 'New update' }] });
  useNotificationStore.setState({ notifications: [{ ...notice, read: false, category: 'rdp' }] });
  expect(await screen.findByText('New update')).toBeInTheDocument();
});
