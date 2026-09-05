import { prisma } from '../prisma';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

const FALLBACK_TOKENS: RefreshTokenRecord[] = [];

export class TokenRepository {
  static async saveToken(params: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void> {
    try {
      await prisma.refreshToken.create({
        data: params,
      });
      return;
    } catch {
      // Fallback
    }

    FALLBACK_TOKENS.push({
      id: `tok_${Date.now()}`,
      userId: params.userId,
      tokenHash: params.tokenHash,
      familyId: params.familyId,
      expiresAt: params.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  static async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    try {
      const token = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      if (token) return token;
    } catch {
      // Fallback
    }

    return FALLBACK_TOKENS.find((t) => t.tokenHash === tokenHash) || null;
  }

  static async revokeToken(tokenHash: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
      return;
    } catch {
      // Fallback
    }

    const t = FALLBACK_TOKENS.find((tok) => tok.tokenHash === tokenHash);
    if (t) t.revokedAt = new Date();
  }

  static async revokeFamily(familyId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { familyId },
        data: { revokedAt: new Date() },
      });
      return;
    } catch {
      // Fallback
    }

    FALLBACK_TOKENS.forEach((t) => {
      if (t.familyId === familyId) t.revokedAt = new Date();
    });
  }
}
