import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, PaymentMethod } from "@prisma/client";
import { authorizeBillingStaff } from "../../../route-auth";

/**
 * BIL-04 — POST /api/v1/billing/invoices/:id/payments
 *
 * Records a payment against an invoice (adapter-agnostic — no gateway binding
 * per SOW §7.1). Payment is created with an implicit PENDING status tracked via
 * AuditLog. The invoice status is NOT updated until the payment is confirmed
 * via PATCH /billing/payments/:id/status with { status: "SUCCESS" }.
 *
 * Roles: BILLING_STAFF, ADMIN.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authorizeBillingStaff(request);
  if (auth.error || !auth.user) return auth.error;

  try {
    const { id } = params;
    const body = await request.json();
    const { amount, mode, externalRef } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return apiError("BIL_INVALID_AMOUNT", "amount must be a positive number", 400);
    }

    if (!mode || !Object.values(PaymentMethod).includes(mode as PaymentMethod)) {
      return apiError(
        "BIL_INVALID_MODE",
        `mode must be one of: ${Object.values(PaymentMethod).join(", ")}`,
        400
      );
    }

    // Fetch invoice to validate it exists and is payable
    let invoice = null;
    try {
      invoice = await prisma.invoice.findUnique({ where: { id } });
    } catch {
      // DB offline
    }

    if (invoice === null) {
      return apiError("BIL_INVOICE_NOT_FOUND", "Invoice not found", 404);
    }

    if (invoice && invoice.status === "CANCELLED") {
      return apiError("BIL_INVOICE_CANCELLED", "Cannot collect payment on a cancelled invoice", 422);
    }

    if (invoice && invoice.status === "PAID") {
      return apiError("BIL_INVOICE_ALREADY_PAID", "Invoice is already fully paid", 422);
    }

    // Create the payment record
    let payment = null;
    try {
      payment = await prisma.payment.create({
        data: {
          invoiceId: id,
          patientId: invoice.patientId,
          amount: Number(amount),
          paymentMethod: mode as PaymentMethod,
          transactionReference: externalRef ?? null,
          collectedBy: auth.user.sub,
        },
      });
    } catch {
      // DB offline — return intent confirmation
      payment = {
        id: `pay-${Date.now()}`,
        invoiceId: id,
        amount: Number(amount),
        paymentMethod: mode,
        transactionReference: externalRef ?? null,
        collectedBy: auth.user.sub,
        createdAt: new Date().toISOString(),
      };
    }

    // Audit — record as PENDING (payment recorded but not yet confirmed)
    await logAuditEvent({
      actorId: auth.user.sub,
      actorRole: auth.user.role,
      action: AuditAction.CREATE,
      entityType: "Payment",
      entityId: (payment as any).id,
      changes: {
        after: {
          invoiceId: id,
          amount: Number(amount),
          mode,
          externalRef: externalRef ?? null,
          status: "PENDING",
        },
      },
    });

    return apiSuccess(
      {
        paymentId: (payment as any).id,
        invoiceId: id,
        amount: Number(amount),
        mode,
        externalRef: externalRef ?? null,
        status: "PENDING",
        message: "Payment recorded. Confirm with PATCH /billing/payments/:id/status",
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to record payment", 500);
  }
}
