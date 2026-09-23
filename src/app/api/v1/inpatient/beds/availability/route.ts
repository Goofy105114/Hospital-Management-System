import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { BedStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * IPD-02 — GET /api/v1/inpatient/beds/availability
 *
 * Returns all AVAILABLE beds, optionally filtered by ?wardId=.
 * Used by IPD-03 bed assignment to find a valid bed before admitting a patient.
 * The double-assignment concurrency constraint (🔐 unique active assignment per bed)
 * is enforced at the admission layer (IPD-03), not here.
 *
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
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to view bed availability", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");

    const beds = await prisma.bed.findMany({
      where: {
        status: BedStatus.AVAILABLE,
        ...(wardId ? { wardId } : {}),
      },
      include: {
        ward: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ wardId: "asc" }, { bedNumber: "asc" }],
    });

    const available = beds.map((b) => ({
      bedId: b.id,
      bedNumber: b.bedNumber,
      status: b.status,
      dailyRate: Number(b.dailyRate),
      wardId: b.wardId,
      wardName: b.ward.name,
      wardType: b.ward.type,
    }));

    return apiSuccess({
      wardId: wardId ?? null,
      totalAvailable: (available as unknown[]).length,
      beds: available,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve bed availability", 500);
  }
}
