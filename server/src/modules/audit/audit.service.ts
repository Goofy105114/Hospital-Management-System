import crypto from 'node:crypto';
import { db } from '../../database/db.js';
import { AuditLogRecord, SecurityEventRecord } from '../../common/types.js';

export class AuditService {
  /**
   * Records a business audit log event per PRD A.4.8 and SEC-03
   */
  static recordAudit(params: {
    actorId: string | null;
    actorRole: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    changes?: Record<string, any>;
  }): void {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const changesJson = params.changes ? JSON.stringify(params.changes) : null;

    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, changes, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.actorId,
      params.actorRole,
      params.action,
      params.entityType,
      params.entityId,
      changesJson,
      timestamp
    );
  }

  /**
   * Records a security event per IAM-01-S05 and IAM-04
   */
  static recordSecurityEvent(params: {
    userId: string | null;
    eventType: 'LOGIN_SUCCESS' | 'FAILED_LOGIN' | 'ACCOUNT_LOCKED' | 'LOGOUT' | 'TOKEN_REFRESH' | 'REPLAY_ATTACK_DETECTED';
    identifier: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any>;
  }): void {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;

    const stmt = db.prepare(`
      INSERT INTO security_events (id, user_id, event_type, identifier, ip_address, user_agent, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.userId,
      params.eventType,
      params.identifier,
      params.ipAddress || null,
      params.userAgent || null,
      metadataJson,
      createdAt
    );
  }

  /**
   * Query recent security events for monitoring & verification
   */
  static getRecentSecurityEvents(limit: number = 20): SecurityEventRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM security_events
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as unknown as SecurityEventRecord[];
  }

  /**
   * Query recent audit logs
   */
  static getRecentAuditLogs(limit: number = 20): AuditLogRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as unknown as AuditLogRecord[];
  }
}
