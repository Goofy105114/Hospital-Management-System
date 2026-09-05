import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  timeToExpiry: number;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  decrementTimer: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      timeToExpiry: 900, // 15 minutes in seconds
      isLoading: false,

      login: async (identifier: string, pass: string) => {
        set({ isLoading: true });
        try {
          const res = await axios.post('/api/v1/auth/login', {
            identifier,
            password: pass,
          });

          const { accessToken, refreshToken, user } = res.data.data;

          set({
            accessToken,
            refreshToken,
            user,
            isAuthenticated: true,
            timeToExpiry: 900,
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false });
          const responseData = err.response?.data;
          throw {
            code: responseData?.error?.code || 'AUTH_ERROR',
            message: responseData?.error?.message || 'Login failed',
            details: responseData?.error?.details || {},
          };
        }
      },

      logout: async () => {
        const { refreshToken, accessToken } = get();
        try {
          if (refreshToken) {
            await axios.post(
              '/api/v1/auth/logout',
              { refreshToken },
              { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined }
            );
          }
        } catch {
          // Ignore network errors on logout
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            timeToExpiry: 900,
          });
        }
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;

        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;

          set({
            accessToken: newAccess,
            refreshToken: newRefresh,
            timeToExpiry: 900,
          });
        } catch (err) {
          get().logout();
          throw err;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, timeToExpiry: 900 });
      },

      decrementTimer: () => {
        const current = get().timeToExpiry;
        if (current > 0) {
          set({ timeToExpiry: current - 1 });
        } else if (get().isAuthenticated) {
          get().refreshSession().catch(() => get().logout());
        }
      },
    }),
    {
      name: 'going_merry_auth_storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
