import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbPOs = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = dbPOs.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      supplier: po.supplier?.name || "Primary Medical Supplier",
      orderDate: po.createdAt.toISOString().slice(0, 10),
      expectedDelivery: new Date(new Date(po.createdAt).getTime() + 7 * 86400000)
        .toISOString()
        .slice(0, 10),
      totalAmount: Number(po.totalAmount),
      status: po.status,
      items: po.items.map((i) => ({
        medicine: i.itemName,
        qtyOrdered: i.quantity,
        qtyReceived: po.status === "RECEIVED" ? i.quantity : 0,
        unitCost: Number(i.unitPrice),
      })),
    }));

    return NextResponse.json(successResponse(formatted));
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
    const { supplier, items, totalAmount, action } = body;

    const supplierName = (supplier || "Primary Medical Supplier").trim();
    let supplierRecord = await prisma.supplier.findFirst({
      where: { name: supplierName },
    });

    if (!supplierRecord) {
      supplierRecord = await prisma.supplier.create({
        data: { name: supplierName },
      });
    }

    const seq = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${new Date().getFullYear()}-${seq}`;

    const orderItems = Array.isArray(items) && items.length > 0
      ? items.map((item: any) => ({
          itemName: item.medicine || item.itemName || "Medical Supply",
          quantity: Number(item.qtyOrdered || item.quantity || 100),
          unitPrice: Number(item.unitCost || item.unitPrice || 1.0),
          totalPrice:
            Number(item.qtyOrdered || item.quantity || 100) *
            Number(item.unitCost || item.unitPrice || 1.0),
        }))
      : [
          {
            itemName: "Standard Clinical Supply Lot",
            quantity: 500,
            unitPrice: 2.5,
            totalPrice: 1250.0,
          },
        ];

    const computedTotal =
      Number(totalAmount) ||
      orderItems.reduce((acc: number, cur: any) => acc + Number(cur.totalPrice), 0);

    const createdPO = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplierRecord.id,
        status: action === "RECEIVE" ? "RECEIVED" : "DRAFT",
        totalAmount: computedTotal,
        items: {
          create: orderItems,
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    return NextResponse.json(
      successResponse({
        id: createdPO.id,
        poNumber: createdPO.poNumber,
        supplier: createdPO.supplier.name,
        orderDate: createdPO.createdAt.toISOString().slice(0, 10),
        expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        totalAmount: Number(createdPO.totalAmount),
        status: createdPO.status,
        items: createdPO.items.map((i) => ({
          medicine: i.itemName,
          qtyOrdered: i.quantity,
          qtyReceived: createdPO.status === "RECEIVED" ? i.quantity : 0,
          unitCost: Number(i.unitPrice),
        })),
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("INV_PO_CREATE_FAILED", "Failed to create purchase order", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
