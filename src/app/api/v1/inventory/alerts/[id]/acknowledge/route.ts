import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { StockAlertService } from "@/server/services/stock-alert.service";
import { authorizeInventoryManager } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeInventoryManager(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await StockAlertService.acknowledge(params.id, auth.user.sub, auth.user.role);
  return result.success
    ? apiSuccess({ status: result.data.status })
    : apiError(result.code, "Unable to acknowledge alert", result.status);
}
