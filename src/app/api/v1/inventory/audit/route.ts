import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { reconcilePhysicalStockAudit } from "@/server/domain/inventory-item";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: { status: "ACTIVE" },
        },
      },
    });

    const itemsForAudit = items.map((item) => {
      const stockOnHand = item.batches.reduce(
        (sum, b) => sum + b.quantityAvailable,
        0
      );
      return {
        id: item.id,
        itemName: item.name,
        category: item.category,
        systemStockOnHand: stockOnHand,
        physicalCount: stockOnHand, // baseline physical count
        unitCost: 10.0, // default estimation unit cost
      };
    });

    const auditReport = reconcilePhysicalStockAudit(itemsForAudit);

    const result = {
      asOfDate: new Date().toISOString(),
      totalItemsAudited: auditReport.totalItemsAudited,
      itemsWithDiscrepancyCount: auditReport.itemsWithDiscrepancyCount,
      totalDiscrepancyQty: auditReport.totalDiscrepancyQty,
      totalVarianceValue: auditReport.totalVarianceValue,
      discrepancies: auditReport.discrepancies,
    };

    return NextResponse.json(
      successResponse(result, "Inventory physical audit report generated successfully")
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("INV_AUDIT_FAILED", "Failed to generate inventory audit report", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
