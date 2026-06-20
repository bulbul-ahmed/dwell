-- Add admin-editable icon to amenities. Idempotent.

ALTER TABLE "amenities" ADD COLUMN IF NOT EXISTS "icon" text NOT NULL DEFAULT '';

-- Backfill icons for the originally-seeded labels (was the consumer hardcoded map).
UPDATE "amenities" SET "icon" = v.icon FROM (VALUES
  ('Generator',         '⚡'),
  ('Gas',               '🔥'),
  ('Lift',              '🛗'),
  ('Car parking',       '🅿️'),
  ('Security guard',    '🔒'),
  ('CCTV',              '📷'),
  ('Rooftop access',    '🌇'),
  ('Water supply 24/7', '💧'),
  ('Intercom',          '📞')
) AS v(label, icon)
WHERE "amenities"."label" = v.label AND ("amenities"."icon" = '' OR "amenities"."icon" IS NULL);
