import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization');
    const ipAddress = req.headers.get('x-forwarded-for') || null;
    const userAgent = req.headers.get('user-agent') || null;

    let userPayload: { id: string; role: string } | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7).trim();
        const verified = verifyAccessToken(token);
        userPayload = { id: verified.sub, role: verified.role };
      } catch {
        // Token might already be expired on logout
      }
    }

    await AuthService.logout({
      refreshToken: body.refreshToken,
      user: userPayload,
      ipAddress,
      userAgent,
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return new NextResponse(null, { status: 204 });
  }
}
