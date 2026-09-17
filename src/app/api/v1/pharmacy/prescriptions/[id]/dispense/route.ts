import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { PharmacyService } from "@/server/services/pharmacy.service";
import { authorizePharmacist } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizePharmacist(request);
  if (auth.error || !auth.user) return auth.error;
  const body = await request.json();
  if (!Array.isArray(body.items)) {
    return apiError("PHA_INVALID_REQUEST", "items are required", 400);
  }
  const result = await PharmacyService.dispensePrescription({
    prescriptionId: params.id,
    dispensedBy: auth.user.sub,
    items: body.items,
  });
  return result.success
    ? apiSuccess(
        { dispensingTxId: result.data.dispensation.id, status: result.data.completion },
        undefined,
        201
      )
    : apiError(result.code, "Dispensing failed", result.status, result.details);
}
