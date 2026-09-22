import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    const ledger = await prisma.stockLedgerEntry.findMany({
      where: {
        ...(itemId ? { itemId } : {}),
      },
      include: {
        item: { select: { name: true, unit: true } },
        location: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = ledger.map((l) => ({
      id: l.id,
      itemId: l.itemId,
      itemName: l.item.name,
      unit: l.item.unit,
      locationName: l.location.name,
      quantityDelta: l.quantityDelta,
      reason: l.reason,
      refType: l.refType,
      createdBy: l.createdBy,
      createdAt: l.createdAt.toISOString(),
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiSuccess([]);
  }
}
