import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { DiagnosticReportService } from "@/server/services/diagnostic-report.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.LAB_TECH, UserRole.RADIOLOGIST, UserRole.DOCTOR])) {
    return apiError("UNAUTHORIZED_ROLE", "Role cannot generate diagnostic reports", 403);
  }
  const result = await DiagnosticReportService.generate(params.id, user.sub, user.role);
  return result.success
    ? apiSuccess({ reportDocId: result.data.id }, undefined, 201)
    : apiError(result.code, "Unable to generate report", result.status);
}
