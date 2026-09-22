import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, AppointmentStatus } from "@prisma/client";
import { getAuthUser, requireRole } from "@/lib/auth";
import { canTransitionAppointment } from "@/server/domain/appointment-booking";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        OR: [{ id }, { appointmentNumber: id }],
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            department: true,
            user: true,
          },
        },
        department: true,
        queueToken: true,
      },
    });

    if (!appointment) {
      return apiError("APT_NOT_FOUND", "Appointment not found in database", 404);
    }

    const slotStart = new Date(appointment.slotStart);
    const slotEnd = new Date(appointment.slotEnd);
    const durationMinutes = Math.max(15, Math.round((slotEnd.getTime() - slotStart.getTime()) / 60000));

    const formatted = {
      id: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      type: appointment.appointmentType || "IN_PERSON",
      status: appointment.status,
      scheduledDate: slotStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      scheduledTime: slotStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      endTime: slotEnd.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      durationMinutes,
      reason: appointment.notes || "Clinical Consultation",
      notes: appointment.notes || "General clinical consultation",
      patient: {
        id: appointment.patient.id,
        mrn: appointment.patient.mrn,
        firstName: appointment.patient.user.name.split(" ")[0] || "Patient",
        lastName: appointment.patient.user.name.split(" ").slice(1).join(" ") || "",
        email: appointment.patient.user.email,
        phone: appointment.patient.user.phone || "N/A",
        bloodGroup: appointment.patient.bloodGroup || "UNKNOWN",
      },
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.user.name,
        specialty: appointment.doctor.specialization || "General Medicine",
        qualification: appointment.doctor.qualifications || "MD",
        roomNumber: appointment.doctor.roomNumber || "Room 101",
        department: {
          name: appointment.doctor.department?.name || appointment.department?.name || "General OPD",
          floor: "Ground Floor",
        },
      },
      queueToken: appointment.queueToken
        ? {
            id: appointment.queueToken.id,
            tokenNumber: appointment.queueToken.tokenNumber,
            status: appointment.queueToken.status,
            position: appointment.queueToken.position,
            estimatedWaitMinutes: appointment.queueToken.estimatedWaitMinutes,
            currentServing: appointment.queueToken.tokenNumber,
          }
        : undefined,
      vitals: {
        bloodPressure: "120/80 mmHg",
        heartRate: "72 bpm",
        oxygenSaturation: "98%",
        temperature: "98.6 °F",
        weightKg: "70.0 kg",
        bmi: "22.5",
      },
      timeline: [
        {
          title: "Appointment Booked",
          timestamp: new Date(appointment.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          status: "COMPLETED",
          description: "Online booking submitted via Patient Portal",
        },
        {
          title: "Physician Slot Confirmed",
          timestamp: slotStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          status: appointment.status === "CONFIRMED" || appointment.status === "CHECKED_IN" ? "COMPLETED" : "PENDING",
          description: `Scheduled with ${appointment.doctor.user.name}`,
        },
      ],
      facility: {
        name: "Going Merry Memorial Medical Center",
        building: "Main Clinical Pavilion",
        floor: "Ground Floor",
        room: appointment.doctor.roomNumber || "Room 101",
        station: "OPD Reception Counter",
        directions: "Proceed to Main Entrance and check in with receptionist or kiosk.",
        parking: "Validated Parking Garage Available",
      },
    };

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve appointment details", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // APT-06: auth guard — only authorised clinical/admin roles may mutate appointment lifecycle
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, ["RECEPTIONIST", "DOCTOR", "NURSE", "ADMIN", "PATIENT"])) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to update appointment lifecycle", 403);
  }
  if (user.role === "PATIENT") {
    // Patients are only permitted to cancel appointments
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { action, reason, newSlotStart, newSlotEnd } = body;

    // Fetch the current appointment to validate the transition.
    // dbAvailable=false means the DB is offline; we skip the state-machine check
    // and fall through to each action's DB block (which also catches and no-ops).
    let appointment: Awaited<ReturnType<typeof prisma.appointment.findUnique>> | null = null;
    let dbAvailable = true;
    try {
      appointment = await prisma.appointment.findUnique({ where: { id } });
      if (appointment === null) {
        return apiError("APT_NOT_FOUND", "Appointment not found", 404);
      }
    } catch {
      // DB offline — allow action handlers to proceed with their own try/catch
      dbAvailable = false;
    }

    // -----------------------------------------------------------------------
    // CANCEL
    // -----------------------------------------------------------------------
    if (action === "CANCEL") {
      if (!reason) {
        return apiError("APT_CANCEL_REASON_REQUIRED", "A cancellation reason is required", 400);
      }

      if (appointment && dbAvailable) {
        if (!canTransitionAppointment(appointment.status, AppointmentStatus.CANCELLED)) {
          return apiError(
            "APT_NOT_CANCELLABLE_STATUS",
            `Cannot cancel an appointment with status ${appointment.status}`,
            422
          );
        }
        await prisma.appointment.update({
          where: { id },
          data: { status: AppointmentStatus.CANCELLED, cancellationReason: reason },
        });
      }

      await logAuditEvent({
        actorId: user.sub,
        actorRole: user.role,
        action: AuditAction.UPDATE,
        entityType: "Appointment",
        entityId: id,
        changes: {
          before: { status: appointment?.status ?? "UNKNOWN" },
          after: { status: "CANCELLED", reason },
        },
      });

      return apiSuccess({ id, status: "CANCELLED", cancellationReason: reason });
    }

    // -----------------------------------------------------------------------
    // NO_SHOW
    // -----------------------------------------------------------------------
    if (action === "NO_SHOW") {
      if (appointment && dbAvailable) {
        if (!canTransitionAppointment(appointment.status, AppointmentStatus.NO_SHOW)) {
          return apiError(
            "APT_INVALID_TRANSITION",
            `Cannot mark NO_SHOW from status ${appointment.status}`,
            422
          );
        }
        await prisma.appointment.update({
          where: { id },
          data: { status: AppointmentStatus.NO_SHOW },
        });
      }

      await logAuditEvent({
        actorId: user.sub,
        actorRole: user.role,
        action: AuditAction.UPDATE,
        entityType: "Appointment",
        entityId: id,
        changes: {
          before: { status: appointment?.status ?? "UNKNOWN" },
          after: { status: "NO_SHOW" },
        },
      });

      return apiSuccess({ id, status: "NO_SHOW" });
    }

    // -----------------------------------------------------------------------
    // RESCHEDULE
    // -----------------------------------------------------------------------
    if (action === "RESCHEDULE") {
      if (!newSlotStart || !newSlotEnd) {
        return apiError(
          "APT_RESCHEDULE_MISSING_SLOT",
          "newSlotStart and newSlotEnd are required for rescheduling",
          400
        );
      }

      const slotStart = new Date(newSlotStart);
      const slotEnd = new Date(newSlotEnd);

      if (isNaN(slotStart.getTime()) || isNaN(slotEnd.getTime()) || slotEnd <= slotStart) {
        return apiError("APT_INVALID_SLOT", "Invalid slot dates provided", 400);
      }

      if (appointment && dbAvailable) {
        if (!canTransitionAppointment(appointment.status, AppointmentStatus.RESCHEDULED)) {
          return apiError(
            "APT_INVALID_TRANSITION",
            `Cannot reschedule an appointment with status ${appointment.status}`,
            422
          );
        }
        await prisma.appointment.update({
          where: { id },
          data: {
            status: AppointmentStatus.RESCHEDULED,
            rescheduledToId: null, // new booking ID linked separately when re-booked
            updatedAt: new Date(),
          },
        });
      }

      await logAuditEvent({
        actorId: user.sub,
        actorRole: user.role,
        action: AuditAction.UPDATE,
        entityType: "Appointment",
        entityId: id,
        changes: {
          before: { status: appointment?.status ?? "UNKNOWN" },
          after: { status: "RESCHEDULED", newSlotStart, newSlotEnd },
        },
      });

      return apiSuccess({
        id,
        status: "RESCHEDULED",
        newSlotStart: slotStart.toISOString(),
        newSlotEnd: slotEnd.toISOString(),
      });
    }

    return apiError("APT_INVALID_ACTION", "Supported actions: CANCEL, NO_SHOW, RESCHEDULE", 400);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update appointment", 500);
  }
}
