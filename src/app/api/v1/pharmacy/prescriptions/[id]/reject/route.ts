import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { PharmacyService } from "@/server/services/pharmacy.service";
import { authorizePharmacist } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizePharmacist(request);
  if (auth.error || !auth.user) return auth.error;
  const { reason } = await request.json();
  if (!reason?.trim()) return apiError("PHA_REASON_REQUIRED", "reason is required", 400);
  const result = await PharmacyService.reviewPrescription(
    params.id,
    "REJECT",
    reason,
    auth.user.sub
  );
  return result.success
    ? apiSuccess({ status: result.data.status })
    : apiError(result.code, "Prescription cannot be rejected", result.status);
}
