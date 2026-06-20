---
name: project-dwell
description: Stack, location, build order, config gotchas for Dwell consumer app and admin panel
metadata:
  type: project
---

## Consumer App
- Path: `/Users/bulbulahmed/start/Dwell/consumer-app/`
- Port: 3001
- Stack: Next.js 15 + TypeScript + Tailwind + Drizzle ORM + PostgreSQL (port 5434)
- Auth: JWT via `jose`, cookie name `dwell_token`, secret in `JWT_SECRET` env
- DB: `drizzle-orm/postgres-js`, schema at `src/db/schema.ts`
- Fonts: Plus Jakarta Sans + Instrument Serif (Google Fonts)
- Key libs: Radix UI, Framer Motion, Zustand, Lucide React, Stream Chat

## Admin App
- Path: `/Users/bulbulahmed/start/Dwell/admin-app/`
- Port: 3002
- Stack: Same as consumer (Next.js 15, TypeScript, Tailwind, Drizzle, same DB)
- Auth: Reads same `dwell_token` cookie, checks `role === 'admin'`
- Route guard: `src/proxy.ts` (Next 16 uses "proxy" not "middleware")
- Admin user: `admin@dwell.bd` / `admin123` (role: admin, id: 5, name: Shamim Ahsan)
- Screens: Dashboard, Moderation queue, Moderation review, Listings, Listing detail, Edit listing, Users, User detail, Reports, Analytics, Areas & Config, Audit Log, Settings
- Design tokens: dark navy sidebar (#16273F→#0E1A2C), canvas #F4F6F9, navy text #15243B
- CSS classes: `bv-lift`, `bv-press`, `bv-fill`, `bv-nav`, `bv-rowh`, `bv-skel` — defined in globals.css
- No consumer API wiring needed — admin reads DB directly via own Drizzle instance

## Provider App
- Path: `/Users/bulbulahmed/start/Dwell/provider-app/`
- Port: 3003
- Stack: Same as admin (Next.js 16, TypeScript, Tailwind, Zustand, Lucide React) — no Framer Motion
- Auth: Not yet wired — mock data only, no route guard yet
- Screens (9): Overview, My Listings, Listing Detail `/listings/[id]`, Leads, Visits, Reviews, Boost & Promote, Analytics, Profile & Settings
- Route group: `app/(provider)/` — shared sidebar+header layout
- Mock data: `src/lib/provider/data.ts`; badge colors: `badge.ts`; BDT formatter: `formatters.ts`
- Toast: Zustand store at `src/lib/provider/toast-store.ts`
- Extra Tailwind animations: `bvriseX` (scaleX 0→1 for horizontal progress bars) in addition to standard `bvrise`
- "List a property" button → toast (wizard lives in main consumer app)
- Boost page reads `?listing=` query param for which listing to boost

## Shared DB
- URL: `postgresql://dwell:dwell@localhost:5434/dwell`
- Schema: users (renter/owner/admin roles), listings (verified=false means pending moderation), owners, bookings, reviews, threads, messages, notifications, saves

## Config gotchas
- Next 16: use `proxy.ts` not `middleware.ts`, export function named `proxy` not `middleware`
- CSS `@import` must come before `@tailwind` directives in globals.css
- `drizzle-kit` commands need `DATABASE_URL=...` prefix
- bcryptjs needed in admin-app (add to deps)

**Why:** Dwell is a Dhaka rental marketplace (Aftab Nagar area focus). Consumer app is the public marketplace. Admin app is the moderation/management console.
**How to apply:** Match this stack exactly for any new features. Don't introduce new auth patterns — reuse `dwell_token` JWT.
