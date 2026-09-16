import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { StockTransferService } from "@/server/services/stock-transfer.service";
import { authorizeInventoryManager } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeInventoryManager(request);
  if (auth.error || !auth.user) return auth.error;
  const { receivedQuantity } = await request.json();
  const result = await StockTransferService.receive(
    params.id,
    receivedQuantity,
    auth.user.sub,
    auth.user.role
  );
  return result.success
    ? apiSuccess({
        status: result.data.transfer.status,
        warning: result.data.discrepancy === 0 ? null : "INV_TRANSFER_QUANTITY_MISMATCH",
        discrepancy: result.data.discrepancy,
      })
    : apiError(
        result.code,
        "Unable to receive transfer",
        result.status,
        "details" in result ? result.details : undefined
      );
}
