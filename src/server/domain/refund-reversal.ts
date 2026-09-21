export interface RefundValidationInput {
  originalPaymentAmount: number;
  refundAmount: number;
  reason?: string;
}

export function validateRefundRequest(input: RefundValidationInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (typeof input.refundAmount !== "number" || isNaN(input.refundAmount) || input.refundAmount <= 0) {
    return {
      isValid: false,
      errorCode: "BIL_INVALID_REFUND_AMOUNT",
      errorMessage: "Refund amount must be greater than zero",
    };
  }

  if (input.refundAmount > input.originalPaymentAmount) {
    return {
      isValid: false,
      errorCode: "BIL_REFUND_EXCEEDS_PAYMENT",
      errorMessage: "Refund amount cannot exceed original payment amount",
    };
  }

  if (!input.reason || typeof input.reason !== "string" || input.reason.trim().length === 0) {
    return {
      isValid: false,
      errorCode: "BIL_INVALID_REFUND_REASON",
      errorMessage: "Reason is required for processing a payment refund",
    };
  }

  return { isValid: true };
}
