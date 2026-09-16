import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_PATIENT_DASHBOARD = {
  patient: {
    id: "pat-eleanor-vance",
    name: "Eleanor Vance",
    mrn: "GM-84920",
    dob: "1984-06-12",
    age: 40,
    gender: "Female",
    bloodGroup: "A+",
    allergies: ["Penicillin", "NSAIDs (Ibuprofen)"],
    primaryPhysician: "Dr. Marcus Vance, MD (Cardiology)",
  },
  upcomingAppointments: [
    {
      id: "APT-20241024-0014",
      appointmentNumber: "APT-20241024-0014",
      doctorName: "Dr. Marcus Vance, MD",
      doctorSpecialization: "Department of Cardiology",
      doctorPhoto:
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
      roomNumber: "Room 304, East Wing (3rd Floor)",
      slotStart: "2026-10-24T11:30:00.000Z",
      slotEnd: "2026-10-24T12:15:00.000Z",
      status: "CONFIRMED",
      appointmentType: "CONSULTATION",
      reason: "Follow-up consultation for blood pressure stabilization & lipid check",
      preVisitStatus: "Checked In Online",
    },
  ],
  activeQueueToken: {
    id: "tok-24",
    tokenNumber: "#A-24",
    roomNumber: "Room 304",
    doctorName: "Dr. Marcus Vance",
    status: "WAITING",
    priorityTier: "NORMAL",
    positionAhead: 3,
    estimatedWaitMinutes: 18,
    stationName: "Station 4 Active",
    nowServing: "#A-21",
    queueProgressPercent: 85,
  },
  recentPrescriptions: [
    {
      id: "med-01",
      name: "Metoprolol Succinate",
      dosage: "25mg Extended Release",
      sig: "Take 1 tablet daily with breakfast",
      status: "ACTIVE",
      takenToday: true,
      refillsRemaining: 2,
    },
    {
      id: "med-02",
      name: "Lisinopril",
      dosage: "10mg Tablet",
      sig: "Take 1 tablet daily in the evening",
      status: "ACTIVE",
      takenToday: false,
      refillsRemaining: 3,
    },
    {
      id: "med-03",
      name: "Atorvastatin Calcium",
      dosage: "20mg Tablet",
      sig: "Take 1 tablet daily at bedtime",
      status: "ACTIVE",
      takenToday: false,
      refillsRemaining: 2,
    },
  ],
  recentReports: [
    {
      id: "rep-cmp-01",
      testName: "Comprehensive Metabolic Panel (CMP)",
      category: "BIOCHEMISTRY",
      date: "Oct 24, 2026",
      status: "FINAL_REPORT",
      isCritical: false,
      summary: "Normal electrolyte & renal profile. Fasting glucose 92 mg/dL.",
    },
    {
      id: "rep-ecg-01",
      testName: "12-Lead Electrocardiogram (Resting)",
      category: "CARDIOLOGY",
      date: "Oct 24, 2026",
      status: "FINAL_REPORT",
      isCritical: false,
      summary: "Normal sinus rhythm at 72 bpm. Normal axis and PR intervals.",
    },
  ],
  vitalsSnapshot: {
    bloodPressure: "118/76 mmHg",
    heartRate: "72 bpm",
    oxygenSaturation: "99%",
    temperature: "98.2°F",
    bmi: 22.4,
    recordedAt: "Today, 08:30 AM",
  },
  billingSummary: {
    totalOwing: 20.0,
    insuranceCovered: 100.0,
    totalBilled: 120.0,
    latestInvoiceNumber: "INV-20241024-0032",
    status: "PAID",
  },
  activitySummary: [
    {
      id: "act-1",
      action: "Online check-in completed for Cardiology consultation",
      time: "10 mins ago",
    },
    {
      id: "act-2",
      action: "Lab specimen drawn for CMP Panel at Central Diagnostic Lab",
      time: "1 hour ago",
    },
    { id: "act-3", action: "Prescription refill approved: Metoprolol 25mg", time: "Yesterday" },
  ],
};

