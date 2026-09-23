import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
      },
      include: {
        patient: { select: { mrn: true, user: { select: { name: true } } } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patientId: inv.patientId,
      patientName: inv.patient.user.name,
      patientMrn: inv.patient.mrn,
      totalAmount: Number(inv.totalAmount),
      discountAmount: Number(inv.discountAmount),
      taxAmount: Number(inv.taxAmount),
      netAmount: Number(inv.netAmount),
      paidAmount: Number(inv.paidAmount),
      balanceAmount: Number(inv.balanceAmount),
      status: inv.status,
      dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
      createdAt: inv.createdAt.toISOString(),
      items: inv.items.map((i) => ({
        id: i.id,
        description: i.description,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return apiError("FETCH_FAILED", "Failed to fetch invoices", 500);
  }
}
