-- 0006 — Visit reminders: idempotency marker for the reminder cron.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp;
