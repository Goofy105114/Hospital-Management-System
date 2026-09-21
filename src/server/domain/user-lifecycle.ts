import { UserRole, UserStatus } from "@prisma/client";

export interface OnboardStaffInput {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
}

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Validates staff onboarding payload.
 * Prevents onboarding users as PATIENT through administrative staff endpoints.
 */
export function validateStaffOnboarding(input: OnboardStaffInput): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!input.name || input.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters long." });
  }

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push({ field: "email", message: "A valid email address is required." });
  }

  if (input.role === UserRole.PATIENT) {
    errors.push({
      field: "role",
      message: "Staff onboarding cannot assign the PATIENT role. Use patient registration.",
    });
  }

  if (!Object.values(UserRole).includes(input.role)) {
    errors.push({ field: "role", message: `Invalid user role: ${input.role}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * State machine rules for user lifecycle status transitions.
 */
const VALID_STATUS_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  [UserStatus.PENDING_VERIFICATION]: [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.LOCKED],
  [UserStatus.ACTIVE]: [UserStatus.LOCKED, UserStatus.SUSPENDED],
  [UserStatus.LOCKED]: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
  [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.LOCKED],
};

export function canTransitionUserStatus(
  currentStatus: UserStatus,
  targetStatus: UserStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

/**
 * Validates role assignment permissions.
 * SUPER_ADMIN can assign any role. ADMIN can assign non-admin staff roles.
 */
export function canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === UserRole.SUPER_ADMIN) return true;
  if (actorRole === UserRole.ADMIN) {
    return targetRole !== UserRole.SUPER_ADMIN && targetRole !== UserRole.ADMIN;
  }
  return false;
}

/**
 * Generates a secure, temporary single-use password matching IAM-03 policy:
 * At least 10 chars, uppercase, lowercase, number, special char.
 */
export function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";

  const getRandomChar = (chars: string) => chars.charAt(Math.floor(Math.random() * chars.length));

  let password =
    getRandomChar(upper) +
    getRandomChar(lower) +
    getRandomChar(digits) +
    getRandomChar(special);

  const allChars = upper + lower + digits + special;
  for (let i = 0; i < 6; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle the generated characters
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
