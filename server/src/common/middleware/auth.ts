import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../jwt.js';
import { AppError, ErrorCodes } from '../errors.js';
import { JwtUserPayload } from '../types.js';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Authorization header with Bearer token is required'
      )
    );
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
