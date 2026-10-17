import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Notification } from '../services/notificationService';
import { getNotifications, getUnreadCount, markAsRead } from '../services/notificationService';
import { subscribeToNotifications } from '../lib/actionCable';
import { useNotificationStore } from './notificationStore';

vi.mock('../services/notificationService', () => ({
  getNotifications: vi.fn(), getUnreadCount: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(),
}));
vi.mock('../lib/actionCable', () => ({
  subscribeToNotifications: vi.fn(), unsubscribe: vi.fn(), disconnectConsumer: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: vi.fn() }));
const notification = (id: number, read_at: string | null = null): Notification => ({
  id, title: 'Order update', message: 'Your order is ready', category: 'order',
  created_at: '2026-10-17T12:00:00Z', read_at, read: Boolean(read_at),
});
const store = () => useNotificationStore.getState();
const subscribe = () => {
  store().subscribeToRealtime();
  return vi.mocked(subscribeToNotifications).mock.calls[0][0];
};
beforeEach(() => {
  vi.clearAllMocks();
  useNotificationStore.setState({ notifications: [notification(1), notification(2)], unreadCount: 5, soundEnabled: false, subscription: null });
});
describe('notification unread counts', () => {
  it('normalizes API timestamps and keeps the server total across pages', async () => {
    vi.mocked(getNotifications).mockResolvedValue({ notifications: [{ ...notification(1, '2026-10-17T13:00:00Z'), read: undefined }], unread_count: 12 });
    await store().fetchNotifications();
    expect(store().notifications[0].read).toBe(true);
    expect(store().unreadCount).toBe(12);
  });
  it('counts a read once when its realtime event arrives before the HTTP response', async () => {
    const receive = subscribe();
    vi.mocked(markAsRead).mockImplementation(async () => { receive({ action: 'notification_read', id: 1 }); });
    await store().markAsRead(1);
    receive({ action: 'notification_read', id: 1 });
    expect(store().unreadCount).toBe(4);
    expect(store().notifications[0].read_at).toBeTruthy();
  });
  it('counts a read once when the HTTP response arrives first', async () => {
    const receive = subscribe();
    vi.mocked(markAsRead).mockResolvedValue({});
    await store().markAsRead(1);
    receive({ action: 'notification_read', id: 1 });
    expect(store().unreadCount).toBe(4);
  });
  it('refreshes the server count for an event outside the loaded page', async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(3);
    subscribe()({ action: 'notification_read', id: 90 });
    await vi.waitFor(() => expect(store().unreadCount).toBe(3));
  });
  it('does not count already-read or duplicate incoming notifications', () => {
    store().addNotification(notification(3, '2026-10-17T13:00:00Z'));
    store().addNotification(notification(4));
    store().addNotification(notification(4));
    expect(store().unreadCount).toBe(6);
  });
});
