import { NextRequest } from "next/server";
import { InvoiceAdjustmentMethod, InvoiceAdjustmentType } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { BillingPricingService } from "@/server/services/billing-pricing.service";
import { authorizeBillingStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeBillingStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const { amount, reason } = await request.json();
  const result = await BillingPricingService.applyAdjustment({
    invoiceId: params.id,
    type: InvoiceAdjustmentType.WAIVER,
    method: InvoiceAdjustmentMethod.FLAT,
    value: amount,
    reason,
    actorId: auth.user.sub,
    actorRole: auth.user.role,
  });
  return result.success
    ? apiSuccess({ status: result.data.adjustment.status, newTotal: result.data.totals.finalTotal })
    : apiError(result.code, "Unable to request waiver", result.status);
}
