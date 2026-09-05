import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { JwtUserPayload, User } from './types.js';
import { AppError, ErrorCodes } from './errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'going-merry-hms-super-secure-jwt-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'going-merry-hms-refresh-secret-key-2026';

// Access token valid for 15 minutes (per PRD A.4.4)
const ACCESS_TOKEN_EXPIRATION = '15m';
// Refresh token valid for 7 days (per PRD A.4.4)
const REFRESH_TOKEN_EXPIRATION = '7d';

export interface DecodedRefreshToken {
  sub: string;
  familyId: string;
  jti: string;
  iat: number;
  exp: number;
}

export function generateAccessToken(user: User): string {
  const payload: JwtUserPayload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
}

export function generateRefreshToken(userId: string, familyId?: string): { token: string; familyId: string; jti: string; expiresAt: Date } {
  const tokenFamily = familyId || crypto.randomUUID();
  const jti = crypto.randomUUID();
  
  const token = jwt.sign(
    { sub: userId, familyId: tokenFamily, jti },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRATION }
  );

  // 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    token,
    familyId: tokenFamily,
    jti,
    expiresAt,
  };
}

export function verifyAccessToken(token: string): JwtUserPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Access token has expired');
    }
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid access token');
  }
}

export function verifyRefreshToken(token: string): DecodedRefreshToken {
  try {
    return jwt.verify(token, REFRESH_SECRET) as DecodedRefreshToken;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Refresh token has expired');
    }
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid refresh token');
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
