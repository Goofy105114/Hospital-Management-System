import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { validateStockAdjustmentInput } from "@/server/domain/inventory-item";
import { StockMovementReason } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const locationId = searchParams.get("locationId");
    const reason = searchParams.get("reason");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {};
    if (itemId) where.itemId = itemId;
    if (locationId) where.locationId = locationId;
    if (reason && Object.values(StockMovementReason).includes(reason.toUpperCase() as StockMovementReason)) {
      where.reason = reason.toUpperCase() as StockMovementReason;
    }

    const ledger = await prisma.stockLedgerEntry.findMany({
      where,
      include: {
        item: { select: { name: true, unit: true, sku: true } },
        location: { select: { name: true } },
        batch: { select: { batchNumber: true, expiryDate: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    const formatted = ledger.map((l) => ({
      id: l.id,
      itemId: l.itemId,
      itemName: l.item.name,
      sku: l.item.sku,
      unit: l.item.unit,
      locationId: l.locationId,
      locationName: l.location.name,
      batchId: l.batchId,
      batchNumber: l.batch?.batchNumber || null,
      quantityDelta: l.quantityDelta,
      reason: l.reason,
      refType: l.refType,
      refId: l.refId,
      createdBy: l.createdBy,
      createdAt: l.createdAt.toISOString(),
    }));

    return apiSuccess(formatted, `Retrieved ${formatted.length} stock ledger entries`);
  } catch (error: any) {
    return apiError("INV_LEDGER_FETCH_FAILED", error.message || "Failed to retrieve stock ledger", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = validateStockAdjustmentInput({
      itemId: body.itemId,
      locationId: body.locationId,
      batchId: body.batchId,
      quantityDelta: body.quantityDelta,
      reason: body.reason,
      justification: body.justification || body.notes,
      createdBy: body.createdBy,
    });

    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "VALIDATION_FAILED",
        validation.errorMessage || "Stock ledger input validation failed",
        400
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: body.itemId },
    });

    if (!item) {
      return apiError("INV_ITEM_NOT_FOUND", "Inventory item not found", 404);
    }

    const location = await prisma.stockLocation.findUnique({
      where: { id: body.locationId },
    });

    if (!location) {
      return apiError("INV_LOCATION_NOT_FOUND", "Stock location not found", 404);
    }

    const created = await prisma.stockLedgerEntry.create({
      data: {
        itemId: body.itemId,
        locationId: body.locationId,
        batchId: body.batchId || null,
        quantityDelta: body.quantityDelta,
        reason: body.reason.toUpperCase() as StockMovementReason,
        refType: body.refType || "MANUAL_ADJUSTMENT",
        refId: body.refId || null,
        createdBy: body.createdBy || "Inventory Manager",
      },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    return apiSuccess(
      {
        id: created.id,
        itemId: created.itemId,
        itemName: created.item.name,
        locationId: created.locationId,
        locationName: created.location.name,
        quantityDelta: created.quantityDelta,
        reason: created.reason,
        refType: created.refType,
        createdAt: created.createdAt.toISOString(),
        message: "Stock adjustment ledger entry recorded successfully",
      },
      "Stock movement ledger entry recorded successfully",
      201
    );
  } catch (error: any) {
    return apiError(
      "INV_ADJUSTMENT_FAILED",
      error.message || "Failed to record stock ledger adjustment",
      500
    );
  }
}
