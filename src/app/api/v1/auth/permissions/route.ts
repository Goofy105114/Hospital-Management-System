import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api-envelope";
import { getAuthUser, ROLE_PERMISSIONS, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  const role = user?.role || (UserRole.PATIENT as UserRole);

  const permissions = ROLE_PERMISSIONS[role] || [];

  return NextResponse.json(
    successResponse(
      {
        userId: user?.sub || "anonymous",
        role,
        permissions,
        isSuperAdmin: role === "SUPER_ADMIN",
        isAdmin: role === "ADMIN",
      },
      `Retrieved ${permissions.length} permissions for role ${role}`
    )
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = getAuthUser(req);
  const role = body.role || user?.role || UserRole.PATIENT;
  const permission = body.permission;

  const allowed = hasPermission(role, permission);

  return NextResponse.json(
    successResponse(
      {
        role,
        permission,
        allowed,
      },
      allowed ? "Permission granted" : "Permission denied"
    )
  );
}
