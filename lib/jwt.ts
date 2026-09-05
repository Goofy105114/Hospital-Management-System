import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-access-token-key-32-chars-minimum';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'local-development-secret-refresh-token-key-32-chars-minimum';

export interface JwtPayload {
  sub: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: { sub: string; familyId: string; tokenId?: string }): string {
  return jwt.sign(
    { ...payload, jti: payload.tokenId || crypto.randomUUID() },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string; familyId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string; familyId: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
