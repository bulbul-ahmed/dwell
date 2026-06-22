-- 0008 — Signup: marketing/SMS consent + ToS acceptance timestamp.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketing_consent" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tos_accepted_at" timestamp;
