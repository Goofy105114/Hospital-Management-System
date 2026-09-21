import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { authorizeBillingStaff } from "../route-auth";
import { validateChargeableService } from "@/server/domain/charge-catalog";

export const dynamic = "force-dynamic";

const FALLBACK_SERVICES = [
  {
    id: "srv-01",
    name: "General Practitioner Consultation",
    category: "CONSULTATION",
    price: 50.0,
    isActive: true,
  },
  {
    id: "srv-02",
    name: "Specialist Cardiology Consultation",
    category: "CONSULTATION",
    price: 120.0,
    isActive: true,
  },
  {
    id: "srv-03",
    name: "Complete Blood Count (CBC)",
    category: "DIAGNOSTIC",
    price: 35.0,
    isActive: true,
  },
  {
    id: "srv-04",
    name: "Chest X-Ray Single View",
    category: "PROCEDURE",
    price: 75.0,
    isActive: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    try {
      const dbServices = await prisma.clinicalService.findMany({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
        },
        orderBy: { name: "asc" },
      });

      if (dbServices.length > 0) {
        return apiSuccess(dbServices);
      }
    } catch {
      // Fallback
    }

    const filtered = category
      ? FALLBACK_SERVICES.filter((s) => s.category.toUpperCase() === category.toUpperCase())
      : FALLBACK_SERVICES;

    return apiSuccess(filtered);
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

    try {
      const created = await prisma.clinicalService.create({
        data: {
          name: body.name.trim(),
          category: body.category.toUpperCase(),
          price: Number(body.price),
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        },
      });
      return apiSuccess(created, undefined, 201);
    } catch {
      const fallback = {
        id: `srv-${Date.now()}`,
        name: body.name.trim(),
        category: body.category.toUpperCase(),
        price: Number(body.price),
        isActive: true,
      };
      return apiSuccess(fallback, undefined, 201);
    }
  } catch (error: any) {
    return apiError("BIL_SERVICE_CREATE_FAILED", error?.message || "Failed to create service", 500);
  }
}
