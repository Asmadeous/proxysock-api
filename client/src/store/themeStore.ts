import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: true, // Default to dark mode
      toggleDark: () => set((state) => ({ dark: !state.dark })),
      setDark: (dark: boolean) => set({ dark }),
    }),
    {
      name: 'theme-storage', // key for localStorage
    }
  )
);
