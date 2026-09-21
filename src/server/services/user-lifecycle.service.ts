import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, UserRole, UserStatus } from "@prisma/client";
import {
  canAssignRole,
  canTransitionUserStatus,
  generateTemporaryPassword,
  OnboardStaffInput,
  validateStaffOnboarding,
} from "../domain/user-lifecycle";

export interface ActorContext {
  id?: string;
  role?: UserRole | string;
  ipAddress?: string;
  requestId?: string;
}

export class UserLifecycleService {
  /**
   * Onboard a new staff user with temporary credentials and initial PENDING_VERIFICATION status.
   */
  static async onboardStaff(input: OnboardStaffInput, actor?: ActorContext) {
    const validation = validateStaffOnboarding(input);
    if (!validation.isValid) {
      return {
        success: false,
        code: "VALIDATION_FAILED",
        status: 400,
        errors: validation.errors,
      };
    }

    // Check email / phone uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email.toLowerCase().trim() },
          ...(input.phone ? [{ phone: input.phone.trim() }] : []),
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        code: "USER_ALREADY_EXISTS",
        status: 409,
        message: "A user with this email or phone number already exists.",
      };
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    let departmentRecord = null;
    if (input.department) {
      departmentRecord = await prisma.department.findFirst({
        where: {
          OR: [
            { name: { equals: input.department, mode: "insensitive" } },
            { code: { equals: input.department, mode: "insensitive" } },
          ],
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone ? input.phone.trim() : null,
        role: input.role,
        status: UserStatus.PENDING_VERIFICATION,
        passwordHash,
        ...(input.role === UserRole.DOCTOR && departmentRecord
          ? {
              doctorProfile: {
                create: {
                  departmentId: departmentRecord.id,
                  specialization: input.specialization || "General Medicine",
                  licenseNumber: input.licenseNumber || `LIC-${Date.now().toString().slice(-6)}`,
                },
              },
            }
          : {}),
      },
      include: {
        doctorProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    await logAuditEvent({
      actorId: actor?.id,
      actorRole: String(actor?.role || "ADMIN"),
      action: AuditAction.CREATE,
      entityType: "User",
      entityId: user.id,
      changes: {
        after: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: input.department || null,
        },
      },
      ipAddress: actor?.ipAddress,
      requestId: actor?.requestId,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.doctorProfile?.department?.name || input.department || "General",
          status: user.status,
          lastLoginAt: "Pending first login",
        },
        tempPassword,
      },
    };
  }

  /**
   * Updates a user's lifecycle status (e.g. ACTIVE, LOCKED, SUSPENDED).
   * Revokes all active refresh tokens if the account is locked or suspended.
   */
  static async updateUserStatus(
    userId: string,
    targetStatus: UserStatus,
    reason?: string,
    actor?: ActorContext
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, code: "USER_NOT_FOUND", status: 404 };
    }

    if (!canTransitionUserStatus(user.status, targetStatus)) {
      return {
        success: false,
        code: "INVALID_STATUS_TRANSITION",
        status: 400,
        message: `Cannot transition from ${user.status} to ${targetStatus}`,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: targetStatus,
        failedLoginCount: targetStatus === UserStatus.ACTIVE ? 0 : user.failedLoginCount,
        lockedUntil: targetStatus === UserStatus.LOCKED ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      },
    });

    // If locked or suspended, immediately revoke all active refresh tokens
    if (targetStatus === UserStatus.LOCKED || targetStatus === UserStatus.SUSPENDED) {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await logAuditEvent({
      actorId: actor?.id,
      actorRole: String(actor?.role || "ADMIN"),
      action: AuditAction.UPDATE,
      entityType: "User",
      entityId: userId,
      changes: {
        before: { status: user.status },
        after: { status: targetStatus, reason: reason || null },
      },
      ipAddress: actor?.ipAddress,
      requestId: actor?.requestId,
    });

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    };
  }

  /**
   * Updates a user's canonical RBAC role.
   */
  static async updateUserRole(
    userId: string,
    newRole: UserRole,
    actor?: ActorContext
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, code: "USER_NOT_FOUND", status: 404 };
    }

    const actorRole = (actor?.role as UserRole) || UserRole.ADMIN;
    if (!canAssignRole(actorRole, newRole)) {
      return {
        success: false,
        code: "FORBIDDEN_ROLE_ASSIGNMENT",
        status: 403,
        message: `Actor with role ${actorRole} cannot assign role ${newRole}`,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await logAuditEvent({
      actorId: actor?.id,
      actorRole: String(actorRole),
      action: AuditAction.UPDATE,
      entityType: "User",
      entityId: userId,
      changes: {
        before: { role: user.role },
        after: { role: newRole },
      },
      ipAddress: actor?.ipAddress,
      requestId: actor?.requestId,
    });

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    };
  }

  /**
   * Lists all staff users with optional filtering.
   */
  static async listStaff(filters?: { role?: string; search?: string }) {
    const whereClause: Record<string, unknown> = {
      role: { not: UserRole.PATIENT },
    };

    if (filters?.role && filters.role !== "ALL") {
      whereClause.role = filters.role as UserRole;
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        doctorProfile: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email || "",
      phone: u.phone || "",
      role: u.role,
      department: u.doctorProfile?.department?.name || "General",
      status: u.status,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toLocaleDateString() : "Never",
    }));
  }
}
