import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return apiError("AUTH_INVALID_REQUEST", "Identifier and password are required", 400);
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const requestId = req.headers.get("x-request-id") || undefined;

    const result = await AuthService.login(identifier, password, ip, requestId);

    if (!result.success || !result.data) {
      return apiError(
        result.code || "AUTH_FAILED",
        "Authentication failed",
        result.status || 401,
        result.details
      );
    }

    const response = apiSuccess(result.data, undefined, 200);
    response.cookies.set("accessToken", result.data.accessToken, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });
    response.cookies.set("activeRole", result.data.user.role, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("[LOGIN ROUTE ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500);
  }
}
