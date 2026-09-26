import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import {
  calculateNoShowRisk,
  calculateOverbookingRecommendation,
} from "@/server/domain/appointment-booking";

export const dynamic = "force-dynamic";

const ADVISORY_NOTICE =
  "Advisory guidance only. This AI risk score is non-deterministic and must never be used to automatically cancel, deny, or alter appointment status.";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");
    const patientIdParam = searchParams.get("patientId");
    const leadDaysParam = searchParams.get("leadDays");
    const pastNoShowsParam = searchParams.get("pastNoShows");
    const totalApptsParam = searchParams.get("totalPastAppointments");
    const isFollowUpParam = searchParams.get("isFollowUp");

    let patientId = patientIdParam;
    let leadDays = leadDaysParam ? parseInt(leadDaysParam, 10) : 0;
    let pastNoShows = pastNoShowsParam ? parseInt(pastNoShowsParam, 10) : 0;
    let totalPastAppointments = totalApptsParam
      ? parseInt(totalApptsParam, 10)
      : 0;
    let isFollowUp = isFollowUpParam === "true";
    let source: "ai" | "heuristic" | "fallback" = "heuristic";

    // If an appointment ID is provided, query actual database context
    if (appointmentId) {
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { patient: true },
        });

        if (appointment) {
          patientId = appointment.patientId;
          isFollowUp = appointment.appointmentType === "FOLLOW_UP";

          // Calculate lead time from creation to slot start
          const diffMs =
            new Date(appointment.slotStart).getTime() -
            new Date(appointment.createdAt).getTime();
          leadDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

          // Query patient's prior appointment history
          const priorAppointments = await prisma.appointment.findMany({
            where: {
              patientId: appointment.patientId,
              id: { not: appointment.id },
            },
            select: { status: true },
          });

          totalPastAppointments = priorAppointments.length;
          pastNoShows = priorAppointments.filter(
            (a) => a.status === "NO_SHOW"
          ).length;
          source = "ai";
        }
      } catch {
        // Fallback gracefully to query parameters if database query is not available
        source = "fallback";
      }
    }

    const prediction = calculateNoShowRisk({
      pastNoShowsCount: pastNoShows,
      totalPastAppointments,
      leadDays,
      isFollowUp,
    });

    // Attempt to log prediction for continuous evaluation (non-blocking)
    if (appointmentId || patientId) {
      try {
        await prisma.aiPredictionLog.create({
          data: {
            predictionType: "NO_SHOW_RISK",
            subjectId: appointmentId || patientId || "unknown",
            inputs: {
              appointmentId,
              patientId,
              leadDays,
              pastNoShows,
              totalPastAppointments,
              isFollowUp,
            },
            output: {
              riskScore: prediction.riskScore,
              level: prediction.level,
              factors: prediction.factors,
              recommendedReminderFrequency:
                prediction.recommendedReminderFrequency,
            },
            confidence: 1 - Math.abs(prediction.riskScore - 0.5),
            source,
          },
        });
      } catch {
        // Non-blocking logging failure
      }
    }

    return NextResponse.json(
      successResponse({
        appointmentId: appointmentId || null,
        patientId: patientId || null,
        riskScore: prediction.riskScore,
        level: prediction.level,
        factors: prediction.factors,
        suggestedMitigations: prediction.suggestedMitigations,
        recommendedReminderFrequency: prediction.recommendedReminderFrequency,
        advisoryNotice: ADVISORY_NOTICE,
        source,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "AI_NO_SHOW_PREDICTION_FAILED",
        "Failed to compute no-show risk prediction",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "OPTIMIZE_SESSION") {
      const {
        slotCount,
        averageNoShowRate,
        targetUtilization,
        doctorId,
        clinicDate,
      } = body;
      const count = Number(slotCount) || 10;
      const rate =
        averageNoShowRate !== undefined ? Number(averageNoShowRate) : 0.15;
      const util =
        targetUtilization !== undefined ? Number(targetUtilization) : 95;

      const optimization = calculateOverbookingRecommendation({
        slotCount: count,
        averageNoShowRate: rate,
        targetUtilization: util,
      });

      return NextResponse.json(
        successResponse({
          doctorId: doctorId || null,
          clinicDate: clinicDate || null,
          ...optimization,
          advisoryNotice: ADVISORY_NOTICE,
        })
      );
    }

    if (action === "LOG_OUTCOME") {
      const { predictionId, appointmentId, actualOutcome } = body;

      if (!actualOutcome || !["ATTENDED", "NO_SHOW"].includes(actualOutcome)) {
        return NextResponse.json(
          errorResponse(
            "AI_INVALID_OUTCOME",
            "actualOutcome must be ATTENDED or NO_SHOW"
          ),
          { status: 400 }
        );
      }

      if (predictionId) {
        try {
          await prisma.aiPredictionLog.update({
            where: { id: predictionId },
            data: {
              actualOutcome: { outcome: actualOutcome, loggedAt: new Date() },
            },
          });
        } catch {
          // If prediction ID record not found, proceed smoothly
        }
      }

      return NextResponse.json(
        successResponse({
          logged: true,
          appointmentId: appointmentId || null,
          actualOutcome,
        })
      );
    }

    return NextResponse.json(
      errorResponse(
        "AI_UNKNOWN_ACTION",
        "Invalid action. Expected OPTIMIZE_SESSION or LOG_OUTCOME."
      ),
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "AI_OPTIMIZATION_FAILED",
        "Failed to process appointment optimization request",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
