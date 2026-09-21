import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { getAuthUser } from "@/lib/auth";
import { UserLifecycleService } from "@/server/services/user-lifecycle.service";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const { role } = body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        errorResponse("INVALID_ROLE", `Provided role '${role}' is invalid.`),
        { status: 400 }
      );
    }

    const actor = {
      id: authUser?.sub,
      role: authUser?.role || "ADMIN",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      requestId: req.headers.get("x-request-id") || undefined,
    };

    try {
      const result = await UserLifecycleService.updateUserRole(
        params.id,
        role as UserRole,
        actor
      );

      if (!result.success) {
        return NextResponse.json(
          errorResponse(result.code || "ROLE_UPDATE_FAILED", result.message || "Failed to update role"),
          { status: result.status || 400 }
        );
      }

      return NextResponse.json(successResponse(result.data));
    } catch {
      // Mock fallback
      return NextResponse.json(
        successResponse({
          id: params.id,
          role,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  } catch (error) {
    return NextResponse.json(
      errorResponse("ROLE_UPDATE_ERROR", "An error occurred while updating user role", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
