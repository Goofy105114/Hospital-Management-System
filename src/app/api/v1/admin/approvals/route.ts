import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { validateAdministrativeApprovalAction } from "@/server/domain/system-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const adjustments = await prisma.invoiceAdjustment.findMany({
      where: {
        ...(status ? { status: status.toUpperCase() as any } : {}),
      },
      include: {
        invoice: {
          include: { patient: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = adjustments.map((a) => ({
      id: a.id,
      approvalType: "INVOICE_ADJUSTMENT",
      referenceId: a.invoiceId,
      invoiceNumber: a.invoice.invoiceNumber,
      patientName: a.invoice.patient?.user?.name || "Patient",
      type: a.type,
      value: Number(a.value),
      appliedAmount: Number(a.appliedAmount),
      reason: a.reason,
      status: a.status,
      requestedBy: a.requestedBy,
      approvedBy: a.approvedBy,
      approvedAt: a.approvedAt?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json(
      successResponse(formatted, `Retrieved ${formatted.length} administrative approval requests`)
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("ADM_APPROVALS_FETCH_FAILED", "Failed to retrieve approvals", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = validateAdministrativeApprovalAction({
      approverRole: body.approverRole || "ADMIN",
      decision: body.decision,
      reason: body.reason,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Approval action validation failed"
        ),
        { status: 400 }
      );
    }

    if (!body.approvalId) {
      return NextResponse.json(
        errorResponse("ADM_APPROVAL_ID_REQUIRED", "approvalId is required"),
        { status: 400 }
      );
    }

    const adjustment = await prisma.invoiceAdjustment.findUnique({
      where: { id: body.approvalId },
    });

    if (!adjustment) {
      return NextResponse.json(
        errorResponse("ADM_APPROVAL_NOT_FOUND", "Approval request not found"),
        { status: 404 }
      );
    }

    const updated = await prisma.invoiceAdjustment.update({
      where: { id: body.approvalId },
      data: {
        status: body.decision === "APPROVED" ? "APPROVED" : "REJECTED",
        approvedBy: body.approverId || "Admin",
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(
      successResponse(
        {
          id: updated.id,
          status: updated.status,
          approvedBy: updated.approvedBy,
          approvedAt: updated.approvedAt?.toISOString(),
          decision: body.decision,
        },
        `Administrative request ${body.decision.toLowerCase()} successfully`
      )
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("ADM_APPROVAL_PROCESS_FAILED", "Failed to process administrative approval", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
