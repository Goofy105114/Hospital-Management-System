CREATE INDEX IF NOT EXISTS diagnostic_report_patient_history_idx
ON "DiagnosticReport" ("patientId", "releasedAt", "generatedAt");
