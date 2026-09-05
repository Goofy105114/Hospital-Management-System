import { prisma } from '../prisma';

export interface SecurityEventRecord {
  id: string;
  userId: string | null;
  eventType: string;
  identifier: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: string | null;
  timestamp: Date;
}

const FALLBACK_SECURITY_EVENTS: SecurityEventRecord[] = [];
const FALLBACK_AUDIT_LOGS: AuditLogRecord[] = [];

export class AuditRepository {
  static async recordSecurityEvent(data: {
    userId?: string | null;
    eventType: string;
    identifier: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<void> {
    const metaStr = data.metadata ? JSON.stringify(data.metadata) : null;
    try {
      await prisma.securityEvent.create({
        data: {
          userId: data.userId || null,
          eventType: data.eventType,
          identifier: data.identifier,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: metaStr,
        },
      });
      return;
    } catch {
      // Fallback
    }

    FALLBACK_SECURITY_EVENTS.unshift({
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId || null,
      eventType: data.eventType,
      identifier: data.identifier,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      metadata: metaStr,
      createdAt: new Date(),
    });
  }

  static async recordAudit(data: {
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    changes?: Record<string, any> | null;
  }): Promise<void> {
    const changesStr = data.changes ? JSON.stringify(data.changes) : null;
    try {
      await prisma.auditLog.create({
        data: {
          actorId: data.actorId || null,
          actorRole: data.actorRole || null,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId || null,
          changes: changesStr,
        },
      });
      return;
    } catch {
      // Fallback
    }

    FALLBACK_AUDIT_LOGS.unshift({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: data.actorId || null,
      actorRole: data.actorRole || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      changes: changesStr,
      timestamp: new Date(),
    });
  }

  static async getRecentSecurityEvents(limit = 20): Promise<SecurityEventRecord[]> {
    try {
      const events = await prisma.securityEvent.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      if (events && events.length > 0) return events;
    } catch {
      // Fallback
    }

    return FALLBACK_SECURITY_EVENTS.slice(0, limit);
  }

  static async getRecentAuditLogs(limit = 20): Promise<AuditLogRecord[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
      });
      if (logs && logs.length > 0) return logs;
    } catch {
      // Fallback
    }

    return FALLBACK_AUDIT_LOGS.slice(0, limit);
  }
}
