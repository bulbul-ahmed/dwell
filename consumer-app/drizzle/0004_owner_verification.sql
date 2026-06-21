-- 0004 — Owner/Agency verification fields
-- Idempotent: applied directly via psql (repo applies SQL by hand, not drizzle-kit journal).

-- owner_status enum (guarded — CREATE TYPE has no IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "owner_status" AS ENUM
    ('unverified','phone_verified','kyc_verified','agency_pending','agency_verified','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- owners verification columns
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "verified"         boolean NOT NULL DEFAULT false;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "phone"            text;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "status"           "owner_status" NOT NULL DEFAULT 'unverified';
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "nid_number"       text;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "nid_doc_url"      text;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "business_name"    text;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "trade_license"    text;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "business_doc_url" text;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "verified_by"      integer;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "verified_at"      timestamp;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "created_at"       timestamp NOT NULL DEFAULT now();

-- Backfill existing seed owners so current data stays trusted/visible post-migration.
-- New owners created after this start at 'unverified'.
UPDATE "owners" SET "status" =
  CASE WHEN "type" = 'Agency' THEN 'agency_verified'::owner_status
       ELSE 'kyc_verified'::owner_status END
WHERE "status" = 'unverified';
