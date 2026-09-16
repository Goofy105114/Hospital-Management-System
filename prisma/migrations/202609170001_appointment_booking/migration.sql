CREATE SEQUENCE IF NOT EXISTS appointment_number_seq START 1;

DROP INDEX IF EXISTS "Appointment_doctorId_slotStart_status_key";

CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_doctor_slot_unique
ON "Appointment" ("doctorId", "slotStart")
WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS');

CREATE INDEX IF NOT EXISTS appointments_patient_window_idx
ON "Appointment" ("patientId", "slotStart", "slotEnd");
