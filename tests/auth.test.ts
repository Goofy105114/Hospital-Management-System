import { describe, it, expect } from 'vitest';
import { AuthService } from '@/lib/services/auth.service';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/lib/jwt';
import { UserRepository } from '@/lib/repositories/user.repository';

describe('IAM-01: Authentication & Token Management Service', () => {
  describe('JWT Cryptographic Signing and Verification', () => {
    it('should generate and verify a valid access token', () => {
      const payload = {
        sub: 'usr_doc_001',
        role: 'DOCTOR',
        name: 'Dr. Sarah Sharma',
        email: 'doctor.sharma@goingmerry.com',
        phone: '+919876543210',
        status: 'ACTIVE',
      };

      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = verifyAccessToken(token);
      expect(decoded.sub).toBe('usr_doc_001');
      expect(decoded.email).toBe('doctor.sharma@goingmerry.com');
      expect(decoded.role).toBe('DOCTOR');
    });

    it('should reject a tampered access token', () => {
      const payload = {
        sub: 'usr_doc_001',
        role: 'DOCTOR',
        name: 'Dr. Sarah Sharma',
        email: 'doctor.sharma@goingmerry.com',
        phone: '+919876543210',
        status: 'ACTIVE',
      };

      const token = generateAccessToken(payload);
      const tampered = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it('should generate and verify a valid refresh token', () => {
      const payload = {
        sub: 'usr_pat_001',
        familyId: 'fam-001',
      };

      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.sub).toBe('usr_pat_001');
      expect(decoded.familyId).toBe('fam-001');
    });
  });

  describe('AuthService.login - Credential Verification', () => {
    it('should authenticate a valid patient by email and return JWT pair', async () => {
      const result = await AuthService.login({
        identifier: 'patient.john@goingmerry.com',
        password: 'Patient@123',
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest-Client',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('patient.john@goingmerry.com');
      expect(result.user.role).toBe('PATIENT');
    });

    it('should authenticate a valid physician by phone number', async () => {
      const result = await AuthService.login({
        identifier: '+919876543210',
        password: 'Doctor@123',
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest-Client',
      });

      expect(result.user.role).toBe('DOCTOR');
      expect(result.user.name).toBe('Dr. Sarah Sharma');
    });

    it('should reject invalid password with AUTH_INVALID_CREDENTIALS', async () => {
      await expect(
        AuthService.login({
          identifier: 'doctor.sharma@goingmerry.com',
          password: 'WrongPassword99!',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
      });
    });

    it('should reject non-existent user with AUTH_INVALID_CREDENTIALS', async () => {
      await expect(
        AuthService.login({
          identifier: 'nobody@nowhere.com',
          password: 'Password123!',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
      });
    });

    it('should reject a suspended account with AUTH_ACCOUNT_SUSPENDED', async () => {
      await expect(
        AuthService.login({
          identifier: 'suspended.user@goingmerry.com',
          password: 'Suspended@123',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_ACCOUNT_SUSPENDED',
      });
    });

    it('should reject an already locked account with AUTH_ACCOUNT_LOCKED', async () => {
      await expect(
        AuthService.login({
          identifier: 'locked.user@goingmerry.com',
          password: 'Locked@123',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_ACCOUNT_LOCKED',
      });
    });

    it('should reject a pending verification account with AUTH_ACCOUNT_UNVERIFIED', async () => {
      await expect(
        AuthService.login({
          identifier: 'unverified.user@goingmerry.com',
          password: 'Pending@123',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_ACCOUNT_UNVERIFIED',
      });
    });
  });

  describe('AuthService.login - Brute Force Lockout Policy', () => {
    it('should lock account after 5 consecutive failed attempts', async () => {
      const targetUser = await UserRepository.findByIdentifier('reception@goingmerry.com');
      expect(targetUser).toBeDefined();

      // Reset count to ensure clean state
      if (targetUser) {
        await UserRepository.resetFailedLogin(targetUser.id);
      }

      // 4 failed attempts should yield AUTH_INVALID_CREDENTIALS
      for (let i = 0; i < 4; i++) {
        try {
          await AuthService.login({
            identifier: 'reception@goingmerry.com',
            password: 'WrongPassword!',
            ipAddress: '127.0.0.1',
          });
        } catch (err: any) {
          expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
        }
      }

      // 5th failed attempt should trigger lockout
      await expect(
        AuthService.login({
          identifier: 'reception@goingmerry.com',
          password: 'WrongPassword!',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_ACCOUNT_LOCKED',
      });

      // Subsequent attempt with even the CORRECT password must be rejected because locked
      await expect(
        AuthService.login({
          identifier: 'reception@goingmerry.com',
          password: 'Reception@123',
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_ACCOUNT_LOCKED',
      });
    });
  });

  describe('AuthService.refresh - Token Rotation', () => {
    it('should exchange a valid refresh token for a new token pair and invalidate old token', async () => {
      const loginRes = await AuthService.login({
        identifier: 'patient.john@goingmerry.com',
        password: 'Patient@123',
        ipAddress: '127.0.0.1',
      });

      const oldRefreshToken = loginRes.refreshToken;

      // Exchange refresh token
      const refreshed = await AuthService.refresh({
        refreshToken: oldRefreshToken,
        ipAddress: '127.0.0.1',
      });
      expect(refreshed).toHaveProperty('accessToken');
      expect(refreshed).toHaveProperty('refreshToken');
      expect(refreshed.refreshToken).not.toBe(oldRefreshToken);

      // Replaying the old refresh token must be rejected as compromised
      await expect(
        AuthService.refresh({
          refreshToken: oldRefreshToken,
          ipAddress: '127.0.0.1',
        })
      ).rejects.toMatchObject({
        code: 'AUTH_TOKEN_COMPROMISED',
      });
    });
  });
});
