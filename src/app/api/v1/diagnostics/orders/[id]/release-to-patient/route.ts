import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { DiagnosticReportService } from "@/server/services/diagnostic-report.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.DOCTOR])) {
    return apiError("UNAUTHORIZED_ROLE", "Doctor or administrator role required", 403);
  }
  const result = await DiagnosticReportService.release(params.id, user.sub, user.role);
  return result.success
    ? apiSuccess({ releasedAt: result.data.releasedAt })
    : apiError(result.code, "Unable to release report", result.status);
}
