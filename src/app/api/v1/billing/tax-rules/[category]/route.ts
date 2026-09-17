import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { BillingPricingService } from "@/server/services/billing-pricing.service";

export async function PUT(request: NextRequest, { params }: { params: { category: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, []))
    return apiError("UNAUTHORIZED_ROLE", "Administrator role required", 403);
  const { ratePercent } = await request.json();
  const result = await BillingPricingService.setTaxRule(params.category, ratePercent);
  return result.success
    ? apiSuccess(result.data)
    : apiError(result.code, "Unable to configure tax", result.status);
}
