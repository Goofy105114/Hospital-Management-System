import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { BedStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * IPD-02 — GET /api/v1/inpatient/beds
 *
 * Lists beds, filterable by ?wardId= and ?status=.
 * Roles: DOCTOR, NURSE, RECEPTIONIST, ADMIN.
 */
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ADMIN,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to view beds", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const status = searchParams.get("status") as BedStatus | null;

    if (status && !Object.values(BedStatus).includes(status)) {
      return apiError(
        "IPD_INVALID_BED_STATUS",
        `status must be one of: ${Object.values(BedStatus).join(", ")}`,
        400
      );
    }

    const results = await prisma.bed.findMany({
      where: {
        ...(wardId ? { wardId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        ward: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ wardId: "asc" }, { bedNumber: "asc" }],
    });

    const beds = results.map((b) => ({
      id: b.id,
      bedNumber: b.bedNumber,
      status: b.status,
      dailyRate: Number(b.dailyRate),
      wardId: b.wardId,
      wardName: b.ward.name,
      wardType: b.ward.type,
    }));

    return apiSuccess(beds);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve beds", 500);
  }
}

/**
 * IPD-02 — POST /api/v1/inpatient/beds
 *
 * Creates a new bed in a ward. Enforces unique bedNumber per ward.
 * Roles: ADMIN.
 */
export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required to create beds", 403);
  }

  try {
    const body = await request.json();
    const { wardId, bedNumber, dailyRate } = body;

    if (!wardId || !bedNumber?.trim()) {
      return apiError("IPD_BED_FIELDS_REQUIRED", "wardId and bedNumber are required", 400);
    }

    // Verify ward exists
    const ward = await prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) {
      return apiError("IPD_WARD_NOT_FOUND", "Ward not found", 404);
    }

    try {
      const bed = await prisma.bed.create({
        data: {
          wardId,
          bedNumber: bedNumber.trim(),
          status: BedStatus.AVAILABLE,
          dailyRate: dailyRate ? Number(dailyRate) : 250.0,
        },
        include: { ward: { select: { name: true, type: true } } },
      });
      return apiSuccess(bed, undefined, 201);
    } catch (dbErr: any) {
      if (dbErr?.code === "P2002") {
        return apiError(
          "IPD_BED_NUMBER_TAKEN",
          "A bed with this number already exists in this ward",
          409
        );
      }
      throw dbErr;
    }
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create bed", 500);
  }
}

/**
 * IPD-03 — PATCH /api/v1/inpatient/beds
 *
 * Updates bed status (OCCUPIED, CLEANING, AVAILABLE, MAINTENANCE).
 */
export async function PATCH(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

  try {
    const body = await request.json();
    const { bedId, status } = body;
    if (!bedId) return apiError("BAD_REQUEST", "bedId is required", 400);

    const updated = await prisma.bed.update({
      where: { id: bedId },
      data: {
        ...(status ? { status: status as BedStatus } : {}),
      },
      include: { ward: true },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update bed", 500);
  }
}

