import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalPatients,
      todayAppointments,
      activeQueueTokens,
      totalWards,
      occupiedBeds,
      totalBeds,
      totalInvoices,
      lowStockItems,
      departments,
      paidInvoices,
    ] = await Promise.all([
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.appointment.count({
        where: {
          slotStart: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.queueToken.count({
        where: {
          status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] },
        },
      }),
      prisma.ward.count(),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
      prisma.bed.count(),
      prisma.invoice.count(),
      prisma.inventoryItem.count({
        where: {
          currentStockOnHand: { lte: 50 },
        },
      }),
      prisma.department.findMany({
        select: {
          name: true,
          _count: {
            select: {
              appointments: true,
            },
          },
        },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: { status: "PAID" },
        select: {
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const departmentLoad = departments.map((d) => ({
      department: d.name,
      patients: d._count.appointments,
      load: Math.min(100, Math.round((d._count.appointments / 20) * 100)),
    }));

    // Group paid revenue by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, { revenue: number; appointments: number }> = {};
    for (const inv of paidInvoices) {
      const m = months[new Date(inv.createdAt).getMonth()];
      if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, appointments: 0 };
      monthlyMap[m].revenue += Number(inv.totalAmount || 0);
      monthlyMap[m].appointments += 1;
    }

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue),
      appointments: data.appointments,
    }));

    return apiSuccess({
      metrics: {
        totalPatients,
        todayAppointments,
        activeQueueTokens,
        bedOccupancyRate,
        occupiedBeds,
        totalBeds,
        totalInvoices,
        lowStockItems,
      },
      monthlyRevenue,
      departmentLoad,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err?.message || "Failed to retrieve hospital report overview", 500);
  }
}
