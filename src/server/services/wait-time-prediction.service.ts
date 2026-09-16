import { QueueSource, QueueTokenStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { predictWaitTime } from "@/lib/openrouter";
import { deterministicWaitEstimate, WaitTimeFeatures } from "@/server/domain/wait-time";

export class WaitTimePredictionService {
  static async predict(input: {
    doctorId: string;
    queuePosition: number;
    appointmentType?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [doctor, completed, activeWalkIns, queueState] = await Promise.all([
      prisma.doctor.findUnique({
        where: { id: input.doctorId },
        include: { clinicSessions: { where: { dayOfWeek: new Date().getDay(), isActive: true } } },
      }),
      prisma.queueToken.findMany({
        where: {
          doctorId: input.doctorId,
          status: QueueTokenStatus.COMPLETED,
          calledAt: { not: null },
          completedAt: { not: null },
        },
        select: { calledAt: true, completedAt: true },
        orderBy: { completedAt: "desc" },
        take: 50,
      }),
      prisma.queueToken.count({
        where: {
          doctorId: input.doctorId,
          source: QueueSource.WALK_IN,
          status: QueueTokenStatus.WAITING,
          checkedInAt: { gte: today },
        },
      }),
      prisma.doctorQueueState.findUnique({ where: { doctorId: input.doctorId } }),
    ]);
    const durations = completed
      .map((token) =>
        token.calledAt && token.completedAt
          ? (token.completedAt.getTime() - token.calledAt.getTime()) / 60_000
          : 0
      )
      .filter((duration) => duration > 0 && duration < 240);
    const avgConsultationMinutes = durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 12;
    const features: WaitTimeFeatures = {
      queuePosition: input.queuePosition,
      avgConsultationMinutes,
      activeWalkIns,
      doctorAvailable: Boolean(
        doctor?.isActive && doctor.clinicSessions.length && !queueState?.isPaused
      ),
      appointmentType: input.appointmentType,
    };
    const fallback = deterministicWaitEstimate(features);
    let result: { estimatedMinutes: number; confidence?: number; source: "ai_model" | "fallback" };
    try {
      const prediction = await predictWaitTime(
        input.queuePosition,
        Math.max(1, Math.round(avgConsultationMinutes))
      );
      result =
        prediction.source === "ai_model"
          ? {
              estimatedMinutes: prediction.data.estimatedMinutes,
              confidence: prediction.confidence,
              source: prediction.source,
            }
          : { estimatedMinutes: fallback, confidence: 0.75, source: "fallback" };
    } catch {
      result = { estimatedMinutes: fallback, confidence: 0.6, source: "fallback" };
    }
    await prisma.aiPredictionLog.create({
      data: {
        predictionType: "WAIT_TIME",
        subjectId: input.doctorId,
        inputs: features,
        output: { estimatedMinutes: result.estimatedMinutes },
        source: result.source,
        confidence: result.confidence,
      },
    });
    return { ...result, advisory: true, context: features };
  }
}
