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

    it("returns null when no valid credentials provided", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/profile");
      expect(getAuthUser(req)).toBeNull();
    });
  });
});
