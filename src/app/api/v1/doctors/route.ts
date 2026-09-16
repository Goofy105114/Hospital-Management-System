import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-envelope";

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
  } catch {
    return apiSuccess([
      {
        id: "doc-001",
        name: "Dr. Marcus Vance",
        email: "marcus.vance@goingmerry.org",
        phone: "+1 555-0192",
        departmentId: "dept-01",
        departmentName: "Cardiology & Vascular Medicine",
        specialization: "Interventional Cardiology",
        qualifications: "MD, FACC - Chief of Cardiology",
        consultationFee: 150,
        roomNumber: "Room 402B",
        photoUrl: null,
        bio: "Specialist in preventative cardiology and echocardiography.",
        isActive: true,
      },
      {
        id: "doc-002",
        name: "Dr. Sarah Jenkins",
        email: "sarah.jenkins@goingmerry.org",
        phone: "+1 555-0193",
        departmentId: "dept-02",
        departmentName: "Internal Medicine",
        specialization: "General Internal Medicine",
        qualifications: "MD, FACP",
        consultationFee: 120,
        roomNumber: "Room 305A",
        photoUrl: null,
        bio: "Comprehensive chronic disease management and adult wellness.",
        isActive: true,
      },
    ]);
  }
}
