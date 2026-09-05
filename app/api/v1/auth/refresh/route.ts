import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { apiSuccess, apiError } from '@/lib/envelope';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || null;
    const userAgent = req.headers.get('user-agent') || null;

    const result = await AuthService.refresh({
      refreshToken: body.refreshToken,
      ipAddress,
      userAgent,
    });

    return apiSuccess(result, 200);
  } catch (err: any) {
    const status = err.statusCode || 401;
    const code = err.code || 'AUTH_TOKEN_INVALID';
    const message = err.message || 'Token refresh failed';

    return apiError(code, message, status);
  }
}
