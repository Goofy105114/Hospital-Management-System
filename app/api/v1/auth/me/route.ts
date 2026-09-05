import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { verifyAccessToken } from '@/lib/jwt';
import { apiSuccess, apiError } from '@/lib/envelope';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('AUTH_TOKEN_INVALID', 'Bearer token required', 401);
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyAccessToken(token);

    const profile = await AuthService.getMe(payload.sub);
    return apiSuccess(profile, 200);
  } catch (err: any) {
    const status = err.statusCode || 401;
    const code = err.code || 'AUTH_TOKEN_INVALID';
    const message = err.message || 'Unauthorized';

    return apiError(code, message, status);
  }
}
