import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { authorizeInventoryManager } from "../route-auth";
import { validateInventoryItem } from "@/server/domain/inventory-item";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: {
        batches: {
          where: { status: "ACTIVE" },
          orderBy: { expiryDate: "asc" },
        },
        medicine: true,
      },
      orderBy: { name: "asc" },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      reorderThreshold: item.reorderThreshold,
      currentStockOnHand: item.currentStockOnHand,
      isLowStock: item.currentStockOnHand <= item.reorderThreshold,
      batchesCount: item.batches.length,
      batches: item.batches.map((b) => ({
        id: b.id,
        lotNumber: b.lotNumber,
        expiryDate: b.expiryDate.toISOString().slice(0, 10),
        quantityAvailable: b.quantityAvailable,
        unitCost: Number(b.unitCost),
        status: b.status,
      })),
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("INV_FETCH_FAILED", err?.message || "Failed to retrieve inventory items", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = authorizeInventoryManager(req);
    if (authResult.error) return authResult.error;

    const body = await req.json();
    const validation = validateInventoryItem(body);
    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "INV_INVALID_PAYLOAD",
        validation.errorMessage || "Invalid item payload",
        400
      );
    }

    const created = await prisma.inventoryItem.create({
      data: {
        name: body.name.trim(),
        category: body.category,
        unit: body.unit,
        reorderThreshold: Number(body.reorderThreshold) || 0,
        currentStockOnHand: 0,
        medicineId: body.medicineId || null,
        isActive: true,
      },
    });

    await logAuditEvent({
      actorId: authResult.user?.sub,
      actorRole: authResult.user?.role,
      action: AuditAction.CREATE,
      entityType: "InventoryItem",
      entityId: created.id,
      changes: { after: created },
    });

    return apiSuccess(created, undefined, 201);
  } catch (err: any) {
    return apiError("INV_CREATE_FAILED", err.message || "Failed to create inventory item", 500);
  }
}
