import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { BillingPricingService } from "@/server/services/billing-pricing.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, []))
    return apiError("UNAUTHORIZED_ROLE", "Administrator role required", 403);
  const { approve = true } = await request.json();
  const result = await BillingPricingService.approveWaiver(
    params.id,
    Boolean(approve),
    user.sub,
    user.role
  );
  return result.success
    ? apiSuccess({ status: result.data.adjustment.status, newTotal: result.data.totals.finalTotal })
    : apiError(result.code, "Unable to decide waiver", result.status);
}
