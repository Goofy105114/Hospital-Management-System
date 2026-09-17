import { NextRequest } from "next/server";
import { AuditAction, UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { DiagnosticReportService } from "@/server/services/diagnostic-report.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.LAB_TECH, UserRole.RADIOLOGIST])) {
    return apiError("UNAUTHORIZED_ROLE", "Diagnostic staff role required", 403);
  }
  const body = await request.json();
  if (!body.testId || (body.numericValue === undefined && !body.textValue)) {
    return apiError("DIA_INVALID_RESULT", "testId and a result value are required", 400);
  }
  const result = await DiagnosticReportService.recordResult({
    ...body,
    orderId: params.id,
    actorId: user.sub,
    actorRole: user.role,
    isAbnormal: Boolean(body.isAbnormal),
    isCritical: Boolean(body.isCritical),
  });
  return apiSuccess(result.data, undefined, 201);
}
