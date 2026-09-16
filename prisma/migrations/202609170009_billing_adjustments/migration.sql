CREATE INDEX IF NOT EXISTS invoice_adjustment_approval_idx
ON "InvoiceAdjustment" ("invoiceId", status);
