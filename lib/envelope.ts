import { NextResponse } from 'next/server';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
}

export function apiSuccess<T>(data: T, status = 200, extraMeta: Record<string, any> = {}) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...extraMeta,
      },
    },
    { status }
  );
}

export function apiError(code: string, message: string, status = 400, details: Record<string, any> = {}) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}
