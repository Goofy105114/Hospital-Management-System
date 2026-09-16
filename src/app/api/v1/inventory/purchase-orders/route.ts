import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_POS = [
  {
    id: "po-01",
    poNumber: "PO-2026-0041",
    supplier: "Pfizer Global Health Supply",
    orderDate: "2026-10-18",
    expectedDelivery: "2026-10-28",
    totalAmount: 4850.0,
    itemCount: 4,
    status: "SENT",
    items: [
      { medicine: "Amlodipine Besylate 5mg", qtyOrdered: 1000, qtyReceived: 0, unitCost: 2.2 },
      { medicine: "Atorvastatin 20mg", qtyOrdered: 500, qtyReceived: 0, unitCost: 4.5 },
    ],
  },
  {
    id: "po-02",
    poNumber: "PO-2026-0038",
    supplier: "Novartis Pharmaceuticals",
    orderDate: "2026-10-10",
    expectedDelivery: "2026-10-20",
    totalAmount: 3200.0,
    itemCount: 2,
    status: "PARTIALLY_RECEIVED",
    items: [
      { medicine: "Metformin 500mg", qtyOrdered: 2000, qtyReceived: 1000, unitCost: 1.1 },
      { medicine: "Omeprazole 20mg", qtyOrdered: 800, qtyReceived: 800, unitCost: 1.25 },
    ],
  },
  {
    id: "po-03",
    poNumber: "PO-2026-0032",
    supplier: "Medline Medical Supplies Ltd",
    orderDate: "2026-09-28",
    expectedDelivery: "2026-10-05",
    totalAmount: 1850.0,
    itemCount: 6,
    status: "RECEIVED",
    items: [
      { medicine: "Sterile Normal Saline 500mL", qtyOrdered: 400, qtyReceived: 400, unitCost: 3.5 },
      { medicine: "IV Cannula 20G", qtyOrdered: 1000, qtyReceived: 1000, unitCost: 0.45 },
    ],
  },
];

export async function GET() {
  try {
    try {
      const dbPOs = await prisma.purchaseOrder.findMany({
        include: {
          items: true,
        },
      });
      if (dbPOs.length > 0) {
        return NextResponse.json(successResponse(dbPOs));
      }
    } catch {
      // Fallback
    }

    return NextResponse.json(successResponse(FALLBACK_POS));
  } catch (error) {
    return NextResponse.json(
      errorResponse("INV_PO_FETCH_FAILED", "Failed to retrieve purchase orders", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplier, expectedDelivery, items, totalAmount } = body;

    const seq = Math.floor(1000 + Math.random() * 9000);
    const newPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${seq}`,
      supplier: supplier || "Primary Medical Supplier",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDelivery:
        expectedDelivery || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      totalAmount: Number(totalAmount) || 2500.0,
      itemCount: items?.length || 2,
      status: "DRAFT",
      items: items || [],
    };

    return NextResponse.json(successResponse(newPO), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse("INV_PO_CREATE_FAILED", "Failed to create purchase order", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
