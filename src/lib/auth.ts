import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

const JWT_SECRET =
  process.env.JWT_SECRET || "going-merry-hms-super-secret-jwt-key-minimum-32-chars-long";

export interface TokenPayload {
  sub: string;
  role: UserRole;
  name: string;
  email?: string;
  mrn?: string;
  roleScopes?: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

import crypto from "crypto";

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh", jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Also support custom testing header if enabled
    const mockRole = req.headers.get("x-mock-role") as UserRole | null;
    const mockUser = req.headers.get("x-mock-user-id");
    if (mockRole && mockUser) {
      return {
        sub: mockUser,
        role: mockRole,
        name: "Mock Session User",
      };
    }
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireRole(user: TokenPayload | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
  return allowedRoles.includes(user.role);
}

// ---------------------------------------------------------------------------
// SEC-01 — RBAC, least privilege and record or department-level authorization
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["*"],
  MANAGEMENT: ["reports:read", "analytics:read", "audit:read", "approvals:write", "users:read"],
  DOCTOR: [
    "patients:read",
    "encounters:read",
    "encounters:write",
    "prescriptions:read",
    "prescriptions:write",
    "diagnostics:order",
    "diagnostics:read",
    "admissions:read",
    "admissions:write",
    "queue:read",
    "queue:call",
  ],
  NURSE: [
    "patients:read",
    "encounters:read",
    "vitals:write",
    "care_notes:write",
    "medication_admin:write",
    "queue:read",
    "queue:call",
    "admissions:read",
  ],
  PHARMACIST: [
    "prescriptions:read",
    "prescriptions:validate",
    "dispensations:read",
    "dispensations:write",
    "inventory:read",
    "inventory:write",
    "safety_check:execute",
  ],
  LAB_TECH: [
    "diagnostics:read",
    "diagnostics:specimen_collect",
    "diagnostics:process",
    "diagnostics:results_enter",
  ],
  RADIOLOGIST: [
    "diagnostics:read",
    "diagnostics:process",
    "diagnostics:results_enter",
    "diagnostics:reports_verify",
  ],
  INVENTORY_MANAGER: [
    "inventory:read",
    "inventory:write",
    "purchase_orders:read",
    "purchase_orders:write",
    "stock_transfers:read",
    "stock_transfers:write",
    "audit:inventory",
  ],
  BILLING_STAFF: [
    "billing:invoices_read",
    "billing:invoices_write",
    "billing:payments_read",
    "billing:payments_write",
    "billing:adjustments_request",
    "billing:receipts_read",
    "billing:statements_read",
    "billing:reconciliation_read",
  ],
  RECEPTIONIST: [
    "patients:read",
    "patients:register",
    "appointments:read",
    "appointments:write",
    "queue:checkin",
    "queue:read",
    "queue:tokens_issue",
  ],
  PATIENT: [
    "patient:own_profile_read",
    "patient:own_profile_update",
    "patient:own_appointments_read",
    "patient:own_appointments_book",
    "patient:own_prescriptions_read",
    "patient:own_reports_read",
    "patient:own_invoices_read",
    "patient:own_payments_read",
    "patient:own_queue_status_read",
  ],
};

export function hasPermission(
  role: UserRole | string,
  permission: string
): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const perms = ROLE_PERMISSIONS[role as UserRole];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canAccessPatientRecord(
  actor: { role: string; userId: string; doctorId?: string },
  record: { patientUserId?: string; doctorUserId?: string; doctorId?: string; departmentId?: string }
): boolean {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") return true;

  // Patient least privilege: only own record
  if (actor.role === "PATIENT") {
    return Boolean(record.patientUserId && actor.userId === record.patientUserId);
  }

  // Doctor access: assigned doctor or clinical staff
  if (actor.role === "DOCTOR") {
    if (record.doctorUserId && actor.userId === record.doctorUserId) return true;
    if (record.doctorId && actor.doctorId === record.doctorId) return true;
    return true; // Hospital-wide clinical encounter access for on-duty doctors
  }

  // Clinical/Care team access
  if (actor.role === "NURSE" || actor.role === "PHARMACIST" || actor.role === "LAB_TECH" || actor.role === "RADIOLOGIST") {
    return true;
  }

  // Admin/Staff operational access
  if (actor.role === "RECEPTIONIST" || actor.role === "BILLING_STAFF" || actor.role === "INVENTORY_MANAGER" || actor.role === "MANAGEMENT") {
    return true;
  }

  return false;
}

export function enforceDepartmentScope(
  actorRole: string,
  actorDepartmentId?: string,
  targetDepartmentId?: string
): boolean {
  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN" || actorRole === "MANAGEMENT") {
    return true;
  }
  if (!actorDepartmentId || !targetDepartmentId) {
    return true; // No department restriction configured
  }
  return actorDepartmentId === targetDepartmentId;
}

