import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { reconcileDailyCollections } from "@/server/domain/invoice-pricing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = endDateParam ? new Date(endDateParam) : new Date();

    const [payments, invoices] = await Promise.all([
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const reconciliation = reconcileDailyCollections(
      payments.map((p) => ({
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        collectedBy: p.collectedBy,
        createdAt: p.createdAt,
      }))
    );

    const totalBilled = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount),
      0
    );

    const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    const result = {
      asOfDate: new Date().toISOString(),
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      totalBilled: round(totalBilled),
      totalCollected: reconciliation.totalCollected,
      totalOutstanding: round(totalOutstanding),
      transactionCount: reconciliation.transactionCount,
      collectionsByMethod: reconciliation.byMethod,
      invoicesIssuedCount: invoices.length,
    };

    return NextResponse.json(
      successResponse(result, "Financial reconciliation report generated successfully")
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "BIL_RECONCILIATION_FAILED",
        "Failed to generate financial reconciliation report",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
