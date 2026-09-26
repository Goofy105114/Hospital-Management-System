export type PricingLine = { amount: number; taxRatePercent?: number };

export function calculateInvoiceTotals(input: {
  lines: PricingLine[];
  discountAmounts: number[];
  waiverAmounts: number[];
}) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const subtotal = round(input.lines.reduce((sum, line) => sum + line.amount, 0));
  const discount = round(input.discountAmounts.reduce((sum, amount) => sum + amount, 0));
  const taxableBase = Math.max(0, subtotal - discount);
  const weightedTax = input.lines.reduce(
    (sum, line) => sum + line.amount * ((line.taxRatePercent ?? 0) / 100),
    0
  );
  const tax = round(subtotal > 0 ? weightedTax * (taxableBase / subtotal) : 0);
  const waiver = round(input.waiverAmounts.reduce((sum, amount) => sum + amount, 0));
  return {
    subtotal,
    discount,
    tax,
    waiver,
    finalTotal: round(Math.max(0, subtotal - discount + tax - waiver)),
  };
}

export function adjustmentAmount(
  method: "PERCENT" | "FLAT",
  value: number,
  eligibleAmount: number
): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (method === "PERCENT") {
    if (value > 100) return null;
    return Math.round(eligibleAmount * value) / 100;
  }
  if (value > eligibleAmount) return null;
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// BIL-06 — Receipts, statements, reconciliation and financial audit
// ---------------------------------------------------------------------------

export interface AgingBuckets {
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
  totalOutstanding: number;
}

export function calculateAgingBuckets(
  invoices: Array<{ invoiceDate: Date | string; balanceAmount: number }>,
  asOfDate: Date = new Date()
): AgingBuckets {
  let current = 0;
  let days30 = 0;
  let days60 = 0;
  let days90Plus = 0;

  const nowMs = asOfDate.getTime();

  for (const inv of invoices) {
    const bal = Math.max(0, inv.balanceAmount || 0);
    if (bal <= 0) continue;

    const invDate = new Date(inv.invoiceDate);
    const diffDays = Math.floor((nowMs - invDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      current += bal;
    } else if (diffDays <= 60) {
      days30 += bal;
    } else if (diffDays <= 90) {
      days60 += bal;
    } else {
      days90Plus += bal;
    }
  }

  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const totalOutstanding = round(current + days30 + days60 + days90Plus);

  return {
    current: round(current),
    days30: round(days30),
    days60: round(days60),
    days90Plus: round(days90Plus),
    totalOutstanding,
  };
}

export interface DailyCollectionReconciliation {
  totalCollected: number;
  byMethod: Record<string, number>;
  transactionCount: number;
}

export function reconcileDailyCollections(
  payments: Array<{
    amount: number;
    paymentMethod: string;
    collectedBy?: string | null;
    createdAt: Date | string;
  }>
): DailyCollectionReconciliation {
  let totalCollected = 0;
  const byMethod: Record<string, number> = {
    CASH: 0,
    CARD: 0,
    UPI: 0,
    INSURANCE: 0,
    BANK_TRANSFER: 0,
  };

  for (const p of payments) {
    const amt = Math.max(0, p.amount || 0);
    totalCollected += amt;
    const method = p.paymentMethod?.toUpperCase() || "CASH";
    byMethod[method] = (byMethod[method] || 0) + amt;
  }

  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  for (const key of Object.keys(byMethod)) {
    byMethod[key] = round(byMethod[key]);
  }

  return {
    totalCollected: round(totalCollected),
    byMethod,
    transactionCount: payments.length,
  };
}

export function generateReceiptNumber(paymentId: string | number, timestamp: Date = new Date()): string {
  const yyyy = timestamp.getFullYear();
  const mm = String(timestamp.getMonth() + 1).padStart(2, "0");
  const suffix = typeof paymentId === "string" ? paymentId.slice(-6).toUpperCase() : String(paymentId).padStart(6, "0");
  return `RCP-${yyyy}${mm}-${suffix}`;
}

