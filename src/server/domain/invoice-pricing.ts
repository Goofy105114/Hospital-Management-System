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
