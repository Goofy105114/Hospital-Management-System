import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { UserRepository, UserRecord } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { AuditRepository } from '../repositories/audit.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../jwt';

export interface AuthSuccessResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: string;
    status: string;
    lastLoginAt: Date | null;
  };
}

export class AuthService {
  static async login(params: {
    identifier: string;
    password?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuthSuccessResult> {
    const { identifier, password, ipAddress, userAgent } = params;

    if (!identifier || !password) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Identifier and password are required',
      };
    }

    const user = await UserRepository.findByIdentifier(identifier);

    if (!user) {
      await AuditRepository.recordSecurityEvent({
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'USER_NOT_FOUND' },
      });

      throw {
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email/phone or password provided',
      };
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      await AuditRepository.recordSecurityEvent({
        userId: user.id,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'ACCOUNT_SUSPENDED' },
      });

      throw {
        statusCode: 403,
        code: 'AUTH_ACCOUNT_SUSPENDED',
        message: 'Account has been suspended. Please contact hospital administration.',
      };
    }

    if (user.status === 'PENDING_VERIFICATION') {
      await AuditRepository.recordSecurityEvent({
        userId: user.id,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'ACCOUNT_UNVERIFIED' },
      });

      throw {
        statusCode: 403,
        code: 'AUTH_ACCOUNT_UNVERIFIED',
        message: 'Account is pending verification. Please complete email/phone verification.',
      };
    }

    // Check lockout status
    if (user.status === 'LOCKED' && user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      await AuditRepository.recordSecurityEvent({
        userId: user.id,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'ACCOUNT_LOCKED', lockedUntil: user.lockedUntil },
      });

      throw {
        statusCode: 403,
        code: 'AUTH_ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to excessive failed attempts.',
        details: { lockedUntil: user.lockedUntil },
      };
    }

    // Validate password
    const isMatch = bcrypt.compareSync(password, user.passwordHash);

    if (!isMatch) {
      const { failedCount, lockedUntil } = await UserRepository.incrementFailedLogin(user.id);

      if (lockedUntil) {
        await AuditRepository.recordSecurityEvent({
          userId: user.id,
          eventType: 'ACCOUNT_LOCKED',
          identifier,
          ipAddress,
          userAgent,
          metadata: { consecutiveFailures: failedCount, lockedUntil },
        });

        throw {
          statusCode: 403,
          code: 'AUTH_ACCOUNT_LOCKED',
          message: 'Account has been locked for 30 minutes due to 5 consecutive failed login attempts.',
          details: { lockedUntil },
        };
      }

      await AuditRepository.recordSecurityEvent({
        userId: user.id,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { consecutiveFailures: failedCount },
      });

      throw {
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email/phone or password provided',
        details: { attemptsRemaining: 5 - failedCount },
      };
    }

    // Reset failed counter upon successful login
    await UserRepository.resetFailedLogin(user.id);

    // Issue JWT pair
    const familyId = crypto.randomUUID();
    const accessToken = generateAccessToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    });

    const refreshToken = generateRefreshToken({ sub: user.id, familyId });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await TokenRepository.saveToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    await AuditRepository.recordSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      identifier,
      ipAddress,
      userAgent,
      metadata: { role: user.role },
    });

    await AuditRepository.recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      changes: { ipAddress, userAgent },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  static async refresh(params: {
    refreshToken: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken, ipAddress, userAgent } = params;

    if (!refreshToken) {
      throw {
        statusCode: 400,
        code: 'AUTH_TOKEN_MISSING',
        message: 'Refresh token is required',
      };
    }

    let payload: { sub: string; familyId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw {
        statusCode: 401,
        code: 'AUTH_TOKEN_INVALID',
        message: 'Refresh token has expired or is invalid',
      };
    }

    const tokenHash = hashToken(refreshToken);
    const existingToken = await TokenRepository.findByHash(tokenHash);

    if (!existingToken) {
      throw {
        statusCode: 401,
        code: 'AUTH_TOKEN_INVALID',
        message: 'Refresh token not recognized in session store',
      };
    }

    // Replay attack defense: if token was already revoked, invalidate entire token family
    if (existingToken.revokedAt) {
      await TokenRepository.revokeFamily(existingToken.familyId);

      await AuditRepository.recordSecurityEvent({
        userId: payload.sub,
        eventType: 'REPLAY_ATTACK_DETECTED',
        identifier: payload.sub,
        ipAddress,
        userAgent,
        metadata: { familyId: existingToken.familyId },
      });

      throw {
        statusCode: 401,
        code: 'AUTH_TOKEN_COMPROMISED',
        message: 'Potential token reuse detected. All sessions in this family have been terminated.',
      };
    }

    // Revoke old token
    await TokenRepository.revokeToken(tokenHash);

    const user = await UserRepository.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw {
        statusCode: 403,
        code: 'AUTH_ACCOUNT_NOT_ACTIVE',
        message: 'User account is not active',
      };
    }

    // Issue rotated token pair with same familyId
    const newAccessToken = generateAccessToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    });

    const newRefreshToken = generateRefreshToken({ sub: user.id, familyId: existingToken.familyId });
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await TokenRepository.saveToken({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: existingToken.familyId,
      expiresAt,
    });

    await AuditRepository.recordSecurityEvent({
      userId: user.id,
      eventType: 'TOKEN_REFRESH',
      identifier: user.id,
      ipAddress,
      userAgent,
      metadata: { familyId: existingToken.familyId },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(params: {
    refreshToken?: string;
    user?: { id: string; role: string };
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const { refreshToken, user, ipAddress, userAgent } = params;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await TokenRepository.revokeToken(tokenHash);
    }

    if (user) {
      await AuditRepository.recordSecurityEvent({
        userId: user.id,
        eventType: 'LOGOUT',
        identifier: user.id,
        ipAddress,
        userAgent,
      });

      await AuditRepository.recordAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: user.id,
        changes: { ipAddress, userAgent },
      });
    }
  }

  static async getMe(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
