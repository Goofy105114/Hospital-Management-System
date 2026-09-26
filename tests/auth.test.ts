import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  requireRole,
  getAuthUser,
  TokenPayload,
} from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

describe("Authentication & Authorization Library (SEC-01 / AUTH)", () => {
  it("hashes and securely compares passwords", async () => {
    const raw = "SuperSecret123!";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(await comparePassword(raw, hashed)).toBe(true);
    expect(await comparePassword("WrongPassword", hashed)).toBe(false);
  }, 15000);

  it("generates and verifies JWT access tokens with payload", () => {
    const payload: TokenPayload = {
      sub: "usr-12345",
      role: UserRole.DOCTOR,
      name: "Dr. Gregory House",
      email: "house@princeton-plainsboro.com",
    };

    const token = generateAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("usr-12345");
    expect(decoded?.role).toBe(UserRole.DOCTOR);
    expect(decoded?.name).toBe("Dr. Gregory House");
    expect(decoded?.email).toBe("house@princeton-plainsboro.com");
  });

  it("rejects tampered or invalid tokens", () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    expect(verifyToken(invalidToken)).toBeNull();
  });

  it("generates valid refresh token signed for user", () => {
    const refreshToken = generateRefreshToken("usr-abcde");
    expect(refreshToken).toBeDefined();

    const decoded = verifyToken(refreshToken);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("usr-abcde");
  });

  describe("Role-based access control (RBAC)", () => {
    it("permits SUPER_ADMIN and ADMIN regardless of allowedRoles array", () => {
      const superAdmin: TokenPayload = { sub: "1", role: UserRole.SUPER_ADMIN, name: "Root" };
      const admin: TokenPayload = { sub: "2", role: UserRole.ADMIN, name: "Admin" };

      expect(requireRole(superAdmin, [UserRole.DOCTOR])).toBe(true);
      expect(requireRole(admin, [UserRole.PATIENT])).toBe(true);
    });

    it("allows matching role and denies mismatched role", () => {
      const doctor: TokenPayload = { sub: "3", role: UserRole.DOCTOR, name: "Doc" };
      const nurse: TokenPayload = { sub: "4", role: UserRole.NURSE, name: "Nurse" };

      expect(requireRole(doctor, [UserRole.DOCTOR, UserRole.NURSE])).toBe(true);
      expect(requireRole(nurse, [UserRole.DOCTOR])).toBe(false);
      expect(requireRole(null, [UserRole.DOCTOR])).toBe(false);
    });
  });

  describe("Request Authentication Extraction", () => {
    it("extracts user from Bearer Authorization header", () => {
      const payload: TokenPayload = { sub: "u-99", role: UserRole.PATIENT, name: "Alice" };
      const token = generateAccessToken(payload);

      const req = new NextRequest("http://localhost:3000/api/v1/profile", {
        headers: { authorization: `Bearer ${token}` },
      });

      const user = getAuthUser(req);
      expect(user).not.toBeNull();
      expect(user?.sub).toBe("u-99");
      expect(user?.role).toBe(UserRole.PATIENT);
    });

    it("falls back to mock headers when Bearer header is missing", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/profile", {
        headers: {
          "x-mock-role": UserRole.RECEPTIONIST,
          "x-mock-user-id": "mock-rec-1",
        },
      });

      const user = getAuthUser(req);
      expect(user).not.toBeNull();
      expect(user?.sub).toBe("mock-rec-1");
      expect(user?.role).toBe(UserRole.RECEPTIONIST);
    });

    it("falls back to default sub when x-mock-user-id is omitted but x-mock-role is present", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/medicines", {
        headers: {
          "x-mock-role": UserRole.PHARMACIST,
        },
      });

      const user = getAuthUser(req);
      expect(user).not.toBeNull();
      expect(user?.sub).toBe("mock-session-user");
      expect(user?.role).toBe(UserRole.PHARMACIST);
    });

    it("authorizes PHARMACIST to manage formulary medicines alongside INVENTORY_MANAGER and ADMIN", () => {
      const pharmacistUser: TokenPayload = {
        sub: "usr-pharma-1",
        role: UserRole.PHARMACIST,
        name: "Head Pharmacist",
      };

      const allowedRoles = [UserRole.PHARMACIST, UserRole.INVENTORY_MANAGER, UserRole.ADMIN];
      expect(requireRole(pharmacistUser, allowedRoles)).toBe(true);

      const patientUser: TokenPayload = {
        sub: "usr-patient-1",
        role: UserRole.PATIENT,
        name: "Jane Doe",
      };
      expect(requireRole(patientUser, allowedRoles)).toBe(false);
    });

    it("returns null when no valid credentials provided", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/profile");
      expect(getAuthUser(req)).toBeNull();
    });
  });

  describe("Signup & Authentication Validation Rules (AUTH-VAL)", () => {
    it("strictly rejects numeric emails such as 434@gmail.com", async () => {
      const { isValidEmail } = await import("@/lib/utils");

      // Pure numeric emails must be rejected
      expect(isValidEmail("434@gmail.com")).toBe(false);
      expect(isValidEmail("123@yahoo.com")).toBe(false);
      expect(isValidEmail("999999@domain.org")).toBe(false);
      expect(isValidEmail("0@gmail.com")).toBe(false);

      // Emails starting with numbers must be rejected
      expect(isValidEmail("1user@example.com")).toBe(false);
      expect(isValidEmail("123abc@domain.com")).toBe(false);

      // Malformed emails must be rejected
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("not-an-email")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@domain")).toBe(false);

      // Valid name-based emails must be accepted
      expect(isValidEmail("eleanor.vance@example.com")).toBe(true);
      expect(isValidEmail("dr.vance@goingmerry.hms")).toBe(true);
      expect(isValidEmail("admin@goingmerry.hms")).toBe(true);
      expect(isValidEmail("receptionist@goingmerry.hms")).toBe(true);
      expect(isValidEmail("john.doe+care@example.com")).toBe(true);
      expect(isValidEmail("alice-smith@hospital.org")).toBe(true);
      expect(isValidEmail("nurse_joy@pokemon.center")).toBe(true);
      expect(isValidEmail("doctor123@hospital.org")).toBe(true);
    });

    it("strictly validates names to prevent empty or purely numeric inputs", async () => {
      const { isValidName } = await import("@/lib/utils");

      expect(isValidName("")).toBe(false);
      expect(isValidName("   ")).toBe(false);
      expect(isValidName("A")).toBe(false);
      expect(isValidName("12345")).toBe(false);
      expect(isValidName("999")).toBe(false);

      expect(isValidName("Jane Doe")).toBe(true);
      expect(isValidName("Dr. Eleanor Vance, MD")).toBe(true);
      expect(isValidName("Bob")).toBe(true);
    });
  });
});

