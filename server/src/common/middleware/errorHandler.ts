import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../errors.js';
import { errorResponse } from '../envelope.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  // Handle SyntaxError (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Malformed JSON payload'));
    return;
  }

  console.error('Unhandled server error:', err);

  res.status(500).json(
    errorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      'An unexpected internal server error occurred',
      { details: process.env.NODE_ENV === 'development' ? err.message : undefined }
    )
  );
}
