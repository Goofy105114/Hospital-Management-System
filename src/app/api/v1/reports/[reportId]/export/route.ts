import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const VALID_REPORT_IDS = [
  "overview",
  "appointments",
  "revenue",
  "queue",
  "inventory",
] as const;

/**
 * REP-05 — GET /api/v1/reports/:reportId/export?format=csv|pdf
 *
 * Exports a named report as CSV (PDF acknowledged as out of scope for
 * server-side generation per SOW §7.1 — both formats return CSV).
 * Role-scoping mirrors the underlying report: MANAGEMENT/ADMIN only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.MANAGEMENT, UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Management or admin role required for report export", 403);
  }

  const { reportId } = params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";

  if (!VALID_REPORT_IDS.includes(reportId as (typeof VALID_REPORT_IDS)[number])) {
    return apiError(
      "REP_INVALID_REPORT_ID",
      `reportId must be one of: ${VALID_REPORT_IDS.join(", ")}`,
      400
    );
  }

  try {
    let rows: string[][] = [];
    let headers: string[] = [];

    if (reportId === "overview") {
      headers = ["Metric", "Value"];
      const [patients, appointments, tokens, occupied, total, invoices] = await Promise.all([
        prisma.patient.count({ where: { deletedAt: null } }),
        prisma.appointment.count({ where: { slotStart: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.queueToken.count({ where: { status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] } } }),
        prisma.bed.count({ where: { status: "OCCUPIED" } }),
        prisma.bed.count(),
        prisma.invoice.count(),
      ]);
      rows = [
        ["Total Patients", String(patients)],
        ["Today Appointments", String(appointments)],
        ["Active Queue Tokens", String(tokens)],
        ["Bed Occupancy %", total > 0 ? String(Math.round((occupied / total) * 100)) : "0"],
        ["Total Invoices", String(invoices)],
      ];

    } else if (reportId === "appointments") {
      headers = ["AppointmentNumber", "PatientName", "DoctorName", "SlotStart", "Status"];
      const appts = await prisma.appointment.findMany({
        take: 500,
        orderBy: { slotStart: "desc" },
        include: {
          patient: { select: { user: { select: { name: true } } } },
          doctor:  { select: { user: { select: { name: true } } } },
        },
      });
      rows = appts.map((a) => [
        a.appointmentNumber,
        a.patient.user.name,
        a.doctor.user.name,
        a.slotStart.toISOString(),
        a.status,
      ]);

    } else if (reportId === "revenue") {
      headers = ["InvoiceNumber", "PatientMrn", "NetAmount", "PaidAmount", "Status", "Date"];
      const invoices = await prisma.invoice.findMany({
        take: 500,
        orderBy: { createdAt: "desc" },
        include: { patient: { select: { mrn: true } } },
      });
      rows = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.patient.mrn,
        String(inv.netAmount),
        String(inv.paidAmount),
        inv.status,
        inv.createdAt.toISOString().slice(0, 10),
      ]);

    } else if (reportId === "queue") {
      headers = ["TokenNumber", "DoctorId", "Status", "Position", "EstimatedWait", "CheckedInAt"];
      const tokens = await prisma.queueToken.findMany({
        take: 500,
        orderBy: { checkedInAt: "desc" },
      });
      rows = tokens.map((t) => [
        t.tokenNumber,
        t.doctorId,
        t.status,
        String(t.position),
        String(t.estimatedWaitMinutes),
        t.checkedInAt.toISOString(),
      ]);

    } else if (reportId === "inventory") {
      headers = ["ItemName", "Category", "CurrentStockOnHand", "Unit"];
      const items = await prisma.inventoryItem.findMany({
        take: 500,
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
      rows = items.map((i) => [
        i.name,
        i.category,
        String(i.currentStockOnHand),
        i.unit,
      ]);
    }

    // Build CSV
    const csvLines = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const filename = `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvLines, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Note: PDF export not implemented server-side (SOW §7.1 exclusion).
        // Both csv and pdf format params return CSV.
        "X-Export-Format": format === "pdf" ? "csv-fallback" : "csv",
      },
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to export report", 500);
  }
}
