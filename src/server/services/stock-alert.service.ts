import { AuditAction, BatchStatus, Prisma, StockAlertStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { desiredAlertStatus, validateThreshold } from "@/server/domain/stock-alert";

export class StockAlertService {
  static async setThreshold(input: {
    itemId: string;
    locationId: string;
    minQuantity: number;
    reorderQuantity: number;
    actorId: string;
    actorRole: string;
  }) {
    const error = validateThreshold(input.minQuantity, input.reorderQuantity);
    if (error) return { success: false as const, code: error, status: 400 };
    try {
      const threshold = await prisma.$transaction(async (tx) => {
        const [item, location] = await Promise.all([
          tx.inventoryItem.findFirst({ where: { id: input.itemId, isActive: true } }),
          tx.stockLocation.findFirst({ where: { id: input.locationId, isActive: true } }),
        ]);
        if (!item || !location) throw new StockAlertError("INV_THRESHOLD_TARGET_NOT_FOUND", 404);
        const updated = await tx.reorderThreshold.upsert({
          where: { itemId_locationId: { itemId: input.itemId, locationId: input.locationId } },
          create: {
            itemId: input.itemId,
            locationId: input.locationId,
            minQuantity: input.minQuantity,
            reorderQuantity: input.reorderQuantity,
            updatedBy: input.actorId,
          },
          update: {
            minQuantity: input.minQuantity,
            reorderQuantity: input.reorderQuantity,
            updatedBy: input.actorId,
          },
        });
        await this.evaluate(tx, input.itemId, input.locationId);
        await tx.auditLog.create({
          data: {
            actorId: input.actorId,
            actorRole: input.actorRole,
            action: AuditAction.UPDATE,
            entityType: "ReorderThreshold",
            entityId: updated.id,
            changes: {
              after: {
                minQuantity: input.minQuantity,
                reorderQuantity: input.reorderQuantity,
              },
            },
          },
        });
        return updated;
      });
      return { success: true as const, data: threshold };
    } catch (error) {
      if (error instanceof StockAlertError) {
        return { success: false as const, code: error.code, status: error.status };
      }
      throw error;
    }
  }

  static async evaluate(tx: Prisma.TransactionClient, itemId: string, locationId: string) {
    const threshold = await tx.reorderThreshold.findUnique({
      where: { itemId_locationId: { itemId, locationId } },
    });
    if (!threshold) return null;
    const stock = await tx.stockBatch.aggregate({
      where: {
        itemId,
        locationId,
        status: BatchStatus.ACTIVE,
        expiryDate: { gt: new Date() },
      },
      _sum: { quantityAvailable: true },
    });
    const currentQuantity = stock._sum.quantityAvailable ?? 0;
    const existing = await tx.stockAlert.findFirst({
      where: {
        itemId,
        locationId,
        status: { in: [StockAlertStatus.OPEN, StockAlertStatus.ACKNOWLEDGED] },
      },
      orderBy: { createdAt: "desc" },
    });
    const desired = desiredAlertStatus(currentQuantity, threshold.minQuantity, existing?.status);
    if (desired === StockAlertStatus.OPEN && !existing) {
      const alert = await tx.stockAlert.create({
        data: { itemId, locationId, currentQuantity, threshold: threshold.minQuantity },
      });
      await tx.outboxEvent.create({
        data: {
          topic: "inventory.low-stock",
          aggregateType: "StockAlert",
          aggregateId: alert.id,
          payload: { itemId, locationId, currentQuantity, threshold: threshold.minQuantity },
        },
      });
      return alert;
    }
    if (existing && desired === StockAlertStatus.RESOLVED) {
      return tx.stockAlert.update({
        where: { id: existing.id },
        data: { status: StockAlertStatus.RESOLVED, currentQuantity, resolvedAt: new Date() },
      });
    }
    if (existing) {
      return tx.stockAlert.update({ where: { id: existing.id }, data: { currentQuantity } });
    }
    return null;
  }

  static async acknowledge(id: string, actorId: string, actorRole: string) {
    try {
      const alert = await prisma.$transaction(async (tx) => {
        const current = await tx.stockAlert.findUnique({ where: { id } });
        if (!current) throw new StockAlertError("INV_ALERT_NOT_FOUND", 404);
        if (current.status === StockAlertStatus.RESOLVED) {
          throw new StockAlertError("INV_ALERT_ALREADY_RESOLVED", 422);
        }
        const updated = await tx.stockAlert.update({
          where: { id },
          data: {
            status: StockAlertStatus.ACKNOWLEDGED,
            acknowledgedBy: actorId,
            acknowledgedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            actorRole,
            action: AuditAction.UPDATE,
            entityType: "StockAlert",
            entityId: id,
            changes: { after: { status: updated.status } },
          },
        });
        return updated;
      });
      return { success: true as const, data: alert };
    } catch (error) {
      if (error instanceof StockAlertError) {
        return { success: false as const, code: error.code, status: error.status };
      }
      throw error;
    }
  }

  static async expireBatches() {
    return prisma.stockBatch.updateMany({
      where: { expiryDate: { lte: new Date() }, status: BatchStatus.ACTIVE },
      data: { status: BatchStatus.EXPIRED },
    });
  }
}

export class StockAlertError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
  }
}
