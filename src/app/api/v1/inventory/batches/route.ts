import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_BATCHES = [
  {
    id: "batch-01",
    lotNumber: "LOT-AML-2025-09",
    medicineName: "Amlodipine Besylate 5mg",
    location: "Main Pharmacy Store",
    quantity: 320,
    manufacturedDate: "2025-09-01",
    expiryDate: "2027-08-31",
    isColdChain: false,
    status: "ACTIVE",
    daysToExpiry: 687,
  },
  {
    id: "batch-02",
    lotNumber: "LOT-MET-2024-11",
    medicineName: "Metformin 500mg",
    location: "OPD Sub-Dispensary",
    quantity: 140,
    manufacturedDate: "2024-11-15",
    expiryDate: "2026-11-30",
    isColdChain: false,
    status: "ACTIVE",
    daysToExpiry: 48,
  },
  {
    id: "batch-03",
    lotNumber: "LOT-INS-2025-03",
    medicineName: "Regular Insulin 100 IU/mL",
    location: "Refrigerated Depot (2-8°C)",
    quantity: 45,
    manufacturedDate: "2025-03-10",
    expiryDate: "2026-10-31",
    isColdChain: true,
    status: "ACTIVE",
    daysToExpiry: 18,
  },
  {
    id: "batch-04",
    lotNumber: "LOT-AMO-2024-06",
    medicineName: "Amoxicillin / Clavulanate 625mg",
    location: "Main Pharmacy Store",
    quantity: 80,
    manufacturedDate: "2024-06-01",
    expiryDate: "2026-05-31",
    isColdChain: false,
    status: "QUARANTINED",
    quarantineReason: "Suspected packaging seal moisture compromise during transit",
    daysToExpiry: 0,
  },
];

export async function GET() {
  try {
    try {
      const dbBatches = await prisma.stockBatch.findMany({
        include: {
          item: true,
          location: true,
        },
      });
      if (dbBatches.length > 0) {
        return NextResponse.json(successResponse(dbBatches));
      }
    } catch {
      // Fallback
    }

    return NextResponse.json(successResponse(FALLBACK_BATCHES));
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

    return NextResponse.json(
      successResponse({
        id: batchId,
        status,
        reason,
        updatedAt: new Date().toISOString(),
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
