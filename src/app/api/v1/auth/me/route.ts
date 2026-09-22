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

export async function PATCH(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return apiError("AUTH_UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await req.json();
    const { name, phone, address, preferredLanguage } = body;

    const updatedUser = await prisma.user.update({
      where: { id: auth.sub },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });

    if (
      updatedUser.patientProfile &&
      (address !== undefined || preferredLanguage !== undefined)
    ) {
      await prisma.patient.update({
        where: { id: updatedUser.patientProfile.id },
        data: {
          ...(address !== undefined ? { address } : {}),
          ...(preferredLanguage !== undefined ? { preferredLanguage } : {}),
        },
      });
    }

    return apiSuccess({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
    });
  } catch (error: any) {
    return apiError(
      "AUTH_UPDATE_FAILED",
      error.message || "Failed to update profile",
      500
    );
  }
}

