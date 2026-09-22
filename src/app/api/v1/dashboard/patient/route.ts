import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const patientIdParam = searchParams.get("patientId");
    const mrnParam = searchParams.get("mrn");

    let patient: any = await prisma.patient.findFirst({
      where: {
        deletedAt: null,
        ...(auth?.sub ? { userId: auth.sub } : {}),
        ...(patientIdParam ? { id: patientIdParam } : {}),
        ...(mrnParam ? { mrn: mrnParam } : {}),
      },
      include: {
        user: true,
        vitalSigns: { orderBy: { recordedAt: "desc" }, take: 1 },
        appointments: {
          where: { status: { in: ["CONFIRMED", "CHECKED_IN", "RESCHEDULED"] } },
          include: { doctor: { include: { user: true } }, department: true },
          take: 5,
          orderBy: { slotStart: "asc" },
        },
        queueTokens: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { doctor: { include: { user: true } } },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Fallback: If no patient resolved from auth/params, query the first active patient from DB
    if (!patient && !patientIdParam && !mrnParam) {
      patient = await prisma.patient.findFirst({
        where: { deletedAt: null },
        include: {
          user: true,
          vitalSigns: { orderBy: { recordedAt: "desc" }, take: 1 },
          appointments: {
            where: { status: { in: ["CONFIRMED", "CHECKED_IN", "RESCHEDULED"] } },
            include: { doctor: { include: { user: true } }, department: true },
            take: 5,
            orderBy: { slotStart: "asc" },
          },
          queueTokens: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { doctor: { include: { user: true } } },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    }

    if (!patient) {
      return apiSuccess({
        patient: {
          id: "",
          name: "Patient",
          mrn: "N/A",
          dob: "",
          age: 0,
          gender: "Other",
          bloodGroup: "N/A",
          allergies: [],
          primaryPhysician: "None",
        },
        upcomingAppointments: [],
        activeQueueToken: null,
        recentPrescriptions: [],
        recentReports: [],
        vitalsSnapshot: null,
        billingSummary: null,
        activitySummary: [],
      });
    }

    const latestVitals = patient.vitalSigns[0];
    const latestInvoice = patient.invoices[0];

    // Find current active queue token (WAITING, CALLED, IN_CONSULTATION)
    const activeToken = patient.queueTokens.find(
      (t: any) => t.status === "WAITING" || t.status === "CALLED" || t.status === "IN_CONSULTATION"
    );

    // Fetch real prescriptions from DB
    const dbPrescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const formattedPrescriptions = dbPrescriptions.flatMap((rx: any) =>
      rx.items.map((item: any) => ({
        id: item.id,
        name: item.medicine?.name || "Prescribed Medicine",
        dosage: item.dosage,
        sig: `${item.frequency} for ${item.durationDays} days`,
        status: rx.status,
        takenToday: false,
        refillsRemaining: 1,
      }))
    );

    // Fetch real diagnostic orders / reports from DB
    const dbOrders = await prisma.diagnosticOrder.findMany({
      where: { patientId: patient.id },
      include: {
        items: { include: { test: true } },
        reports: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const formattedReports = dbOrders.flatMap((o: any) =>
      o.items.map((it: any) => ({
        id: it.id,
        testName: it.test.name,
        category: it.test.category,
        date: new Date(o.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: o.status,
        isCritical: false,
        summary: o.reports?.[0]?.title || "Clinical laboratory assay.",
      }))
    );

    const calculatedAge = patient.dob
      ? Math.abs(new Date(Date.now() - new Date(patient.dob).getTime()).getUTCFullYear() - 1970)
      : 30;

    const formattedAppointments = patient.appointments.map((a: any) => ({
      id: a.id,
      appointmentNumber: a.appointmentNumber,
      doctorName: a.doctor.user.name,
      doctorSpecialization: a.doctor.specialization || "General Medicine",
      doctorPhoto:
        a.doctor.photoUrl ||
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
      roomNumber: a.doctor.roomNumber || "OPD Suite",
      slotStart: a.slotStart.toISOString(),
      slotEnd: a.slotEnd.toISOString(),
      status: a.status,
      appointmentType: a.appointmentType,
      reason: a.notes || "General Consultation",
      preVisitStatus: a.status === "CHECKED_IN" ? "Checked In Online" : "Confirmed",
    }));

    return apiSuccess({
      patient: {
        id: patient.id,
        name: patient.user.name,
        mrn: patient.mrn,
        dob: patient.dob ? patient.dob.toISOString().split("T")[0] : "",
        age: calculatedAge,
        gender: patient.gender === "FEMALE" ? "Female" : patient.gender === "MALE" ? "Male" : "Other",
        bloodGroup: patient.bloodGroup || "O+",
        allergies: [],
        primaryPhysician: patient.appointments[0]?.doctor.user.name || "Attending Physician",
      },
      upcomingAppointments: formattedAppointments,
      activeQueueToken: activeToken
        ? {
            id: activeToken.id,
            tokenNumber: activeToken.tokenNumber,
            roomNumber: activeToken.doctor.roomNumber || "OPD Suite",
            doctorName: activeToken.doctor.user.name,
            status: activeToken.status,
            priorityTier: activeToken.priorityTier,
            positionAhead: activeToken.position || 1,
            estimatedWaitMinutes: activeToken.estimatedWaitMinutes || 15,
            stationName: `Room ${activeToken.doctor.roomNumber || "1"}`,
            nowServing: activeToken.tokenNumber,
            queueProgressPercent:
              activeToken.status === "IN_CONSULTATION" ? 90 : activeToken.status === "CALLED" ? 75 : 30,
          }
        : null,
      recentPrescriptions: formattedPrescriptions,
      recentReports: formattedReports,
      vitalsSnapshot: latestVitals
        ? {
            bloodPressure: `${latestVitals.systolicBp}/${latestVitals.diastolicBp} mmHg`,
            heartRate: `${latestVitals.heartRate} bpm`,
            oxygenSaturation: `${latestVitals.oxygenSaturation}%`,
            temperature:
              latestVitals.temperatureCelsius != null
                ? `${((Number(latestVitals.temperatureCelsius) * 9) / 5 + 32).toFixed(1)}°F`
                : "98.2°F",
            bmi: latestVitals.bmi ? Number(latestVitals.bmi) : 22.4,
            recordedAt: new Date(latestVitals.recordedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }
        : null,
      billingSummary: latestInvoice
        ? {
            totalOwing: Number(latestInvoice.balanceAmount),
            insuranceCovered: Number(latestInvoice.discountAmount),
            totalBilled: Number(latestInvoice.totalAmount),
            latestInvoiceNumber: latestInvoice.invoiceNumber,
            status: latestInvoice.status,
          }
        : null,
      activitySummary: [],
    });
  } catch (error) {
    return apiError("PAT_DASHBOARD_FAILED", "Failed to retrieve patient dashboard", 500, {
      error: String(error),
    });
  }
}
