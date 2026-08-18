import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const data = await authApi.login({ email, password });
        localStorage.setItem('nexus_token', data.access_token);
        set({ user: data.user, token: data.access_token, isAuthenticated: true });
      },

      register: async (email, password, fullName) => {
        const data = await authApi.register({ email, password, full_name: fullName });
        localStorage.setItem('nexus_token', data.access_token);
        set({ user: data.user, token: data.access_token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('nexus_token');
        authApi.logout().catch(() => {});
        set({ user: null, token: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          const user = await authApi.me();
          set({ user });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
