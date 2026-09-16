import { BatchStatus, Prisma, StockMovementReason } from "@prisma/client";
import { StockAlertService } from "@/server/services/stock-alert.service";

export class InventoryLedgerService {
  static async recordMovement(
    tx: Prisma.TransactionClient,
    input: {
      itemId: string;
      batchId: string;
      locationId: string;
      quantityDelta: number;
      reason: StockMovementReason;
      refType: string;
      refId: string;
      createdBy: string;
    }
  ) {
    await tx.$queryRaw`SELECT id FROM "StockBatch" WHERE id = ${input.batchId} FOR UPDATE`;
    const batch = await tx.stockBatch.findUnique({ where: { id: input.batchId } });
    if (!batch || batch.itemId !== input.itemId || batch.locationId !== input.locationId) {
      throw new InventoryMutationError("INV_BATCH_MISMATCH", 422);
    }
    if (input.quantityDelta < 0) {
      if (batch.status === BatchStatus.EXPIRED || batch.expiryDate <= new Date()) {
        throw new InventoryMutationError("PHA_BATCH_EXPIRED", 422);
      }
      if (batch.status !== BatchStatus.ACTIVE) {
        throw new InventoryMutationError("PHA_BATCH_UNAVAILABLE", 422);
      }
      if (batch.quantityAvailable < Math.abs(input.quantityDelta)) {
        throw new InventoryMutationError("PHA_INSUFFICIENT_STOCK", 422, {
          availableQuantity: batch.quantityAvailable,
        });
      }
    }
    const nextQuantity = batch.quantityAvailable + input.quantityDelta;
    if (nextQuantity < 0) throw new InventoryMutationError("INV_NEGATIVE_STOCK", 409);
    await tx.stockBatch.update({
      where: { id: batch.id },
      data: {
        quantityAvailable: nextQuantity,
        status: nextQuantity === 0 ? BatchStatus.DEPLETED : batch.status,
      },
    });
    await tx.inventoryItem.update({
      where: { id: input.itemId },
      data: { currentStockOnHand: { increment: input.quantityDelta } },
    });
    const entry = await tx.stockLedgerEntry.create({ data: input });
    await StockAlertService.evaluate(tx, input.itemId, input.locationId);
    return entry;
  }
}

export class InventoryMutationError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(code);
  }
}
