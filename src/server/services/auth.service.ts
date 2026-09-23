import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { UserRole, UserStatus, AuditAction, Gender } from "@prisma/client";

export class AuthService {
  static async login(identifier: string, password: string, ipAddress?: string, requestId?: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      return { success: false, code: "AUTH_INVALID_CREDENTIALS", status: 401 };
    }

    if (user.status === UserStatus.LOCKED) {
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        return {
          success: false,
          code: "AUTH_ACCOUNT_LOCKED",
          status: 403,
          details: { lockedUntil: user.lockedUntil },
        };
      } else {
        // Unlock after lockout period expired
        await prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE, failedLoginCount: 0, lockedUntil: null },
        });
      }
    }

    if (user.status === UserStatus.SUSPENDED) {
      return { success: false, code: "AUTH_ACCOUNT_SUSPENDED", status: 403 };
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      return { success: false, code: "AUTH_ACCOUNT_UNVERIFIED", status: 403 };
    }

    const isValid = user.passwordHash ? await comparePassword(password, user.passwordHash) : false;

    if (!isValid) {
      const newFailedCount = user.failedLoginCount + 1;
      const willLock = newFailedCount >= 5;
      const lockedUntil = willLock ? new Date(Date.now() + 30 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          status: willLock ? UserStatus.LOCKED : user.status,
          lockedUntil,
        },
      });

      await logAuditEvent({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.VIEW,
        entityType: "User",
        entityId: user.id,
        changes: {
          before: { failedLoginCount: user.failedLoginCount },
          after: { failedLoginCount: newFailedCount, locked: willLock },
        },
        ipAddress,
        requestId,
      });

      return {
        success: false,
        code: willLock ? "AUTH_ACCOUNT_LOCKED" : "AUTH_INVALID_CREDENTIALS",
        status: willLock ? 403 : 401,
      };
    }

    // Reset failed login count and update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const tokenPayload: TokenPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email || undefined,
      mrn: user.patientProfile?.mrn || undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Clear old refresh tokens for this user, then store new one
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.VIEW,
      entityType: "User",
      entityId: user.id,
      changes: { after: { login: "SUCCESS", timestamp: new Date().toISOString() } },
      ipAddress,
      requestId,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          phone: user.phone,
          mrn: user.patientProfile?.mrn,
          doctorId: user.doctorProfile?.id,
        },
      },
    };
  }

  static async registerPatient(data: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    gender: Gender;
    password: string;
    bloodGroup?: string;
  }) {
    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      return { success: false, code: "REG_DUPLICATE_IDENTITY", status: 409 };
    }

    const passwordHash = await hashPassword(data.password);

    // Auto-generate MRN: MRN-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const count = await prisma.patient.count();
    const mrn = `MRN-${year}-${String(count + 1).padStart(6, "0")}`;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        patientProfile: {
          create: {
            mrn,
            dob: new Date(data.dob),
            gender: data.gender,
            bloodGroup: data.bloodGroup,
          },
        },
      },
      include: {
        patientProfile: true,
      },
    });

    return {
      success: true,
      data: {
        userId: user.id,
        mrn,
        verificationRequired: false,
      },
    };
  }
}
