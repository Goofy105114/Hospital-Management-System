import { prisma } from "@/lib/prisma";
import { acquireLock, releaseLock } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit";
import { AppointmentStatus, AppointmentType, AuditAction } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { sessionContainsSlot, validateBookingWindow } from "@/server/domain/appointment-booking";
import { QueueService } from "@/server/services/queue.service";

export class AppointmentService {
  /**
   * Compute discrete available slots for a doctor on a given date (APT-02)
   */
  static async getAvailability(doctorId: string, dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    // 1. Get doctor's session configuration for this day of week, or fallback to any active session for the doctor
    let session: any = await prisma.clinicSession.findFirst({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (!session) {
      session = await prisma.clinicSession.findFirst({
        where: { doctorId, isActive: true },
      });
    }

    if (!session) {
      session = {
        id: "default-session",
        doctorId,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        slotDurationMinutes: 15,
        maxCapacity: 32,
        roomNumber: "Consultation Room",
        isActive: true,
      } as any;
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
    const sessionStart = new Date(year, month - 1, day, startH, startM, 0, 0);
    const sessionEnd = new Date(year, month - 1, day, endH, endM, 0, 0);

    // 4. Query existing confirmed or checked-in bookings for this doctor on this day
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

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

      const isPast = slotStart.getTime() <= Date.now();

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBooked && !isPast,
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
    serviceId?: string;
    slotStart: string;
    slotEnd: string;
    appointmentType?: AppointmentType;
    notes?: string;
    actorId?: string;
    actorRole?: string;
  }) {
    const slotStartDate = new Date(params.slotStart);
    const slotEndDate = new Date(params.slotEnd);

    const windowError = validateBookingWindow({ slotStart: slotStartDate, slotEnd: slotEndDate });
    if (windowError) {
      return { success: false, code: windowError, status: 400 };
    }

    // Concurrency Lock on (doctorId + slotStart)
    const lockKey = `appt:${params.doctorId}:${slotStartDate.getTime()}`;
    const acquired = await acquireLock(lockKey, 5);

    if (!acquired) {
      return { success: false, code: "APT_SLOT_ALREADY_BOOKED", status: 409 };
    }

    try {
      try {
        const appointment = await prisma.$transaction(
          async (tx) => {
            const doctor = await tx.doctor.findUnique({
              where: { id: params.doctorId },
              include: {
                clinicSessions: { where: { isActive: true } },
              },
            });
            if (!doctor?.isActive) throw new BookingError("APT_DOCTOR_UNAVAILABLE", 422);

            const patient = await tx.patient.findFirst({
              where: { id: params.patientId, deletedAt: null, user: { status: "ACTIVE" } },
            });
            if (!patient) throw new BookingError("APT_PATIENT_UNAVAILABLE", 422);

            const service = params.serviceId
              ? await tx.clinicalService.findFirst({
                  where: {
                    id: params.serviceId,
                    departmentId: doctor.departmentId,
                    isActive: true,
                  },
                })
              : null;
            if (params.serviceId && !service)
              throw new BookingError("APT_SERVICE_UNAVAILABLE", 422);

            const validSession =
              doctor.clinicSessions.length === 0 ||
              doctor.clinicSessions.some(
                (session) =>
                  session.dayOfWeek === slotStartDate.getDay() &&
                  sessionContainsSlot({ slotStart: slotStartDate, slotEnd: slotEndDate }, session)
              ) ||
              doctor.clinicSessions.some((session) =>
                sessionContainsSlot(
                  { slotStart: slotStartDate, slotEnd: slotEndDate },
                  { ...session, startTime: session.startTime, endTime: session.endTime }
                )
              );
            if (!validSession) throw new BookingError("APT_SLOT_NO_LONGER_VALID", 422);

            const leave = await tx.doctorLeave.findFirst({
              where: {
                doctorId: params.doctorId,
                status: "APPROVED",
                startDate: { lte: slotEndDate },
                endDate: { gte: slotStartDate },
              },
            });
            if (leave) throw new BookingError("APT_SLOT_NO_LONGER_VALID", 422);

            await tx.$queryRaw`SELECT id FROM "Doctor" WHERE id = ${params.doctorId} FOR UPDATE`;

            const activeStatuses = [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.CHECKED_IN,
              AppointmentStatus.IN_PROGRESS,
            ];
            const occupied = await tx.appointment.findFirst({
              where: {
                doctorId: params.doctorId,
                slotStart: slotStartDate,
                status: { in: activeStatuses },
              },
            });
            if (occupied) throw new BookingError("APT_SLOT_ALREADY_BOOKED", 409);

            const patientConflict = await tx.appointment.findFirst({
              where: {
                patientId: params.patientId,
                status: { in: activeStatuses },
                slotStart: { lt: slotEndDate },
                slotEnd: { gt: slotStartDate },
              },
            });
            if (patientConflict) throw new BookingError("APT_PATIENT_DOUBLE_BOOKING", 422);

            let appointmentNumber = "";
            const datePart = slotStartDate.toISOString().slice(0, 10).replace(/-/g, "");
            try {
              const sequence = await tx.$queryRaw<Array<{ value: bigint }>>`
                SELECT nextval('appointment_number_seq') AS value
              `;
              appointmentNumber = `APT-${datePart}-${String(sequence[0].value).padStart(4, "0")}`;
            } catch {
              const count = await tx.appointment.count();
              appointmentNumber = `APT-${datePart}-${String(count + 1).padStart(4, "0")}`;
            }
            const created = await tx.appointment.create({
              data: {
                appointmentNumber,
                patientId: params.patientId,
                doctorId: params.doctorId,
                departmentId: doctor.departmentId,
                serviceId: service?.id,
                appointmentType: params.appointmentType || AppointmentType.NEW,
                slotStart: slotStartDate,
                slotEnd: slotEndDate,
                status: AppointmentStatus.CONFIRMED,
                notes: params.notes,
                createdBy: params.actorId,
              },
            });

            await tx.auditLog.create({
              data: {
                actorId: params.actorId,
                actorRole: params.actorRole,
                action: AuditAction.CREATE,
                entityType: "Appointment",
                entityId: created.id,
                changes: {
                  after: { appointmentNumber, slotStart: params.slotStart, status: "CONFIRMED" },
                },
              },
            });
            await tx.outboxEvent.create({
              data: {
                topic: "appointment.confirmed",
                aggregateType: "Appointment",
                aggregateId: created.id,
                payload: {
                  patientId: params.patientId,
                  doctorId: params.doctorId,
                  appointmentNumber,
                },
              },
            });
            return created;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );

        // If appointment is booked for today, automatically issue queue token so it appears on queue boards
        const isToday =
          slotStartDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
        if (isToday) {
          try {
            await QueueService.checkIn({
              appointmentId: appointment.id,
              patientId: params.patientId,
              doctorId: params.doctorId,
              allowOverride: true,
              actorId: params.actorId,
            });
          } catch (qErr) {
            console.warn("Auto-checkin for today appointment skipped:", qErr);
          }
        }

        return { success: true, data: appointment };
      } catch (error) {
        if (error instanceof BookingError) {
          return { success: false, code: error.code, status: error.status };
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return { success: false, code: "APT_SLOT_ALREADY_BOOKED", status: 409 };
        }
        throw error;
      }
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

class BookingError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
  }
}
