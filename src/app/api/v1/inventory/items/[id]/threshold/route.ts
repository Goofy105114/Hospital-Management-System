import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { StockAlertService } from "@/server/services/stock-alert.service";
import { authorizeInventoryManager } from "../../../route-auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeInventoryManager(request);
  if (auth.error || !auth.user) return auth.error;
  const { locationId, minQuantity, reorderQuantity } = await request.json();
  if (!locationId) return apiError("INV_LOCATION_REQUIRED", "locationId is required", 400);
  const result = await StockAlertService.setThreshold({
    itemId: params.id,
    locationId,
    minQuantity,
    reorderQuantity,
    actorId: auth.user.sub,
    actorRole: auth.user.role,
  });
  return result.success
    ? apiSuccess({})
    : apiError(result.code, "Unable to configure threshold", result.status);
}
