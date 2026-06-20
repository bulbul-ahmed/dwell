-- Config system tables (admin-managed). Idempotent.

CREATE TABLE IF NOT EXISTS "blocks" (
  "id"         serial PRIMARY KEY,
  "name"       text NOT NULL,
  "area_name"  text NOT NULL DEFAULT 'Aftab Nagar',
  "active"     boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "amenities" (
  "id"         serial PRIMARY KEY,
  "label"      text NOT NULL,
  "active"     boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id"         serial PRIMARY KEY,
  "label"      text NOT NULL,
  "slug"       text NOT NULL,
  "bg"         text NOT NULL DEFAULT '#EEF3F8',
  "fg"         text NOT NULL DEFAULT '#1E3A5C',
  "active"     boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pricing_plans" (
  "id"          serial PRIMARY KEY,
  "name"        text NOT NULL,
  "price"       integer NOT NULL DEFAULT 0,
  "period"      text NOT NULL DEFAULT 'mo',
  "description" text NOT NULL DEFAULT '',
  "active"      boolean NOT NULL DEFAULT false,
  "sort_order"  integer NOT NULL DEFAULT 0,
  "created_at"  timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "config_audit" (
  "id"          serial PRIMARY KEY,
  "admin_name"  text NOT NULL,
  "admin_email" text NOT NULL,
  "entity"      text NOT NULL,
  "entity_id"   integer,
  "action"      text NOT NULL,
  "summary"     text NOT NULL,
  "created_at"  timestamp NOT NULL DEFAULT now()
);