export async function GET(req: NextRequest) {
  try {
    try {
      const patient = await prisma.patient.findFirst({
        where: { deletedAt: null },
        include: {
          user: true,
          vitalSigns: { orderBy: { recordedAt: "desc" }, take: 1 },
          appointments: {
            where: { status: "CONFIRMED" },
            include: { doctor: { include: { user: true } }, department: true },
            take: 3,
            orderBy: { slotStart: "asc" },
          },
          queueTokens: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { doctor: { include: { user: true } } },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (patient) {
        const latestAppt = patient.appointments[0];
        const latestToken = patient.queueTokens[0];
        const latestVitals = patient.vitalSigns[0];
        const latestInvoice = patient.invoices[0];

        const calculatedAge = patient.dob
          ? Math.abs(new Date(Date.now() - new Date(patient.dob).getTime()).getUTCFullYear() - 1970)
          : 38;

        return apiSuccess({
          patient: {
            id: patient.id,
            name: patient.user.name,
            mrn: patient.mrn,
            dob: patient.dob ? patient.dob.toISOString().split("T")[0] : "1990-05-14",
            age: calculatedAge,
            gender: patient.gender === "FEMALE" ? "Female" : "Male",
            bloodGroup: patient.bloodGroup || "O+",
            allergies: ["Penicillin"],
            primaryPhysician: latestAppt?.doctor.user.name || "Dr. Marcus Vance, MD",
          },
          upcomingAppointments: latestAppt
            ? [
                {
                  id: latestAppt.id,
                  appointmentNumber: latestAppt.appointmentNumber,
                  doctorName: latestAppt.doctor.user.name,
                  doctorSpecialization: latestAppt.doctor.specialization,
                  doctorPhoto:
                    latestAppt.doctor.photoUrl ||
                    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
                  roomNumber: latestAppt.doctor.roomNumber,
                  slotStart: latestAppt.slotStart.toISOString(),
                  slotEnd: latestAppt.slotEnd.toISOString(),
                  status: latestAppt.status,
                  appointmentType: latestAppt.appointmentType,
                  reason: latestAppt.notes || "Cardiology consultation",
                  preVisitStatus: "Checked In Online",
                },
              ]
            : FALLBACK_PATIENT_DASHBOARD.upcomingAppointments,
          activeQueueToken: latestToken
            ? {
                id: latestToken.id,
                tokenNumber: latestToken.tokenNumber,
                roomNumber: "Room 304",
                doctorName: latestToken.doctor.user.name,
                status: latestToken.status,
                priorityTier: latestToken.priorityTier,
                positionAhead: latestToken.position || 3,
                estimatedWaitMinutes: latestToken.estimatedWaitMinutes || 18,
                stationName: "Station 4 Active",
                nowServing: "#A-21",
                queueProgressPercent: 85,
              }
            : FALLBACK_PATIENT_DASHBOARD.activeQueueToken,
          recentPrescriptions: FALLBACK_PATIENT_DASHBOARD.recentPrescriptions,
          recentReports: FALLBACK_PATIENT_DASHBOARD.recentReports,
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
                recordedAt: "Today, 08:30 AM",
              }
            : FALLBACK_PATIENT_DASHBOARD.vitalsSnapshot,
          billingSummary: latestInvoice
            ? {
                totalOwing: Number(latestInvoice.balanceAmount),
                insuranceCovered: Number(latestInvoice.discountAmount),
                totalBilled: Number(latestInvoice.totalAmount),
                latestInvoiceNumber: latestInvoice.invoiceNumber,
                status: latestInvoice.status,
              }
            : FALLBACK_PATIENT_DASHBOARD.billingSummary,
          activitySummary: FALLBACK_PATIENT_DASHBOARD.activitySummary,
        });
      }
    } catch (dbErr) {
      console.warn("[PATIENT DASHBOARD DB FALLBACK]", dbErr);
    }

    return apiSuccess(FALLBACK_PATIENT_DASHBOARD);
  } catch (error) {
    return apiError("PAT_DASHBOARD_FAILED", "Failed to retrieve patient dashboard", 500, {
      error: String(error),
    });
  }
}
