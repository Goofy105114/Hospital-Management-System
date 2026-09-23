import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { AppointmentStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_KPI_CODES = [
  "AVG_WAIT_TIME",
  "NO_SHOW_RATE",
  "REVENUE",
  "STOCK_TURNOVER",
  "BED_OCCUPANCY",
] as const;
type KpiCode = (typeof VALID_KPI_CODES)[number];

/**
 * REP-05 — GET /api/v1/reports/kpis
 *
 * Returns a time-series for the requested KPI over a date range.
 *
 * KPI definitions (reproducible/auditable formulas):
 *   AVG_WAIT_TIME   — AVG(queueToken.estimatedWaitMinutes) per day in range
 *   NO_SHOW_RATE    — COUNT(NO_SHOW) / COUNT(non-cancelled appointments) × 100 per day
 *   REVENUE         — SUM(invoice.paidAmount) per day in range
 *   STOCK_TURNOVER  — SUM(ABS(stockLedger.quantityDelta)) for DISPENSE reason per day
 *   BED_OCCUPANCY   — Current point-in-time: COUNT(OCCUPIED) / COUNT(total beds) × 100
 *
 * Query params:
 *   ?kpiCode=   one of the codes above (required)
 *   ?dateFrom=  ISO date (defaults to 30 days ago)
 *   ?dateTo=    ISO date (defaults to today)
 *
 * Roles: MANAGEMENT, ADMIN.
 */
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.MANAGEMENT, UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Management or admin role required", 403);
  }

  const { searchParams } = new URL(request.url);
  const kpiCode = searchParams.get("kpiCode") as KpiCode | null;
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  if (!kpiCode || !VALID_KPI_CODES.includes(kpiCode)) {
    return apiError(
      "REP_INVALID_KPI",
      `kpiCode must be one of: ${VALID_KPI_CODES.join(", ")}`,
      400
    );
  }

  const dateTo = dateToParam ? new Date(dateToParam) : new Date();
  const dateFrom = dateFromParam
    ? new Date(dateFromParam)
    : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

  dateTo.setHours(23, 59, 59, 999);
  dateFrom.setHours(0, 0, 0, 0);

  try {
    let series: { date: string; value: number }[] = [];

    // -----------------------------------------------------------------------
    // BED_OCCUPANCY — point-in-time, no bucketing needed
    // -----------------------------------------------------------------------
    if (kpiCode === "BED_OCCUPANCY") {
      const [occupied, total] = await Promise.all([
        prisma.bed.count({ where: { status: "OCCUPIED" } }),
        prisma.bed.count(),
      ]);
      const value = total > 0 ? Math.round((occupied / total) * 100) : 0;
      series = [{ date: new Date().toISOString().slice(0, 10), value }];
      return apiSuccess({ kpiCode, dateFrom: dateFrom.toISOString().slice(0, 10), dateTo: dateTo.toISOString().slice(0, 10), series });
    }

    // -----------------------------------------------------------------------
    // Time-series KPIs — generate day buckets then query each
    // -----------------------------------------------------------------------
    const days: string[] = [];
    const cursor = new Date(dateFrom);
    while (cursor <= dateTo) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    // Cap to 90 days to avoid runaway queries
    const cappedDays = days.slice(-90);

    for (const day of cappedDays) {
      const dayStart = new Date(`${day}T00:00:00.000Z`);
      const dayEnd   = new Date(`${day}T23:59:59.999Z`);
      let value = 0;

      if (kpiCode === "AVG_WAIT_TIME") {
        const result = await prisma.queueToken.aggregate({
          _avg: { estimatedWaitMinutes: true },
          where: { checkedInAt: { gte: dayStart, lte: dayEnd } },
        });
        value = Math.round(result._avg.estimatedWaitMinutes ?? 0);

      } else if (kpiCode === "NO_SHOW_RATE") {
        const [noShow, total] = await Promise.all([
          prisma.appointment.count({
            where: { slotStart: { gte: dayStart, lte: dayEnd }, status: AppointmentStatus.NO_SHOW },
          }),
          prisma.appointment.count({
            where: {
              slotStart: { gte: dayStart, lte: dayEnd },
              status: { not: AppointmentStatus.CANCELLED },
            },
          }),
        ]);
        value = total > 0 ? Math.round((noShow / total) * 100) : 0;

      } else if (kpiCode === "REVENUE") {
        const result = await prisma.invoice.aggregate({
          _sum: { paidAmount: true },
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        });
        value = Number(result._sum.paidAmount ?? 0);

      } else if (kpiCode === "STOCK_TURNOVER") {
        const result = await prisma.stockLedgerEntry.aggregate({
          _sum: { quantityDelta: true },
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            reason: "DISPENSE",
          },
        });
        // ABS of delta (dispenses are negative)
        value = Math.abs(Number(result._sum.quantityDelta ?? 0));
      }

      series.push({ date: day, value });
    }

    return apiSuccess({
      kpiCode,
      formula: {
        AVG_WAIT_TIME:  "AVG(queueToken.estimatedWaitMinutes) per day",
        NO_SHOW_RATE:   "COUNT(NO_SHOW) / COUNT(non-cancelled appointments) × 100 per day",
        REVENUE:        "SUM(invoice.paidAmount) per day",
        STOCK_TURNOVER: "SUM(ABS(stockLedger.quantityDelta WHERE reason=DISPENSE)) per day",
        BED_OCCUPANCY:  "COUNT(OCCUPIED beds) / COUNT(total beds) × 100 (point-in-time)",
      }[kpiCode],
      dateFrom: dateFrom.toISOString().slice(0, 10),
      dateTo:   dateTo.toISOString().slice(0, 10),
      series,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to compute KPI", 500);
  }
}
