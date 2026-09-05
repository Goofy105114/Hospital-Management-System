import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/envelope';

export async function GET(_req: NextRequest) {
  return apiSuccess({
    service: 'going-merry-hms-platform',
    version: '1.0.0',
    status: 'HEALTHY',
    stack: 'Next.js App Router + Prisma PostgreSQL + Upstash Redis',
  });
}
