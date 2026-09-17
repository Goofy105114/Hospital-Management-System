import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { StockTransferService } from "@/server/services/stock-transfer.service";
import { authorizeInventoryManager } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeInventoryManager(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await StockTransferService.dispatch(params.id, auth.user.sub, auth.user.role);
  return result.success
    ? apiSuccess({ status: result.data.status })
    : apiError(result.code, "Unable to dispatch transfer", result.status, result.details);
}
