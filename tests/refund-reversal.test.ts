import { describe, expect, it } from "vitest";
import { validateRefundRequest } from "@/server/domain/refund-reversal";

describe("BIL-05 refunds, reversals and payment exception handling", () => {
  it("accepts a valid refund within the original payment amount", () => {
    const valid = validateRefundRequest({
      originalPaymentAmount: 150.0,
      refundAmount: 50.0,
      reason: "Patient overpaid on invoice",
    });
    expect(valid.isValid).toBe(true);
  });

  it("rejects refund amounts that exceed the original payment (Acceptance Criteria)", () => {
    const excess = validateRefundRequest({
      originalPaymentAmount: 100.0,
      refundAmount: 150.0,
      reason: "Full reversal requested",
    });
    expect(excess.isValid).toBe(false);
    expect(excess.errorCode).toBe("BIL_REFUND_EXCEEDS_PAYMENT");
  });

  it("rejects non-positive refund amounts", () => {
    const zeroRefund = validateRefundRequest({
      originalPaymentAmount: 100.0,
      refundAmount: 0,
      reason: "Test",
    });
    expect(zeroRefund.isValid).toBe(false);
    expect(zeroRefund.errorCode).toBe("BIL_INVALID_REFUND_AMOUNT");

    const negativeRefund = validateRefundRequest({
      originalPaymentAmount: 100.0,
      refundAmount: -20,
      reason: "Test",
    });
    expect(negativeRefund.isValid).toBe(false);
    expect(negativeRefund.errorCode).toBe("BIL_INVALID_REFUND_AMOUNT");
  });

  it("requires a clear reason for the refund audit trail", () => {
    const noReason = validateRefundRequest({
      originalPaymentAmount: 100.0,
      refundAmount: 20.0,
      reason: "   ",
    });
    expect(noReason.isValid).toBe(false);
    expect(noReason.errorCode).toBe("BIL_INVALID_REFUND_REASON");
  });
});
