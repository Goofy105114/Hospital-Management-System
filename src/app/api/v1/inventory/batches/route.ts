import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbBatches = await prisma.stockBatch.findMany({
      include: {
        item: true,
        location: true,
      },
      orderBy: { expiryDate: "asc" },
    });

    const now = Date.now();
    const formatted = dbBatches.map((b) => {
      const expTime = new Date(b.expiryDate).getTime();
      const daysToExpiry = Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));

      return {
        id: b.id,
        lotNumber: b.lotNumber,
        medicineName: b.item.name,
        location: b.location.name,
        quantity: b.quantityAvailable,
        manufacturedDate: b.manufacturingDate
          ? b.manufacturingDate.toISOString().slice(0, 10)
          : "",
        expiryDate: b.expiryDate.toISOString().slice(0, 10),
        isColdChain: (b.item as any).isColdChain || false,
        status: b.status,
        daysToExpiry,
      };
    });

    return NextResponse.json(successResponse(formatted));
  } catch (error) {
    return NextResponse.json(
      errorResponse("INV_BATCH_FETCH_FAILED", "Failed to retrieve batch lots", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, status, reason } = body;

    if (!batchId) {
      return NextResponse.json(
        errorResponse("BAD_REQUEST", "batchId is required"),
        { status: 400 }
      );
    }

    const updated = await prisma.stockBatch.update({
      where: { id: batchId },
      data: {
        ...(status ? { status } : {}),
      },
      include: {
        item: true,
        location: true,
      },
    });

    return NextResponse.json(
      successResponse({
        id: updated.id,
        lotNumber: updated.lotNumber,
        medicineName: updated.item.name,
        status: updated.status,
        reason,
        updatedAt: updated.updatedAt.toISOString(),
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("INV_BATCH_UPDATE_FAILED", "Failed to update batch lot status", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
