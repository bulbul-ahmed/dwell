-- 0005 — Visit lifecycle: reschedule + decline reason + 'suggested' status
-- Idempotent, applied directly via psql (repo applies SQL by hand).
-- NOTE: ALTER TYPE ... ADD VALUE must be committed before the new value is used,
-- so it runs as its own statement ahead of the column adds.

ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'suggested';

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "suggested_date" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "suggested_time" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "decline_reason" text;
