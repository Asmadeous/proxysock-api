import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './SideBar';
import { useThemeStore } from '@/store/themeStore';
import Dashboard from '@/pages/UserDashboard/Dashboard';

const notifications = vi.hoisted(() => ({
  unreadCount: 3, notifications: [], fetchNotifications: vi.fn(), fetchUnreadCount: vi.fn(),
  subscribeToRealtime: vi.fn(), unsubscribeFromRealtime: vi.fn(),
}));
vi.mock('@/store/notificationStore', () => ({ useNotificationStore: (select: (state: typeof notifications) => unknown) => select(notifications) }));
vi.mock('@/services/api', () => ({ fetchUserSummaryCounts: vi.fn().mockResolvedValue({ support_chats: 2 }), formatImageUrl: (url: string) => url }));
vi.mock('@/components/UserBalance', () => ({ default: ({ variant }: { variant: string }) => <div data-testid="wallet" data-variant={variant}>Wallet</div> }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'Demo User' }, logout: vi.fn() }) }));

const props = { isMobile: false, setSidebarOpen: vi.fn(), handleLogout: vi.fn(), cartCount: 4, userName: 'Demo User', isCollapsed: false, setIsCollapsed: vi.fn(), onLinkClick: vi.fn() };
function sidebar(overrides = {}, path = '/dashboard/orders/42') {
  return render(<MemoryRouter initialEntries={[path]}><Sidebar {...props} {...overrides} /></MemoryRouter>);
}
beforeEach(() => { vi.clearAllMocks(); useThemeStore.setState({ dark: false }); });
afterEach(cleanup);

describe('Dashboard sidebar', () => {
  it('keeps all navigation destinations and highlights the parent of a detail page', async () => {
    sidebar();
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('navigation', { name: 'Dashboard navigation' }).querySelectorAll('a')).toHaveLength(13);
    expect(screen.getByLabelText('4 items in cart')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('2 updates')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Notifications, 3 unread' })).toHaveAttribute('href', '/dashboard/notifications');
  });
  it('keeps collapsed links accessible and exposes wallet, theme, collapse and logout controls', () => {
    sidebar({ isCollapsed: true });
    expect(screen.getByTestId('wallet')).toHaveAttribute('data-variant', 'sidebar-collapsed');
    expect(screen.getByRole('link', { name: 'Proxies' })).toHaveAttribute('title', 'Proxies');
    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(props.setIsCollapsed).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(props.handleLogout).toHaveBeenCalledOnce();
  });
  it('keeps the mobile menu expanded and closes it on navigation', () => {
    sidebar({ isMobile: true, isCollapsed: true });
    expect(screen.getByText('Explore services')).toBeVisible();
    expect(screen.getByTestId('wallet')).toHaveAttribute('data-variant', 'sidebar');
    fireEvent.click(screen.getByRole('link', { name: 'Proxies' }));
    expect(props.onLinkClick).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
    expect(props.setSidebarOpen).toHaveBeenCalledWith(false);
  });
  it('uses initials when a profile image fails', () => {
    sidebar({ profilePictureUrl: '/missing-avatar.png' });
    fireEvent.error(document.querySelector('.workspace-avatar img')!);
    expect(screen.getByText('DU')).toBeInTheDocument();
  });
  it('opens a mobile dialog, closes on Escape and restores focus to the menu button', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    fireEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: 'Workspace navigation' })).toBeInTheDocument();
    expect(notifications.subscribeToRealtime).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toggle).toHaveFocus();
    expect(notifications.unsubscribeFromRealtime).toHaveBeenCalledOnce();
  });
});
