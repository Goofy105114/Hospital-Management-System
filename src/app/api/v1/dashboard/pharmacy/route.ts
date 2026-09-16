import { NextRequest } from "next/server";
import { BatchStatus, PrescriptionStatus, StockAlertStatus, UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pharmacyDashboardRates } from "@/server/domain/pharmacy-dashboard";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.PHARMACIST, UserRole.INVENTORY_MANAGER])) {
    return apiError("UNAUTHORIZED_ROLE", "Pharmacy or inventory role required", 403);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nearExpiryDate = new Date(Date.now() + 90 * 86_400_000);
  const [queueLength, full, partial, nearExpiryBatches, openAlerts, batches] = await Promise.all([
    prisma.prescription.count({
      where: {
        status: {
          in: [
            PrescriptionStatus.FINALIZED,
            PrescriptionStatus.PENDING,
            PrescriptionStatus.VALIDATED,
            PrescriptionStatus.PARTIALLY_DISPENSED,
            PrescriptionStatus.ON_HOLD,
          ],
        },
      },
    }),
    prisma.dispensation.count({ where: { dispensedAt: { gte: today }, status: "FULL" } }),
    prisma.dispensation.count({ where: { dispensedAt: { gte: today }, status: "PARTIAL" } }),
    prisma.stockBatch.findMany({
      where: {
        expiryDate: { lte: nearExpiryDate },
        quantityAvailable: { gt: 0 },
        status: { in: [BatchStatus.ACTIVE, BatchStatus.QUARANTINED] },
      },
      include: { item: { select: { name: true } }, location: { select: { name: true } } },
      orderBy: { expiryDate: "asc" },
      take: 20,
    }),
    prisma.stockAlert.findMany({
      where: { status: { in: [StockAlertStatus.OPEN, StockAlertStatus.ACKNOWLEDGED] } },
      include: { item: { select: { name: true } }, location: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.stockBatch.findMany({
      where: { quantityAvailable: { gt: 0 } },
      include: { location: { select: { id: true, name: true } } },
    }),
  ]);
  const byLocation = new Map<
    string,
    { locationId: string; locationName: string; quantity: number }
  >();
  for (const batch of batches) {
    const current = byLocation.get(batch.locationId) ?? {
      locationId: batch.locationId,
      locationName: batch.location.name,
      quantity: 0,
    };
    current.quantity += batch.quantityAvailable;
    byLocation.set(batch.locationId, current);
  }
  const metrics = pharmacyDashboardRates({
    queueLength,
    dispensedFull: full,
    dispensedPartial: partial,
    lowStockCount: openAlerts.length,
    nearExpiryCount: nearExpiryBatches.length,
  });
  return apiSuccess({
    ...metrics,
    dispensedToday: metrics.totalDispensed,
    stockLevels: [...byLocation.values()],
    nearExpiryBatches,
    openAlerts,
  });
}
