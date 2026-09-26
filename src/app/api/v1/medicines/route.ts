import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MedicineForm, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();
    const isActiveParam = searchParams.get("isActive");
    const isActiveFilter =
      isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

    const dbMedicines = await prisma.medicine.findMany({
      where: {
        ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { genericName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        inventoryItems: {
          select: { currentStockOnHand: true, category: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = dbMedicines.map((m) => {
      const stock = m.inventoryItems?.reduce((acc, item) => acc + (item.currentStockOnHand || 0), 0) ?? 250;
      const category = m.manufacturer || m.inventoryItems?.[0]?.category || "General Medicine";
      return {
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        form: m.form,
        strength: m.strength || "Standard",
        unit: m.unit || "Tablet",
        category,
        atcCode: "N/A",
        unitPrice: Number(m.unitPrice ?? 1.5),
        stockOnHand: stock,
        isActive: m.isActive,
      };
    });

    return NextResponse.json(successResponse(formatted));
  } catch (error) {
    return NextResponse.json(
      errorResponse("MED_FETCH_FAILED", "Failed to retrieve medicines catalog", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // PHA-02: PHARMACIST, INVENTORY_MANAGER and ADMIN may add medicines to the formulary
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      errorResponse("UNAUTHENTICATED", "Authentication required"),
      { status: 401 }
    );
  }
  if (!requireRole(user, [UserRole.PHARMACIST, UserRole.INVENTORY_MANAGER, UserRole.ADMIN])) {
    return NextResponse.json(
      errorResponse("UNAUTHORIZED_ROLE", "Pharmacist, inventory manager, or admin role required"),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, genericName, form, strength, unit, manufacturer, unitPrice } = body;

    if (!name || !genericName || !form) {
      return NextResponse.json(
        errorResponse("PHA_INVALID_PAYLOAD", "Name, generic name, and form are required"),
        { status: 400 }
      );
    }

    const upperForm = String(form).toUpperCase() as MedicineForm;

    // Validate form enum
    if (!Object.values(MedicineForm).includes(upperForm)) {
      return NextResponse.json(
        errorResponse(
          "PHA_INVALID_FORM",
          `form must be one of: ${Object.values(MedicineForm).join(", ")}`
        ),
        { status: 400 }
      );
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: name.trim(),
        genericName: genericName.trim(),
        form: upperForm,
        strength: strength?.trim() || null,
        unit: unit || "Tablet",
        manufacturer: manufacturer?.trim() || null,
        unitPrice: unitPrice ? Number(unitPrice) : 1.5,
        isActive: true,
        inventoryItems: {
          create: {
            name: `${name.trim()} ${strength?.trim() || ""}`.trim(),
            category: "MEDICINE",
            unit: unit || "Box",
            reorderThreshold: 50,
            currentStockOnHand: 100,
          },
        },
      },
    });
    return NextResponse.json(successResponse(medicine), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse("PHA_CREATE_FAILED", "Failed to add medicine to formulary", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
