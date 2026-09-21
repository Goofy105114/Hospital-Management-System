import { describe, expect, it } from "vitest";
import { UserRole, UserStatus } from "@prisma/client";
import {
  canAssignRole,
  canTransitionUserStatus,
  generateTemporaryPassword,
  validateStaffOnboarding,
} from "@/server/domain/user-lifecycle";

describe("ADM-02 Staff Onboarding & User Lifecycle Domain Rules", () => {
  it("validates staff onboarding input and rejects invalid email or missing name", () => {
    const invalidName = validateStaffOnboarding({
      name: " ",
      email: "staff@goingmerry.org",
      role: UserRole.DOCTOR,
    });
    expect(invalidName.isValid).toBe(false);
    expect(invalidName.errors.some((e) => e.field === "name")).toBe(true);

    const invalidEmail = validateStaffOnboarding({
      name: "Dr. Sarah",
      email: "invalid-email-string",
      role: UserRole.DOCTOR,
    });
    expect(invalidEmail.isValid).toBe(false);
    expect(invalidEmail.errors.some((e) => e.field === "email")).toBe(true);
  });

  it("strictly prohibits assigning PATIENT role through staff onboarding", () => {
    const patientAttempt = validateStaffOnboarding({
      name: "John Doe",
      email: "john.doe@patient.org",
      role: UserRole.PATIENT,
    });
    expect(patientAttempt.isValid).toBe(false);
    expect(
      patientAttempt.errors.some(
        (e) => e.field === "role" && e.message.includes("cannot assign the PATIENT role")
      )
    ).toBe(true);
  });

  it("accepts valid clinical and administrative staff onboarding payloads", () => {
    const validDoctor = validateStaffOnboarding({
      name: "Dr. Gregory House",
      email: "gregory.house@goingmerry.org",
      phone: "+1 (555) 111-2233",
      role: UserRole.DOCTOR,
      department: "Diagnostics",
    });
    expect(validDoctor.isValid).toBe(true);
    expect(validDoctor.errors).toHaveLength(0);

    const validNurse = validateStaffOnboarding({
      name: "Florence Nightingale",
      email: "florence@goingmerry.org",
      role: UserRole.NURSE,
    });
    expect(validNurse.isValid).toBe(true);
  });

  it("enforces legal status transitions (canTransitionUserStatus)", () => {
    // PENDING_VERIFICATION can become ACTIVE, LOCKED, SUSPENDED
    expect(canTransitionUserStatus(UserStatus.PENDING_VERIFICATION, UserStatus.ACTIVE)).toBe(true);
    expect(canTransitionUserStatus(UserStatus.PENDING_VERIFICATION, UserStatus.LOCKED)).toBe(true);

    // ACTIVE can be LOCKED or SUSPENDED
    expect(canTransitionUserStatus(UserStatus.ACTIVE, UserStatus.LOCKED)).toBe(true);
    expect(canTransitionUserStatus(UserStatus.ACTIVE, UserStatus.SUSPENDED)).toBe(true);
    expect(canTransitionUserStatus(UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION)).toBe(false);

    // LOCKED can be unlocked to ACTIVE or transferred to SUSPENDED
    expect(canTransitionUserStatus(UserStatus.LOCKED, UserStatus.ACTIVE)).toBe(true);
    expect(canTransitionUserStatus(UserStatus.LOCKED, UserStatus.SUSPENDED)).toBe(true);
  });

  it("enforces role hierarchy and assignment boundaries (canAssignRole)", () => {
    // SUPER_ADMIN can assign any role including ADMIN and SUPER_ADMIN
    expect(canAssignRole(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true);
    expect(canAssignRole(UserRole.SUPER_ADMIN, UserRole.DOCTOR)).toBe(true);

    // ADMIN cannot escalate to SUPER_ADMIN or assign ADMIN
    expect(canAssignRole(UserRole.ADMIN, UserRole.DOCTOR)).toBe(true);
    expect(canAssignRole(UserRole.ADMIN, UserRole.NURSE)).toBe(true);
    expect(canAssignRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
    expect(canAssignRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)).toBe(false);

    // Non-admins cannot assign roles
    expect(canAssignRole(UserRole.DOCTOR, UserRole.NURSE)).toBe(false);
  });

  it("generates a high-entropy temporary password matching IAM-03 security rules", () => {
    const password = generateTemporaryPassword();
    expect(password.length).toBeGreaterThanOrEqual(10);
    expect(/[A-Z]/.test(password)).toBe(true); // Uppercase
    expect(/[a-z]/.test(password)).toBe(true); // Lowercase
    expect(/[0-9]/.test(password)).toBe(true); // Number
    expect(/[!@#$%&*]/.test(password)).toBe(true); // Special char
  });
});
