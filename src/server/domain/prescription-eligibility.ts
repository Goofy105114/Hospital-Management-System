import { PrescriptionStatus } from "@prisma/client";

export function assessPrescriptionEligibility(input: {
  status: PrescriptionStatus;
  createdAt: Date;
  validUntil?: Date | null;
  now?: Date;
  hasInactiveMedicine?: boolean;
}): string | null {
  const now = input.now ?? new Date();
  if (input.status === PrescriptionStatus.DISPENSED) return "PHA_RX_ALREADY_DISPENSED";
  if (input.status === PrescriptionStatus.REJECTED) return "PHA_RX_REJECTED";
  const expiresAt = input.validUntil ?? new Date(input.createdAt.getTime() + 30 * 86_400_000);
  if (expiresAt < now) return "PHA_RX_EXPIRED";
  if (input.hasInactiveMedicine) return "PHA_MEDICINE_INACTIVE";
  return null;
}
