import {
  pgTable, serial, text, integer, boolean, timestamp,
  primaryKey, pgEnum, real, jsonb, doublePrecision,
} from 'drizzle-orm/pg-core';

export const zones = pgTable('zones', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  areaName:  text('area_name').notNull(),
  polygon:   jsonb('polygon').notNull(),
  color:     text('color').notNull().default('#1E3A5C'),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Enums ────────────────────────────────────────────────────────────────────

export const listingCatEnum = pgEnum('listing_cat', ['rent', 'buy', 'sublet', 'student', 'room', 'office']);
export const ownerTypeEnum  = pgEnum('owner_type',  ['Agency', 'Owner']);
export const ownerStatusEnum = pgEnum('owner_status', ['unverified', 'phone_verified', 'kyc_verified', 'agency_pending', 'agency_verified', 'suspended']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed', 'suggested']);
export const senderRoleEnum  = pgEnum('sender_role',  ['me', 'other']);
export const userRoleEnum    = pgEnum('user_role',    ['renter', 'owner', 'admin']);
export const notifTypeEnum   = pgEnum('notif_type',   ['visit', 'message', 'listing', 'review', 'system']);

// ── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  phone:        text('phone'),
  avatarUrl:    text('avatar_url'),
  passwordHash: text('password_hash'),
  role:         userRoleEnum('role').default('renter').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

// ── OTP Codes ────────────────────────────────────────────────────────────────

export const otpCodes = pgTable('otp_codes', {
  id:        serial('id').primaryKey(),
  email:     text('email').notNull(),
  codeHash:  text('code_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used:      boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Owners ───────────────────────────────────────────────────────────────────

export const owners = pgTable('owners', {
  id:           serial('id').primaryKey(),
  name:         text('name').notNull(),
  type:         ownerTypeEnum('type').notNull(),
  rating:       real('rating').notNull().default(4.5),
  responseTime: text('response_time'),
  verified:       boolean('verified').notNull().default(false),
  phone:          text('phone'),
  status:         ownerStatusEnum('status').notNull().default('unverified'),
  nidNumber:      text('nid_number'),
  nidDocUrl:      text('nid_doc_url'),
  businessName:   text('business_name'),
  tradeLicense:   text('trade_license'),
  businessDocUrl: text('business_doc_url'),
  address:        text('address'),
  verifiedBy:     integer('verified_by'),
  verifiedAt:     timestamp('verified_at'),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  userId:       integer('user_id').references(() => users.id),
});

// ── Listings ─────────────────────────────────────────────────────────────────

export const listings = pgTable('listings', {
  id:         serial('id').primaryKey(),
  cat:        listingCatEnum('cat').notNull(),
  title:      text('title').notNull(),
  area:       text('area').notNull(),
  price:      integer('price').notNull(),
  beds:       integer('beds').notNull(),
  baths:      integer('baths').notNull(),
  size:       integer('size').notNull(),
  floor:      text('floor').notNull(),
  furnishing: text('furnishing').notNull(),
  pref:       text('pref').notNull(),
  advance:    integer('advance').notNull().default(0),
  service:    integer('service').notNull().default(0),
  verified:   boolean('verified').notNull().default(false),
  sale:       boolean('sale').notNull().default(false),
  ownerId:    integer('owner_id').notNull().references(() => owners.id),
  cover:      text('cover').notNull(),
  shots:      text('shots').array().notNull().default([]),
  shotCats:   text('shot_cats').array(),
  amenities:  text('amenities').array().notNull().default([]),
  mapX:       text('map_x'),
  mapY:       text('map_y'),
  mapLat:     doublePrecision('map_lat'),
  mapLng:     doublePrecision('map_lng'),
  zoneId:     integer('zone_id').references(() => zones.id),
  description:  text('description'),
  propertyType: text('property_type'),
  availableFrom: text('available_from'),
  landmark:    text('landmark'),
  facing:      text('facing'),
  balconies:   integer('balconies').default(0),
  totalFloors: text('total_floors'),
  videos:            text('videos').array(),
  meta:              jsonb('meta'),
  views:             integer('views').notNull().default(0),
  moderationStatus:  text('moderation_status').notNull().default('pending'),
  rejectionReason:   text('rejection_reason'),
  createdAt:         timestamp('created_at').defaultNow().notNull(),
});

// ── Reports (community flags on listings → admin-only moderation) ─────────────

export const reports = pgTable('reports', {
  id:             serial('id').primaryKey(),
  listingId:      integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  reporterUserId: integer('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
  reason:         text('reason').notNull(),
  details:        text('details'),
  status:         text('status').notNull().default('open'),   // 'open' | 'resolved'
  resolvedAs:     text('resolved_as'),                         // 'dismissed' | 'removed'
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  resolvedAt:     timestamp('resolved_at'),
});

// ── Saves ────────────────────────────────────────────────────────────────────

export const saves = pgTable('saves', {
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.userId, t.listingId] })]);

// ── Bookings (visit requests) ─────────────────────────────────────────────────

export const bookings = pgTable('bookings', {
  id:        serial('id').primaryKey(),
  listingId: integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slot:      text('slot').notNull(),
  visitDate: text('visit_date'),
  visitTime: text('visit_time'),
  note:      text('note'),
  status:    bookingStatusEnum('status').notNull().default('pending'),
  suggestedDate: text('suggested_date'),
  suggestedTime: text('suggested_time'),
  declineReason: text('decline_reason'),
  reminderSentAt: timestamp('reminder_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Threads & Messages ────────────────────────────────────────────────────────

export const threads = pgTable('threads', {
  id:          serial('id').primaryKey(),
  listingId:   integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  userId:      integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessage: text('last_message'),
  lastAt:      timestamp('last_at').defaultNow().notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id:         serial('id').primaryKey(),
  threadId:   integer('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  senderRole: senderRoleEnum('sender_role').notNull(),
  content:    text('content').notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

// ── Notifications ─────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:      notifTypeEnum('type').notNull().default('system'),
  title:     text('title').notNull(),
  body:      text('body').notNull(),
  href:      text('href').notNull().default('/'),
  icon:      text('icon').notNull().default('ti-bell'),
  icoBg:     text('ico_bg').notNull().default('#EEF3F8'),
  icoFg:     text('ico_fg').notNull().default('#1E3A5C'),
  read:      boolean('read').notNull().default(false),
  threadId:  integer('thread_id'),
  count:     integer('count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Price snapshots (market trend over time) ──────────────────────────────────
// One row per (scope, capture) — written by the periodic snapshot job. Lets the
// insights trend chart plot real market movement instead of inferring it from
// listing createdAt. scope = 'rent' | 'buy'.

export const priceSnapshots = pgTable('price_snapshots', {
  id:          serial('id').primaryKey(),
  scope:       text('scope').notNull(),
  avgPrice:    integer('avg_price').notNull(),
  medianPrice: integer('median_price').notNull(),
  perSqft:     integer('per_sqft').notNull(),
  sampleSize:  integer('sample_size').notNull(),
  capturedAt:  timestamp('captured_at').defaultNow().notNull(),
});

// ── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable('reviews', {
  id:          serial('id').primaryKey(),
  listingId:   integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  userId:      integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating:      integer('rating').notNull(),
  subRatings:  jsonb('sub_ratings'),
  comment:     text('comment'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

// ── Amenities master (admin-managed; read-only here for icon lookup) ──────────

export const amenities = pgTable('amenities', {
  id:        serial('id').primaryKey(),
  label:     text('label').notNull(),
  icon:      text('icon').notNull().default(''),
  active:    boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
