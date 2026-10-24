import { NextResponse } from "next/server";

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: {
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface ApiPaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    timestamp: string;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
    timestamp: string;
  };
}

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown> | string
): ApiSuccessEnvelope<T> {
  const metaObj = typeof meta === "string" ? { message: meta } : (meta || {});
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...metaObj,
    },
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown> | null
): ApiErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      details: details || {},
      timestamp: new Date().toISOString(),
    },
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown> | string,
  status = 200
) {
  return NextResponse.json<ApiSuccessEnvelope<T>>(successResponse(data, meta), { status });
}

export function apiPaginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalItems: number,
  status = 200
) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  return NextResponse.json<ApiPaginatedEnvelope<T>>(
    {
      success: true,
      data,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown> | null
) {
  return NextResponse.json<ApiErrorEnvelope>(errorResponse(code, message, details), { status });
}
