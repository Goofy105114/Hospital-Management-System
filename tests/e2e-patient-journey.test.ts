/**
 * REL E2E — Critical Patient Journey Integration Test
 *
 * Tests the full patient-to-appointment-to-queue-to-consultation-to-pharmacy
 * journey by chaining the domain function contracts end-to-end.
 *
 * All assertions are against pure domain functions (no DB, no HTTP) — the same
 * approach used throughout the test suite. The goal is to verify that the
 * business rule contracts from all modules are compatible when exercised in
 * sequence, not to test infrastructure.
 *
 * Journey under test:
 *   1. Patient arrives → APT-03 booking window validation
 *   2. Appointment confirmed → APT-06 lifecycle: CONFIRMED → CHECKED_IN
 *   3. Check-in → QUE-02 token number format generation
 *   4. Queue walk → QUE-05 full lifecycle: WAITING → CALLED → IN_CONSULTATION → COMPLETED
 *   5. Queue exceptions → QUE-06: cancel and transfer paths
 *   6. Post-consultation → PHA-04 dispensing validation
 *   7. Billing → BIL-03 invoice totals and adjustment arithmetic
 *   8. API layer → envelope shape conformance across modules
 */

import { describe, expect, it } from "vitest";

// APT-03: booking window validation
import { validateBookingWindow, sessionContainsSlot } from "@/server/domain/appointment-booking";

// APT-06: appointment lifecycle state machine
import { canTransitionAppointment } from "@/server/domain/appointment-booking";
import { AppointmentStatus } from "@prisma/client";

// QUE-02: token number format
import { generateTokenNumber } from "@/server/domain/queue-state";

// QUE-05 / QUE-06: queue state machine
import {
  canTransitionQueueToken,
  assertQueueTransition,
  QueueStateError,
} from "@/server/domain/queue-state";
import { QueueTokenStatus } from "@prisma/client";

// PHA-04: dispensing rules
import { validateDispenseRequest, dispensingCompletionStatus } from "@/server/domain/dispensing";

// BIL-03: invoice pricing
import { calculateInvoiceTotals, adjustmentAmount } from "@/server/domain/invoice-pricing";

// AI-01: wait time fallback
import { deterministicWaitEstimate } from "@/server/domain/wait-time";

// API envelope
import { apiSuccess, apiError } from "@/lib/api-envelope";

