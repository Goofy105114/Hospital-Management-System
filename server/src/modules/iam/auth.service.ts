import bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository.js';
import { TokenRepository } from './token.repository.js';
import { AuditService } from '../audit/audit.service.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../common/jwt.js';
import { AppError, ErrorCodes } from '../../common/errors.js';
import { User, UserPublicProfile } from '../../common/types.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Authenticate user with email/phone + password per IAM-01-S02 & IAM-01-S03
   */
  static async login(params: {
    identifier: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<LoginResult> {
    const { identifier, password, ipAddress, userAgent } = params;

    if (!identifier || !password) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Identifier and password are required');
    }

    const user = UserRepository.findByIdentifier(identifier);

    // If user does not exist
    if (!user) {
      AuditService.recordSecurityEvent({
        userId: null,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'USER_NOT_FOUND' },
      });

      throw new AppError(
        401,
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid identifier or password'
      );
    }

    // Check account lockout status
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until);
      const now = new Date();

      if (lockExpiry > now) {
        AuditService.recordSecurityEvent({
          userId: user.id,
          eventType: 'FAILED_LOGIN',
          identifier,
          ipAddress,
          userAgent,
          metadata: { reason: 'ACCOUNT_LOCKED', lockedUntil: user.locked_until },
        });

        throw new AppError(
          403,
          ErrorCodes.AUTH_ACCOUNT_LOCKED,
          `Account is temporarily locked until ${lockExpiry.toLocaleTimeString()} due to multiple failed login attempts`,
          { lockedUntil: user.locked_until }
        );
      } else {
        // Lock expired - auto clear
        UserRepository.unlockAndReset(user.id);
        user.failed_login_count = 0;
        user.locked_until = null;
        user.status = 'ACTIVE';
      }
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      AuditService.recordSecurityEvent({
        userId: user.id,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'ACCOUNT_SUSPENDED' },
      });

      throw new AppError(
        403,
        ErrorCodes.AUTH_ACCOUNT_SUSPENDED,
        'Account has been suspended by hospital administration'
      );
    }

    if (user.status === 'PENDING_VERIFICATION') {
      AuditService.recordSecurityEvent({
        userId: user.id,
        eventType: 'FAILED_LOGIN',
        identifier,
        ipAddress,
        userAgent,
        metadata: { reason: 'ACCOUNT_UNVERIFIED' },
      });

      throw new AppError(
        403,
        ErrorCodes.AUTH_ACCOUNT_UNVERIFIED,
        'Account is pending verification'
      );
    }

    if (user.status === 'LOCKED') {
      throw new AppError(
        403,
        ErrorCodes.AUTH_ACCOUNT_LOCKED,
        'Account is currently locked',
        { lockedUntil: user.locked_until }
      );
    }

    // Validate password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const { failedCount, lockedUntil } = UserRepository.incrementFailedLogin(user.id);

      if (lockedUntil) {
        // Account locked after 5 consecutive failures (IAM-01-S05)
        AuditService.recordSecurityEvent({
          userId: user.id,
          eventType: 'ACCOUNT_LOCKED',
          identifier,
          ipAddress,
          userAgent,
          metadata: { consecutiveFailures: failedCount, lockedUntil },
        });

        AuditService.recordAudit({
          actorId: user.id,
          actorRole: user.role,
          action: 'AUTH_LOCKOUT',
          entityType: 'USER',
          entityId: user.id,
          changes: { consecutiveFailures: failedCount, lockedUntil },
        });

        throw new AppError(
          403,
          ErrorCodes.AUTH_ACCOUNT_LOCKED,
          'Account has been locked for 30 minutes due to 5 consecutive failed login attempts',
          { lockedUntil }
        );
      } else {
        const attemptsRemaining = 5 - failedCount;
        AuditService.recordSecurityEvent({
          userId: user.id,
          eventType: 'FAILED_LOGIN',
          identifier,
          ipAddress,
          userAgent,
          metadata: { failedCount, attemptsRemaining },
        });

        throw new AppError(
          401,
          ErrorCodes.AUTH_INVALID_CREDENTIALS,
          `Invalid identifier or password. ${attemptsRemaining} attempt(s) remaining before account lockout.`,
          { attemptsRemaining }
        );
      }
    }

    // Successful login
    UserRepository.recordSuccessfulLogin(user.id);

    // Generate token pair (PRD IAM-01-S04)
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, familyId, expiresAt } = generateRefreshToken(user.id);

    // Store hashed refresh token
    const tokenHash = hashToken(refreshToken);
    TokenRepository.create({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt: expiresAt.toISOString(),
    });

    // Record security event
    AuditService.recordSecurityEvent({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      identifier,
      ipAddress,
      userAgent,
      metadata: { role: user.role },
    });

    // Record audit trail event (A.4.8)
    AuditService.recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      changes: { ipAddress, userAgent, role: user.role },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  /**
   * Rotate refresh token per IAM-01-S04 with replay attack defense
   */
  static async refresh(params: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RefreshResult> {
    const { refreshToken, ipAddress, userAgent } = params;

    if (!refreshToken) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Refresh token is required');
    }

    // Decode and verify JWT signature/expiration
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const tokenRecord = TokenRepository.findByHash(tokenHash);

    // Replay attack detection: token was already revoked or not found
    if (!tokenRecord || tokenRecord.revoked_at !== null) {
      // Revoke the entire family to protect the user
      TokenRepository.revokeFamily(decoded.familyId);

      AuditService.recordSecurityEvent({
        userId: decoded.sub,
        eventType: 'REPLAY_ATTACK_DETECTED',
        identifier: decoded.sub,
        ipAddress,
        userAgent,
        metadata: { familyId: decoded.familyId, tokenHash },
      });

      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_REVOKED,
        'Suspicious token replay detected. All sessions in this family have been revoked. Please log in again.'
      );
    }

    // Look up user
    const user = UserRepository.findById(decoded.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(403, ErrorCodes.AUTH_ACCOUNT_SUSPENDED, 'User account is no longer active');
    }

    // Revoke old refresh token (rotation)
    TokenRepository.revokeToken(tokenHash);

    // Issue new pair in the same token family
    const newAccessToken = generateAccessToken(user);
    const { token: newRefreshToken, expiresAt } = generateRefreshToken(user.id, decoded.familyId);

    TokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      familyId: decoded.familyId,
      expiresAt: expiresAt.toISOString(),
    });

    AuditService.recordSecurityEvent({
      userId: user.id,
      eventType: 'TOKEN_REFRESH',
      identifier: user.email,
      ipAddress,
      userAgent,
      metadata: { familyId: decoded.familyId },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Terminate authenticated session and blacklist refresh token (IAM-01-S04)
   */
  static async logout(params: {
    refreshToken?: string;
    user?: { id: string; role: string };
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const { refreshToken, user, ipAddress, userAgent } = params;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      TokenRepository.revokeToken(tokenHash);
    }

    if (user) {
      AuditService.recordSecurityEvent({
        userId: user.id,
        eventType: 'LOGOUT',
        identifier: user.id,
        ipAddress,
        userAgent,
      });

      AuditService.recordAudit({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: user.id,
        changes: { ipAddress, userAgent },
      });
    }
  }

  /**
   * Get current authenticated user profile
   */
  static async getMe(userId: string): Promise<UserPublicProfile> {
    const user = UserRepository.findById(userId);
    if (!user) {
      throw new AppError(404, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.last_login_at,
    };
  }
}
