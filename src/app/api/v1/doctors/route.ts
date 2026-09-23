import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const q = searchParams.get("q");

    const doctors = await prisma.doctor.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
        ...(q
          ? {
              OR: [
                { user: { name: { contains: q, mode: "insensitive" } } },
                { specialization: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    const formatted = doctors.map((d) => ({
      id: d.id,
      name: d.user.name,
      email: d.user.email,
      phone: d.user.phone,
      departmentId: d.departmentId,
      departmentName: d.department.name,
      specialization: d.specialization,
      qualifications: d.qualifications,
      consultationFee: Number(d.consultationFee),
      roomNumber: d.roomNumber,
      photoUrl: d.photoUrl,
      bio: d.bio,
      isActive: d.isActive,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    console.error("[DOCTORS_GET_ERROR]", error);
    return apiError("DOCTORS_FETCH_FAILED", error.message || "Failed to fetch doctors", 500);
  }
}
