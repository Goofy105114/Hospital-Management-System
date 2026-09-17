import {
  AuditAction,
  BatchStatus,
  Prisma,
  StockMovementReason,
  StockTransferStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canTransitionTransfer, validateTransferRequest } from "@/server/domain/stock-transfer";
import {
  InventoryLedgerService,
  InventoryMutationError,
} from "@/server/services/inventory-ledger.service";

export class StockTransferService {
  static async request(input: {
    itemId: string;
    batchId: string;
    quantity: number;
    fromLocationId: string;
    toLocationId: string;
    actorId: string;
    actorRole: string;
  }) {
    const error = validateTransferRequest(input);
    if (error) return { success: false as const, code: error, status: 400 };
    const [source, destination, batch] = await Promise.all([
      prisma.stockLocation.findFirst({ where: { id: input.fromLocationId, isActive: true } }),
      prisma.stockLocation.findFirst({ where: { id: input.toLocationId, isActive: true } }),
      prisma.stockBatch.findUnique({ where: { id: input.batchId } }),
    ]);
    if (!source || !destination) {
      return { success: false as const, code: "INV_TRANSFER_LOCATION_UNAVAILABLE", status: 422 };
    }
    if (!batch || batch.itemId !== input.itemId || batch.locationId !== source.id) {
      return { success: false as const, code: "INV_TRANSFER_BATCH_MISMATCH", status: 422 };
    }
    if (batch.status !== BatchStatus.ACTIVE || batch.expiryDate <= new Date()) {
      return { success: false as const, code: "INV_TRANSFER_BATCH_UNAVAILABLE", status: 422 };
    }
    const transfer = await prisma.$transaction(async (tx) => {
      const created = await tx.stockTransfer.create({
        data: {
          itemId: input.itemId,
          sourceBatchId: input.batchId,
          quantity: input.quantity,
          fromLocationId: input.fromLocationId,
          toLocationId: input.toLocationId,
          requestedBy: input.actorId,
        },
      });
      await this.recordEvent(tx, created.id, "REQUESTED", input.actorId, {
        quantity: input.quantity,
      });
      await this.audit(tx, created.id, input.actorId, input.actorRole, "REQUESTED");
      return created;
    });
    return { success: true as const, data: transfer };
  }

  static async dispatch(id: string, actorId: string, actorRole: string) {
    try {
      const transfer = await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "StockTransfer" WHERE id = ${id} FOR UPDATE`;
          const current = await tx.stockTransfer.findUnique({ where: { id } });
          if (!current) throw new TransferError("INV_TRANSFER_NOT_FOUND", 404);
          if (!canTransitionTransfer(current.status, StockTransferStatus.DISPATCHED)) {
            throw new TransferError("INV_TRANSFER_INVALID_STATE", 422);
          }
          await InventoryLedgerService.recordMovement(tx, {
            itemId: current.itemId,
            batchId: current.sourceBatchId,
            locationId: current.fromLocationId,
            quantityDelta: -current.quantity,
            reason: StockMovementReason.TRANSFER_OUT,
            refType: "STOCK_TRANSFER",
            refId: current.id,
            createdBy: actorId,
          });
          const updated = await tx.stockTransfer.update({
            where: { id },
            data: {
              status: StockTransferStatus.DISPATCHED,
              dispatchedBy: actorId,
              dispatchedAt: new Date(),
            },
          });
          await this.recordEvent(tx, id, "DISPATCHED", actorId, { quantity: current.quantity });
          await this.audit(tx, id, actorId, actorRole, "DISPATCHED");
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { success: true as const, data: transfer };
    } catch (error) {
      return this.error(error);
    }
  }

  static async receive(id: string, receivedQuantity: number, actorId: string, actorRole: string) {
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return { success: false as const, code: "INV_TRANSFER_INVALID_RECEIPT", status: 400 };
    }
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "StockTransfer" WHERE id = ${id} FOR UPDATE`;
          const current = await tx.stockTransfer.findUnique({
            where: { id },
            include: { sourceBatch: true },
          });
          if (!current) throw new TransferError("INV_TRANSFER_NOT_FOUND", 404);
          if (!canTransitionTransfer(current.status, StockTransferStatus.RECEIVED)) {
            throw new TransferError("INV_TRANSFER_INVALID_STATE", 422);
          }
          let destinationBatch = await tx.stockBatch.findFirst({
            where: {
              itemId: current.itemId,
              locationId: current.toLocationId,
              lotNumber: current.sourceBatch.lotNumber,
              expiryDate: current.sourceBatch.expiryDate,
            },
          });
          if (!destinationBatch) {
            destinationBatch = await tx.stockBatch.create({
              data: {
                itemId: current.itemId,
                locationId: current.toLocationId,
                lotNumber: current.sourceBatch.lotNumber,
                manufacturingDate: current.sourceBatch.manufacturingDate,
                expiryDate: current.sourceBatch.expiryDate,
                quantityAvailable: 0,
                unitCost: current.sourceBatch.unitCost,
                status: BatchStatus.ACTIVE,
              },
            });
          }
          if (receivedQuantity > 0) {
            await InventoryLedgerService.recordMovement(tx, {
              itemId: current.itemId,
              batchId: destinationBatch.id,
              locationId: current.toLocationId,
              quantityDelta: receivedQuantity,
              reason: StockMovementReason.TRANSFER_IN,
              refType: "STOCK_TRANSFER",
              refId: current.id,
              createdBy: actorId,
            });
          }
          const discrepancy = current.quantity - receivedQuantity;
          const updated = await tx.stockTransfer.update({
            where: { id },
            data: {
              destinationBatchId: destinationBatch.id,
              receivedQuantity,
              discrepancyQuantity: discrepancy,
              status: StockTransferStatus.RECEIVED,
              receivedBy: actorId,
              receivedAt: new Date(),
            },
          });
          await this.recordEvent(tx, id, "RECEIVED", actorId, {
            dispatchedQuantity: current.quantity,
            receivedQuantity,
            discrepancy,
          });
          await this.audit(tx, id, actorId, actorRole, "RECEIVED");
          return { transfer: updated, discrepancy };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { success: true as const, data: result };
    } catch (error) {
      return this.error(error);
    }
  }

  private static recordEvent(
    tx: Prisma.TransactionClient,
    transferId: string,
    action: string,
    actorId: string,
    payload: Prisma.InputJsonObject
  ) {
    return tx.stockTransferEvent.create({ data: { transferId, action, actorId, payload } });
  }

  private static async audit(
    tx: Prisma.TransactionClient,
    entityId: string,
    actorId: string,
    actorRole: string,
    status: string
  ) {
    await tx.auditLog.create({
      data: {
        actorId,
        actorRole,
        action: AuditAction.UPDATE,
        entityType: "StockTransfer",
        entityId,
        changes: { after: { status } },
      },
    });
    await tx.outboxEvent.create({
      data: {
        topic: `inventory.transfer.${status.toLowerCase()}`,
        aggregateType: "StockTransfer",
        aggregateId: entityId,
        payload: { status },
      },
    });
  }

  private static error(error: unknown) {
    if (error instanceof TransferError || error instanceof InventoryMutationError) {
      const code =
        error.code === "PHA_INSUFFICIENT_STOCK" ? "INV_TRANSFER_INSUFFICIENT_STOCK" : error.code;
      return { success: false as const, code, status: error.status, details: error.details };
    }
    throw error;
  }
}

class TransferError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(code);
  }
}
