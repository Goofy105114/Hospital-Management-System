import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { AdmissionStatus, BedStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
    if (!requireRole(user, [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST, UserRole.MANAGEMENT])) {
      return apiError("UNAUTHORIZED_ROLE", "Staff or clinical role required to view inpatient admissions", 403);
    }

    const admissions = await prisma.admission.findMany({
      include: {
        patient: { include: { user: true } },
        admittingDoctor: { include: { user: true } },
        bed: { include: { ward: true } },
      },
      orderBy: { admissionDate: "desc" },
    });

    const formatted = admissions.map((adm) => ({
      id: adm.id,
      admissionNumber: adm.admissionNumber,
      patientName: adm.patient.user.name,
      mrn: adm.patient.mrn,
      wardName: adm.bed?.ward?.name || "General Ward",
      bedNumber: adm.bed?.bedNumber || "Unassigned",
      attendingDoctor: adm.admittingDoctor.user.name,
      admittedAt: adm.admissionDate.toISOString().replace("T", " ").slice(0, 16),
      diagnosis: adm.admissionDiagnosis || "Inpatient observation and management",
      dischargeReady: adm.status === AdmissionStatus.DISCHARGED,
      status: adm.status,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("ADMISSIONS_FETCH_FAILED", error.message || "Failed to retrieve admissions", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
    if (!requireRole(user, [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.SUPER_ADMIN])) {
      return apiError("UNAUTHORIZED_ROLE", "Clinical or admin role required to update admissions", 403);
    }

    const body = await request.json();
    const { admissionId, status, dischargeSummary } = body;

    if (!admissionId) {
      return apiError("BAD_REQUEST", "admissionId is required", 400);
    }

    const updated = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        ...(status ? { status: status as AdmissionStatus } : {}),
        dischargeSummary: dischargeSummary || undefined,
        dischargeDate: status === AdmissionStatus.DISCHARGED ? new Date() : undefined,
      },
      include: {
        bed: true,
      },
    });

    if (status === AdmissionStatus.DISCHARGED && updated.bedId) {
      await prisma.bed.update({
        where: { id: updated.bedId },
        data: { status: BedStatus.AVAILABLE },
      });
    }

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError("ADMISSION_UPDATE_FAILED", error.message || "Failed to update admission", 500);
  }
}
