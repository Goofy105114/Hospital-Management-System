import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, DiagnosticOrderStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * DIA-02 — GET /api/v1/diagnostics/orders
 *
 * List diagnostic orders, filterable by patientId, encounterId, status.
 * PATIENT role is scoped to their own orders only.
 */
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.DOCTOR,
      UserRole.LAB_TECH,
      UserRole.RADIOLOGIST,
      UserRole.NURSE,
      UserRole.ADMIN,
      UserRole.PATIENT,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to view diagnostic orders", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const encounterId = searchParams.get("encounterId");
    const status = searchParams.get("status") as DiagnosticOrderStatus | null;

    // PATIENT role: must scope to own orders
    let scopedPatientId = patientId;
    if (user.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { userId: user.sub },
        select: { id: true },
      });
      scopedPatientId = patient?.id ?? "none";
    }

    const results = await prisma.diagnosticOrder.findMany({
      where: {
        ...(scopedPatientId ? { patientId: scopedPatientId } : {}),
        ...(encounterId ? { encounterId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        patient: { select: { mrn: true, user: { select: { name: true } } } },
        items: {
          include: {
            test: { select: { name: true, code: true, category: true, sampleType: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const orders = results.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      patientId: o.patientId,
      patientName: o.patient.user.name,
      patientMrn: o.patient.mrn,
      encounterId: o.encounterId,
      doctorId: o.doctorId,
      status: o.status,
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
      tests: o.items.map((item) => ({
        testId: item.testId,
        testName: item.test.name,
        testCode: item.test.code,
        category: item.test.category,
        sampleType: item.test.sampleType,
        price: Number(item.price),
      })),
    }));

    return apiSuccess(orders);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve diagnostic orders", 500);
  }
}

/**
 * DIA-02 — POST /api/v1/diagnostics/orders
 *
 * Create a new diagnostic order with one or more tests.
 * Resolves each testId price from the catalog and creates order items.
 * Roles: DOCTOR.
 */
export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.DOCTOR])) {
    return apiError("UNAUTHORIZED_ROLE", "Only doctors may create diagnostic orders", 403);
  }

  try {
    const body = await request.json();
    const { patientId, encounterId, testIds, notes } = body;

    if (!patientId || !Array.isArray(testIds) || testIds.length === 0) {
      return apiError(
        "DIA_INVALID_ORDER",
        "patientId and at least one testId are required",
        400
      );
    }

    // Generate orderNumber: DIA-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.diagnosticOrder.count();
    const orderNumber = `DIA-${today}-${String(count + 1).padStart(4, "0")}`;

    // Resolve catalog items and their prices
    const catalogItems = await prisma.diagnosticCatalog.findMany({
      where: { id: { in: testIds }, isActive: true },
      select: { id: true, price: true },
    });

    if (catalogItems.length !== testIds.length) {
      const foundIds = catalogItems.map((c) => c.id);
      const missing = testIds.filter((id: string) => !foundIds.includes(id));
      return apiError(
        "DIA_TEST_NOT_FOUND",
        `The following test IDs were not found or are inactive: ${missing.join(", ")}`,
        422
      );
    }

    const order = await prisma.diagnosticOrder.create({
      data: {
        orderNumber,
        patientId,
        encounterId: encounterId ?? null,
        doctorId: user.sub,
        status: DiagnosticOrderStatus.ORDERED,
        notes: notes ?? null,
        items: {
          create: catalogItems.map((c) => ({
            testId: c.id,
            price: c.price,
          })),
        },
      },
      include: {
        items: {
          include: { test: { select: { name: true, code: true } } },
        },
      },
    });

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.CREATE,
      entityType: "DiagnosticOrder",
      entityId: order.id,
      changes: {
        after: { orderNumber, patientId, testIds, status: "ORDERED" },
      },
    });

    return apiSuccess(order, undefined, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create diagnostic order", 500);
  }
}
