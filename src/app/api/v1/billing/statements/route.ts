import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { calculateAgingBuckets, generateReceiptNumber } from "@/server/domain/invoice-pricing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        errorResponse(
          "BIL_PATIENT_REQUIRED",
          "patientId query parameter is required to generate statement"
        ),
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      return NextResponse.json(
        errorResponse("BIL_PATIENT_NOT_FOUND", "Patient not found"),
        { status: 404 }
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: { patientId },
      include: { payments: true, adjustments: true },
      orderBy: { createdAt: "desc" },
    });

    const allPayments = await prisma.payment.findMany({
      where: { patientId },
      include: { invoice: true },
      orderBy: { createdAt: "desc" },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalAdjustments = 0;

    const invoiceSummaries = invoices.map((inv) => {
      const invTotal = Number(inv.totalAmount);
      const invPaid = Number(inv.paidAmount);
      const invBal = Number(inv.balanceAmount);

      totalInvoiced += invTotal;
      totalPaid += invPaid;

      const adjSum = inv.adjustments.reduce(
        (sum, a) => sum + Number(a.appliedAmount),
        0
      );
      totalAdjustments += adjSum;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.createdAt.toISOString(),
        totalAmount: invTotal,
        paidAmount: invPaid,
        balanceAmount: invBal,
        status: inv.status,
      };
    });

    const aging = calculateAgingBuckets(
      invoices.map((inv) => ({
        invoiceDate: inv.createdAt,
        balanceAmount: Number(inv.balanceAmount),
      }))
    );

    const paymentSummaries = allPayments.map((p) => ({
      id: p.id,
      receiptNumber: generateReceiptNumber(p.id, p.createdAt),
      invoiceNumber: p.invoice?.invoiceNumber || "N/A",
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      paymentDate: p.createdAt.toISOString(),
      collectedBy: p.collectedBy,
    }));

    const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    const statement = {
      patientId: patient.id,
      patientName: patient.user?.name || "Patient",
      patientMrn: patient.mrn,
      generatedAt: new Date().toISOString(),
      totalInvoiced: round(totalInvoiced),
      totalPaid: round(totalPaid),
      totalAdjustments: round(totalAdjustments),
      outstandingBalance: aging.totalOutstanding,
      aging,
      invoices: invoiceSummaries,
      payments: paymentSummaries,
    };

    return NextResponse.json(
      successResponse(statement, "Patient billing statement generated successfully")
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "BIL_STATEMENT_FAILED",
        "Failed to generate patient billing statement",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
