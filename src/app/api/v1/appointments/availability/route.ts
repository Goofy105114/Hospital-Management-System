import { NextRequest } from "next/server";
import { AppointmentService } from "@/server/services/appointment.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    if (!doctorId) {
      return apiError("APT_MISSING_DOCTOR", "doctorId is required", 400);
    }

    const slots = await AppointmentService.getAvailability(doctorId, date);

    return apiSuccess({
      doctorId,
      date,
      slots,
    });
  } catch (err: any) {
    console.error("[AVAILABILITY ROUTE ERROR]", err);
    return apiSuccess({
      doctorId: req.nextUrl?.searchParams?.get("doctorId") || "",
      date: req.nextUrl?.searchParams?.get("date") || new Date().toISOString().slice(0, 10),
      slots: [],
    });
  }
}
