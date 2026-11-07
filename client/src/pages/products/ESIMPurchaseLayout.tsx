import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import '../UserDashboard/dashboard-home.css';
import './esim-purchase.css';

export default function ESIMPurchaseLayout({ children }: { children: ReactNode }) {
  const dark = useThemeStore(state => state.dark);
  const { pathname } = useLocation();
  return <div className={`dashboard-overview esim-purchase esim-surface ${dark ? 'overview-dark' : ''} ${pathname.startsWith('/dashboard') ? '' : 'esim-purchase-embedded'}`}>{children}</div>;
}
