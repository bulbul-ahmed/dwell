CREATE TABLE IF NOT EXISTS "price_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"avg_price" integer NOT NULL,
	"median_price" integer NOT NULL,
	"per_sqft" integer NOT NULL,
	"sample_size" integer NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "price_snapshots_scope_captured_idx" ON "price_snapshots" ("scope","captured_at");
