import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  dob: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"]),
  password: z.string().min(6),
  bloodGroup: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "REG_INVALID_FORMAT",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    const result = await AuthService.registerPatient(parsed.data);

    if (!result.success) {
      return apiError(
        result.code || "REGISTRATION_FAILED",
        "Registration failed",
        result.status || 400
      );
    }

    return apiSuccess(result.data, undefined, 201);
  } catch (err) {
    console.error("[REGISTER ROUTE ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500);
  }
}
