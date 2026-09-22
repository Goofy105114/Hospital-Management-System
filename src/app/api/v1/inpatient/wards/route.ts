import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole, WardType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          include: {
            admissions: {
              where: { status: "ADMITTED" },
              include: {
                patient: { select: { mrn: true, user: { select: { name: true } } } },
                admittingDoctor: { select: { user: { select: { name: true } } } },
              },
            },
          },
          orderBy: { bedNumber: "asc" },
        },
      },
    });

    const formatted = wards.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      totalBeds: w.totalBeds,
      occupiedBeds: w.beds.filter((b) => b.status === "OCCUPIED").length,
      availableBeds: w.beds.filter((b) => b.status === "AVAILABLE").length,
      beds: w.beds.map((b) => {
        const activeAdmission = b.admissions[0];
        return {
          id: b.id,
          bedNumber: b.bedNumber,
          status: b.status,
          dailyRate: Number(b.dailyRate),
          patientName: activeAdmission?.patient.user.name || null,
          patientMrn: activeAdmission?.patient.mrn || null,
          admissionDate: activeAdmission?.admissionDate.toISOString().slice(0, 10) || null,
          doctorName: activeAdmission?.admittingDoctor.user.name || null,
        };
      }),
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("WARDS_FETCH_FAILED", error.message || "Failed to retrieve inpatient wards", 500);
  }
}

/**
 * IPD-02 — POST /api/v1/inpatient/wards
 *
 * Creates a new ward. Roles: ADMIN.
 */
export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required to create wards", 403);
  }

  try {
    const body = await request.json();
    const { name, type, totalBeds } = body;

    if (!name?.trim()) {
      return apiError("IPD_WARD_NAME_REQUIRED", "Ward name is required", 400);
    }

    if (type && !Object.values(WardType).includes(type as WardType)) {
      return apiError(
        "IPD_INVALID_WARD_TYPE",
        `type must be one of: ${Object.values(WardType).join(", ")}`,
        400
      );
    }

    let ward = null;
    try {
      ward = await prisma.ward.create({
        data: {
          name: name.trim(),
          type: (type as WardType) ?? WardType.MALE_GENERAL,
          totalBeds: Number(totalBeds) || 20,
        },
      });
    } catch (dbErr: any) {
      if (dbErr?.code === "P2002") {
        return apiError("IPD_WARD_NAME_TAKEN", "A ward with this name already exists", 409);
      }
      throw dbErr;
    }

    return apiSuccess(ward, undefined, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create ward", 500);
  }
}
