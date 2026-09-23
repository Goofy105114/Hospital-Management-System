import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { hashPassword, getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required to view staff users", 403);
  }

  try {
    const dbUsers = await prisma.user.findMany({
      where: {
        role: {
          not: "PATIENT",
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(dbUsers);
  } catch (error: any) {
    return apiError("ADM_USERS_FETCH_FAILED", error?.message || "Failed to retrieve staff users", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required to onboard staff user", 403);
  }

  try {
    const body = await req.json();
    const { name, email, phone, role, password } = body;

    const passwordHash = await hashPassword(password || "Password123!");

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || "+1 (555) 000-0000",
        role: role || "NURSE",
        status: "ACTIVE",
        passwordHash,
      },
    });

    return apiSuccess(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt.toISOString(),
      },
      undefined,
      201
    );
  } catch (error: any) {
    return apiError("ADM_USER_CREATE_FAILED", error?.message || "Failed to onboard staff user", 500);
  }
}
