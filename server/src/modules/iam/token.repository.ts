import crypto from 'node:crypto';
import { db } from '../../database/db.js';
import { RefreshTokenRecord } from '../../common/types.js';

export class TokenRepository {
  static create(params: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: string;
  }): RefreshTokenRecord {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at, revoked_at, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, ?)
    `);

    stmt.run(
      id,
      params.userId,
      params.tokenHash,
      params.familyId,
      params.expiresAt,
      createdAt
    );

    return {
      id,
      user_id: params.userId,
      token_hash: params.tokenHash,
      family_id: params.familyId,
      expires_at: params.expiresAt,
      revoked_at: null,
      created_at: createdAt,
    };
  }

  static findByHash(tokenHash: string): RefreshTokenRecord | null {
    const stmt = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?');
    const row = stmt.get(tokenHash);
    return row ? (row as unknown as RefreshTokenRecord) : null;
  }

  static revokeToken(tokenHash: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?');
    stmt.run(now, tokenHash);
  }

  static revokeFamily(familyId: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL');
    stmt.run(now, familyId);
  }
}
