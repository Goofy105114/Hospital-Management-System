import { NextRequest } from "next/server";
import { PharmacyService } from "@/server/services/pharmacy.service";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const body = await req.json();
    const { prescriptionId, items } = body;

    if (!prescriptionId || !items || !Array.isArray(items)) {
      return apiError("PHA_INVALID_REQUEST", "prescriptionId and items are required", 400);
    }

    const dispensedBy = auth?.name || "Pharmacist Staff";

    const result = await PharmacyService.dispensePrescription({
      prescriptionId,
      dispensedBy,
      items,
    });

    if (!result.success) {
      return apiError(
        result.code || "DISPENSE_FAILED",
        "Dispensation failed",
        result.status || 400
      );
    }

    return apiSuccess(result.data, undefined, 201);
  } catch (err) {
    console.error("[DISPENSE ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Dispense failed", 500);
  }
}
