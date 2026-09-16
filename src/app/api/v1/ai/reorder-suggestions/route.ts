import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { InventoryForecastService } from "@/server/services/inventory-forecast.service";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.INVENTORY_MANAGER])) {
    return apiError("UNAUTHORIZED_ROLE", "Inventory manager role required", 403);
  }
  const locationId = new URL(request.url).searchParams.get("locationId");
  if (!locationId) return apiError("INV_LOCATION_REQUIRED", "locationId is required", 400);
  const result = await InventoryForecastService.suggestions(locationId);
  return result.success
    ? apiSuccess(result.data)
    : apiError(result.code, "Unable to generate reorder suggestions", result.status);
}
