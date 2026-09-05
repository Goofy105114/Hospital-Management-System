import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { seedDatabase } from '../src/database/seed.js';
import { UserRepository } from '../src/modules/iam/user.repository.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import http from 'node:http';

let server: http.Server;
let baseUrl: string;

function makeRequest(path: string, options: {
  method: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const bodyStr = options.body ? JSON.stringify(options.body) : '';

    const req = http.request(url, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsedBody = null;
        if (data) {
          try {
            parsedBody = JSON.parse(data);
          } catch {
            parsedBody = data;
          }
        }
        resolve({
          status: res.statusCode || 500,
          body: parsedBody,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

describe('IAM-01: Patient and Staff Authentication Suite', () => {
  before(async () => {
    await seedDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      (server as any).closeAllConnections?.();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('IAM-01-S01 & IAM-01-S02: Credential Validation & Login', () => {
    it('should authenticate a valid patient by email and return JWT pair', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'patient.john@goingmerry.com',
          password: 'Patient@123',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.ok(res.body.data.refreshToken);
      assert.equal(res.body.data.user.role, 'PATIENT');
      assert.equal(res.body.data.user.email, 'patient.john@goingmerry.com');
      assert.ok(res.body.meta.timestamp);
    });

    it('should authenticate a valid staff member (doctor) by phone', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: '+919876543210',
          password: 'Doctor@123',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.equal(res.body.data.user.role, 'DOCTOR');
    });

    it('should reject invalid password with 401 AUTH_INVALID_CREDENTIALS', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'doctor.smith@goingmerry.com',
          password: 'WrongPassword!',
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'AUTH_INVALID_CREDENTIALS');
      assert.ok(res.body.error.details.attemptsRemaining !== undefined);
    });

    it('should reject non-existent user with 401 AUTH_INVALID_CREDENTIALS', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'nonexistent@goingmerry.com',
          password: 'AnyPassword123',
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('IAM-01-S03: Account Status Validation', () => {
    it('should reject login for SUSPENDED account with 403 AUTH_ACCOUNT_SUSPENDED', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'suspended@goingmerry.com',
          password: 'Suspended@123',
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'AUTH_ACCOUNT_SUSPENDED');
    });

    it('should reject login for PENDING_VERIFICATION account with 403 AUTH_ACCOUNT_UNVERIFIED', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'unverified@goingmerry.com',
          password: 'Unverified@123',
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'AUTH_ACCOUNT_UNVERIFIED');
    });

    it('should reject login for LOCKED account with 403 AUTH_ACCOUNT_LOCKED', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'locked@goingmerry.com',
          password: 'Locked@123',
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'AUTH_ACCOUNT_LOCKED');
      assert.ok(res.body.error.details.lockedUntil);
    });
  });

  describe('IAM-01-S05: Failed Login Handling & Lockout Policy', () => {
    it('should auto-lock account after 5 consecutive failed attempts', async () => {
      const targetUser = UserRepository.findByIdentifier('receptionist@goingmerry.com');
      assert.ok(targetUser);
      UserRepository.unlockAndReset(targetUser.id);

      // Attempt 1 to 4: Failures return 401
      for (let i = 1; i <= 4; i++) {
        const res = await makeRequest('/api/v1/auth/login', {
          method: 'POST',
          body: {
            identifier: 'receptionist@goingmerry.com',
            password: 'BadPassword!',
          },
        });
        assert.equal(res.status, 401);
        assert.equal(res.body.error.details.attemptsRemaining, 5 - i);
      }

      // 5th attempt: Triggers auto-lockout (403)
      const fifthRes = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'receptionist@goingmerry.com',
          password: 'BadPassword!',
        },
      });

      assert.equal(fifthRes.status, 403);
      assert.equal(fifthRes.body.error.code, 'AUTH_ACCOUNT_LOCKED');
      assert.ok(fifthRes.body.error.details.lockedUntil);

      // Subsequent attempt even with correct password is still locked
      const sixthRes = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'receptionist@goingmerry.com',
          password: 'Reception@123',
        },
      });
      assert.equal(sixthRes.status, 403);
      assert.equal(sixthRes.body.error.code, 'AUTH_ACCOUNT_LOCKED');

      // Cleanup
      UserRepository.unlockAndReset(targetUser.id);
    });
  });

  describe('IAM-01-S04: Session Creation, Refresh, Token Rotation, and Logout', () => {
    let accessToken: string;
    let refreshToken: string;

    it('should successfully login and obtain initial token pair', async () => {
      const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'pharmacist@goingmerry.com',
          password: 'Pharmacy@123',
        },
      });

      assert.equal(res.status, 201);
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
      assert.ok(accessToken);
      assert.ok(refreshToken);
    });

    it('should access /auth/me with valid access token', async () => {
      const res = await makeRequest('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.role, 'PHARMACIST');
      assert.equal(res.body.data.email, 'pharmacist@goingmerry.com');
    });

    it('should rotate refresh token and provide new access token via /auth/refresh', async () => {
      const res = await makeRequest('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken,
        },
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.data.accessToken);
      assert.ok(res.body.data.refreshToken);
      assert.notEqual(res.body.data.refreshToken, refreshToken);

      // Update stored tokens
      const newRefreshToken = res.body.data.refreshToken;

      // Replay attack test: Trying to use the OLD rotated refresh token
      const replayRes = await makeRequest('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken, // Old revoked token
        },
      });

      assert.equal(replayRes.status, 401);
      assert.equal(replayRes.body.error.code, 'AUTH_TOKEN_REVOKED');

      // Replay attack defense revoked the entire family: Even the new token is now revoked!
      const cascadeRes = await makeRequest('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: newRefreshToken,
        },
      });
      assert.equal(cascadeRes.status, 401);
    });

    it('should invalidate refresh token upon logout', async () => {
      // Login again for a clean session
      const loginRes = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          identifier: 'admin@goingmerry.com',
          password: 'Admin@123',
        },
      });
      const currentToken = loginRes.body.data.accessToken;
      const currentRefreshToken = loginRes.body.data.refreshToken;

      // Call logout
      const logoutRes = await makeRequest('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        body: {
          refreshToken: currentRefreshToken,
        },
      });
      assert.equal(logoutRes.status, 204);

      // Subsequent refresh must fail
      const failedRefresh = await makeRequest('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: currentRefreshToken,
        },
      });
      assert.equal(failedRefresh.status, 401);
    });
  });

  describe('Security and Audit Trail Verification', () => {
    it('should have recorded audit events and security events for auth actions', async () => {
      const securityEvents = AuditService.getRecentSecurityEvents(10);
      const auditLogs = AuditService.getRecentAuditLogs(10);

      assert.ok(securityEvents.length > 0);
      assert.ok(auditLogs.length > 0);

      const hasLoginSuccess = securityEvents.some((e) => e.event_type === 'LOGIN_SUCCESS');
      const hasFailedLogin = securityEvents.some((e) => e.event_type === 'FAILED_LOGIN');
      const hasAuditLogin = auditLogs.some((a) => a.action === 'LOGIN');

      assert.ok(hasLoginSuccess, 'Expected at least one LOGIN_SUCCESS event');
      assert.ok(hasFailedLogin, 'Expected at least one FAILED_LOGIN event');
      assert.ok(hasAuditLogin, 'Expected at least one LOGIN audit log');
    });
  });
});
