import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeState {
  darkMode: boolean;
  toggleDark: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useDarkModeStore = create<DarkModeState>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleDark: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (dark) => set({ darkMode: dark }),
    }),
    {
      name: 'dark-mode-storage',
    }
  )
);