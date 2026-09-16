CREATE INDEX IF NOT EXISTS prescription_worklist_priority_idx
ON "Prescription" (status, priority, "createdAt");
