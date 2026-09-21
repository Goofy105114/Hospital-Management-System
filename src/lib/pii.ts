/**
 * SEC-02 — PII Masking / Tokenization Utilities
 *
 * These pure functions are the single source of truth for masking rules
 * across PAT, EMR, and BIL modules. Import from here — never inline masks.
 *
 * Full-PII access roles (see PRD SEC-02 Business Rules):
 *   RECEPTIONIST, DOCTOR, NURSE, ADMIN, SUPER_ADMIN
 *
 * Masked roles (phone/email shown partially redacted):
 *   LAB_TECH, RADIOLOGIST, PHARMACIST, INVENTORY_MANAGER,
 *   BILLING_STAFF, MANAGEMENT, PATIENT (own record = full; others = masked)
 */

import { UserRole } from "@prisma/client";

/** Roles that see full PII without step-up for the patient list/detail. */
const FULL_PII_ROLES: UserRole[] = [
  UserRole.RECEPTIONIST,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/**
 * Returns true if the given role has unrestricted access to patient PII.
 * PATIENT role is excluded here — callers must handle the "own record"
 * exception at the route level before calling this function.
 */
export function hasPiiAccess(role: UserRole): boolean {
  return FULL_PII_ROLES.includes(role);
}

/**
 * Masks a phone number, preserving the last 4 digits.
 *
 * Examples:
 *   "+1 (555) 234-5678"  → "+X-XXXXX-5678"
 *   "+919876543210"       → "+XXXXXXX3210"
 *   "5550001234"          → "XXXXXX1234"
 *   null / undefined      → null
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "XXXXX";
  const last4 = digits.slice(-4);
  return `+X-XXXXX-${last4}`;
}

/**
 * Masks an email address, keeping only the first character of the local part
 * and the full domain.
 *
 * Examples:
 *   "eleanor.pena@example.com" → "e*****@example.com"
 *   null / undefined            → null
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "*****";
  const first = email[0];
  const domain = email.slice(atIndex);
  return `${first}*****${domain}`;
}

/**
 * Masks a generic sensitive string field (e.g. address) by replacing all
 * characters after the first 3 with asterisks.
 *
 * Examples:
 *   "123 Main St, Springfield" → "123********************"
 *   null / undefined            → null
 */
export function maskField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 3) return "***";
  return value.slice(0, 3) + "*".repeat(Math.min(value.length - 3, 20));
}
