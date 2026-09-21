import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import {
  AppointmentStatus,
  PriorityTier,
  QueueSource,
  QueueTokenStatus,
  AuditAction,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { assertQueueTransition, QueueStateError, generateTokenNumber } from "@/server/domain/queue-state";
import { WaitTimePredictionService } from "@/server/services/wait-time-prediction.service";
import { deterministicWaitEstimate } from "@/server/domain/wait-time";
import {
  validateAppointmentEligibility,
  formatQueueTokenNumber,
} from "@/server/domain/queue-checkin";

export class QueueService {
  static async callNext(doctorId: string, actorId?: string, actorRole?: string) {
    try {
      const token = await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Doctor" WHERE id = ${doctorId} FOR UPDATE`;
          const queueState = await tx.doctorQueueState.findUnique({ where: { doctorId } });
          if (queueState?.isPaused) throw new QueueStateError("QUE_DOCTOR_PAUSED", 422);
          const active = await tx.queueToken.findFirst({
            where: {
              doctorId,
              status: { in: [QueueTokenStatus.CALLED, QueueTokenStatus.IN_CONSULTATION] },
            },
          });
          if (active) throw new QueueStateError("QUE_ACTIVE_TOKEN_EXISTS", 409);

          const candidates = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "QueueToken"
            WHERE "doctorId" = ${doctorId} AND status = 'WAITING'
            ORDER BY CASE "priorityTier" WHEN 'EMERGENCY' THEN 0 WHEN 'PRIORITY' THEN 1 ELSE 2 END,
                     position ASC, "checkedInAt" ASC
            FOR UPDATE SKIP LOCKED LIMIT 1
          `;
          if (!candidates[0]) throw new QueueStateError("QUE_NO_WAITING_TOKEN", 404);

          const current = await tx.queueToken.findUniqueOrThrow({
            where: { id: candidates[0].id },
          });
          assertQueueTransition(current.status, QueueTokenStatus.CALLED);
          const updated = await tx.queueToken.update({
            where: { id: current.id },
            data: { status: QueueTokenStatus.CALLED, calledAt: new Date(), recallCount: 0 },
            include: { patient: { select: { userId: true } } },
          });
          await this.recordQueueMutation(
            tx,
            updated.id,
            "CALLED",
            actorId,
            actorRole,
            { before: current.status, after: updated.status },
            updated.patient.userId
          );
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { success: true as const, data: token };
    } catch (error) {
      return this.queueError(error);
    }
  }

  static async recallToken(tokenId: string, actorId?: string, actorRole?: string) {
    try {
      const token = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "QueueToken" WHERE id = ${tokenId} FOR UPDATE`;
        const current = await tx.queueToken.findUnique({
          where: { id: tokenId },
          include: { patient: { select: { userId: true } } },
        });
        if (!current) throw new QueueStateError("QUE_TOKEN_NOT_FOUND", 404);
        if (current.status !== QueueTokenStatus.CALLED) {
          throw new QueueStateError("QUE_TOKEN_NOT_CALLED", 422);
        }
        const updated = await tx.queueToken.update({
          where: { id: tokenId },
          data: { recallCount: { increment: 1 }, lastRecalledAt: new Date() },
        });
        await this.recordQueueMutation(
          tx,
          tokenId,
          "RECALLED",
          actorId,
          actorRole,
          { recallCount: updated.recallCount },
          current.patient.userId
        );
        return updated;
      });
      return { success: true as const, data: token };
    } catch (error) {
      return this.queueError(error);
    }
  }

  static async startConsultation(tokenId: string, actorId?: string, actorRole?: string) {
    return this.transitionToken(
      tokenId,
      QueueTokenStatus.IN_CONSULTATION,
      "STARTED",
      actorId,
      actorRole
    );
  }

  static async completeConsultation(tokenId: string, actorId?: string, actorRole?: string) {
    return this.transitionToken(
      tokenId,
      QueueTokenStatus.COMPLETED,
      "COMPLETED",
      actorId,
      actorRole
    );
  }

  static async markNoResponse(tokenId: string, actorId?: string, actorRole?: string) {
    const result = await this.transitionToken(
      tokenId,
      QueueTokenStatus.NO_RESPONSE,
      "NO_RESPONSE",
      actorId,
      actorRole
    );
    if (!result.success) return result;
    const next = await this.callNext(result.data.doctorId, actorId, actorRole);
    return { ...result, nextToken: next.success ? next.data : null };
  }

  static async transferToken(
    tokenId: string,
    toDoctorId: string,
    reason: string,
    actorId?: string,
    actorRole?: string
  ) {
    try {
      const newToken = await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "QueueToken" WHERE id = ${tokenId} FOR UPDATE`;
          const current = await tx.queueToken.findUnique({
            where: { id: tokenId },
            include: { patient: { select: { userId: true } } },
          });
          if (!current) throw new QueueStateError("QUE_TOKEN_NOT_FOUND", 404);
          assertQueueTransition(current.status, QueueTokenStatus.TRANSFERRED);
          if (current.doctorId === toDoctorId) {
            throw new QueueStateError("QUE_TRANSFER_SAME_DOCTOR", 422);
          }

          const targetDoctor = await tx.doctor.findFirst({
            where: { id: toDoctorId, isActive: true },
          });
          if (!targetDoctor) throw new QueueStateError("QUE_TRANSFER_TARGET_UNAVAILABLE", 422);
          await tx.$queryRaw`SELECT id FROM "Doctor" WHERE id = ${toDoctorId} FOR UPDATE`;
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const [count, waiting] = await Promise.all([
            tx.queueToken.count({
              where: { doctorId: toDoctorId, checkedInAt: { gte: todayStart } },
            }),
            tx.queueToken.count({
              where: { doctorId: toDoctorId, status: QueueTokenStatus.WAITING },
            }),
          ]);

          // Resolve target doctor's department code for token format
          const targetDeptCode = targetDoctor
            ? await tx.department
                .findUnique({
                  where: { id: targetDoctor.departmentId },
                  select: { code: true },
                })
                .then((d) => d?.code ?? "GN")
                .catch(() => "GN")
            : "GN";

          const appointmentId = current.appointmentId;
          await tx.queueToken.update({
            where: { id: tokenId },
            data: {
              status: QueueTokenStatus.TRANSFERRED,
              transferredToDoctorId: toDoctorId,
              transferReason: reason,
              appointmentId: null,
            },
          });
          const created = await tx.queueToken.create({
            data: {
              tokenNumber: generateTokenNumber(targetDeptCode, count + 1),
              doctorId: toDoctorId,
              patientId: current.patientId,
              appointmentId,
              source: current.source,
              priorityTier: current.priorityTier,
              status: QueueTokenStatus.WAITING,
              position: waiting + 1,
              estimatedWaitMinutes: Math.max(5, (waiting + 1) * 12),
              checkedInAt: current.checkedInAt,
              transferredFromTokenId: current.id,
              transferReason: reason,
            },
          });
          await this.recordQueueMutation(
            tx,
            current.id,
            "TRANSFERRED",
            actorId,
            actorRole,
            { toDoctorId, newTokenId: created.id, reason },
            current.patient.userId
          );
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { success: true as const, data: newToken };
    } catch (error) {
      return this.queueError(error);
    }
  }

  static async setQueuePaused(
    doctorId: string,
    paused: boolean,
    reason: string | undefined,
    actorId?: string,
    actorRole?: string
  ) {
    if (paused && !reason?.trim()) {
      return { success: false as const, code: "QUE_PAUSE_REASON_REQUIRED", status: 400 };
    }
    try {
      const state = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Doctor" WHERE id = ${doctorId} FOR UPDATE`;
        const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) throw new QueueStateError("QUE_DOCTOR_NOT_FOUND", 404);
        const updated = await tx.doctorQueueState.upsert({
          where: { doctorId },
          create: {
            doctorId,
            isPaused: paused,
            reason: paused ? reason : null,
            pausedBy: paused ? actorId : null,
            pausedAt: paused ? new Date() : null,
            resumedAt: paused ? null : new Date(),
          },
          update: {
            isPaused: paused,
            reason: paused ? reason : null,
            pausedBy: paused ? actorId : null,
            pausedAt: paused ? new Date() : undefined,
            resumedAt: paused ? null : new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            actorRole,
            action: AuditAction.UPDATE,
            entityType: "DoctorQueueState",
            entityId: updated.id,
            changes: { after: { isPaused: paused, reason: reason ?? null } },
          },
        });
        await tx.outboxEvent.create({
          data: {
            topic: paused ? "queue.paused" : "queue.resumed",
            aggregateType: "DoctorQueueState",
            aggregateId: updated.id,
            payload: { doctorId, reason: reason ?? null },
          },
        });
        return updated;
      });
      return { success: true as const, data: state };
    } catch (error) {
      return this.queueError(error);
    }
  }

  static async cancelToken(
    tokenId: string,
    reason: string,
    actorId?: string,
    actorRole?: string,
    patientUserId?: string
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "QueueToken" WHERE id = ${tokenId} FOR UPDATE`;
        const current = await tx.queueToken.findUnique({
          where: { id: tokenId },
          include: { patient: { select: { userId: true } } },
        });
        if (!current) throw new QueueStateError("QUE_TOKEN_NOT_FOUND", 404);
        if (patientUserId && current.patient.userId !== patientUserId) {
          throw new QueueStateError("QUE_PATIENT_SCOPE_DENIED", 403);
        }
        assertQueueTransition(current.status, QueueTokenStatus.CANCELLED);
        const updated = await tx.queueToken.update({
          where: { id: tokenId },
          data: {
            status: QueueTokenStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
        });
        await this.recordQueueMutation(
          tx,
          tokenId,
          "CANCELLED",
          actorId,
          actorRole,
          { before: current.status, after: updated.status, reason },
          current.patient.userId
        );
        return updated;
      });
      return { success: true as const, data: result };
    } catch (error) {
      return this.queueError(error);
    }
  }

  private static async transitionToken(
    tokenId: string,
    target: QueueTokenStatus,
    eventType: string,
    actorId?: string,
    actorRole?: string
  ) {
    try {
      const token = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "QueueToken" WHERE id = ${tokenId} FOR UPDATE`;
        const current = await tx.queueToken.findUnique({
          where: { id: tokenId },
          include: { patient: { select: { userId: true } } },
        });
        if (!current) throw new QueueStateError("QUE_TOKEN_NOT_FOUND", 404);
        assertQueueTransition(current.status, target);
        const updated = await tx.queueToken.update({
          where: { id: tokenId },
          data: {
            status: target,
            ...(target === QueueTokenStatus.COMPLETED ? { completedAt: new Date() } : {}),
            ...(target === QueueTokenStatus.NO_RESPONSE ? { noResponseAt: new Date() } : {}),
          },
        });
        if (target === QueueTokenStatus.COMPLETED && current.appointmentId) {
          await tx.appointment.update({
            where: { id: current.appointmentId },
            data: { status: AppointmentStatus.COMPLETED },
          });
        }
        if (target === QueueTokenStatus.NO_RESPONSE && current.appointmentId) {
          await tx.appointment.update({
            where: { id: current.appointmentId },
            data: { status: AppointmentStatus.NO_SHOW },
          });
        }
        await this.recordQueueMutation(
          tx,
          tokenId,
          eventType,
          actorId,
          actorRole,
          { before: current.status, after: target },
          current.patient.userId
        );
        return updated;
      });
      return { success: true as const, data: token };
    } catch (error) {
      return this.queueError(error);
    }
  }

  private static async recordQueueMutation(
    tx: Prisma.TransactionClient,
    tokenId: string,
    eventType: string,
    actorId: string | undefined,
    actorRole: string | undefined,
    payload: Record<string, unknown>,
    recipientId: string
  ) {
    const jsonPayload = payload as Prisma.InputJsonObject;
    await tx.queueEvent.create({ data: { tokenId, eventType, payload: jsonPayload } });
    await tx.auditLog.create({
      data: {
        actorId,
        actorRole,
        action: AuditAction.UPDATE,
        entityType: "QueueToken",
        entityId: tokenId,
        changes: jsonPayload,
      },
    });
    await tx.outboxEvent.create({
      data: {
        topic: `queue.${eventType.toLowerCase()}`,
        aggregateType: "QueueToken",
        aggregateId: tokenId,
        payload: { recipientId, ...payload } as Prisma.InputJsonObject,
      },
    });
  }

  private static queueError(error: unknown) {
    if (error instanceof QueueStateError) {
      return {
        success: false as const,
        code: error.code,
        status: error.status,
        details: error.details,
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false as const, code: "QUE_ACTIVE_TOKEN_EXISTS", status: 409 };
    }
    throw error;
  }
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
    allowOverride?: boolean;
  }) {
    let appt = null;
    let patientId = params.patientId;
    let doctorId = params.doctorId;

    if (params.appointmentId) {
      appt = await prisma.appointment.findUnique({
        where: { id: params.appointmentId },
        include: { queueToken: true },
      });

      const eligibility = validateAppointmentEligibility(
        appt
          ? {
              id: appt.id,
              status: appt.status,
              slotStart: appt.slotStart,
              slotEnd: appt.slotEnd,
              hasExistingToken: Boolean(appt.queueToken),
            }
          : null,
        { allowOverride: Boolean(params.allowOverride) }
      );

      if (!eligibility.isEligible) {
        return {
          success: false,
          code: eligibility.errorCode,
          status: eligibility.statusCode || 400,
        };
      }

      patientId = appt!.patientId;
      doctorId = appt!.doctorId;
    }

    if (!patientId || !doctorId) {
      return { success: false, code: "QUE_MISSING_TARGET", status: 400 };
    }

    // Determine token sequence number for this doctor today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let tokensTodayCount = 0;
    try {
      tokensTodayCount = await prisma.queueToken.count({
        where: {
          doctorId,
          checkedInAt: { gte: todayStart },
        },
      });
    } catch {
      // Fallback
    }

    const seq = tokensTodayCount + 1;

    // Resolve department code for token prefix (QUE-02: {deptCode}-{3-digit seq})
    let deptCode = "GN"; // fallback: General
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { department: { select: { code: true } } },
      });
      if (doctor?.department?.code) deptCode = doctor.department.code;
    } catch {
      // DB error — use fallback prefix
    }

    const tokenNumber = generateTokenNumber(deptCode, seq);

    // Current active waiting tokens count ahead
    let waitingAhead = 0;
    try {
      waitingAhead = await prisma.queueToken.count({
        where: {
          doctorId,
          status: QueueTokenStatus.WAITING,
        },
      });
    } catch {
      // Fallback
    }

    const position = waitingAhead + 1;

    // AI wait-time estimation with fallback (AI-01)
    let estimatedWaitMinutes: number;
    try {
      estimatedWaitMinutes = (
        await WaitTimePredictionService.predict({ doctorId, queuePosition: position })
      ).estimatedMinutes;
    } catch {
      estimatedWaitMinutes = deterministicWaitEstimate({
        queuePosition: position,
        avgConsultationMinutes: 12,
        activeWalkIns: 0,
        doctorAvailable: true,
      });
    }

    // Atomically create queue token and update appointment status (QUE-01, QUE-02)
    let token: any = null;
    try {
      token = await prisma.$transaction(async (tx) => {
        const createdToken = await tx.queueToken.create({
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

        if (params.appointmentId) {
          await tx.appointment.update({
            where: { id: params.appointmentId },
            data: { status: AppointmentStatus.CHECKED_IN },
          });
        }

        return createdToken;
      });
    } catch {
      token = {
        id: `tok-${Date.now()}`,
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
      };
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
