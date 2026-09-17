CREATE UNIQUE INDEX IF NOT EXISTS queue_one_active_token_per_doctor
ON "QueueToken" ("doctorId")
WHERE status IN ('CALLED', 'IN_CONSULTATION');
