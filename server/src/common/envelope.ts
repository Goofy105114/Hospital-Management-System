import { ApiResponse, ApiErrorResponse } from './types.js';

/**
 * Standard Success Response Envelope per PRD A.4.2
 * { "success": true, "data": { ... }, "meta": { "timestamp": "ISO8601" } }
 */
export function successResponse<T>(data: T, meta: Record<string, any> = {}): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Standard Error Response Envelope per PRD A.4.2
 * { "success": false, "error": { "code": "...", "message": "...", "details": { ... } } }
 */
export function errorResponse(
  code: string,
  message: string,
  details: Record<string, any> = {}
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
