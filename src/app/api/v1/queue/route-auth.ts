import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { getAuthUser, requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api-envelope";

export function authorizeQueueStaff(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return { error: apiError("UNAUTHENTICATED", "Authentication required", 401) };
  if (!requireRole(user, [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])) {
    return { error: apiError("UNAUTHORIZED_ROLE", "Queue staff role required", 403) };
  }
  return { user };
}
