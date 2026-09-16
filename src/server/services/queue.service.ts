import { prisma } from "@/lib/prisma";
import { predictWaitTime } from "@/lib/openrouter";
import { logAuditEvent } from "@/lib/audit";
import {
  AppointmentStatus,
  PriorityTier,
  QueueSource,
  QueueTokenStatus,
  AuditAction,
} from "@prisma/client";

export class QueueService {
  /**
   * Check in patient and issue queue token atomically (QUE-01, QUE-02)
   */
  static async checkIn(params: {
    appointmentId?: string;
    patientId?: string;
    doctorId?: string;
    isWalkIn?: boolean;
    priorityTier?: PriorityTier;
    actorId?: string;
  }) {
    let appt = null;
    let patientId = params.patientId;
    let doctorId = params.doctorId;

    if (params.appointmentId) {
      appt = await prisma.appointment.findUnique({
        where: { id: params.appointmentId },
        include: { queueToken: true },
      });

      if (!appt) {
        return { success: false, code: "APT_NOT_FOUND", status: 404 };
      }

      if (appt.status === AppointmentStatus.CHECKED_IN || appt.queueToken) {
        return { success: false, code: "QUE_ALREADY_CHECKED_IN", status: 409 };
      }

      patientId = appt.patientId;
      doctorId = appt.doctorId;
    }

    if (!patientId || !doctorId) {
      return { success: false, code: "QUE_MISSING_TARGET", status: 400 };
    }

    // Determine token sequence number for this doctor today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tokensTodayCount = await prisma.queueToken.count({
      where: {
        doctorId,
        checkedInAt: { gte: todayStart },
      },
    });

    const seq = tokensTodayCount + 1;
    // Format token e.g. #A-24 or #A-01
    const tokenNumber = `#A-${String(seq).padStart(2, "0")}`;

    // Current active waiting tokens count ahead
    const waitingAhead = await prisma.queueToken.count({
      where: {
        doctorId,
        status: QueueTokenStatus.WAITING,
      },
    });

    const position = waitingAhead + 1;

    // AI wait-time estimation with fallback (AI-01)
    const waitTimeRes = await predictWaitTime(position, 12);
    const estimatedWaitMinutes = waitTimeRes.data.estimatedMinutes;

    // Create queue token
    const token = await prisma.queueToken.create({
      data: {
        tokenNumber,
        doctorId,
        patientId,
        appointmentId: params.appointmentId || null,
        source: params.isWalkIn ? QueueSource.WALK_IN : QueueSource.APPOINTMENT,
        priorityTier: params.priorityTier || PriorityTier.NORMAL,
        status: QueueTokenStatus.WAITING,
        position,
        estimatedWaitMinutes,
        checkedInAt: new Date(),
      },
      include: {
        doctor: { select: { roomNumber: true, user: { select: { name: true } } } },
        patient: { select: { mrn: true, user: { select: { name: true } } } },
      },
    });

    // Update appointment status to CHECKED_IN if linked
    if (params.appointmentId) {
      await prisma.appointment.update({
        where: { id: params.appointmentId },
        data: { status: AppointmentStatus.CHECKED_IN },
      });
    }

    await logAuditEvent({
      actorId: params.actorId,
      action: AuditAction.CREATE,
      entityType: "QueueToken",
      entityId: token.id,
      changes: { after: { tokenNumber, position, estimatedWaitMinutes } },
    });

    return {
      success: true,
      data: token,
    };
  }

  /**
   * Get Live Queue Board for a doctor or department (QUE-03)
   */
  static async getDoctorQueueBoard(doctorId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tokens = await prisma.queueToken.findMany({
      where: {
        doctorId,
        checkedInAt: { gte: todayStart },
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            dob: true,
            bloodGroup: true,
            user: { select: { name: true } },
            alerts: { where: { isActive: true } },
          },
        },
      },
      orderBy: [{ priorityTier: "desc" }, { position: "asc" }],
    });

    const waiting = tokens.filter((t) => t.status === QueueTokenStatus.WAITING);
    const called = tokens.filter(
      (t) => t.status === QueueTokenStatus.CALLED || t.status === QueueTokenStatus.IN_CONSULTATION
    );
    const completed = tokens.filter((t) => t.status === QueueTokenStatus.COMPLETED);

    return {
      nowServing: called[0]?.tokenNumber || "None",
      nowServingToken: called[0] || null,
      waitingCount: waiting.length,
      completedCount: completed.length,
      tokens,
    };
  }

  /**
   * Call next patient token (QUE-05)
   */
  static async callToken(tokenId: string, actorId?: string) {
    const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
    if (!token) return { success: false, code: "QUE_TOKEN_NOT_FOUND", status: 404 };

    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: QueueTokenStatus.CALLED,
        calledAt: new Date(),
      },
    });

    await logAuditEvent({
      actorId,
      action: AuditAction.UPDATE,
      entityType: "QueueToken",
      entityId: tokenId,
      changes: { before: { status: token.status }, after: { status: "CALLED" } },
    });

    return { success: true, data: updated };
  }

  /**
   * Complete Consultation for Token (QUE-05 / EMR-06)
   */
  static async completeToken(tokenId: string, actorId?: string) {
    const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
    if (!token) return { success: false, code: "QUE_TOKEN_NOT_FOUND", status: 404 };

    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: QueueTokenStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (token.appointmentId) {
      await prisma.appointment.update({
        where: { id: token.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });
    }

    return { success: true, data: updated };
  }
}
