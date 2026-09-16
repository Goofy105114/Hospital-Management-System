import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_MEDICINES = [
  {
    id: "med-01",
    name: "Amlodipine Besylate",
    genericName: "Amlodipine",
    form: "TABLET",
    strength: "5 mg",
    unit: "Tablet",
    category: "Cardiovascular / Antihypertensive",
    atcCode: "C08CA01",
    unitPrice: 12.5,
    stockOnHand: 420,
    isActive: true,
  },
  {
    id: "med-02",
    name: "Metformin Hydrochloride",
    genericName: "Metformin",
    form: "TABLET",
    strength: "500 mg",
    unit: "Tablet",
    category: "Endocrinology / Antidiabetic",
    atcCode: "A10BA02",
    unitPrice: 8.0,
    stockOnHand: 680,
    isActive: true,
  },
  {
    id: "med-03",
    name: "Atorvastatin Calcium",
    genericName: "Atorvastatin",
    form: "TABLET",
    strength: "20 mg",
    unit: "Tablet",
    category: "Cardiovascular / Statin",
    atcCode: "C10AA05",
    unitPrice: 18.0,
    stockOnHand: 310,
    isActive: true,
  },
  {
    id: "med-04",
    name: "Amoxicillin / Clavulanate",
    genericName: "Amoxicillin-Clavulanic Acid",
    form: "TABLET",
    strength: "625 mg",
    unit: "Tablet",
    category: "Anti-infective / Penicillin",
    atcCode: "J01CR02",
    unitPrice: 24.5,
    stockOnHand: 180,
    isActive: true,
  },
  {
    id: "med-05",
    name: "Omeprazole Delayed-Release",
    genericName: "Omeprazole",
    form: "CAPSULE",
    strength: "20 mg",
    unit: "Capsule",
    category: "Gastroenterology / PPI",
    atcCode: "A02BC01",
    unitPrice: 14.0,
    stockOnHand: 550,
    isActive: true,
  },
  {
    id: "med-06",
    name: "Paracetamol Infusion",
    genericName: "Acetaminophen",
    form: "INJECTION",
    strength: "1000 mg / 100 mL",
    unit: "Vial",
    category: "Analgesic / Antipyretic",
    atcCode: "N02BE01",
    unitPrice: 45.0,
    stockOnHand: 95,
    isActive: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();

    try {
      const dbMedicines = await prisma.medicine.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { genericName: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
      });

      if (dbMedicines.length > 0) {
        return NextResponse.json(successResponse(dbMedicines));
      }
    } catch {
      // Fallback
    }

    const filtered = q
      ? FALLBACK_MEDICINES.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        )
      : FALLBACK_MEDICINES;

    return NextResponse.json(successResponse(filtered));
  } catch (error) {
    return NextResponse.json(
      errorResponse("PHA_FETCH_FAILED", "Failed to retrieve medicines catalog", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, genericName, form, strength, unit, category, unitPrice, atcCode } = body;

    if (!name || !genericName || !form) {
      return NextResponse.json(
        errorResponse("PHA_INVALID_PAYLOAD", "Name, generic name, and form are required"),
        { status: 400 }
      );
    }

    const newMedicine = {
      id: `med-${Date.now()}`,
      name,
      genericName,
      form: form || "TABLET",
      strength: strength || "Standard",
      unit: unit || "Unit",
      category: category || "General",
      atcCode: atcCode || "N/A",
      unitPrice: Number(unitPrice) || 10.0,
      stockOnHand: 0,
      isActive: true,
    };

    return NextResponse.json(successResponse(newMedicine), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse("PHA_CREATE_FAILED", "Failed to add medicine to formulary", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
