import { NextRequest } from "next/server";
import { PharmacyService } from "@/server/services/pharmacy.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { authorizePharmacist } from "../route-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = authorizePharmacist(req);
    if (auth.error || !auth.user) return auth.error;
    const body = await req.json();
    const { prescriptionId, items } = body;

    if (!prescriptionId || !items || !Array.isArray(items)) {
      return apiError("PHA_INVALID_REQUEST", "prescriptionId and items are required", 400);
    }

    const result = await PharmacyService.dispensePrescription({
      prescriptionId,
      dispensedBy: auth.user.sub,
      items: items.map((item: any) => ({
        prescriptionItemId: item.prescriptionItemId,
        batchId: item.batchId,
        quantityDispensed: item.quantityDispensed ?? item.quantity,
      })),
    });

    if (!result.success) {
      return apiError(
        result.code || "DISPENSE_FAILED",
        "Dispensation failed",
        result.status || 400
      );
    }

    return apiSuccess(
      { dispensingTxId: result.data.dispensation.id, status: result.data.completion },
      undefined,
      201
    );
  } catch (err) {
    console.error("[DISPENSE ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Dispense failed", 500);
  }
}
