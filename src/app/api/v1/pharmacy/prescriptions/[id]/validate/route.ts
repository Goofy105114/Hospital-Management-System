import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { PharmacyService } from "@/server/services/pharmacy.service";
import { authorizePharmacist } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizePharmacist(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await PharmacyService.validatePrescription(params.id, auth.user.sub);
  return result.success
    ? apiSuccess({ validated: true, warnings: result.data.warnings })
    : apiError(result.code, "Prescription cannot be validated", result.status);
}
