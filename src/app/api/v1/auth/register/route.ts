import { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { isValidEmail, isValidName } from "@/lib/utils";
import { z } from "zod";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Full legal name must be at least 2 characters")
    .refine(isValidName, "Name must contain letters and cannot be purely numbers"),
  email: z
    .string()
    .email("Invalid email address")
    .refine(isValidEmail, "Email username cannot consist of only numbers or start with a number"),
  phone: z
    .string()
    .min(8, "Phone number must be at least 8 digits")
    .regex(/^[+]?[0-9\s()-]{8,20}$/, "Invalid phone format"),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Valid date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
