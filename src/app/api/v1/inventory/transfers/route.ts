import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { StockTransferService } from "@/server/services/stock-transfer.service";
import { authorizeInventoryManager } from "../route-auth";

export async function POST(request: NextRequest) {
  const auth = authorizeInventoryManager(request);
  if (auth.error || !auth.user) return auth.error;
  const body = await request.json();
  const result = await StockTransferService.request({
    ...body,
    actorId: auth.user.sub,
    actorRole: auth.user.role,
  });
  return result.success
    ? apiSuccess({ id: result.data.id, status: result.data.status }, undefined, 201)
    : apiError(result.code, "Unable to request stock transfer", result.status);
}
