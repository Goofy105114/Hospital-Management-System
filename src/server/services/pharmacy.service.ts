import { prisma } from "@/lib/prisma";
import { SafetyCheckService } from "@/lib/safety-check";
import { PrescriptionStatus, StockMovementReason, AuditAction, Prisma } from "@prisma/client";
import { assessPrescriptionEligibility } from "@/server/domain/prescription-eligibility";
import {
  dispensingCompletionStatus,
  DispenseRequestItem,
  validateDispenseRequest,
} from "@/server/domain/dispensing";
import {
  InventoryLedgerService,
  InventoryMutationError,
} from "@/server/services/inventory-ledger.service";

export class PharmacyService {
  static async validatePrescription(prescriptionId: string, pharmacistId: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: { include: { medicine: true } },
        patient: { include: { allergies: true } },
      },
    });
    if (!prescription) return { success: false as const, code: "PHA_RX_NOT_FOUND", status: 404 };
    const eligibilityError = assessPrescriptionEligibility({
      status: prescription.status,
      createdAt: prescription.createdAt,
      validUntil: prescription.validUntil,
      hasInactiveMedicine: prescription.items.some((item) => !item.medicine.isActive),
    });
    if (eligibilityError) {
      return {
        success: false as const,
        code: eligibilityError,
        status: eligibilityError === "PHA_RX_ALREADY_DISPENSED" ? 409 : 422,
      };
    }

    const warnings = SafetyCheckService.checkPrescriptionSafety(
      prescription.items.map((item) => item.medicine.name),
      prescription.patient.allergies.map((allergy) => ({
        allergen: allergy.allergen,
        severity: allergy.severity,
      }))
    );
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: PrescriptionStatus.VALIDATED,
          validatedBy: pharmacistId,
          validatedAt: new Date(),
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: pharmacistId,
          action: AuditAction.APPROVE,
          entityType: "Prescription",
          entityId: prescriptionId,
          changes: { before: { status: prescription.status }, after: { status: result.status } },
        },
      });
      return result;
    });
    return { success: true as const, data: { validated: true, warnings, prescription: updated } };
  }

  static async reviewPrescription(
    prescriptionId: string,
    action: "HOLD" | "REJECT",
    reason: string,
    pharmacistId: string,
    queryToDoctor?: string
  ) {
    const current = await prisma.prescription.findUnique({ where: { id: prescriptionId } });
    if (!current) return { success: false as const, code: "PHA_RX_NOT_FOUND", status: 404 };
    if (
      current.status === PrescriptionStatus.DISPENSED ||
      current.status === PrescriptionStatus.REJECTED
    ) {
      return { success: false as const, code: "PHA_RX_NOT_REVIEWABLE", status: 422 };
    }
    const status = action === "HOLD" ? PrescriptionStatus.ON_HOLD : PrescriptionStatus.REJECTED;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status,
          holdReason: action === "HOLD" ? reason : null,
          rejectionReason: action === "REJECT" ? reason : null,
          pharmacistNotes: queryToDoctor,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: pharmacistId,
          action: AuditAction.UPDATE,
          entityType: "Prescription",
          entityId: prescriptionId,
          changes: { before: { status: current.status }, after: { status, reason } },
        },
      });
      await tx.outboxEvent.create({
        data: {
          topic: action === "HOLD" ? "prescription.held" : "prescription.rejected",
          aggregateType: "Prescription",
          aggregateId: prescriptionId,
          payload: { doctorId: current.doctorId, reason, queryToDoctor: queryToDoctor ?? null },
        },
      });
      return updated;
    });
    return { success: true as const, data: result };
  }
  /**
   * Run double-check safety analysis on prescription (PHA-03)
   */
  static async getSafetyCheck(prescriptionId: string) {
    const rx = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: { include: { medicine: true } },
        patient: { include: { allergies: true } },
      },
    });

    if (!rx) {
      return { success: false, code: "PHA_RX_NOT_FOUND", status: 404 };
    }

    const newMeds = rx.items.map((i) => i.medicine.name);
    const allergies = rx.patient.allergies.map((a) => ({
      allergen: a.allergen,
      severity: a.severity,
    }));

    const result = SafetyCheckService.checkPrescriptionSafety(newMeds, allergies);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Dispense medication and deduct from stock ledger atomically (PHA-04, INV-03)
   */
  static async dispensePrescription(params: {
    prescriptionId: string;
    dispensedBy: string;
    items: DispenseRequestItem[];
  }) {
    const requestError = validateDispenseRequest(params.items);
    if (requestError) return { success: false as const, code: requestError, status: 400 };
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Prescription" WHERE id = ${params.prescriptionId} FOR UPDATE`;
          const rx = await tx.prescription.findUnique({
            where: { id: params.prescriptionId },
            include: { items: { include: { medicine: true } } },
          });
          if (!rx) throw new InventoryMutationError("PHA_RX_NOT_FOUND", 404);
          if (
            rx.status !== PrescriptionStatus.VALIDATED &&
            rx.status !== PrescriptionStatus.PARTIALLY_DISPENSED
          ) {
            throw new InventoryMutationError("PHA_RX_NOT_VALIDATED", 422);
          }

          const dispensation = await tx.dispensation.create({
            data: {
              prescriptionId: rx.id,
              patientId: rx.patientId,
              dispensedBy: params.dispensedBy,
              totalAmount: 0,
              status: "PROCESSING",
            },
          });
          let totalAmount = 0;
          for (const item of params.items) {
            const rxItem = rx.items.find((candidate) => candidate.id === item.prescriptionItemId);
            if (!rxItem) throw new InventoryMutationError("PHA_RX_ITEM_MISMATCH", 422);
            const remaining = rxItem.quantityPrescribed - rxItem.quantityDispensed;
            if (item.quantityDispensed > remaining) {
              throw new InventoryMutationError("PHA_QUANTITY_EXCEEDS_REMAINING", 422, {
                remaining,
              });
            }
            const batch = await tx.stockBatch.findUnique({ where: { id: item.batchId } });
            const inventoryItem = batch
              ? await tx.inventoryItem.findUnique({ where: { id: batch.itemId } })
              : null;
            if (!batch || inventoryItem?.medicineId !== rxItem.medicineId) {
              throw new InventoryMutationError("PHA_BATCH_MEDICINE_MISMATCH", 422);
            }
            await InventoryLedgerService.recordMovement(tx, {
              itemId: inventoryItem.id,
              batchId: batch.id,
              locationId: batch.locationId,
              quantityDelta: -item.quantityDispensed,
              reason: StockMovementReason.DISPENSE,
              refType: "DISPENSATION",
              refId: dispensation.id,
              createdBy: params.dispensedBy,
            });
            await tx.dispensationItem.create({
              data: {
                dispensationId: dispensation.id,
                prescriptionItemId: rxItem.id,
                medicineId: rxItem.medicineId,
                batchId: batch.id,
                quantityDispensed: item.quantityDispensed,
                unitPrice: rxItem.medicine.unitPrice,
              },
            });
            await tx.prescriptionItem.update({
              where: { id: rxItem.id },
              data: { quantityDispensed: { increment: item.quantityDispensed } },
            });
            rxItem.quantityDispensed += item.quantityDispensed;
            totalAmount += Number(rxItem.medicine.unitPrice) * item.quantityDispensed;
          }

          const completion = dispensingCompletionStatus(rx.items);
          const prescriptionStatus =
            completion === "FULL"
              ? PrescriptionStatus.DISPENSED
              : PrescriptionStatus.PARTIALLY_DISPENSED;
          const completed = await tx.dispensation.update({
            where: { id: dispensation.id },
            data: { totalAmount, status: completion },
          });
          await tx.prescription.update({
            where: { id: rx.id },
            data: { status: prescriptionStatus },
          });
          await tx.auditLog.create({
            data: {
              actorId: params.dispensedBy,
              action: AuditAction.APPROVE,
              entityType: "Prescription",
              entityId: rx.id,
              changes: { after: { status: prescriptionStatus, dispensationId: completed.id } },
            },
          });
          await tx.outboxEvent.create({
            data: {
              topic:
                completion === "FULL"
                  ? "prescription.dispensed"
                  : "prescription.partially-dispensed",
              aggregateType: "Prescription",
              aggregateId: rx.id,
              payload: { patientId: rx.patientId, dispensationId: completed.id, completion },
            },
          });
          return { dispensation: completed, completion };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { success: true as const, data: result };
    } catch (error) {
      if (error instanceof InventoryMutationError) {
        return {
          success: false as const,
          code: error.code,
          status: error.status,
          details: error.details,
        };
      }
      throw error;
    }
  }
}
