import { prisma } from "@/lib/prisma";
import { acquireLock, releaseLock } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit";
import { AppointmentStatus, AppointmentType, AuditAction } from "@prisma/client";

export class AppointmentService {
  /**
   * Compute discrete available slots for a doctor on a given date (APT-02)
   */
  static async getAvailability(doctorId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();

    // 1. Get doctor's session configuration for this day of week
    const session = await prisma.clinicSession.findFirst({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (!session) {
      return [];
    }

    // 2. Check doctor leaves
    const leave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
        status: "APPROVED",
      },
    });

    if (leave) {
      return [];
    }

    // 3. Generate slots between session.startTime ("09:00") and session.endTime ("17:00")
    const [startH, startM] = session.startTime.split(":").map(Number);
    const [endH, endM] = session.endTime.split(":").map(Number);

    const slotDuration = session.slotDurationMinutes || 15;
    const sessionStart = new Date(targetDate);
    sessionStart.setHours(startH, startM, 0, 0);

    const sessionEnd = new Date(targetDate);
    sessionEnd.setHours(endH, endM, 0, 0);

    // 4. Query existing confirmed or checked-in bookings for this doctor on this day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.appointment.findMany({
      where: {
        doctorId,
        slotStart: { gte: dayStart, lte: dayEnd },
        status: {
          in: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
      select: { slotStart: true, slotEnd: true },
    });

    const slots: Array<{ start: string; end: string; available: boolean }> = [];
    let current = new Date(sessionStart);

    while (current.getTime() + slotDuration * 60 * 1000 <= sessionEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000);

      // Check collision
      const isBooked = existingBookings.some((b) => {
        return (
          (slotStart >= b.slotStart && slotStart < b.slotEnd) ||
          (slotEnd > b.slotStart && slotEnd <= b.slotEnd)
        );
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBooked,
      });

      current = new Date(current.getTime() + slotDuration * 60 * 1000);
    }

    return slots;
  }

  /**
   * Concurrency-protected appointment booking (APT-03)
   */
  static async bookAppointment(params: {
    patientId: string;
    doctorId: string;
    departmentId?: string;
    slotStart: string;
    slotEnd: string;
    appointmentType?: AppointmentType;
    notes?: string;
    actorId?: string;
    actorRole?: string;
  }) {
    const slotStartDate = new Date(params.slotStart);
    const slotEndDate = new Date(params.slotEnd);

    // Concurrency Lock on (doctorId + slotStart)
    const lockKey = `appt:${params.doctorId}:${slotStartDate.getTime()}`;
    const acquired = await acquireLock(lockKey, 5);

    if (!acquired) {
      return { success: false, code: "APT_SLOT_ALREADY_BOOKED", status: 409 };
    }

    try {
      // 1. Double check DB inside lock
      const existing = await prisma.appointment.findFirst({
        where: {
          doctorId: params.doctorId,
          slotStart: slotStartDate,
          status: {
            in: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.CHECKED_IN,
              AppointmentStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (existing) {
        return { success: false, code: "APT_SLOT_ALREADY_BOOKED", status: 409 };
      }

      // 2. Resolve department if not passed
      let deptId = params.departmentId;
      if (!deptId) {
        const doctor = await prisma.doctor.findUnique({
          where: { id: params.doctorId },
          select: { departmentId: true },
        });
        deptId = doctor?.departmentId || "";
      }

      // 3. Generate human readable appointment number: APT-YYYYMMDD-XXXX
      const datePart = slotStartDate.toISOString().slice(0, 10).replace(/-/g, "");
      const count = await prisma.appointment.count();
      const seq = String(count + 1).padStart(4, "0");
      const appointmentNumber = `APT-${datePart}-${seq}`;

      const appointment = await prisma.appointment.create({
        data: {
          appointmentNumber,
          patientId: params.patientId,
          doctorId: params.doctorId,
          departmentId: deptId,
          appointmentType: params.appointmentType || AppointmentType.NEW,
          slotStart: slotStartDate,
          slotEnd: slotEndDate,
          status: AppointmentStatus.CONFIRMED,
          notes: params.notes,
          createdBy: params.actorId,
        },
        include: {
          doctor: { select: { specialization: true, user: { select: { name: true } } } },
          patient: { select: { mrn: true, user: { select: { name: true } } } },
          department: { select: { name: true } },
        },
      });

      await logAuditEvent({
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: AuditAction.CREATE,
        entityType: "Appointment",
        entityId: appointment.id,
        changes: { after: { appointmentNumber, slotStart: params.slotStart, status: "CONFIRMED" } },
      });

      return {
        success: true,
        data: appointment,
      };
    } finally {
      await releaseLock(lockKey);
    }
  }

  /**
   * Cancel Appointment (APT-04)
   */
  static async cancelAppointment(
    appointmentId: string,
    reason: string,
    actorId?: string,
    actorRole?: string
  ) {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appt) {
      return { success: false, code: "APT_NOT_FOUND", status: 404 };
    }

    if (
      appt.status === AppointmentStatus.COMPLETED ||
      appt.status === AppointmentStatus.CANCELLED
    ) {
      return { success: false, code: "APT_NOT_CANCELLABLE_STATUS", status: 422 };
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason,
      },
    });

    await logAuditEvent({
      actorId,
      actorRole,
      action: AuditAction.UPDATE,
      entityType: "Appointment",
      entityId: appointmentId,
      changes: { before: { status: appt.status }, after: { status: "CANCELLED", reason } },
    });

    return { success: true, data: updated };
  }
}
