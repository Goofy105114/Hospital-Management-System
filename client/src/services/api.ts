import { AuthSession, DemoUser, SecurityEvent, AuditLog, User } from '../types/auth.js';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details: Record<string, any>;

  constructor(statusCode: number, code: string, message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function getStoredAccessToken(): string | null {
  return localStorage.getItem('hms_access_token');
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem('hms_refresh_token');
}

export function storeSessionTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('hms_access_token', accessToken);
  localStorage.setItem('hms_refresh_token', refreshToken);
}

export function clearStoredSession(): void {
  localStorage.removeItem('hms_access_token');
  localStorage.removeItem('hms_refresh_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': crypto.randomUUID(),
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    const err = json.error || { code: 'UNKNOWN_ERROR', message: 'Request failed', details: {} };
    throw new ApiError(response.status, err.code, err.message, err.details);
  }

  return json.data;
}

export const authApi = {
  getStoredTokens() {
    return {
      accessToken: getStoredAccessToken(),
      refreshToken: getStoredRefreshToken(),
    };
  },

  async login(identifier: string, password: string): Promise<AuthSession> {
    const data = await request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    storeSessionTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const data = await request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    storeSessionTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(refreshToken?: string | null): Promise<void> {
    try {
      await request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshToken || getStoredRefreshToken() }),
      });
    } finally {
      clearStoredSession();
    }
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me', {
      method: 'GET',
    });
  },

  async getDemoUsers(): Promise<DemoUser[]> {
    return request<DemoUser[]>('/auth/demo-users', {
      method: 'GET',
    });
  },

  async getSecurityOverview(): Promise<{ securityEvents: SecurityEvent[]; auditLogs: AuditLog[] }> {
    return request<{ securityEvents: SecurityEvent[]; auditLogs: AuditLog[] }>('/auth/security-overview', {
      method: 'GET',
    });
  },
};
