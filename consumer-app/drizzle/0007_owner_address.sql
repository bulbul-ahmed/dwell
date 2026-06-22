-- 0007 — Owner address (collected during become-owner onboarding).
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "address" text;
