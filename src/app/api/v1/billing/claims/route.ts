import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole, InsuranceClaimStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const dbClaims = await prisma.insuranceClaim.findMany({
      include: {
        invoice: {
          include: {
            patient: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formatted = dbClaims.map((c) => {
      const claimAmt = Number(c.claimAmount);
      const appAmt = c.approvedAmount ? Number(c.approvedAmount) : 0;
      return {
        id: c.id,
        claimNumber: `CLM-${c.id.slice(0, 8).toUpperCase()}`,
        patientName: c.invoice?.patient?.user?.name || "Patient",
        mrn: c.invoice?.patient?.mrn || "MRN-000000",
        payerName: c.providerName,
        policyNumber: c.policyNumber,
        preAuthCode: c.authNumber || "AUTH-" + c.id.slice(0, 6).toUpperCase(),
        claimedAmount: claimAmt,
        approvedAmount: appAmt,
        copayAmount: Math.max(0, claimAmt - appAmt),
        submittedDate: c.submittedAt.toISOString().slice(0, 10),
        status: c.status,
      };
    });

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("CLAIMS_FETCH_FAILED", error.message || "Failed to retrieve claims", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await request.json();
    const {
      patientName,
      mrn,
      payerName,
      policyNumber,
      preAuthCode,
      claimedAmount,
      invoiceId: incomingInvoiceId,
    } = body;

    let patientRecord = null;
    if (mrn) {
      patientRecord = await prisma.patient.findUnique({
        where: { mrn },
        include: { user: true },
      });
    }

    if (!patientRecord && patientName) {
      patientRecord = await prisma.patient.findFirst({
        where: {
          user: {
            name: { contains: patientName, mode: "insensitive" },
          },
        },
        include: { user: true },
      });
    }

    if (!patientRecord) {
      patientRecord = await prisma.patient.findFirst({
        include: { user: true },
      });
    }

    if (!patientRecord) {
      return apiError("PATIENT_NOT_FOUND", "No patient found to associate claim with", 404);
    }

    let invoice = null;
    if (incomingInvoiceId) {
      invoice = await prisma.invoice.findUnique({ where: { id: incomingInvoiceId } });
    }

    if (!invoice) {
      invoice = await prisma.invoice.findFirst({
        where: { patientId: patientRecord.id },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!invoice) {
      // Create a pending clinical invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId: patientRecord.id,
          totalAmount: Number(claimedAmount) || 500,
          status: "ISSUED",
        },
      });
    }

    const createdClaim = await prisma.insuranceClaim.create({
      data: {
        invoiceId: invoice.id,
        patientId: patientRecord.id,
        providerName: payerName || "National Health Insurance",
        policyNumber: policyNumber || "POL-992019",
        authNumber: preAuthCode || `AUTH-${Math.floor(10000 + Math.random() * 90000)}`,
        claimAmount: Number(claimedAmount) || 500,
        status: InsuranceClaimStatus.SUBMITTED,
      },
    });

    return apiSuccess(
      {
        id: createdClaim.id,
        claimNumber: `CLM-${createdClaim.id.slice(0, 8).toUpperCase()}`,
        patientName: patientRecord.user.name,
        mrn: patientRecord.mrn,
        payerName: createdClaim.providerName,
        policyNumber: createdClaim.policyNumber,
        preAuthCode: createdClaim.authNumber,
        claimedAmount: Number(createdClaim.claimAmount),
        approvedAmount: 0,
        copayAmount: Number(createdClaim.claimAmount),
        submittedDate: createdClaim.submittedAt.toISOString().slice(0, 10),
        status: createdClaim.status,
      },
      undefined,
      201
    );
  } catch (error: any) {
    return apiError("CLAIM_CREATE_FAILED", error.message || "Failed to create insurance claim", 500);
  }
}
