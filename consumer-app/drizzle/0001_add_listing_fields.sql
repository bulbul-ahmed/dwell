ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "property_type" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "available_from" text;--> statement-breakpoint
UPDATE "listings" SET "property_type" = 'flat'   WHERE "property_type" IS NULL AND "cat" IN ('rent','buy','sublet');--> statement-breakpoint
UPDATE "listings" SET "property_type" = 'room'   WHERE "property_type" IS NULL AND "cat" IN ('room','student');--> statement-breakpoint
UPDATE "listings" SET "available_from" = 'immediate' WHERE "available_from" IS NULL;
