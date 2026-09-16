CREATE INDEX IF NOT EXISTS stock_transfer_worklist_idx
ON "StockTransfer" (status, "createdAt");
