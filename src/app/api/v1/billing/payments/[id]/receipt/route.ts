import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { generateReceiptNumber } from "@/server/domain/invoice-pricing";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            patient: { include: { user: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        errorResponse("BIL_PAYMENT_NOT_FOUND", "Payment record not found"),
        { status: 404 }
      );
    }

    const patient = payment.invoice?.patient;
    const receiptNumber = generateReceiptNumber(payment.id, payment.createdAt);

    const receipt = {
      receiptNumber,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice.invoiceNumber,
      patientId: payment.patientId,
      patientName: patient?.user?.name || "Patient",
      patientMrn: patient?.mrn || "MRN-UNKNOWN",
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      collectedBy: payment.collectedBy,
      invoiceTotal: Number(payment.invoice.totalAmount),
      remainingBalance: Number(payment.invoice.balanceAmount),
      paymentDate: payment.createdAt.toISOString(),
    };

    return NextResponse.json(
      successResponse(receipt, "Payment receipt generated successfully")
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("BIL_RECEIPT_FAILED", "Failed to generate payment receipt", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
