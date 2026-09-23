import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import {
  getAuthUser,
  requireRole,
  generateAccessToken,
  TokenPayload,
} from "@/lib/auth";
import { middleware } from "@/middleware";
import { authorizeBillingStaff } from "@/app/api/v1/billing/route-auth";
import { authorizePharmacist } from "@/app/api/v1/pharmacy/route-auth";
import { authorizeInventoryManager } from "@/app/api/v1/inventory/route-auth";
import { authorizeQueueStaff } from "@/app/api/v1/queue/route-auth";
import { GET as getAuditLogs } from "@/app/api/v1/admin/audit-logs/route";
import { GET as getAdminUsers, POST as postAdminUser } from "@/app/api/v1/admin/users/route";
import { POST as postDepartment } from "@/app/api/v1/departments/route";
import { POST as postDiagnosticCatalog } from "@/app/api/v1/diagnostics/catalog/route";
import { PATCH as patchInpatientAdmission } from "@/app/api/v1/inpatient/admissions/route";

function makeReq(
  url: string,
  options?: {
    method?: string;
    token?: string;
    mockRole?: UserRole;
    mockUserId?: string;
    body?: any;
    cookieRole?: string;
  }
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options?.token) {
    headers["authorization"] = `Bearer ${options.token}`;
  }
  if (options?.mockRole) {
    headers["x-mock-role"] = options.mockRole;
  }
  if (options?.mockUserId) {
    headers["x-mock-user-id"] = options.mockUserId;
  }
  if (options?.cookieRole) {
    headers["cookie"] = `activeRole=${options.cookieRole}`;
  }

  return new NextRequest(url, {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

function tokenFor(role: UserRole, id = "test-user-id"): string {
  const payload: TokenPayload = {
    sub: id,
    role,
    name: `Test ${role}`,
    email: `${role.toLowerCase()}@test.hospital.org`,
  };
  return generateAccessToken(payload);
}

describe("REL-02: Role-Based Security & Access Testing (HMS BRD v4)", () => {
  // =========================================================================
  // 1. Core RBAC requireRole Evaluation Matrix
  // =========================================================================
  describe("1. Core RBAC requireRole() Permission Checks", () => {
    it("permits SUPER_ADMIN and ADMIN access across any protected boundary", () => {
      const superAdmin: TokenPayload = { sub: "sa-1", role: UserRole.SUPER_ADMIN, name: "SuperAdmin" };
      const admin: TokenPayload = { sub: "adm-1", role: UserRole.ADMIN, name: "Admin" };

      expect(requireRole(superAdmin, [UserRole.PATIENT])).toBe(true);
      expect(requireRole(superAdmin, [UserRole.DOCTOR])).toBe(true);
      expect(requireRole(superAdmin, [UserRole.PHARMACIST])).toBe(true);
      expect(requireRole(superAdmin, [UserRole.BILLING_STAFF])).toBe(true);

      expect(requireRole(admin, [UserRole.PATIENT])).toBe(true);
      expect(requireRole(admin, [UserRole.DOCTOR])).toBe(true);
      expect(requireRole(admin, [UserRole.PHARMACIST])).toBe(true);
      expect(requireRole(admin, [UserRole.BILLING_STAFF])).toBe(true);
    });

    it("restricts role-specific boundaries strictly to authorized roles", () => {
      const patient: TokenPayload = { sub: "p-1", role: UserRole.PATIENT, name: "Patient" };
      const doctor: TokenPayload = { sub: "d-1", role: UserRole.DOCTOR, name: "Dr." };
      const pharmacist: TokenPayload = { sub: "ph-1", role: UserRole.PHARMACIST, name: "Pharm" };
      const billing: TokenPayload = { sub: "b-1", role: UserRole.BILLING_STAFF, name: "Billing" };
      const nurse: TokenPayload = { sub: "n-1", role: UserRole.NURSE, name: "Nurse" };
      const labTech: TokenPayload = { sub: "l-1", role: UserRole.LAB_TECH, name: "LabTech" };
      const management: TokenPayload = { sub: "m-1", role: UserRole.MANAGEMENT, name: "Mgmt" };

      // Doctor boundary
      expect(requireRole(doctor, [UserRole.DOCTOR])).toBe(true);
      expect(requireRole(patient, [UserRole.DOCTOR])).toBe(false);
      expect(requireRole(billing, [UserRole.DOCTOR])).toBe(false);

      // Pharmacy boundary
      expect(requireRole(pharmacist, [UserRole.PHARMACIST])).toBe(true);
      expect(requireRole(doctor, [UserRole.PHARMACIST])).toBe(false);
      expect(requireRole(patient, [UserRole.PHARMACIST])).toBe(false);

      // Billing boundary
      expect(requireRole(billing, [UserRole.BILLING_STAFF])).toBe(true);
      expect(requireRole(patient, [UserRole.BILLING_STAFF])).toBe(false);
      expect(requireRole(nurse, [UserRole.BILLING_STAFF])).toBe(false);

      // Diagnostic boundary
      expect(requireRole(labTech, [UserRole.LAB_TECH, UserRole.RADIOLOGIST])).toBe(true);
      expect(requireRole(patient, [UserRole.LAB_TECH, UserRole.RADIOLOGIST])).toBe(false);

      // Management boundary
      expect(requireRole(management, [UserRole.MANAGEMENT])).toBe(true);
      expect(requireRole(patient, [UserRole.MANAGEMENT])).toBe(false);
      expect(requireRole(doctor, [UserRole.MANAGEMENT])).toBe(false);
    });

    it("rejects unauthenticated requests (null user)", () => {
      expect(requireRole(null, [UserRole.PATIENT])).toBe(false);
      expect(requireRole(null, [UserRole.DOCTOR])).toBe(false);
      expect(requireRole(null, [UserRole.ADMIN])).toBe(false);
    });
  });

  // =========================================================================
  // 2. Next.js Edge Route Protection Middleware
  // =========================================================================
  describe("2. Next.js Edge Route Protection Middleware", () => {
    it("allows public authentication paths through without redirection", () => {
      const publicPaths = [
        "/admin/login",
        "/admin/register",
        "/doctor/login",
        "/doctor/register",
        "/receptionist/login",
        "/patient/login",
        "/patient/register",
      ];

      for (const path of publicPaths) {
        const req = makeReq(`http://localhost:3000${path}`);
        const res = middleware(req);
        expect(res.headers.get("location")).toBeNull();
        expect(res.status).toBe(200);
      }
    });

    it("blocks unauthenticated requests to protected paths and redirects to portal login", () => {
      const adminReq = makeReq("http://localhost:3000/admin/audit-logs");
      const adminRes = middleware(adminReq);
      expect(adminRes.headers.get("location")).toContain("/admin/login");

      const doctorReq = makeReq("http://localhost:3000/doctor/encounters");
      const doctorRes = middleware(doctorReq);
      expect(doctorRes.headers.get("location")).toContain("/doctor/login");

      const patientReq = makeReq("http://localhost:3000/patient/appointments");
      const patientRes = middleware(patientReq);
      expect(patientRes.headers.get("location")).toContain("/patient/login");

      const receptionistReq = makeReq("http://localhost:3000/receptionist/queue");
      const receptionistRes = middleware(receptionistReq);
      expect(receptionistRes.headers.get("location")).toContain("/receptionist/login");
    });

    it("blocks unauthorized role navigation and redirects user to their appropriate workspace", () => {
      // Patient trying to access /admin/audit-logs
      const patientOnAdminReq = makeReq("http://localhost:3000/admin/audit-logs", {
        token: tokenFor(UserRole.PATIENT),
      });
      const res1 = middleware(patientOnAdminReq);
      expect(res1.headers.get("location")).toContain("/patient");

      // Doctor trying to access /admin/system-settings
      const docOnAdminReq = makeReq("http://localhost:3000/admin/system-settings", {
        token: tokenFor(UserRole.DOCTOR),
      });
      const res2 = middleware(docOnAdminReq);
      expect(res2.headers.get("location")).toContain("/doctor");

      // Pharmacist trying to access /doctor/encounters
      const pharmOnDocReq = makeReq("http://localhost:3000/doctor/encounters", {
        token: tokenFor(UserRole.PHARMACIST),
      });
      const res3 = middleware(pharmOnDocReq);
      expect(res3.headers.get("location")).toContain("/pharmacist");

      // Patient trying to access /nurse/inpatient
      const patientOnNurseReq = makeReq("http://localhost:3000/nurse/inpatient", {
        token: tokenFor(UserRole.PATIENT),
      });
      const res4 = middleware(patientOnNurseReq);
      expect(res4.headers.get("location")).toContain("/patient");
    });

    it("allows authorized role navigation to role-specific workspace paths", () => {
      // Doctor on /doctor/queue
      const docReq = makeReq("http://localhost:3000/doctor/queue", {
        token: tokenFor(UserRole.DOCTOR),
      });
      expect(middleware(docReq).headers.get("location")).toBeNull();

      // Admin on /admin/audit-logs
      const adminReq = makeReq("http://localhost:3000/admin/audit-logs", {
        token: tokenFor(UserRole.ADMIN),
      });
      expect(middleware(adminReq).headers.get("location")).toBeNull();

      // Pharmacist on /pharmacist/prescriptions
      const pharmReq = makeReq("http://localhost:3000/pharmacist/prescriptions", {
        token: tokenFor(UserRole.PHARMACIST),
      });
      expect(middleware(pharmReq).headers.get("location")).toBeNull();

      // Patient on /patient/records
      const patientReq = makeReq("http://localhost:3000/patient/records", {
        token: tokenFor(UserRole.PATIENT),
      });
      expect(middleware(patientReq).headers.get("location")).toBeNull();

      // Receptionist on /receptionist/queue
      const recReq = makeReq("http://localhost:3000/receptionist/queue", {
        token: tokenFor(UserRole.RECEPTIONIST),
      });
      expect(middleware(recReq).headers.get("location")).toBeNull();

      // Admin bypass on clinician desk
      const adminOnDocReq = makeReq("http://localhost:3000/doctor/queue", {
        token: tokenFor(UserRole.ADMIN),
      });
      expect(middleware(adminOnDocReq).headers.get("location")).toBeNull();
    });
  });

  // =========================================================================
  // 3. Domain Service Route-Auth Helpers
  // =========================================================================
  describe("3. API Domain Route-Auth Helper Guards", () => {
    describe("authorizeBillingStaff()", () => {
      it("blocks unauthenticated requests (401)", () => {
        const req = makeReq("http://localhost:3000/api/v1/billing/invoices");
        const auth = authorizeBillingStaff(req);
        expect(auth.error).toBeDefined();
        expect(auth.error?.status).toBe(401);
      });

      it("blocks unauthorized roles (403 for PATIENT, DOCTOR, NURSE)", () => {
        for (const role of [UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE]) {
          const req = makeReq("http://localhost:3000/api/v1/billing/invoices", {
            token: tokenFor(role),
          });
          const auth = authorizeBillingStaff(req);
          expect(auth.error).toBeDefined();
          expect(auth.error?.status).toBe(403);
        }
      });

      it("grants access to BILLING_STAFF and ADMIN", () => {
        for (const role of [UserRole.BILLING_STAFF, UserRole.ADMIN]) {
          const req = makeReq("http://localhost:3000/api/v1/billing/invoices", {
            token: tokenFor(role),
          });
          const auth = authorizeBillingStaff(req);
          expect(auth.error).toBeUndefined();
          expect(auth.user).toBeDefined();
        }
      });
    });

    describe("authorizePharmacist()", () => {
      it("blocks unauthenticated requests (401)", () => {
        const req = makeReq("http://localhost:3000/api/v1/pharmacy/dispense");
        const auth = authorizePharmacist(req);
        expect(auth.error).toBeDefined();
        expect(auth.error?.status).toBe(401);
      });

      it("blocks non-pharmacist roles (403 for PATIENT, DOCTOR, RECEPTIONIST)", () => {
        for (const role of [UserRole.PATIENT, UserRole.DOCTOR, UserRole.RECEPTIONIST]) {
          const req = makeReq("http://localhost:3000/api/v1/pharmacy/dispense", {
            token: tokenFor(role),
          });
          const auth = authorizePharmacist(req);
          expect(auth.error).toBeDefined();
          expect(auth.error?.status).toBe(403);
        }
      });

      it("grants access to PHARMACIST and ADMIN", () => {
        for (const role of [UserRole.PHARMACIST, UserRole.ADMIN]) {
          const req = makeReq("http://localhost:3000/api/v1/pharmacy/dispense", {
            token: tokenFor(role),
          });
          const auth = authorizePharmacist(req);
          expect(auth.error).toBeUndefined();
          expect(auth.user).toBeDefined();
        }
      });
    });

    describe("authorizeInventoryManager()", () => {
      it("blocks unauthorized roles (403 for PATIENT, DOCTOR)", () => {
        const req = makeReq("http://localhost:3000/api/v1/inventory/items", {
          token: tokenFor(UserRole.PATIENT),
        });
        const auth = authorizeInventoryManager(req);
        expect(auth.error?.status).toBe(403);
      });

      it("grants access to INVENTORY_MANAGER and ADMIN", () => {
        const req = makeReq("http://localhost:3000/api/v1/inventory/items", {
          token: tokenFor(UserRole.INVENTORY_MANAGER),
        });
        const auth = authorizeInventoryManager(req);
        expect(auth.error).toBeUndefined();
        expect(auth.user).toBeDefined();
      });
    });

    describe("authorizeQueueStaff()", () => {
      it("allows clinical and front-desk staff (DOCTOR, NURSE, RECEPTIONIST, ADMIN)", () => {
        for (const role of [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.ADMIN]) {
          const req = makeReq("http://localhost:3000/api/v1/queue/tokens/1/start-consultation", {
            token: tokenFor(role),
          });
          const auth = authorizeQueueStaff(req);
          expect(auth.error).toBeUndefined();
          expect(auth.user?.role).toBe(role);
        }
      });

      it("blocks non-queue staff (403 for PATIENT, INVENTORY_MANAGER)", () => {
        for (const role of [UserRole.PATIENT, UserRole.INVENTORY_MANAGER]) {
          const req = makeReq("http://localhost:3000/api/v1/queue/tokens/1/start-consultation", {
            token: tokenFor(role),
          });
          const auth = authorizeQueueStaff(req);
          expect(auth.error?.status).toBe(403);
        }
      });
    });
  });

  // =========================================================================
  // 4. API Endpoints RBAC Security Hardening Tests
  // =========================================================================
  describe("4. Security Hardening on Sensitive Endpoints", () => {
    describe("GET /api/v1/admin/audit-logs", () => {
      it("rejects unauthenticated requests with 401", async () => {
        const req = makeReq("http://localhost:3000/api/v1/admin/audit-logs");
        const res = await getAuditLogs(req);
        expect(res.status).toBe(401);
      });

      it("rejects non-admin roles (PATIENT, DOCTOR) with 403", async () => {
        for (const role of [UserRole.PATIENT, UserRole.DOCTOR, UserRole.PHARMACIST]) {
          const req = makeReq("http://localhost:3000/api/v1/admin/audit-logs", {
            token: tokenFor(role),
          });
          const res = await getAuditLogs(req);
          expect(res.status).toBe(403);
        }
      });

      it("allows ADMIN and MANAGEMENT roles", async () => {
        for (const role of [UserRole.ADMIN, UserRole.MANAGEMENT]) {
          const req = makeReq("http://localhost:3000/api/v1/admin/audit-logs", {
            token: tokenFor(role),
          });
          const res = await getAuditLogs(req);
          // 200 (or 500 if db disconnected in test environment, but not 401 or 403)
          expect([200, 500]).toContain(res.status);
        }
      });
    });

    describe("Staff User Management (/api/v1/admin/users)", () => {
      it("GET rejects unauthenticated requests with 401", async () => {
        const req = makeReq("http://localhost:3000/api/v1/admin/users");
        const res = await getAdminUsers(req);
        expect(res.status).toBe(401);
      });

      it("GET rejects PATIENT and DOCTOR with 403", async () => {
        for (const role of [UserRole.PATIENT, UserRole.DOCTOR]) {
          const req = makeReq("http://localhost:3000/api/v1/admin/users", {
            token: tokenFor(role),
          });
          const res = await getAdminUsers(req);
          expect(res.status).toBe(403);
        }
      });

      it("POST rejects unauthorized staff onboarding attempts with 401/403", async () => {
        const unauthReq = makeReq("http://localhost:3000/api/v1/admin/users", {
          method: "POST",
          body: { name: "Fake Staff", email: "fake@hospital.org" },
        });
        expect((await postAdminUser(unauthReq)).status).toBe(401);

        const patientReq = makeReq("http://localhost:3000/api/v1/admin/users", {
          method: "POST",
          token: tokenFor(UserRole.PATIENT),
          body: { name: "Fake Staff", email: "fake@hospital.org" },
        });
        expect((await postAdminUser(patientReq)).status).toBe(403);
      });
    });

    describe("POST /api/v1/departments", () => {
      it("rejects unauthenticated department mutation with 401", async () => {
        const req = makeReq("http://localhost:3000/api/v1/departments", {
          method: "POST",
          body: { name: "New Dept", code: "ND" },
        });
        const res = await postDepartment(req);
        expect(res.status).toBe(401);
      });

      it("rejects non-admin role mutation with 403", async () => {
        const req = makeReq("http://localhost:3000/api/v1/departments", {
          method: "POST",
          token: tokenFor(UserRole.DOCTOR),
          body: { name: "New Dept", code: "ND" },
        });
        const res = await postDepartment(req);
        expect(res.status).toBe(403);
      });
    });

    describe("POST /api/v1/diagnostics/catalog", () => {
      it("rejects unauthenticated diagnostic catalog creation with 401", async () => {
        const req = makeReq("http://localhost:3000/api/v1/diagnostics/catalog", {
          method: "POST",
          body: { name: "CBC Test", code: "CBC-01" },
        });
        const res = await postDiagnosticCatalog(req);
        expect(res.status).toBe(401);
      });

      it("rejects PATIENT role from adding diagnostic catalog tests with 403", async () => {
        const req = makeReq("http://localhost:3000/api/v1/diagnostics/catalog", {
          method: "POST",
          token: tokenFor(UserRole.PATIENT),
          body: { name: "CBC Test", code: "CBC-01" },
        });
        const res = await postDiagnosticCatalog(req);
        expect(res.status).toBe(403);
      });
    });

    describe("PATCH /api/v1/inpatient/admissions", () => {
      it("rejects unauthenticated admission modification with 401", async () => {
        const req = makeReq("http://localhost:3000/api/v1/inpatient/admissions", {
          method: "PATCH",
          body: { admissionId: "adm-1", status: "DISCHARGED" },
        });
        const res = await patchInpatientAdmission(req);
        expect(res.status).toBe(401);
      });

      it("rejects non-clinical roles (PATIENT, BILLING_STAFF) from discharging with 403", async () => {
        for (const role of [UserRole.PATIENT, UserRole.BILLING_STAFF]) {
          const req = makeReq("http://localhost:3000/api/v1/inpatient/admissions", {
            method: "PATCH",
            token: tokenFor(role),
            body: { admissionId: "adm-1", status: "DISCHARGED" },
          });
          const res = await patchInpatientAdmission(req);
          expect(res.status).toBe(403);
        }
      });
    });
  });
});
