import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { requireAuth } from '../../common/middleware/auth.js';
import { successResponse } from '../../common/envelope.js';
import { UserRepository } from './user.repository.js';
import { AuditService } from '../audit/audit.service.js';

export const authRouter = Router();

/**
 * POST /api/v1/auth/login
 * Role-aware patient and staff login endpoint (IAM-01-S01, S02, S03)
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await AuthService.login({
      identifier,
      password,
      ipAddress,
      userAgent,
    });

    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token & rotate refresh token (IAM-01-S04)
 */
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await AuthService.refresh({
      refreshToken,
      ipAddress,
      userAgent,
    });

    res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 * Blacklist refresh token and record logout event (IAM-01-S04)
 */
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    await AuthService.logout({
      refreshToken,
      user: req.user ? { id: req.user.sub, role: req.user.role } : undefined,
      ipAddress,
      userAgent,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 * Retrieve current authenticated session identity
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const profile = await AuthService.getMe(userId);
    res.status(200).json(successResponse(profile));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/demo-users
 * Helper endpoint for UAT testing: provides pre-configured personas across roles
 */
authRouter.get('/demo-users', (_req: Request, res: Response) => {
  const users = UserRepository.getAll().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    failedLoginCount: u.failed_login_count,
    lockedUntil: u.locked_until,
  }));

  res.status(200).json(successResponse(users));
});

/**
 * GET /api/v1/auth/security-overview
 * Helper endpoint to inspect security events and audit log in real time
 */
authRouter.get('/security-overview', (_req: Request, res: Response) => {
  const securityEvents = AuditService.getRecentSecurityEvents(15);
  const auditLogs = AuditService.getRecentAuditLogs(15);

  res.status(200).json(
    successResponse({
      securityEvents,
      auditLogs,
    })
  );
});
