import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      doctorsCount: d._count.doctors,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    console.error("Failed to fetch departments:", error);
    return apiError("DEPARTMENTS_FETCH_FAILED", "Failed to retrieve hospital departments", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required to manage departments", 403);
  }

  try {
    const body = await req.json();
    const { name, code, description } = body;
    if (!name || !code) {
      return apiError("INVALID_INPUT", "Name and code are required", 400);
    }
    const dept = await prisma.department.upsert({
      where: { code: code.toUpperCase() },
      update: { name, description },
      create: { name, code: code.toUpperCase(), description, isActive: true },
    });
    return apiSuccess(dept, undefined, 201);
  } catch (error: any) {
    return apiError("DEPARTMENT_SAVE_FAILED", error?.message || "Failed to save department", 500);
  }
}
