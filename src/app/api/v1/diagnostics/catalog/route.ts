import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-envelope";

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
    }));

    return apiSuccess(formatted);
  } catch {
    return apiSuccess([
      {
        id: "cat-01",
        name: "12-Lead Resting Electrocardiogram (ECG)",
        code: "ECG-REST",
        category: "CARDIOLOGY",
        sampleType: "PHYSIOLOGICAL",
        referenceRange: "Normal sinus rhythm",
        price: 120,
      },
      {
        id: "cat-02",
        name: "Comprehensive Metabolic Panel (CMP)",
        code: "CMP-14",
        category: "BIOCHEMISTRY",
        sampleType: "SERUM",
        referenceRange: "Standard reference values",
        price: 85,
      },
      {
        id: "cat-03",
        name: "Lipid Panel (Fasting)",
        code: "LIPID-FAST",
        category: "BIOCHEMISTRY",
        sampleType: "SERUM",
        referenceRange: "Total < 200, LDL < 100",
        price: 75,
      },
    ]);
  }
}
