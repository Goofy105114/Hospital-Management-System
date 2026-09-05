import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { apiSuccess, apiError } from '@/lib/envelope';

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate patient or staff member
 *     description: Authenticates with email or mobile phone and password. Returns JWT access & refresh tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully authenticated
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account locked or suspended
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || null;
    const userAgent = req.headers.get('user-agent') || null;

    const result = await AuthService.login({
      identifier: body.identifier,
      password: body.password,
      ipAddress,
      userAgent,
    });

    return apiSuccess(result, 201);
  } catch (err: any) {
    const status = err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred during login.';
    const details = err.details || {};

    return apiError(code, message, status, details);
  }
}
