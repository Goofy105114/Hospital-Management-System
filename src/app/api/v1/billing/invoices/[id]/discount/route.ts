import { NextRequest } from "next/server";
import { InvoiceAdjustmentMethod, InvoiceAdjustmentType } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { BillingPricingService } from "@/server/services/billing-pricing.service";
import { authorizeBillingStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeBillingStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const { type, value, reason, invoiceItemId } = await request.json();
  if (!Object.values(InvoiceAdjustmentMethod).includes(type)) {
    return apiError("BIL_INVALID_DISCOUNT_TYPE", "type must be PERCENT or FLAT", 400);
  }
  const result = await BillingPricingService.applyAdjustment({
    invoiceId: params.id,
    type: InvoiceAdjustmentType.DISCOUNT,
    method: type,
    value,
    reason,
    invoiceItemId,
    actorId: auth.user.sub,
    actorRole: auth.user.role,
  });
  return result.success
    ? apiSuccess({ newTotal: result.data.totals.finalTotal, calculation: result.data.totals })
    : apiError(result.code, "Unable to apply discount", result.status);
}
