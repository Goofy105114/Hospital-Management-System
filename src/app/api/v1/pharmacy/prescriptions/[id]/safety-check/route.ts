import { NextRequest } from "next/server";
import { PharmacyService } from "@/server/services/pharmacy.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await PharmacyService.getSafetyCheck(params.id);
  if (!result.success) {
    return apiError(
      result.code || "SAFETY_CHECK_FAILED",
      "Safety check failed",
      result.status || 400
    );
  }
  return apiSuccess(result.data);
}
