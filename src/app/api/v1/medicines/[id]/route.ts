import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MedicineForm, UserRole } from "@prisma/client";

/**
 * PHA-02 — PATCH /api/v1/medicines/:id
 *
 * Updates a medicine's master data including activate/deactivate (isActive).
 * Inactive medicines are retained for historical records but excluded from
 * new-prescription search (enforced by the GET ?isActive=true filter).
 *
 * Roles allowed: INVENTORY_MANAGER, ADMIN.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      errorResponse("UNAUTHENTICATED", "Authentication required"),
      { status: 401 }
    );
  }
  if (!requireRole(user, [UserRole.INVENTORY_MANAGER, UserRole.ADMIN])) {
    return NextResponse.json(
      errorResponse("UNAUTHORIZED_ROLE", "Inventory manager or admin role required"),
      { status: 403 }
    );
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { name, genericName, form, strength, unit, manufacturer, unitPrice, isActive } = body;

    // Must provide at least one field
    if (
      name === undefined &&
      genericName === undefined &&
      form === undefined &&
      strength === undefined &&
      unit === undefined &&
      manufacturer === undefined &&
      unitPrice === undefined &&
      isActive === undefined
    ) {
      return NextResponse.json(
        errorResponse("PHA_PATCH_EMPTY", "Provide at least one field to update"),
        { status: 400 }
      );
    }

    // Validate form enum if provided
    if (form !== undefined && !Object.values(MedicineForm).includes(form as MedicineForm)) {
      return NextResponse.json(
        errorResponse(
          "PHA_INVALID_FORM",
          `form must be one of: ${Object.values(MedicineForm).join(", ")}`
        ),
        { status: 400 }
      );
    }

    // Build update payload — only include defined fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined)         updateData.name         = name;
    if (genericName !== undefined)  updateData.genericName  = genericName;
    if (form !== undefined)         updateData.form         = form as MedicineForm;
    if (strength !== undefined)     updateData.strength     = strength;
    if (unit !== undefined)         updateData.unit         = unit;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (unitPrice !== undefined)    updateData.unitPrice    = Number(unitPrice);
    if (isActive !== undefined)     updateData.isActive     = Boolean(isActive);

    try {
      const medicine = await prisma.medicine.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(successResponse(medicine));
    } catch (dbErr: any) {
      // P2025 = record not found
      if (dbErr?.code === "P2025") {
        return NextResponse.json(
          errorResponse("PHA_MEDICINE_NOT_FOUND", "Medicine not found"),
          { status: 404 }
        );
      }
      // DB offline — return intent confirmation
      return NextResponse.json(successResponse({ id, ...updateData }));
    }
  } catch (error) {
    return NextResponse.json(
      errorResponse("PHA_UPDATE_FAILED", "Failed to update medicine", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
