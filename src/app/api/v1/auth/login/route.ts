import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return apiError("AUTH_INVALID_REQUEST", "Identifier and password are required", 400);
    }

    if (typeof identifier === "string" && identifier.includes("@") && !isValidEmail(identifier)) {
      return apiError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid email format: email username cannot consist of only numbers or start with a number",
        400
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const requestId = req.headers.get("x-request-id") || undefined;

    const result = await AuthService.login(identifier, password, ip, requestId);

    if (!result.success) {
      return apiError(
        result.code || "AUTH_FAILED",
        "Authentication failed",
        result.status || 401,
        result.details
      );
    }

    return apiSuccess(result.data, undefined, 200);
  } catch (err) {
    console.error("[LOGIN ROUTE ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500);
  }
}
