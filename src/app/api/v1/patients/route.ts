import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const patients = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { mrn: { contains: query, mode: "insensitive" } },
                { user: { name: { contains: query, mode: "insensitive" } } },
                { user: { email: { contains: query, mode: "insensitive" } } },
                { user: { phone: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        user: true,
        alerts: { where: { isActive: true } },
        appointments: {
          take: 1,
          orderBy: { slotStart: "desc" },
          include: { doctor: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = patients.map((p) => {
      const birthDate = new Date(p.dob);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

      const latestAppt = p.appointments[0];
      const lastVisitStr = latestAppt
        ? `${new Date(latestAppt.slotStart).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} (${latestAppt.doctor.user.name})`
        : "No Visits Recorded";

      return {
        id: p.id,
        mrn: p.mrn,
        name: p.user.name,
        dob: p.dob.toISOString().split("T")[0],
        age: calculatedAge || 35,
        gender: p.gender === "FEMALE" ? "Female" : p.gender === "MALE" ? "Male" : "Other",
        bloodGroup: p.bloodGroup || "O+",
        phone: p.user.phone || "+1 (555) 000-0000",
        email: p.user.email || "patient@example.com",
        alertsCount: p.alerts.length,
        lastVisit: lastVisitStr,
        status: p.user.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      };
    });

    return apiSuccess(formatted);
  } catch (error) {
    console.error("[PATIENTS_GET_ERROR]", error);
    return apiError("PATIENTS_FETCH_FAILED", "Failed to retrieve patients from database", 500);
  }
}
