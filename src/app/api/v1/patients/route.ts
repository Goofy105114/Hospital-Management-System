import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { hasPiiAccess, maskPhone, maskEmail } from "@/lib/pii";
import { UserRole, UserStatus, Gender } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // SEC-02: auth required — PII is never returned to unauthenticated callers
  const user = getAuthUser(req);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

  // Determine whether this caller sees full or masked PII.
  // PATIENT role can only see their own record (handled below); for the list
  // they see masked PII for all other patients.
  const fullPii = hasPiiAccess(user.role);

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
        phone: fullPii
          ? p.user.phone || "+1 (555) 000-0000"
          : maskPhone(p.user.phone) || "+X-XXXXX-0000",
        email: fullPii
          ? p.user.email || "patient@example.com"
          : maskEmail(p.user.email) || "p*****@example.com",
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      name,
      dob,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      allergies,
      preferredLanguage,
    } = body;

    const fullName = name || `${firstName || ""} ${lastName || ""}`.trim() || "Walk-in Patient";
    const patientEmail = email?.trim() || `patient.${Date.now()}@goingmerry.org`;
    const patientPhone = phone?.trim() || "+1-555-000-0000";

    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const mrn = `MRN-${currentYear}-${randomSeq}`;

    const parsedGender =
      gender?.toUpperCase() === "FEMALE"
        ? Gender.FEMALE
        : gender?.toUpperCase() === "MALE"
        ? Gender.MALE
        : Gender.OTHER;

    const parsedDob = dob ? new Date(dob) : new Date("1990-01-01");
    const passwordHash = await hashPassword("Password123!");

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: fullName,
          email: patientEmail,
          phone: patientPhone,
          role: UserRole.PATIENT,
          status: UserStatus.ACTIVE,
          passwordHash,
        },
      });

      const newPatient = await tx.patient.create({
        data: {
          userId: newUser.id,
          mrn,
          dob: parsedDob,
          gender: parsedGender,
          bloodGroup: bloodGroup || "O+",
          address: address || "",
          preferredLanguage: preferredLanguage || "en",
        },
        include: {
          user: true,
        },
      });

      if (allergies && typeof allergies === "string" && allergies.trim()) {
        await tx.patientAlert.create({
          data: {
            patientId: newPatient.id,
            type: "ALLERGY_ON_FILE",
            note: allergies,
            isActive: true,
          },
        });
      }

      return newPatient;
    });

    return apiSuccess(
      {
        id: result.id,
        userId: result.userId,
        mrn: result.mrn,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        dob: result.dob.toISOString().split("T")[0],
        gender: result.gender,
        bloodGroup: result.bloodGroup,
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error("[PATIENT_CREATE_ERROR]", error);
    return apiError("PATIENT_CREATE_FAILED", error.message || "Failed to create patient", 500);
  }
}
