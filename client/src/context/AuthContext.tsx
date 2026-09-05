import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession } from '../types/auth.js';
import { authApi, clearStoredSession, ApiError } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  timeToExpiry: number;
  login: (identifier: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeToExpiry, setTimeToExpiry] = useState<number>(15 * 60); // 15 min default

  // Decode JWT payload expiration
  const calculateExpiry = (token: string): number => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return 15 * 60;
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const remaining = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
        return remaining;
      }
    } catch {
      // Fallback
    }
    return 15 * 60;
  };

  // Restore existing session on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = authApi.getStoredTokens();
      if (tokens.accessToken) {
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        setTimeToExpiry(calculateExpiry(tokens.accessToken));

        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch (err) {
          // If token expired, try to refresh
          if (tokens.refreshToken) {
            try {
              const refreshed = await authApi.refresh(tokens.refreshToken);
              setAccessToken(refreshed.accessToken);
              setRefreshToken(refreshed.refreshToken);
              setTimeToExpiry(calculateExpiry(refreshed.accessToken));
              const profile = await authApi.getMe();
              setUser(profile);
            } catch {
              clearStoredSession();
              setAccessToken(null);
              setRefreshToken(null);
              setUser(null);
            }
          } else {
            clearStoredSession();
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Countdown timer for access token
  useEffect(() => {
    if (!accessToken || !user) return;

    const interval = setInterval(() => {
      setTimeToExpiry((prev) => {
        if (prev <= 1) {
          // Trigger auto-refresh when token reaches 0
          if (refreshToken) {
            authApi.refresh(refreshToken).then((res) => {
              setAccessToken(res.accessToken);
              setRefreshToken(res.refreshToken);
              setTimeToExpiry(calculateExpiry(res.accessToken));
            }).catch(() => {
              logout();
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken, user]);

  const login = async (identifier: string, password: string): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const session = await authApi.login(identifier, password);
      setUser({
        ...session.user,
        status: 'ACTIVE',
      });
      setAccessToken(session.accessToken);
      setRefreshToken(session.refreshToken);
      setTimeToExpiry(calculateExpiry(session.accessToken));
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout(refreshToken);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsLoading(false);
    }
  }, [refreshToken]);

  const refreshSession = async () => {
    if (!refreshToken) {
      throw new ApiError(400, 'AUTH_NO_REFRESH_TOKEN', 'No refresh token available');
    }
    const result = await authApi.refresh(refreshToken);
    setAccessToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    setTimeToExpiry(calculateExpiry(result.accessToken));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        timeToExpiry,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
