import { NextRequest } from 'next/server';
import { AuditRepository } from '@/lib/repositories/audit.repository';
import { apiSuccess } from '@/lib/envelope';

export async function GET(_req: NextRequest) {
  const securityEvents = await AuditRepository.getRecentSecurityEvents(20);
  const auditLogs = await AuditRepository.getRecentAuditLogs(20);

  return apiSuccess({ securityEvents, auditLogs }, 200);
}
