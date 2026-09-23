import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { authorizeBillingStaff } from "../route-auth";
import { validateChargeableService } from "@/server/domain/charge-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const dbTariffs = await prisma.tariff.findMany({
      where: {
        isActive: true,
        ...(category ? { serviceType: category.toUpperCase() } : {}),
      },
      orderBy: { serviceName: "asc" },
    });

    return apiSuccess(
      dbTariffs.map((t) => ({
        id: t.id,
        name: t.serviceName,
        category: t.serviceType,
        price: Number(t.amount),
        isActive: t.isActive,
      }))
    );
  } catch (error) {
    return apiError("BIL_SERVICE_FETCH_FAILED", "Failed to retrieve service catalog", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = authorizeBillingStaff(req);
    if (authResult.error) return authResult.error;

    const body = await req.json();
    const validation = validateChargeableService(body);
    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "BIL_INVALID_SERVICE",
        validation.errorMessage || "Invalid service catalog input",
        400
      );
    }

    const created = await prisma.tariff.create({
      data: {
        serviceName: body.name.trim(),
        serviceType: body.category.toUpperCase(),
        amount: Number(body.price),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });
    return apiSuccess(
      {
        id: created.id,
        name: created.serviceName,
        category: created.serviceType,
        price: Number(created.amount),
        isActive: created.isActive,
      },
      undefined,
      201
    );
  } catch (error: any) {
    return apiError("BIL_SERVICE_CREATE_FAILED", error?.message || "Failed to create service", 500);
  }
}
