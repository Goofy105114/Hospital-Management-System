import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-envelope";
import { StockAlertService } from "@/server/services/stock-alert.service";
import { authorizeInventoryManager } from "../../route-auth";

export async function POST(request: NextRequest) {
  const auth = authorizeInventoryManager(request);
  if (auth.error) return auth.error;
  const result = await StockAlertService.expireBatches();
  return apiSuccess({ expiredBatches: result.count });
}
