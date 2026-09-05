import { db } from '../../database/db.js';
import { User } from '../../common/types.js';

export class UserRepository {
  static findById(id: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return row ? (row as unknown as User) : null;
  }

  static findByIdentifier(identifier: string): User | null {
    const trimmed = identifier.trim().toLowerCase();
    const stmt = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = ? OR phone = ?
    `);
    const row = stmt.get(trimmed, identifier.trim());
    return row ? (row as unknown as User) : null;
  }

  static incrementFailedLogin(userId: string): { failedCount: number; lockedUntil: string | null } {
    const user = this.findById(userId);
    if (!user) return { failedCount: 0, lockedUntil: null };

    const newCount = (user.failed_login_count || 0) + 1;
    const now = new Date();
    let lockedUntil: string | null = null;
    let newStatus = user.status;

    // After 5 consecutive failures, lock for 30 minutes (per PRD IAM-01)
    if (newCount >= 5) {
      const lockExpiry = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
      lockedUntil = lockExpiry.toISOString();
      newStatus = 'LOCKED';
    }

    const stmt = db.prepare(`
      UPDATE users 
      SET failed_login_count = ?, 
          locked_until = ?, 
          status = ?,
          updated_at = ?
      WHERE id = ?
    `);

    stmt.run(newCount, lockedUntil, newStatus, now.toISOString(), userId);
    return { failedCount: newCount, lockedUntil };
  }

  static unlockAndReset(userId: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE users 
      SET failed_login_count = 0, 
          locked_until = NULL, 
          status = 'ACTIVE',
          updated_at = ?
      WHERE id = ?
    `);
    stmt.run(now, userId);
  }

  static recordSuccessfulLogin(userId: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE users 
      SET last_login_at = ?,
          failed_login_count = 0,
          locked_until = NULL,
          updated_at = ?
      WHERE id = ?
    `);
    stmt.run(now, now, userId);
  }

  static getAll(): User[] {
    const stmt = db.prepare('SELECT * FROM users ORDER BY role, name');
    return stmt.all() as unknown as User[];
  }
}
