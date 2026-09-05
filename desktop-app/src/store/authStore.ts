import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Claims, LoginResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: Claims | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  setUser: (user: Claims) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (response) => {
        set({
          token: response.token,
          user: {
            sub: response.username,
            role: response.role,
            exp: 0,
            iat: 0,
          },
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);