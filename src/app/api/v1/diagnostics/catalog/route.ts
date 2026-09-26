import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { validateDiagnosticCatalogInput } from "@/server/domain/charge-catalog";
import { DiagnosticCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { isActive: true };
    if (category && Object.values(DiagnosticCategory).includes(category.toUpperCase() as DiagnosticCategory)) {
      where.category = category.toUpperCase() as DiagnosticCategory;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const catalog = await prisma.diagnosticCatalog.findMany({
      where,
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
      createdAt: c.createdAt.toISOString(),
    }));

    return apiSuccess(formatted, `Retrieved ${formatted.length} diagnostic catalog tests`);
  } catch (error: any) {
    return apiError("DIA_CATALOG_FETCH_FAILED", error.message || "Failed to retrieve catalog", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = validateDiagnosticCatalogInput({
      code: body.code,
      name: body.name,
      category: body.category,
      price: body.price !== undefined ? Number(body.price) : undefined,
      sampleType: body.sampleType,
      referenceRange: body.referenceRange,
      turnaroundTimeHours:
        body.turnaroundTimeHours !== undefined
          ? Number(body.turnaroundTimeHours)
          : undefined,
    });

    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "VALIDATION_FAILED",
        validation.errorMessage || "Invalid diagnostic catalog input",
        400
      );
    }

    const existing = await prisma.diagnosticCatalog.findUnique({
      where: { code: body.code.toUpperCase() },
    });

    if (existing) {
      return apiError(
        "DIA_CODE_DUPLICATE",
        `A diagnostic test with code '${body.code.toUpperCase()}' already exists`,
        409
      );
    }

    const created = await prisma.diagnosticCatalog.create({
      data: {
        code: body.code.toUpperCase(),
        name: body.name,
        category: body.category.toUpperCase() as DiagnosticCategory,
        sampleType: body.sampleType || null,
        referenceRange: body.referenceRange || null,
        price: body.price,
        isActive: body.isActive ?? true,
      },
    });

    return apiSuccess(
      {
        id: created.id,
        code: created.code,
        name: created.name,
        category: created.category,
        sampleType: created.sampleType,
        referenceRange: created.referenceRange,
        price: Number(created.price),
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
      },
      "Diagnostic catalog test item created successfully",
      201
    );
  } catch (error: any) {
    return apiError(
      "DIA_CATALOG_CREATE_FAILED",
      error.message || "Failed to create diagnostic catalog item",
      500
    );
  }
}
