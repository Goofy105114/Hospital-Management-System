import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        claims: true,
      },
    });

    if (!invoice) {
      return apiError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    }

    const formatted = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt.toISOString().slice(0, 10),
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
      status: invoice.status,
      patientName: invoice.patient.user.name,
      patientMrn: invoice.patient.mrn,
      address: invoice.patient.address || "Patient Residential Address",
      phone: invoice.patient.user.phone || invoice.patient.secondaryPhone || "N/A",
      insuranceProvider: invoice.claims[0]?.providerName || "Self Pay",
      policyNumber: invoice.claims[0]?.policyNumber || "N/A",
      items: invoice.items.map((it) => ({
        id: it.id,
        description: it.description,
        department: it.sourceModule || "Clinical Service",
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        total: Number(it.totalPrice),
      })),
      subtotal: Number(invoice.totalAmount),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      insuranceCovered: Number(invoice.discountAmount),
      patientOwing: Number(invoice.balanceAmount),
      paidAmount: Number(invoice.paidAmount),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        date: p.createdAt.toLocaleString(),
        mode: p.paymentMethod,
        ref: p.transactionReference || "POS-REF",
        amount: Number(p.amount),
        status: "SETTLED",
      })),
    };

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("INVOICE_FETCH_FAILED", error.message || "Failed to retrieve invoice", 500);
  }
}
