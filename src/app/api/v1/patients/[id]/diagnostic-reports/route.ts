import { NextRequest } from "next/server";
import { AuditAction, UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.PATIENT, UserRole.DOCTOR])) {
    return apiError("UNAUTHORIZED_ROLE", "Role cannot view diagnostic reports", 403);
  }
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!patient) return apiError("PATIENT_NOT_FOUND", "Patient not found", 404);
  if (user.role === UserRole.PATIENT && patient.userId !== user.sub) {
    return apiError("DIA_REPORT_SCOPE_DENIED", "Patients may only view their own reports", 403);
  }
  const doctor =
    user.role === UserRole.DOCTOR
      ? await prisma.doctor.findUnique({ where: { userId: user.sub }, select: { id: true } })
      : null;
  const reports = await prisma.diagnosticReport.findMany({
    where: {
      patientId: params.id,
      ...(user.role === UserRole.PATIENT ? { releasedAt: { not: null } } : {}),
      ...(user.role === UserRole.DOCTOR ? { order: { doctorId: doctor?.id ?? "" } } : {}),
    },
    include: { order: { select: { orderNumber: true, status: true } } },
    orderBy: { generatedAt: "desc" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.VIEW,
      entityType: "DiagnosticReportHistory",
      entityId: params.id,
      changes: {},
    },
  });
  return apiSuccess(reports);
}
