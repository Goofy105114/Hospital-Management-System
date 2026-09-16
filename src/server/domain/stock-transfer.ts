import { StockTransferStatus } from "@prisma/client";

export function validateTransferRequest(input: {
  quantity: number;
  fromLocationId: string;
  toLocationId: string;
}): string | null {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0)
    return "INV_TRANSFER_INVALID_QUANTITY";
  if (input.fromLocationId === input.toLocationId) return "INV_TRANSFER_SAME_LOCATION";
  return null;
}

export function canTransitionTransfer(from: StockTransferStatus, to: StockTransferStatus): boolean {
  return (
    (from === StockTransferStatus.REQUESTED && to === StockTransferStatus.DISPATCHED) ||
    (from === StockTransferStatus.DISPATCHED && to === StockTransferStatus.RECEIVED) ||
    (from === StockTransferStatus.REQUESTED && to === StockTransferStatus.CANCELLED)
  );
}
