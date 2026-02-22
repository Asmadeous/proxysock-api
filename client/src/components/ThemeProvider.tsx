import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dark = useThemeStore((state) => state.dark);

  useEffect(() => {
    // Apply or remove dark class based on theme state
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return <>{children}</>;
}
