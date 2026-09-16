import { prisma } from "@/lib/prisma";
import { SafetyCheckService } from "@/lib/safety-check";
import { logAuditEvent } from "@/lib/audit";
import { PrescriptionStatus, StockMovementReason, AuditAction } from "@prisma/client";
import { assessPrescriptionEligibility } from "@/server/domain/prescription-eligibility";

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
    items: Array<{
      prescriptionItemId: string;
      medicineId: string;
      batchId?: string;
      quantity: number;
    }>;
  }) {
    const rx = await prisma.prescription.findUnique({
      where: { id: params.prescriptionId },
      include: { items: { include: { medicine: true } } },
    });

    if (!rx) {
      return { success: false, code: "PHA_RX_NOT_FOUND", status: 404 };
    }

    if (rx.status === PrescriptionStatus.DISPENSED) {
      return { success: false, code: "PHA_RX_ALREADY_DISPENSED", status: 409 };
    }

    // Resolve default pharmacy store location
    const location = await prisma.stockLocation.findFirst({
      where: { type: "PHARMACY", isActive: true },
    });
    const locationId = location?.id || "";

    // Execute in atomic DB transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      // 1. Create dispensation record
      const dispensation = await tx.dispensation.create({
        data: {
          prescriptionId: params.prescriptionId,
          dispensedBy: params.dispensedBy,
          totalAmount: 0, // updated below
          status: "COMPLETED",
        },
      });

      // 2. Process each item, create dispensation item and stock ledger entry
      for (const item of params.items) {
        const rxItem = rx.items.find((i) => i.id === item.prescriptionItemId);
        const unitPrice = rxItem?.medicine.unitPrice || 1.5;
        const lineTotal = Number(unitPrice) * item.quantity;
        totalAmount += lineTotal;

        // Record dispensation item
        await tx.dispensationItem.create({
          data: {
            dispensationId: dispensation.id,
            prescriptionItemId: item.prescriptionItemId,
            medicineId: item.medicineId,
            batchId: item.batchId || null,
            quantityDispensed: item.quantity,
            unitPrice,
          },
        });

        // Update prescription item dispensed quantity
        await tx.prescriptionItem.update({
          where: { id: item.prescriptionItemId },
          data: { quantityDispensed: { increment: item.quantity } },
        });

        // Find matching inventory item
        const invItem = await tx.inventoryItem.findFirst({
          where: { medicineId: item.medicineId },
        });

        if (invItem && locationId) {
          // Deduct from stock ledger (append-only ledger row)
          await tx.stockLedgerEntry.create({
            data: {
              itemId: invItem.id,
              batchId: item.batchId || null,
              locationId,
              quantityDelta: -item.quantity, // negative for dispense
              reason: StockMovementReason.DISPENSE,
              refType: "DISPENSATION",
              refId: dispensation.id,
              createdBy: params.dispensedBy,
            },
          });

          // Update currentStockOnHand
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { currentStockOnHand: { decrement: item.quantity } },
          });

          // Decrement batch quantity if batch specified
          if (item.batchId) {
            await tx.stockBatch.update({
              where: { id: item.batchId },
              data: { quantityAvailable: { decrement: item.quantity } },
            });
          }
        }
      }

      // 3. Update total on dispensation and prescription status
      await tx.dispensation.update({
        where: { id: dispensation.id },
        data: { totalAmount },
      });

      await tx.prescription.update({
        where: { id: params.prescriptionId },
        data: {
          status: PrescriptionStatus.DISPENSED,
          validatedBy: params.dispensedBy,
          validatedAt: new Date(),
        },
      });

      return dispensation;
    });

    await logAuditEvent({
      actorId: params.dispensedBy,
      action: AuditAction.APPROVE,
      entityType: "Prescription",
      entityId: params.prescriptionId,
      changes: { after: { status: "DISPENSED", dispensationId: result.id } },
    });

    return { success: true, data: result };
  }
}
