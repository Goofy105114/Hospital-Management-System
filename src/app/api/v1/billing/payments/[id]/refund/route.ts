import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { authorizeBillingStaff } from "../../route-auth";
import { validateRefundRequest } from "@/server/domain/refund-reversal";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authorizeBillingStaff(req);
    if (authResult.error) return authResult.error;

    const paymentId = params.id;
    const body = await req.json();
    const { amount, reason, originalPaymentAmount } = body;

    const paymentAmount = Number(originalPaymentAmount) || 500.0;
    const refundAmount = Number(amount);

    const validation = validateRefundRequest({
      originalPaymentAmount: paymentAmount,
      refundAmount,
      reason,
    });

    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "BIL_INVALID_REFUND",
        validation.errorMessage || "Invalid refund request",
        400
      );
    }

    const refund = {
      refundId: `ref-${Date.now()}`,
      paymentId,
      amount: refundAmount,
      status: "PROCESSED",
      processedBy: authResult.user?.name || "Billing Staff",
      reason,
      createdAt: new Date().toISOString(),
    };

    await logAuditEvent({
      actorId: authResult.user?.sub,
      actorRole: authResult.user?.role,
      action: AuditAction.UPDATE,
      entityType: "PaymentRefund",
      entityId: refund.refundId,
      changes: { after: refund },
    });

    return apiSuccess(refund, undefined, 201);
  } catch (error: any) {
    return apiError("BIL_REFUND_FAILED", error?.message || "Failed to process refund", 500);
  }
}
