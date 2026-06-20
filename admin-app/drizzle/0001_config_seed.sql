-- Seed config tables from the previously-hardcoded constants. Idempotent (only seeds when empty).

-- Amenities (was AMENITIES const)
INSERT INTO "amenities" ("label", "sort_order")
SELECT v.label, v.ord FROM (VALUES
  ('Generator', 0), ('Gas', 1), ('Lift', 2), ('Car parking', 3), ('Security guard', 4),
  ('CCTV', 5), ('Rooftop access', 6), ('Water supply 24/7', 7), ('Intercom', 8)
) AS v(label, ord)
WHERE NOT EXISTS (SELECT 1 FROM "amenities");

-- Categories (was CATEGORIES const)
INSERT INTO "categories" ("label", "slug", "bg", "fg", "sort_order")
SELECT v.label, v.slug, v.bg, v.fg, v.ord FROM (VALUES
  ('Rent',    'rent',    '#EEF3F8', '#1E3A5C', 0),
  ('Buy',     'buy',     '#E7F1EC', '#2E7D55', 1),
  ('Sublet',  'sublet',  '#F7EFDD', '#9A6A1F', 2),
  ('Student', 'student', '#F8E8E3', '#B4402B', 3),
  ('Room',    'room',    '#EEF0F3', '#5A6172', 4)
) AS v(label, slug, bg, fg, ord)
WHERE NOT EXISTS (SELECT 1 FROM "categories");

-- Pricing plans (was PRICING const). price in whole BDT.
INSERT INTO "pricing_plans" ("name", "price", "period", "description", "sort_order")
SELECT v.name, v.price, 'mo', v.descr, v.ord FROM (VALUES
  ('Featured listing',   4500, 'Boost to top of search',     0),
  ('Priority placement', 2800, 'Category homepage slot',      1),
  ('Owner Pro badge',    1200, 'Verified badge + analytics',  2),
  ('Spotlight banner',   7000, 'Full-width hero placement',   3)
) AS v(name, price, descr, ord)
WHERE NOT EXISTS (SELECT 1 FROM "pricing_plans");

-- Blocks: seed canonical list from existing observed areas (verified listings), one-time.
-- Strip the redundant ", Aftab Nagar" suffix and skip blank areas.
INSERT INTO "blocks" ("name", "area_name", "sort_order")
SELECT DISTINCT ON (cleaned) cleaned, 'Aftab Nagar', 0
FROM (
  SELECT btrim(regexp_replace(l.area, ',\s*Aftab Nagar$', '')) AS cleaned
  FROM "listings" l
  WHERE l.verified = true AND btrim(l.area) <> ''
) s
WHERE NOT EXISTS (SELECT 1 FROM "blocks");
