import { NextRequest } from 'next/server';
import { UserRepository } from '@/lib/repositories/user.repository';
import { apiSuccess } from '@/lib/envelope';

export async function GET(_req: NextRequest) {
  const users = await UserRepository.getAll();
  const sanitized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    failedLoginCount: u.failedLoginCount,
    lockedUntil: u.lockedUntil,
  }));

  return apiSuccess(sanitized, 200);
}
