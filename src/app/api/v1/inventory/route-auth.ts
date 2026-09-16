import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";

export function authorizeInventoryManager(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return { error: apiError("UNAUTHENTICATED", "Authentication required", 401) };
  if (!requireRole(user, [UserRole.INVENTORY_MANAGER])) {
    return { error: apiError("UNAUTHORIZED_ROLE", "Inventory manager role required", 403) };
  }
  return { user };
}