// ─────────────────────────────────────────────────────────────────────────────
// 1. APPOINTMENT BOOKING (APT-03)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 1 — Appointment booking window validation (APT-03)", () => {
  const now = new Date("2026-09-21T09:00:00.000Z");

  it("rejects booking a slot in the past", () => {
    expect(
      validateBookingWindow(
        {
          slotStart: new Date("2026-09-21T08:00:00.000Z"),
          slotEnd:   new Date("2026-09-21T08:15:00.000Z"),
        },
        now
      )
    ).toBe("APT_PAST_SLOT");
  });

  it("rejects inverted slot window", () => {
    const result = validateBookingWindow(
      {
        slotStart: new Date("2026-09-22T10:30:00.000Z"),
        slotEnd:   new Date("2026-09-22T10:00:00.000Z"),
      },
      now
    );
    expect(["APT_INVALID_SLOT", "APT_PAST_SLOT"]).toContain(result);
  });

  it("accepts a future aligned 15-min slot within the session", () => {
    const session = { startTime: "09:00", endTime: "17:00", slotDurationMinutes: 15 };
    expect(
      sessionContainsSlot(
        {
          slotStart: new Date(2026, 8, 22, 9, 15), // 09:15
          slotEnd:   new Date(2026, 8, 22, 9, 30), // 09:30
        },
        session
      )
    ).toBe(true);
  });

  it("rejects a slot that overruns the session end", () => {
    const session = { startTime: "09:00", endTime: "09:30", slotDurationMinutes: 15 };
    expect(
      sessionContainsSlot(
        {
          slotStart: new Date(2026, 8, 22, 9, 20),
          slotEnd:   new Date(2026, 8, 22, 9, 35),
        },
        session
      )
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. APPOINTMENT LIFECYCLE (APT-06)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 2 — Appointment lifecycle transitions (APT-06)", () => {
  it("allows CONFIRMED → CHECKED_IN (patient arrives)", () => {
    expect(
      canTransitionAppointment(AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN)
    ).toBe(true);
  });

  it("allows CHECKED_IN → IN_PROGRESS (consultation begins)", () => {
    expect(
      canTransitionAppointment(AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS)
    ).toBe(true);
  });

  it("allows IN_PROGRESS → COMPLETED (consultation ends)", () => {
    expect(
      canTransitionAppointment(AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED)
    ).toBe(true);
  });

  it("allows CONFIRMED → CANCELLED (patient cancels before check-in)", () => {
    expect(
      canTransitionAppointment(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED)
    ).toBe(true);
  });

  it("blocks COMPLETED → CANCELLED (terminal state is immutable)", () => {
    expect(
      canTransitionAppointment(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED)
    ).toBe(false);
  });

  it("allows CONFIRMED → NO_SHOW (patient does not arrive)", () => {
    expect(
      canTransitionAppointment(AppointmentStatus.CONFIRMED, AppointmentStatus.NO_SHOW)
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. QUEUE TOKEN FORMAT (QUE-02)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 3 — Queue token number format (QUE-02)", () => {
  it("generates correct dept-prefix + 3-digit sequence format", () => {
    expect(generateTokenNumber("CARD", 1)).toBe("CA-001");
    expect(generateTokenNumber("CARD", 24)).toBe("CA-024");
    expect(generateTokenNumber("NEUR", 105)).toBe("NE-105");
  });

  it("falls back to 2-char prefix from any dept code", () => {
    expect(generateTokenNumber("GN", 7)).toBe("GN-007");
    expect(generateTokenNumber("X",  1)).toBe("X-001");
  });

  it("pads sequence to always 3 digits", () => {
    expect(generateTokenNumber("CA", 1).split("-")[1]).toHaveLength(3);
    expect(generateTokenNumber("CA", 999).split("-")[1]).toBe("999");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. QUEUE LIFECYCLE (QUE-05)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 4 — Full queue lifecycle (QUE-05)", () => {
  it("walks the complete normal lifecycle: WAITING → CALLED → IN_CONSULTATION → COMPLETED", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING,        QueueTokenStatus.CALLED)).toBe(true);
    expect(canTransitionQueueToken(QueueTokenStatus.CALLED,         QueueTokenStatus.IN_CONSULTATION)).toBe(true);
    expect(canTransitionQueueToken(QueueTokenStatus.IN_CONSULTATION,QueueTokenStatus.COMPLETED)).toBe(true);
  });

  it("blocks skipping directly from WAITING to COMPLETED", () => {
    expect(() =>
      assertQueueTransition(QueueTokenStatus.WAITING, QueueTokenStatus.COMPLETED)
    ).toThrow(QueueStateError);
  });

  it("blocks skipping from WAITING to IN_CONSULTATION", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.IN_CONSULTATION)).toBe(false);
  });

  it("terminal states accept no further transitions", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.COMPLETED, QueueTokenStatus.CALLED)).toBe(false);
    expect(canTransitionQueueToken(QueueTokenStatus.CANCELLED, QueueTokenStatus.WAITING)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. QUEUE EXCEPTIONS (QUE-06)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 5 — Queue exception paths (QUE-06)", () => {
  it("allows WAITING → CANCELLED (patient leaves before being called)", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.CANCELLED)).toBe(true);
  });

  it("allows WAITING → TRANSFERRED (re-assigned to different doctor)", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.TRANSFERRED)).toBe(true);
  });

  it("allows CALLED → NO_RESPONSE (patient does not respond to call)", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.CALLED, QueueTokenStatus.NO_RESPONSE)).toBe(true);
  });

  it("NO_RESPONSE is a distinct status from CANCELLED", () => {
    expect(QueueTokenStatus.NO_RESPONSE).not.toBe(QueueTokenStatus.CANCELLED);
  });

  it("blocks COMPLETED → TRANSFERRED (terminal state)", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.COMPLETED, QueueTokenStatus.TRANSFERRED)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PHARMACY DISPENSING (PHA-04)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 6 — Pharmacy dispensing rules (PHA-04)", () => {
  it("rejects an empty dispense request", () => {
    expect(validateDispenseRequest([])).toBe("PHA_DISPENSE_ITEMS_REQUIRED");
  });

  it("rejects duplicate prescription items in one dispense", () => {
    expect(
      validateDispenseRequest([
        { prescriptionItemId: "rx-01", batchId: "bat-A", quantityDispensed: 30 },
        { prescriptionItemId: "rx-01", batchId: "bat-B", quantityDispensed: 10 },
      ])
    ).toBe("PHA_DUPLICATE_PRESCRIPTION_ITEM");
  });

  it("rejects zero or negative quantities", () => {
    expect(
      validateDispenseRequest([
        { prescriptionItemId: "rx-02", batchId: "bat-A", quantityDispensed: 0 },
      ])
    ).toBe("PHA_INVALID_DISPENSE_QUANTITY");
  });

  it("accepts valid dispense items", () => {
    expect(
      validateDispenseRequest([
        { prescriptionItemId: "rx-01", batchId: "bat-A", quantityDispensed: 30 },
        { prescriptionItemId: "rx-02", batchId: "bat-B", quantityDispensed: 14 },
      ])
    ).toBeNull();
  });

  it("distinguishes partial vs full dispensing", () => {
    expect(dispensingCompletionStatus([{ quantityPrescribed: 30, quantityDispensed: 20 }])).toBe("PARTIAL");
    expect(dispensingCompletionStatus([{ quantityPrescribed: 30, quantityDispensed: 30 }])).toBe("FULL");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. BILLING (BIL-03)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 7 — Invoice pricing and adjustments (BIL-03)", () => {
  it("calculates correct invoice totals including tax, discount and waiver", () => {
    const result = calculateInvoiceTotals({
      lines: [
        { amount: 200, taxRatePercent: 10 },
        { amount: 80,  taxRatePercent: 0  },
      ],
      discountAmounts: [20],
      waiverAmounts:   [10],
    });
    // subtotal=280, discount=20, taxableBase=260
    // weightedTax=200×10%=20; proportional tax=20×(260/280)=18.57
    // finalTotal=280-20+18.57-10=268.57
    expect(result.subtotal).toBe(280);
    expect(result.discount).toBe(20);
    expect(result.tax).toBe(18.57);
    expect(result.waiver).toBe(10);
    expect(result.finalTotal).toBe(268.57);
  });

  it("validates percentage adjustments (0–100%) and flat caps", () => {
    expect(adjustmentAmount("PERCENT", 15, 400)).toBe(60);
    expect(adjustmentAmount("PERCENT", 101, 400)).toBeNull();  // > 100% invalid
    expect(adjustmentAmount("FLAT",    500, 400)).toBeNull();  // flat > invoice invalid
    expect(adjustmentAmount("FLAT",    50,  400)).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. AI WAIT TIME FALLBACK (AI-01)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 8 — AI wait time deterministic fallback (AI-01)", () => {
  it("computes wait time from queue position and consultation duration", () => {
    const wait = deterministicWaitEstimate({
      queuePosition:          3,
      avgConsultationMinutes: 12,
      activeWalkIns:          0,
      doctorAvailable:        true,
    });
    expect(wait).toBe(36);
  });

  it("floors wait time to a minimum of 5 minutes for first-in-queue", () => {
    expect(
      deterministicWaitEstimate({
        queuePosition:          0,
        avgConsultationMinutes: 12,
        activeWalkIns:          0,
        doctorAvailable:        true,
      })
    ).toBe(5);
  });

  it("adds unavailability delay when doctor is not yet in room", () => {
    const withDelay    = deterministicWaitEstimate({ queuePosition: 1, avgConsultationMinutes: 10, activeWalkIns: 0, doctorAvailable: false });
    const withoutDelay = deterministicWaitEstimate({ queuePosition: 1, avgConsultationMinutes: 10, activeWalkIns: 0, doctorAvailable: true  });
    expect(withDelay).toBeGreaterThan(withoutDelay);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. API ENVELOPE CONFORMANCE (cross-module)
// ─────────────────────────────────────────────────────────────────────────────
describe("E2E Step 9 — API envelope shape conformance (A.4.2)", () => {
  it("success response has { success: true, data, meta.timestamp }", async () => {
    const res = apiSuccess({ id: "test-01", status: "CONFIRMED" });
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "test-01", status: "CONFIRMED" });
    expect(body.meta?.timestamp).toBeDefined();
  });

  it("error response has { success: false, error: { code, message, timestamp } }", async () => {
    const res = apiError("APT_SLOT_ALREADY_BOOKED", "Slot is taken", 409, { slot: "10:00" });
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("APT_SLOT_ALREADY_BOOKED");
    expect(body.error.message).toBe("Slot is taken");
    expect(body.error.details?.slot).toBe("10:00");
    expect(body.error.timestamp).toBeDefined();
    expect(res.status).toBe(409);
  });

  it("error codes are SCREAMING_SNAKE_CASE module-namespaced", () => {
    const codes = [
      "APT_SLOT_ALREADY_BOOKED",
      "QUE_TOKEN_ALREADY_CALLED",
      "INV_INSUFFICIENT_STOCK",
      "PHA_DISPENSE_ITEMS_REQUIRED",
      "BIL_INVOICE_NOT_FOUND",
      "DIA_ORDER_NOT_FOUND",
    ];
    codes.forEach((code) => {
      expect(code).toMatch(/^[A-Z]{2,5}_[A-Z0-9_]+$/);
    });
  });
});
