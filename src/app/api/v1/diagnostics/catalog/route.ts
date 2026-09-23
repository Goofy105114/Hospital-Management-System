import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { DiagnosticCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await prisma.diagnosticCatalog.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const formatted = catalog.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      category: c.category,
      sampleType: c.sampleType,
      referenceRange: c.referenceRange,
      price: Number(c.price),
      isActive: c.isActive,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("CATALOG_FETCH_FAILED", error.message || "Failed to retrieve catalog", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, category, sampleType, referenceRange, price } = body;

    if (!name || !code) {
      return apiError("INVALID_INPUT", "Test name and code are required", 400);
    }

    const catKey = (category || "LABORATORY").toUpperCase();
    const validCategory = Object.values(DiagnosticCategory).includes(catKey as DiagnosticCategory)
      ? (catKey as DiagnosticCategory)
      : DiagnosticCategory.LABORATORY;

    const created = await prisma.diagnosticCatalog.create({
      data: {
        name,
        code,
        category: validCategory,
        sampleType: sampleType || "Serum",
        referenceRange: referenceRange || "Normal adult reference range",
        price: Number(price) || 50.0,
        isActive: true,
      },
    });

    return apiSuccess(created, undefined, 201);
  } catch (error: any) {
    return apiError("CATALOG_CREATE_FAILED", error.message || "Failed to create catalog test", 500);
  }
}
