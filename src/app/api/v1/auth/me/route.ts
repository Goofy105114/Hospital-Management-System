import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    include: {
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    return apiError("USER_NOT_FOUND", "User record not found", 404);
  }

  return apiSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    patientProfile: user.patientProfile,
    doctorProfile: user.doctorProfile,
  });
}
