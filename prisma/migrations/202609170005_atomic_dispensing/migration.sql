CREATE INDEX IF NOT EXISTS dispensation_patient_history_idx
ON "Dispensation" ("patientId", "dispensedAt");

CREATE INDEX IF NOT EXISTS dispensing_batch_trace_idx
ON "DispensationItem" ("batchId");
