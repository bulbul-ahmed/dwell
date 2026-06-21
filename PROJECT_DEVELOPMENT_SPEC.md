# Dwell — Project Development Specification

> **Single source of truth for development.** This document is derived from the SRS (`Dwell_SRS_1.docx`, internal product name **"BariVara"**, v1.0 Draft, June 2026). A developer or AI coding assistant should be able to build, extend, and verify the entire product from this file alone, **without reading the original SRS**.

---

## 0. Document Control & How To Use This Spec

| Field | Value |
|---|---|
| Product name (SRS) | BariVara |
| Product name (repository / build) | **Dwell** |
| One-liner | Property rental & sales marketplace for Bangladesh |
| Launch market | Aftab Nagar, Dhaka, Bangladesh (single neighbourhood, hyper-local) |
| Phase 1 | Responsive mobile-first web app (PWA) + admin back office |
| Phase 2 | Native mobile apps (Flutter — iOS & Android) on the same APIs |
| SRS version | 1.0 (Draft), June 2026 |
| Spec generated | 2026-06-21 |

> **Naming reconciliation:** the SRS uses "BariVara" throughout. The actual codebase ships under the name **Dwell** (domains `dwell.bd`, `admin.dwell.bd`, `provider.dwell.bd`; DB `dwell`; JWT cookie `dwell_token`). Treat "BariVara" and "Dwell" as the same product. Use **Dwell** in all new code, copy, and assets.

### How an AI agent should use this document

1. **To build a feature:** open the relevant Module section. Each module is self-contained — Purpose → Functional Requirements → User Stories → Business Rules → UI/UX → Validation → Permissions → API → Data → Errors → Edge Cases → Acceptance Criteria → Testing Checklist.
2. **To audit the codebase against requirements:** use the **Requirement Traceability Matrix** (Section 3) and each module's **Acceptance Criteria** + **Testing Checklist**. Every requirement has a stable ID (`FR-x.y`) so a gap report can cite IDs.
3. **To detect missing/incomplete features:** compare the **Codebase Mapping** (Section 2) and per-module acceptance criteria against the implemented routes and DB schema.

### Requirement priority legend

| Priority | Meaning |
|---|---|
| **Must** | MVP — required for first launch |
| **Should** | Post-MVP near-term |
| **Could** | Future / nice-to-have |

### Phase tags

`MVP` · `MVP+` · `Phase 1.5` · `Phase 2` · `Phase 2+` · `Phase 3` · `Later`

---

## 1. Product Overview

### 1.1 Purpose & Vision

Dwell is a **two-sided marketplace** connecting **property seekers** (tenants, buyers, students, sublet/room seekers) with **property providers** (individual owners, landlords, real-estate agencies). It facilitates discovery, communication, visit scheduling, and trust-building.

**Vision:** Become the most trusted and visually delightful way to find and list property in Bangladesh — starting hyper-local in Aftab Nagar and expanding city by city — with an **Airbnb-grade experience** locals have never seen in this category.

### 1.2 Strategic Principles (these govern prioritisation — do not violate)

1. **Liquidity before monetisation.** An empty marketplace is worth nothing. For the first 6–12 months in Aftab Nagar, the only goal is supply + demand liquidity. **Most paid features stay OFF at launch** (including featured slots), and are gated behind reaching ~100+ live listings.
2. **Charge providers, free for seekers — forever.** Searching, filtering, viewing, favouriting, chatting, and requesting visits are **always free**. Revenue comes only from providers paying for visibility/volume. Never charge seekers; never charge a basic listing fee that would suppress supply.
3. **Genuine verification is the central brand promise.** Being single-neighbourhood, Dwell can physically verify each Aftab Nagar listing — a promise national incumbents cannot match. Make verification loud across the brand.
4. **Area-agnostic architecture.** Expansion to new areas/cities must be a **configuration + data** exercise, not re-engineering.
5. **Bangladesh-first.** Bangla + English, ৳ (BDT) formatting and Bangla numerals, phone-first identity (OTP), MFS payments (bKash/Nagad/Rocket), low-bandwidth performance, WhatsApp-native behaviour.

### 1.3 User Classes

| User Class | Key Needs |
|---|---|
| **Tenant (Flat/Office Rent)** | Find flat/office to rent within budget, location, amenity filters; schedule visits; chat with owners. |
| **Buyer (Flat/Office Purchase)** | Purchase residential/commercial property; needs price, area, legal/ownership clarity, agent contact. |
| **Sublet Seeker** | Short-term/shared accommodation; filter by term length, furnished, shared/private. |
| **Room Seeker** | Single room (bachelor/family); price-sensitive; gender & occupancy rules. |
| **Student** | Hostel seat or single accommodation near campus; budget-driven; seat-level booking. |
| **Individual Owner** | List one/few properties; quick listing, genuine leads, visit scheduling. |
| **Agency / Real-estate** | List many properties; bulk tools, branded profile, team seats, lead management, subscription billing. |
| **Administrator** | Moderate content, verify users/listings, resolve disputes, monitor analytics. |

### 1.4 Roles (system)

`seeker` · `provider` (individual owner) · `agency` · `admin`. **A single account can act as both seeker and provider via role switching** (FR-1.3).

> **Repo note:** the implemented DB uses role values `renter` (= seeker), `owner` (= provider/agency), `admin`. Agency vs individual is distinguished on the `owners` table (`ownerType`). When this spec says `seeker`/`provider`, map to `renter`/`owner` in current code.

---

## 2. System Architecture & Codebase Mapping

### 2.1 Logical Components (from SRS §2.1)

1. **Public Web / PWA** — discovery, search, listing browsing; accessible **without login**.
2. **Seeker & Provider Workspaces** — authenticated dashboards for listings, requests, chats, reviews.
3. **Real-time Services** — chat, notifications, visit-request status updates.
4. **Admin Console** — moderation, verification, analytics, configuration.
5. **Mobile Apps (Phase 2)** — native iOS/Android consuming the same APIs.

### 2.2 Recommended Technology Stack (SRS §6)

| Layer | Technology | Rationale |
|---|---|---|
| Web frontend | **Next.js (React) + TypeScript, Tailwind CSS** | SSR/SSG SEO, fast, component-driven, per-area landing pages. |
| UI system | Tailwind + Radix/shadcn, **Framer Motion** | Polished, consistent, animated components. |
| Mobile (Phase 2) | **Flutter (Dart)** | Single iOS+Android codebase on same APIs (chosen over React Native). |
| Backend / API | **NestJS (Node + TypeScript)** | Structured, scalable REST/GraphQL; shared types with frontend. |
| Primary DB | **PostgreSQL + PostGIS** | Relational integrity + geospatial queries for map/radius search. |
| Search | Elasticsearch / Meilisearch / Typesense | Fast, typo-tolerant, faceted filtering. |
| Cache & queues | **Redis** | Sessions, hot caches, rate limiting, background jobs. |
| Real-time chat | WebSocket (Socket.IO) or managed service | Live messaging, typing/read receipts, presence. |
| Media / CDN | S3-compatible object storage + CDN | Scalable image/video hosting with transforms. |
| Notifications | **FCM** (push) + local SMS gateway + email (SES/SendGrid) | Multi-channel alerts. |
| Payments | **bKash / Nagad / Rocket + SSLCOMMERZ/Stripe** | Local MFS + card coverage. |
| Maps | **Mapbox / Google Maps + custom area polygons** | Aftab Nagar block boundaries. |
| Auth | **OTP (SMS) + JWT/refresh tokens + social login** | Phone-first identity. |
| Infra | Docker + AWS/GCP (Singapore/Mumbai), CI/CD | Containerised, low-latency. |
| Observability | Sentry + centralised logs + metrics | Error tracking + perf visibility. |

> **As-built note (current repo):** The Phase-1 web is implemented as **three separate Next.js apps** sharing one PostgreSQL DB via **Drizzle ORM** (not yet a separate NestJS backend). Auth is JWT via `jose` in cookie `dwell_token`. Chat uses **Stream Chat** in the consumer app. This differs from the SRS target (NestJS + Socket.IO) but satisfies Phase-1 functional needs. New backend work may either continue the Next.js API-route approach or introduce NestJS per the SRS — either is acceptable provided the API contract and data model below are honoured.

### 2.3 As-Built Codebase Map (for verification)

| App | Path | Port | Domain | Auth check |
|---|---|---|---|---|
| Consumer (seeker + provider light) | `consumer-app/` | 3001 | `dwell.bd` | `dwell_token` |
| Admin console | `admin-app/` | 3002 | `admin.dwell.bd` | `role === 'admin'` |
| Provider/agency dashboard | `provider-app/` | 3003 | `provider.dwell.bd` | `role === 'owner'` |

**Shared DB:** `postgresql://dwell:dwell@localhost:5434/dwell`. Schema (Drizzle): `users` (renter/owner/admin), `listings`, `owners`, `bookings` (visits), `reviews`, `threads`, `messages`, `saves`, `notifications`, `zones`.

**Consumer routes implemented:** `/`, `/auth`, `/search`, `/listings`, `/listings/[id]`, `/messages`, `/saved`, `/notifications`, `/list` (listing wizard), `/insights`, `/account`, `/providers/[id]`, `/review/[id]`, `/visits`, `/api`.

**Admin screens:** Dashboard, Moderation, Listings, Users, Reports, Analytics, Areas & Config, Audit Log, Settings.

**Provider screens:** Overview, My Listings, Listing Detail, Leads, Visits, Reviews, Boost, Analytics, Profile.

> **Module → route mapping** is listed inside each module section under "Codebase Mapping" so an auditor can jump straight to the implementing files.

### 2.4 Cross-cutting config conventions (must match existing code)

- Next 16 (provider/admin): use `proxy.ts` (export `proxy`), **not** `middleware.ts`.
- Drizzle IN queries: use `inArray(col, ids)` — **never** `sql\`ANY(ARRAY[...])\``.
- Password hashing: `bcryptjs` (not `bcrypt`); `@types/bcryptjs` in devDependencies.
- Provider/admin apps: **CSS animations only** (no Framer Motion). Consumer app uses Framer Motion.
- Map pins on the search map require a **vector Map ID** — `AdvancedMarker` pins vanish in raster mode (known gotcha).

---

## 3. Requirement Traceability Matrix

Every functional requirement, with priority, phase, and owning module. Use these IDs in any gap/audit report.

| ID | Requirement (short) | Priority | Phase | Module |
|---|---|---|---|---|
| FR-1.1 | Register/login via mobile number + SMS OTP (primary) | Must | MVP | M1 |
| FR-1.2 | Optional email + social login (Google/Facebook/Apple) | Should | MVP+ | M1 |
| FR-1.3 | One account = seeker + provider via role switching | Must | MVP | M1 |
| FR-1.4 | Complete profile (name, photo, contact, language) | Must | MVP | M1 |
| FR-1.5 | KYC via NID/passport upload + verified badge | Should | MVP+ | M1 / M13 |
| FR-1.6 | Agency business accounts: trade licence + team seats | Should | Phase 3 | M1 / M10 |
| FR-1.7 | Password reset, session mgmt, device logout | Must | MVP | M1 |
| FR-1.8 | Account deletion + data export (privacy) | Must | MVP | M1 |
| FR-2.1 | Stepped listing wizard with autosave | Must | MVP | M2 |
| FR-2.2 | Support 7 listing types | Must | MVP | M2 / M3 |
| FR-2.3 | Capture structured attributes per type | Must | MVP | M3 |
| FR-2.4 | Multi photo/video upload, reorder, cover, auto-compress | Must | MVP | M2 |
| FR-2.5 | Map pin; show on area map; optionally hide exact pin | Must | MVP | M2 / M5 |
| FR-2.6 | Draft/preview/publish/pause/rented-sold/re-list | Must | MVP | M2 |
| FR-2.7 | Availability date, rent/price, service charge, negotiable | Must | MVP | M2 |
| FR-2.8 | Agency bulk CSV import + table management | Should | Phase 3 | M10 |
| FR-2.9 | Duplicate detection + expiry + renewal reminders | Should | MVP+ | M2 / M13 |
| FR-2.10 | Listing passes moderation/verification before public | Must | MVP | M2 / M11 |
| FR-4.1 | Universal search bar with intent toggle | Must | MVP | M4 |
| FR-4.2 | Location search (area/block/landmark/map selection) | Must | MVP | M4 |
| FR-4.3 | Full filter set | Must | MVP | M4 |
| FR-4.4 | Sort (relevance/newest/price/nearest/most-viewed) | Must | MVP | M4 |
| FR-4.5 | Map view, clustered pins synced to list | Must | MVP | M4 |
| FR-4.6 | Instant debounced type-ahead + filter chips | Must | MVP | M4 |
| FR-4.7 | Saved searches + alerts (in-app/email/push) | Should | MVP+ | M9 |
| FR-4.8 | Personalised recommendations | Could | Later | M4 |
| FR-4.9 | Recently viewed / trending / similar carousels | Should | MVP+ | M4 |
| FR-4.10 | Draw-on-map / radius / near-me shortcuts | Could | Later | M4 |
| FR-6.1 | Seeker requests visit with proposed slot(s) + note | Must | MVP | M6 |
| FR-6.2 | Provider Accept / Decline / Suggest new time | Must | MVP | M6 |
| FR-6.3 | Seeker Accept or counter-propose; loop until confirmed | Must | MVP | M6 |
| FR-6.4 | On confirm: reminders (in-app/push/SMS) + agenda card | Must | MVP | M6 |
| FR-6.5 | Provider availability windows for valid slots | Should | MVP+ | M6 |
| FR-6.6 | Visit states tracked (6 states) | Must | MVP | M6 |
| FR-6.7 | Reschedule/cancel with reason; history retained | Must | MVP | M6 |
| FR-6.8 | Post-visit review prompt + interest status | Should | MVP+ | M6 / M8 |
| FR-6.9 | Virtual-tour / video-call visit scheduling | Could | Later | M6 |
| FR-7.1 | 1:1 real-time chat tied to a listing | Must | MVP | M7 |
| FR-7.2 | Text, emoji, photos, videos, voice notes, documents | Must | MVP | M7 |
| FR-7.3 | Delivery + read receipts (sent/delivered/read) | Must | MVP | M7 |
| FR-7.4 | Typing indicators + online/last-seen | Should | MVP+ | M7 |
| FR-7.5 | Push/in-app notifications + unread badges | Must | MVP | M7 / M9 |
| FR-7.6 | Inline listing/visit cards + quick-reply templates | Should | MVP+ | M7 |
| FR-7.7 | Reply-to, reactions, in-chat search, pin chats | Should | MVP+ | M7 |
| FR-7.8 | Block, mute, report; spam/abuse filtering | Must | MVP | M7 / M13 |
| FR-7.9 | Media auto-compression + resumable uploads | Must | MVP | M7 |
| FR-7.10 | History persisted + synced web/mobile | Must | MVP | M7 |
| FR-7.11 | Mask phone numbers until consent | Could | Later | M7 / M13 |
| FR-8.1 | Two-way reviews after verified interaction | Must | MVP | M8 |
| FR-8.2 | Star rating + written review + photo/video | Must | MVP | M8 |
| FR-8.3 | Structured sub-ratings | Should | MVP+ | M8 |
| FR-8.4 | Reviews on listing + profiles with aggregates | Must | MVP | M8 |
| FR-8.5 | Owner public response to a review | Should | MVP+ | M8 |
| FR-8.6 | Only verified interactions can review | Must | MVP | M8 |
| FR-8.7 | Report/flag reviews; admin moderation | Must | MVP | M8 / M11 |
| FR-8.8 | Response-rate & response-time metrics on profiles | Should | MVP+ | M8 / M10 |
| FR-11.1 | Moderate/approve/reject listings before public | Must | MVP | M11 |
| FR-11.2 | Verify user/agency docs; assign verified badges | Should | MVP+ | M11 / M13 |
| FR-11.3 | Manage users (suspend/ban/restore); review reports | Must | MVP | M11 |
| FR-11.4 | Configure areas/blocks/amenities/categories/pricing | Must | MVP | M11 / M14 |
| FR-11.5 | Dispute-resolution workflow | Should | MVP+ | M11 |
| FR-11.6 | Platform analytics (supply/demand/conversion/revenue/heatmaps) | Must | MVP | M11 / M15 |
| FR-11.7 | CMS for banners, featured areas, FAQs | Should | MVP+ | M11 |
| FR-11.8 | Audit log of admin actions | Must | MVP | M11 |

**Non-FR modules:** M5 Listing Detail Page (SRS §3.5), M9 Favourites/Saved/Notifications (§3.9), M10 Provider/Agency Dashboard (§3.10), M12 Monetisation (§10), M13 Trust/Safety/Verification (§4.1), M14 Localisation & BD Essentials (§4.3), M15 Area Insights & Analytics (§4.7).

---

## 4. Module Specifications

> Each module follows the same template: **Purpose · Functional Requirements · User Stories · Business Rules · UI/UX · Validation · Permissions · API · Data · Error Handling · Edge Cases · Acceptance Criteria · Testing Checklist · Codebase Mapping.**

---

### M1 — User Accounts, Authentication & Verification

**Covers:** FR-1.1 – FR-1.8 · Phase: MVP (KYC = MVP+, agency = Phase 3)

#### Purpose
Provide phone-first, OTP-based identity for all users, with a single account that can switch between seeker and provider roles, optional social/email linking, KYC verification with a trust badge, agency business accounts, and full privacy controls (deletion + export).

#### Functional Requirements
- **FR-1.1 (Must):** Register & log in using **mobile number + SMS OTP** as the primary method.
- **FR-1.2 (Should):** Optionally link email and social login (Google / Facebook / Apple).
- **FR-1.3 (Must):** A single account acts as **both seeker and provider** via role switching.
- **FR-1.4 (Must):** Complete a profile: name, photo, contact, preferred language.
- **FR-1.5 (Should):** KYC verification via NID/passport upload → verified badge.
- **FR-1.6 (Should):** Agencies register as **business accounts** with trade licence + team member seats.
- **FR-1.7 (Must):** Password reset, session management, device logout.
- **FR-1.8 (Must):** Account deletion + data export honoured per privacy requirements.

#### User Stories
- As a new user, I enter my mobile number, receive an SMS OTP, and log in without a password so onboarding is frictionless.
- As a user who lists property, I switch my active role to "Provider" without creating a second account.
- As an owner, I upload my NID to earn a "Verified" badge so seekers trust me.
- As an agency, I register with a trade licence and invite my team members.
- As a privacy-conscious user, I export my data and delete my account.

#### Business Rules
- **Phone number is the primary identity.** Email is optional/secondary (email penetration is lower than mobile in BD).
- OTP codes expire after a short TTL (recommend 5 minutes) and are single-use; limit resend attempts and rate-limit per phone/IP (anti-abuse).
- Role switching does not change identity — same `user.id`, different active role context.
- KYC verified badge is granted **only** after admin/automated document review (see M11/M13). Unverified users can still transact unless an area policy requires verification.
- Agency accounts gate team seats and bulk tools (M10) behind subscription tier (M12).
- Account deletion must soft-anonymise PII while preserving marketplace integrity records (reviews/transactions de-identified, not silently erased) per legal retention.

#### UI/UX Requirements
- Single combined **auth screen** (`/auth`): phone entry → OTP entry → (first-time) profile completion.
- Clear states: sending OTP, OTP sent (with resend countdown), invalid OTP, locked-out.
- Visible **language switch** (Bangla/English) on auth and everywhere.
- Role switcher accessible from the account menu/header.
- Profile screen (`/account`): editable name, photo, contact, language, verification status, sessions/devices, danger zone (delete/export).

#### Validation Rules
- Phone: valid BD mobile format (e.g., `+8801XXXXXXXXX` / `01XXXXXXXXX`), normalised to E.164 server-side.
- OTP: numeric, fixed length (e.g., 6 digits), TTL-bound, single-use.
- Email (if provided): RFC-valid, unique per account.
- Name: required, 2–60 chars; profile photo: image type, size-limited, auto-compressed.
- KYC docs: allowed types (NID/passport image or PDF), virus-scanned, size-limited.
- Trade licence (agency): required document for business verification.

#### Permissions & Roles
| Action | seeker | provider | agency | admin |
|---|---|---|---|---|
| Register/login (OTP) | ✓ | ✓ | ✓ | ✓ |
| Switch role | ✓ | ✓ | ✓ | n/a |
| Submit KYC | ✓ | ✓ | ✓ | — |
| Approve KYC / assign badge | — | — | — | ✓ |
| Manage team seats | — | — | ✓ (admin of agency) | ✓ |
| Suspend/ban account | — | — | — | ✓ |

#### API / Integration Requirements
- `POST /auth/otp/request` — body `{ phone }` → sends OTP via local SMS aggregator; returns request id + resend cooldown.
- `POST /auth/otp/verify` — body `{ phone, code }` → returns JWT access + refresh tokens (set `dwell_token` cookie), `isNewUser` flag.
- `POST /auth/social` — provider token exchange (Google/Facebook/Apple).
- `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all-devices`.
- `GET/PATCH /me` — profile read/update; `POST /me/avatar`.
- `POST /me/kyc` — upload documents; status `pending|verified|rejected`.
- `POST /agencies` — create business account; `POST /agencies/:id/members` — invite seats.
- `GET /me/export` (data export job), `DELETE /me` (account deletion).
- **Integrations:** SMS OTP aggregator (local), social OAuth providers, virus scanner for uploads.

#### Data Requirements
- `users`: id, phone (unique), email (nullable, unique), name, avatar_url, role (`renter|owner|admin`), preferred_language (`bn|en`), verification_status, created_at, deleted_at (soft).
- `owners`: ownerType (`individual|agency`), agency name, trade_licence_doc, subscription_tier, response_rate, response_time.
- `sessions`/refresh tokens: device, issued_at, revoked_at.
- `kyc_documents`: user_id, type, file_url, status, reviewed_by, reviewed_at.

#### Error Handling
- Invalid/expired OTP → clear inline error + resend option.
- Rate-limit exceeded → cooldown message with retry time.
- SMS delivery failure → fallback messaging + retry; never silently hang.
- Duplicate email/phone → explicit conflict message.
- Upload rejected (virus/oversize/type) → specific reason.

#### Edge Cases
- User changes phone number (re-verify flow; preserve history).
- Same person tries to register twice with the same phone → log in instead.
- OTP arrives after expiry → reject with resend.
- Role switch mid-session must not break active chats/visits.
- Account deletion while having active listings/visits/disputes → must resolve or transfer before hard delete.
- Agency owner leaves → ownership/seat reassignment.

#### Acceptance Criteria
- [ ] A user can complete OTP signup end-to-end and receive a valid `dwell_token`.
- [ ] OTP expires and is single-use; resend is rate-limited.
- [ ] One account can switch between seeker and provider without re-auth.
- [ ] Profile (name, photo, contact, language) is editable and persists.
- [ ] KYC upload sets status `pending` and a badge appears only after approval.
- [ ] Logout invalidates the session; "log out all devices" revokes all refresh tokens.
- [ ] Data export produces the user's data; account deletion anonymises PII while preserving integrity records.

#### Testing Checklist
- [ ] Valid + invalid phone formats (BD).
- [ ] OTP happy path, expiry, reuse, wrong code, resend cooldown, rate limit.
- [ ] Social login link/unlink (when enabled).
- [ ] Role switch persistence across navigation and refresh.
- [ ] KYC: accepted/rejected file types, oversize, malware sample.
- [ ] Session revoke + multi-device logout.
- [ ] Deletion/export legal-retention behaviour.

#### Codebase Mapping
Consumer `/auth`, `/account`; auth lib (`jose` JWT, cookie `dwell_token`, `JWT_SECRET`); `users`/`owners` tables; admin verification screens (M11). Agency seats currently partial (Phase 3).

---

### M2 — Property Listings (Provider Side)

**Covers:** FR-2.1 – FR-2.10 · Phase: MVP (bulk CSV = Phase 3, dup-detect/expiry = MVP+)

#### Purpose
Let providers create rich, structured listings through a guided multi-step wizard with autosave, manage their lifecycle (draft → moderation → live → paused → rented/sold → re-list), and ensure every listing passes moderation/verification before going public.

#### Functional Requirements
- **FR-2.1 (Must):** Stepped wizard: **type → location → details → media → pricing → review → publish**, with **autosave**.
- **FR-2.2 (Must):** Listing types: **Flat for Rent, Flat for Sale, Office for Rent, Office for Sale, Sublet, Single Room, Student Hostel/Seat**.
- **FR-2.3 (Must):** Capture structured attributes per type (see M3).
- **FR-2.4 (Must):** Upload multiple photos + short videos; reorder; set cover image; auto-compress.
- **FR-2.5 (Must):** Pin exact location on map; show on area map; optionally **hide exact pin until visit approved**.
- **FR-2.6 (Must):** Save as draft, preview, publish, pause, mark rented/sold, re-list.
- **FR-2.7 (Must):** Set availability date, rent/price, service charge, negotiable flag.
- **FR-2.8 (Should):** Agencies bulk-import (CSV) + manage many listings in a table view. *(See M10.)*
- **FR-2.9 (Should):** Duplicate-listing detection + listing expiry with renewal reminders. *(See M13 stale-listing decay.)*
- **FR-2.10 (Must):** Listing must pass moderation/verification before going public.

#### User Stories
- As an owner, I create a listing step-by-step, and if I leave mid-way my progress is autosaved.
- As an owner, I upload 10 photos and a short video, reorder them, and pick a cover.
- As an owner, I hide my exact map pin until I approve a visit, for privacy/safety.
- As an owner, I pause a listing while travelling and re-list later.
- As an owner, I mark a flat "rented" so it leaves search but stays in my history.

#### Business Rules
- **No listing is publicly visible until it passes moderation** (status `pending` → `approved`/`rejected`) — FR-2.10. This is the brand-promise gate (M13 verification).
- Required fields per step must be valid before that step is marked complete; publish is blocked until all required fields + at least one photo + a map pin exist.
- Exact-pin gating is configurable per listing; until a visit is approved, show approximate area only (M5).
- Status lifecycle: `draft → pending → approved(live) → paused → rented/sold → relisted(→pending)`. Rejected listings return to draft with reasons.
- Stale-listing decay (M13): listings auto-expire and require one-tap weekly availability re-confirmation; show "verified available on [date]" stamp.
- Negotiable flag affects display ("Negotiable") and may surface in filters.

#### UI/UX Requirements
- Multi-step wizard with progress indicator, autosave toast, back/next, and a final review screen.
- Drag-to-reorder media gallery with cover selection and per-file upload progress; show compression.
- Map step with draggable pin + address/landmark capture + "hide exact pin" toggle.
- Pricing step with rent/price, service charge, advance months, negotiable toggle, availability date picker.
- Provider listing management table (M10): status chips, quick actions (edit/pause/mark/boost).

#### Validation Rules
- Type: required, one of the 7 enums.
- Location: area/block required; map pin lat/lng within Aftab Nagar polygon (configurable per area).
- Media: ≥1 photo to publish; allowed image/video types; per-file + total size caps; auto-compress; videos length-capped (short).
- Price/rent: positive number, BDT; service charge & advance numeric; availability date not in the past.
- Type-specific required attributes enforced (M3).

#### Permissions & Roles
| Action | seeker | provider/agency | admin |
|---|---|---|---|
| Create/edit own listing | — | ✓ | ✓ |
| Publish (submit for moderation) | — | ✓ | ✓ |
| Approve/reject listing | — | — | ✓ |
| Pause / mark rented-sold own listing | — | ✓ | ✓ |
| Bulk CSV import | — | ✓ (agency) | ✓ |

#### API / Integration Requirements
- `POST /listings` (create draft), `PATCH /listings/:id` (autosave step), `POST /listings/:id/publish` (→ moderation), `POST /listings/:id/pause`, `POST /listings/:id/status` (rented/sold/relist).
- `POST /listings/:id/media` (multipart, resumable), `PATCH /listings/:id/media/order`, `PATCH /listings/:id/media/cover`.
- `POST /agencies/:id/listings/import` (CSV).
- `POST /listings/:id/reconfirm` (weekly availability).
- **Integrations:** object storage + CDN with on-the-fly transforms; image/video compression service; map/geocoding; search-index upsert on approve/update/unpublish; virus scan.

#### Data Requirements
- `listings`: id, owner_id, type (enum 7), status (`draft|pending|approved|paused|rented|sold|expired`), title, description, area/block, address, landmark, lat, lng, hide_exact_pin (bool), price, service_charge, advance_months, negotiable (bool), available_from, attributes (JSON per M3), verified (bool), available_confirmed_at, created_at, updated_at, published_at, expires_at.
- `media`: id, listing_id (or review_id), type (photo/video), url, order, is_cover, width/height/duration.

#### Error Handling
- Autosave failure → retry + "unsaved changes" indicator; never lose user input silently.
- Upload failure (network) → resumable retry; show failed items distinctly.
- Publish blocked → list exactly which required fields/steps are missing.
- Rejected by moderation → show reasons; allow edit + resubmit.

#### Edge Cases
- User abandons wizard → draft persists and is resumable.
- Pin placed outside the active area polygon → warn/block per config.
- Duplicate listing (same address/owner) → flag for dedup (FR-2.9).
- Listing expires while paused → handle re-confirm/renew.
- Marking rented/sold should remove from search but keep analytics/history.

#### Acceptance Criteria
- [ ] Wizard autosaves each step; abandoning and returning resumes the draft.
- [ ] All 7 listing types selectable with their attribute sets (M3).
- [ ] Media: multi-upload, reorder, cover selection, compression all work; ≥1 photo required to publish.
- [ ] Map pin captured; "hide exact pin" hides exact location publicly until visit approved.
- [ ] Publish puts the listing in `pending`; it is not publicly searchable until `approved`.
- [ ] Pause / mark rented-sold / re-list transitions work and reflect in search + provider table.
- [ ] Availability date, price, service charge, advance, negotiable persist and display.

#### Testing Checklist
- [ ] Each type's required-field enforcement.
- [ ] Autosave resilience (kill mid-step).
- [ ] Media reorder/cover/compress; oversize/invalid file rejection.
- [ ] Pin-in/out-of-polygon; hide-exact-pin behaviour pre/post visit approval.
- [ ] Moderation gate: pending listing not visible in public search.
- [ ] Status lifecycle transitions + history retention.

#### Codebase Mapping
Consumer `/list` (wizard); provider `My Listings`, `Listing Detail`; `listings` + `media` tables; admin `Moderation`.

---

### M3 — Property Attributes & Categories

**Covers:** SRS §3.3 (FR-2.3 attribute capture) · Phase: MVP

#### Purpose
Define the structured, type-specific attribute schema for each of the 7 listing types so listings are filterable, comparable, and consistent. This module is the **data dictionary** for listing attributes.

#### Listing Types (enum)
`flat_rent` · `flat_sale` · `office_rent` · `office_sale` · `sublet` · `single_room` · `student_hostel`

#### Attribute Sets

**Common (all types):**
| Attribute | Type | Notes |
|---|---|---|
| area/locality | enum/string | Aftab Nagar block |
| address | string | full address |
| map pin | lat/lng | required |
| landmark | string | optional |
| price/rent | number (BDT) | |
| service/maintenance charge | number | |
| advance (months) | number | BD rental economics |
| negotiable | bool | |
| size | number | sq. ft or katha |
| floor number | number | |
| total floors | number | |
| facing direction | enum | N/S/E/W etc. |
| photos | media[] | |
| videos | media[] | short |
| availability date | date | |
| posted-by | enum | owner / agent |

**Residential (Flat / Room / Sublet / Hostel):**
| Attribute | Type | Notes |
|---|---|---|
| bedrooms | number | |
| bathrooms | number | |
| balconies | number | |
| furnishing | enum | unfurnished / semi / furnished |
| tenant preference | enum | family / bachelor / female only / student |
| occupancy limit | number | |
| amenities | multi-enum | lift, generator/backup, parking, gas line, security, CCTV, rooftop access, water supply |

**Hostel / Student (extends residential):**
| Attribute | Type | Notes |
|---|---|---|
| seats per room | number | |
| shared vs single | enum | |
| meals included | bool/enum | |
| gender | enum | |
| curfew/rules | text | |
| distance to campus | number/text | |

**Sublet (extends residential):**
| Attribute | Type | Notes |
|---|---|---|
| term length | number/enum | |
| shared/private | enum | |
| included utilities | multi-enum | |
| current-occupant context | text | |

**Commercial (Office Rent / Sale):**
| Attribute | Type | Notes |
|---|---|---|
| usage type | enum | office, showroom, chamber, co-working |
| layout | enum | open floor vs partitioned |
| washrooms | number | |
| pantry | bool | |
| conference room | bool | |
| lift | bool | |
| parking slots | number | |
| backup power | bool | |
| suitable-for tags | multi-enum | IT, retail, clinic, etc. |
| zoning notes | text | |

**For Sale (Flat / Office Purchase):**
| Attribute | Type | Notes |
|---|---|---|
| ownership type | enum | |
| registration/mutation status | enum/text | |
| deed clarity notes | text | |
| age of building | number | |
| handover status | enum | ready / under-construction |
| expected price per sq.ft | number | |
| loan-eligible | bool | drives EMI tools (M15/future) |
| agent/developer details | object | |

#### Business Rules
- Each type exposes **only** its relevant attribute set in the wizard (M2) and in filters (M4).
- Amenities, areas/blocks, categories, and tenant-preference options are **admin-configurable** (M11/M14) — not hardcoded — to support area-agnostic expansion.
- Sale types require legal/ownership fields; rental types require advance/service-charge fields.
- `tenant preference` (family/bachelor/female-only/student) is **culturally critical** in BD and must be a first-class filter.

#### Validation Rules
- Enum fields validated against admin-configured option sets.
- Numeric fields ≥ 0; size/price required for publish.
- Type-specific required fields enforced server-side (not just UI).

#### Data Requirements
- Store type-specific attributes in a `listings.attributes` JSON column **plus** promote high-cardinality filter fields (bedrooms, bathrooms, furnishing, tenant_preference, price, size, type, area) to indexed columns/search facets for fast filtering.
- `amenities`, `areas/blocks`, `categories` as configurable reference tables.

#### Acceptance Criteria
- [ ] Each of the 7 types renders its correct attribute set in create + filter.
- [ ] Amenities/areas/tenant-preferences come from configurable reference data, not hardcoded.
- [ ] Sale listings capture ownership/registration/handover; rentals capture advance/service charge.
- [ ] Attributes are indexed/faceted for search (M4) and comparison (M9).

#### Testing Checklist
- [ ] Attribute schema per type (presence + required).
- [ ] Config-driven option lists reflect admin changes.
- [ ] Server-side validation rejects missing type-required attributes.

#### Codebase Mapping
`listings.attributes` + reference tables; consumer `/list` (attribute forms) & `/search` (filters); admin `Areas & Config`.

---

### M4 — Search, Filters & Discovery

**Covers:** FR-4.1 – FR-4.10 · Phase: MVP (recs/draw-map = Later)

> "Search is the heart of the product and must feel instant, forgiving, and powerful — comparable to leading global marketplaces."

#### Purpose
Deliver instant, typo-tolerant, faceted search with intent toggling, rich filters, sorting, a synced **list + map** layout, type-ahead suggestions, and discovery surfaces (recently viewed, trending, similar).

#### Functional Requirements
- **FR-4.1 (Must):** Universal search bar with **intent toggle**: Rent / Buy / Sublet / Room / Student.
- **FR-4.2 (Must):** Location search by area, block, landmark, or **map-area selection**.
- **FR-4.3 (Must):** Filters: price range, type, bedrooms, bathrooms, size, furnishing, tenant preference, amenities, availability date, posted-by, **verified-only**.
- **FR-4.4 (Must):** Sort by **relevance, newest, price (low/high), nearest, most viewed**.
- **FR-4.5 (Must):** Map view with **clustered pins synced to the result list** (split list+map layout).
- **FR-4.6 (Must):** Instant results with **debounced, type-ahead suggestions** and **filter chips**.
- **FR-4.7 (Should):** Save searches + alerts (in-app/email/push). *(See M9.)*
- **FR-4.8 (Could):** Personalised recommendations based on activity & favourites.
- **FR-4.9 (Should):** Recently viewed, trending in your area, similar-listing carousels.
- **FR-4.10 (Could):** Draw-on-map / radius search + "near my campus/office" shortcuts.

#### User Stories
- As a seeker, I toggle intent to "Rent", type "Aftab Nagar Block C", and see instant results.
- As a seeker, I filter to 3-bed, furnished, bachelor-allowed, verified-only, under ৳25,000.
- As a seeker, I pan the map and the result list updates to match the visible area.
- As a student, I tap "near my campus" to find hostels within walking distance.

#### Business Rules
- Search/filter/view is **free, no login required** (public PWA).
- **Only `approved` (moderated) listings** appear in public search; paused/rented/sold/expired/pending are excluded.
- **Featured listings** (M12) may be pinned above organic results, clearly labelled "Featured"/"Promoted", and capped in number — only after monetisation is switched on.
- "Verified-only" filter surfaces the brand-promise verified listings.
- Map and list are bi-directionally synced: hovering/selecting a pin highlights the card and vice versa; panning updates results (or offers "search this area").
- Default sort = relevance; "nearest" requires geolocation/permission.

#### UI/UX Requirements
- Split **list + sticky map** layout (desktop); collapsible map toggle on mobile.
- Clean filter bar with **chips** for active filters; "clear all".
- Type-ahead suggestions (debounced) for areas/blocks/landmarks.
- Attractive listing cards: cover photo, price, key facts (beds/baths/size/floor), verified badge, quick favourite.
- Clustered map pins; clusters expand on zoom. **(Pins require a vector Map ID — raster mode hides AdvancedMarkers.)**
- Discovery carousels: recently viewed, trending in your area, similar listings.
- Empty/loading/error states for zero results and slow networks (skeletons).

#### Validation Rules
- Price range: min ≤ max; numeric.
- Filters validated against configurable option sets (M3/M14).
- Map-area selection within supported area polygons.

#### Permissions & Roles
- Public (no auth) for search, filter, view, map.
- Saved searches/alerts require auth (M9).

#### API / Integration Requirements
- `GET /search` — query params: `intent, q, area, block, landmark, bbox/polygon, priceMin, priceMax, type, beds, baths, sizeMin, sizeMax, furnishing, tenantPref, amenities[], availableFrom, postedBy, verifiedOnly, sort, page, cursor`.
- `GET /search/suggest?q=` — type-ahead (areas/blocks/landmarks/listings).
- `GET /search/map` — clustered pins for a bbox/zoom.
- `GET /listings/:id/similar`, `GET /discovery/trending?area=`, `GET /me/recently-viewed`.
- **Integrations:** search engine (Meilisearch/Typesense/Elasticsearch) for typo-tolerant faceting; PostGIS for nearest/radius/polygon; map provider (vector Map ID).

#### Data Requirements
- Search index documents mirror `listings` filterable fields + geo + status + verified + featured rank + popularity (views).
- `recently_viewed` (user_id, listing_id, viewed_at); view counters per listing.

#### Error Handling
- Zero results → helpful empty state + suggestion to broaden filters / save search.
- Map/geolocation denied → fall back to area selection.
- Search service down → graceful degradation (DB fallback or cached) — browsing must remain available (NFR reliability).

#### Edge Cases
- Conflicting filters yielding zero results.
- Very large result sets → pagination/infinite scroll + map clustering.
- Listing changes status mid-session (sold) → reflect on refresh; don't show stale.
- Map ID misconfigured → pins disappear (known gotcha — verify vector mode).

#### Acceptance Criteria
- [ ] Intent toggle changes the result set and available filters.
- [ ] All FR-4.3 filters work and combine; "verified-only" works.
- [ ] All FR-4.4 sorts work, including "nearest" with geolocation.
- [ ] List ↔ map are synced; clustered pins render (vector Map ID).
- [ ] Type-ahead is debounced and relevant; filter chips reflect active state.
- [ ] Only approved listings appear; paused/sold/pending excluded.
- [ ] Recently viewed / trending / similar carousels populate.

#### Testing Checklist
- [ ] Each filter individually + combined; price min>max guard.
- [ ] Each sort order correctness.
- [ ] Map sync, clustering, pan-to-search, pin/card highlight.
- [ ] Type-ahead debounce + suggestion accuracy.
- [ ] Status exclusion (pending/paused/sold not shown).
- [ ] Zero-result + degraded-service behaviour.

#### Codebase Mapping
Consumer `/search`, `/listings`; search index + PostGIS; map component (vector Map ID gotcha); discovery carousels on `/`.

---

### M5 — Listing Detail Page

**Covers:** SRS §3.5 · Phase: MVP

#### Purpose
Present a single listing immersively and trustworthily, with full media, key facts, map context (with gated exact pin), amenities, provider trust card, cost breakdown, and primary actions (Request Visit, Chat, Save, Share, Report).

#### Functional Requirements / Content
- **Full-bleed photo/video gallery** with lightbox + swipe; video autoplay-muted.
- **Key facts band**: price, beds, baths, size, floor, availability — at a glance.
- **Map** with area context; **exact pin gated until a visit is approved** (configurable, ties to M2 hide-exact-pin).
- **Amenities grid** with icons; description; rules; nearby POIs.
- **Verified badge** + **posted-by profile** (owner/agency) with rating and response time.
- **Primary actions**: Request Visit (M6), Chat (M7), Save/Favourite (M9), Share, Report listing (M13).
- **Similar listings** + "others also viewed" sections (M4).
- **Cost breakdown**: rent + service charge + advance + any platform fee.

#### User Stories
- As a seeker, I swipe through high-quality photos and a short video in a lightbox.
- As a seeker, I see total move-in cost (rent + service charge + advance) clearly.
- As a seeker, I see the owner is verified with a 4.7 rating and "replies within 2 hours" before I contact them.
- As a seeker, I report a suspicious listing.

#### Business Rules
- Exact map pin shown only after a visit is approved (or per listing config); otherwise show approximate area circle.
- Provider card shows verified badge, aggregate rating, response-rate/time (M8/M10).
- Cost breakdown must reflect BDT formatting and any active platform fee.
- Report action feeds moderation queue (M11/M13).
- View increments listing popularity (powers "most viewed" sort + analytics).

#### UI/UX Requirements
- Immersive gallery; **sticky action bar** (Request Visit / Chat / Save) on scroll.
- Scannable facts; amenities with icons; clear rules section.
- Trust cues surfaced prominently (verified, rating, response time, real photos).
- Mobile-first, one-handed; share sheet; report modal with reasons.

#### Validation / Permissions
- Public view (no auth). Actions (Request Visit, Chat, Save, Report) require auth → prompt login.
- Only `approved` listings are publicly viewable; owners/admin can preview non-public states.

#### API / Integration
- `GET /listings/:id` (full detail incl. provider summary, cost breakdown, exact-pin gating flag).
- `POST /listings/:id/view` (popularity).
- `GET /listings/:id/similar`.
- Actions delegate to M6/M7/M9/M13 endpoints.

#### Data Requirements
- Reads `listings` + `media` + `owners` (+ aggregate review score, response metrics). View counter.

#### Error Handling / Edge Cases
- Listing not found / removed / no longer public → friendly state + similar suggestions.
- Media fails to load → graceful placeholders; low-bandwidth fallbacks.
- Exact-pin gating must never leak precise coordinates client-side before approval.
- Self-view: owner viewing own listing sees management actions, not "Request Visit".

#### Acceptance Criteria
- [ ] Gallery (photos+video), key-facts band, amenities grid, description, rules render.
- [ ] Exact pin hidden until visit approved (when configured); approximate area shown otherwise.
- [ ] Provider trust card shows verified badge + rating + response time.
- [ ] Cost breakdown (rent+service+advance+fee) accurate in BDT.
- [ ] Primary actions wired (Request Visit, Chat, Save, Share, Report) with auth gating.
- [ ] Similar/others-also-viewed populate; view counter increments.

#### Testing Checklist
- [ ] Pin gating pre/post visit approval (no coordinate leak).
- [ ] Action auth gating (logged out → login prompt).
- [ ] Cost math + BDT/Bangla numeral formatting.
- [ ] Non-public/removed listing handling.
- [ ] Low-bandwidth media degradation.

#### Codebase Mapping
Consumer `/listings/[id]`; `listings`+`media`+`owners`; report → moderation.

---

### M6 — Visit Request & Scheduling

**Covers:** FR-6.1 – FR-6.9 · Phase: MVP (windows/post-visit = MVP+, virtual tour = Later)

#### Purpose
Replace messy back-and-forth with a structured visit-negotiation flow that proposes, suggests, and confirms times; tracks visit states; sends reminders; and protects both parties.

#### Functional Requirements
- **FR-6.1 (Must):** Seeker requests a visit by proposing date/time slot(s) + short note.
- **FR-6.2 (Must):** Provider can **Accept, Decline, or Suggest** an alternative time.
- **FR-6.3 (Must):** Seeker can Accept the suggestion or counter-propose; **loop until confirmed**.
- **FR-6.4 (Must):** On confirmation, both get reminders (in-app/push/SMS) + an **agenda card** (address + map).
- **FR-6.5 (Should):** Provider sets availability windows so seekers only pick valid slots.
- **FR-6.6 (Must):** Visit states: **Requested, Suggested, Confirmed, Completed, Cancelled, No-show**.
- **FR-6.7 (Must):** Reschedule/cancel **with reason**; history retained on both dashboards.
- **FR-6.8 (Should):** Post-visit prompt to leave a review + update interest status.
- **FR-6.9 (Could):** Optional virtual-tour / video-call visit scheduling.

#### Happy-Path Flow (SRS §3.6)
1. Seeker taps **Request Visit** → proposes Fri 5 PM.
2. Provider gets notification → taps **Suggest New Time** → Sat 11 AM.
3. Seeker gets suggestion → taps **Accept**.
4. System **confirms**, sends reminders to both, creates a **visit card** with address + map.
5. After the visit, both are prompted to **review** and mark outcome.

#### State Machine
```
Requested ──provider Accept──────────────► Confirmed
Requested ──provider Suggest──► Suggested ──seeker Accept──► Confirmed
Suggested ──seeker counter──► Requested (loop)
Requested/Suggested ──Decline/Cancel(reason)──► Cancelled
Confirmed ──Reschedule(reason)──► Requested/Suggested (loop)
Confirmed ──visit happens──► Completed ──► (review prompt)
Confirmed ──no attendance──► No-show
```

#### Business Rules
- Both parties must be authenticated; a visit is tied to a specific listing.
- On `Confirmed`, generate an agenda/visit card with address + map (exact pin now revealed per M5 gating) and schedule reminders.
- Reschedule/cancel **requires a reason**; full history retained on both dashboards.
- `Completed` triggers the post-visit review prompt (M8) — and only completed/verified visits unlock reviews (FR-8.6).
- Availability windows (FR-6.5) constrain selectable slots.
- Visit confirmation is one of the trust signals that can trigger WhatsApp handoff (M14) post-confirmation.

#### UI/UX Requirements
- Request modal: slot picker (multiple proposals) + note.
- Provider action card: Accept / Decline / Suggest (with time picker).
- Visit card: status chip, date/time, address+map, reschedule/cancel, contact/chat.
- Both dashboards list visits by state with history.
- Reminder notifications across in-app/push/SMS.

#### Validation Rules
- Proposed times must be in the future and within provider availability windows (if set).
- Reason required for cancel/reschedule.
- State transitions enforced server-side (no illegal transitions).

#### Permissions & Roles
| Action | seeker | provider | admin |
|---|---|---|---|
| Request visit | ✓ | — | — |
| Accept/Decline/Suggest | — | ✓ | — |
| Accept/Counter suggestion | ✓ | — | — |
| Reschedule/Cancel (own side) | ✓ | ✓ | ✓ (dispute) |
| Mark Completed/No-show | ✓/✓ (both confirm) | ✓ | ✓ |

#### API / Integration
- `POST /visits` (create Requested), `POST /visits/:id/accept`, `/decline`, `/suggest`, `/counter`, `/reschedule`, `/cancel`, `/complete`, `/no-show`.
- `GET /visits` (filter by state/role), `GET /visits/:id`.
- Provider availability: `GET/PUT /providers/me/availability`.
- **Integrations:** notifications (in-app/push/SMS) + calendar/agenda card; ties to chat (M7) inline visit cards.

#### Data Requirements
- `bookings`/`visits`: id, listing_id, seeker_id, provider_id, status (enum 6), proposed_slots (JSON), confirmed_at, confirmed_time, reason, history (JSON/audit), created_at, updated_at.

#### Error Handling / Edge Cases
- Double-booking the same slot → conflict guard.
- Negotiation loop never converges → allow cancel anytime; cap reminders.
- Provider unresponsive → expire request after TTL; notify seeker.
- Time-zone/locale correctness (Asia/Dhaka).
- No-show recorded by one party → optional dispute (M11).
- Listing goes rented/sold during negotiation → notify + cancel pending visits.

#### Acceptance Criteria
- [ ] Seeker can propose slot(s) + note; provider can Accept/Decline/Suggest.
- [ ] Negotiation loops (suggest ↔ counter) until Confirmed.
- [ ] On Confirm, both receive reminders + an agenda card with address+map.
- [ ] All 6 states tracked; illegal transitions rejected.
- [ ] Reschedule/cancel requires a reason; history retained both sides.
- [ ] Completed visit prompts review (M8).

#### Testing Checklist
- [ ] Full negotiation loop incl. multiple counters.
- [ ] Reminder delivery across channels on confirm.
- [ ] State-machine guard (reject illegal transitions).
- [ ] TTL expiry of unanswered requests.
- [ ] No-show + reschedule + cancel-with-reason.
- [ ] Conflict/double-booking guard.

#### Codebase Mapping
Consumer `/visits`; provider `Visits`, `Leads`; `bookings` table; notifications (M9).

---

### M7 — In-App Messaging (WhatsApp-style)

**Covers:** FR-7.1 – FR-7.11 · Phase: MVP (typing/reactions/quick-replies = MVP+, phone-mask = Later)

#### Purpose
Keep conversations on-platform (safety, record-keeping, trust) with a real-time, WhatsApp-familiar chat experience tied to listings, with media, receipts, presence, moderation controls, and low-bandwidth resilience.

#### Functional Requirements
- **FR-7.1 (Must):** 1:1 real-time chat between seeker and provider, tied to a listing.
- **FR-7.2 (Must):** Text, emoji, photos, videos, voice notes, documents.
- **FR-7.3 (Must):** Delivery + read receipts (sent / delivered / read ticks).
- **FR-7.4 (Should):** Typing indicators + online/last-seen (privacy-respecting).
- **FR-7.5 (Must):** Push/in-app notifications for new messages; unread badges.
- **FR-7.6 (Should):** Inline listing cards, visit-request cards, quick-reply templates.
- **FR-7.7 (Should):** Reply-to (quote), reactions, in-chat search, pin chats.
- **FR-7.8 (Must):** Block, mute, report a user; spam/abuse filtering.
- **FR-7.9 (Must):** Media auto-compression + resumable uploads for poor networks.
- **FR-7.10 (Must):** Message history persisted + synced across web and mobile.
- **FR-7.11 (Could):** Mask personal phone numbers until both parties consent.

#### User Stories
- As a seeker, I message an owner about a specific flat and see when they've read it.
- As a user, I send a voice note when typing is inconvenient.
- As a user on 3G, my photo compresses and uploads resumably without failing.
- As a user, I block and report someone sending spam.

#### Business Rules
- Each conversation is tied to two users + a listing (context).
- Receipts: sent → delivered → read; presence is privacy-respecting (user can hide last-seen).
- Blocking prevents further messages; muting silences notifications; reporting feeds moderation (M11/M13).
- Media auto-compressed; uploads resumable on flaky networks.
- History persisted server-side and synced across devices/platforms.
- Phone masking (FR-7.11) keeps numbers hidden until mutual consent — anti-leakage (M12/M13 risk mitigation).
- WhatsApp handoff (M14) is offered post-visit-confirmation but in-app chat is retained for records.

#### UI/UX Requirements
- WhatsApp-like layout: conversation list + thread; message bubbles; tick states; timestamps.
- Composer: text, emoji, attach (photo/video/doc), voice-note record.
- Inline cards: listing card, visit-request card, quick-reply templates.
- Unread badges; typing indicator; online/last-seen (respecting privacy).
- Block/mute/report actions in conversation menu.

#### Validation Rules
- Message size/media type/size caps; allowed document types.
- Rate limiting / anti-bot on message send (anti-spam).
- Voice note duration cap.

#### Permissions & Roles
- Auth required. Both participants must not be blocked.
- Admin can view reported conversations for moderation/disputes (M11) per policy.

#### API / Integration
- Real-time transport: WebSocket (Socket.IO) or managed (current repo uses **Stream Chat** in consumer).
- `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations` (start, tied to listing), `POST /messages`, `POST /messages/:id/read`, `POST /conversations/:id/typing`.
- `POST /users/:id/block`, `/mute`, `/report`.
- Media upload (resumable, compressed) to object storage/CDN.
- **Integrations:** FCM push, presence service, virus scan, abuse/spam filter.

#### Data Requirements
- `threads`/`conversations`: id, listing_id, participant_a, participant_b, last_message_at, blocked_by, muted_by.
- `messages`: id, thread_id, sender_id, type (text/photo/video/voice/doc/card), body, media_url, status (sent/delivered/read), reply_to, reactions, created_at.

#### Error Handling / Edge Cases
- Offline send → queue + retry; show pending state.
- Upload failure → resumable retry; failed-item indicator.
- Blocked user attempts to message → silently rejected to sender per policy.
- Duplicate conversation for same listing+pair → reuse existing thread.
- Spam burst → rate-limit + flag.
- Cross-device sync conflicts → server is source of truth.

#### Acceptance Criteria
- [ ] Real-time 1:1 chat tied to a listing works web (and later mobile).
- [ ] Send text, emoji, photo, video, voice note, document.
- [ ] Sent/delivered/read receipts accurate; unread badges + push fire.
- [ ] Block/mute/report function; blocked users can't message.
- [ ] Media auto-compresses and uploads resumably on poor networks.
- [ ] History persists and syncs across sessions/devices.

#### Testing Checklist
- [ ] Real-time delivery + receipt transitions.
- [ ] Each media type send/receive + compression/resume.
- [ ] Block/mute/report enforcement.
- [ ] Offline queue + reconnect sync.
- [ ] Rate-limit/anti-spam.
- [ ] Inline listing/visit cards + quick replies.

#### Codebase Mapping
Consumer `/messages` (Stream Chat); `threads`+`messages`; notifications (M9); report → moderation (M11).

---

### M8 — Reviews, Ratings & Reputation

**Covers:** FR-8.1 – FR-8.8 · Phase: MVP (sub-ratings/response/metrics = MVP+)

#### Purpose
Build the defensible trust layer: two-way reviews after verified interactions, star + written reviews with media, sub-ratings, owner responses, aggregate scores on listings and profiles, anti-fake controls, and provider response metrics.

#### Functional Requirements
- **FR-8.1 (Must):** Both seeker and provider can review **after a verified interaction** (visit/rental).
- **FR-8.2 (Must):** Star rating + written review; attach photos/videos.
- **FR-8.3 (Should):** Structured sub-ratings (accuracy, cleanliness, communication, value).
- **FR-8.4 (Must):** Reviews shown on listing + user/agency profiles with aggregate scores.
- **FR-8.5 (Should):** Owner can publicly respond to a review.
- **FR-8.6 (Must):** **Only verified interactions can review** (anti-fake control).
- **FR-8.7 (Must):** Report/flag reviews; admin moderation + removal of abusive content.
- **FR-8.8 (Should):** Response-rate + response-time metrics on provider profiles.

#### User Stories
- As a seeker who completed a visit, I leave a 5-star review with photos.
- As an owner, I publicly respond to a critical review.
- As a user, I report a fake/abusive review.
- As a seeker, I trust a provider with high rating + "replies within 1 hour".

#### Business Rules
- **Reviews are gated on a verified interaction** (a `Completed` visit or confirmed rental) — FR-8.6. No verified interaction → no review.
- Two-way: both sides can review each other.
- Aggregate scores recomputed on new/edited/removed reviews; shown on listing + profile.
- Owner response is public and attached to the review.
- Reported reviews enter moderation; admins can remove abusive content (M11).
- Response-rate/time computed from chat + visit responsiveness (M7/M6), shown on profile (M10).

#### UI/UX Requirements
- Review form: overall stars + optional sub-ratings + text + media upload.
- Review display: reviewer, rating, sub-ratings, text, media, owner response, report action.
- Aggregate score + distribution on listing detail (M5) and profiles (M10).
- Post-visit prompt entry point (M6 FR-6.8).

#### Validation Rules
- Rating 1–5; text length bounds; media type/size caps.
- One review per verified interaction per reviewer (prevent spam); edits within a window.
- Reviewer must have an eligible completed interaction.

#### Permissions & Roles
| Action | seeker | provider | admin |
|---|---|---|---|
| Leave review (post verified interaction) | ✓ | ✓ | — |
| Respond to review | — | ✓ (own) | — |
| Report review | ✓ | ✓ | — |
| Remove/moderate review | — | — | ✓ |

#### API / Integration
- `POST /reviews` (requires eligible interaction id), `GET /reviews?listingId=/userId=`, `POST /reviews/:id/response`, `POST /reviews/:id/report`.
- Aggregate endpoints: `GET /listings/:id/rating`, `GET /users/:id/rating`.
- **Integrations:** media upload; eligibility check against visits/bookings; moderation queue.

#### Data Requirements
- `reviews`: id, reviewer_id, target_id (user), listing_id, visit_id, rating, sub_ratings (JSON), text, media[], owner_response, status (`published|reported|removed`), created_at.

#### Error Handling / Edge Cases
- Attempt to review without eligible interaction → blocked with explanation.
- Duplicate review for same interaction → rejected.
- Review for a now-deleted listing/user → preserve for integrity, de-identify if account deleted.
- Abusive content → reportable + removable; reviewer notified per policy.
- Rating recomputation race on concurrent reviews.

#### Acceptance Criteria
- [ ] Only users with a completed/verified interaction can review.
- [ ] Star + text + media reviews submit and display.
- [ ] Sub-ratings captured and shown (when enabled).
- [ ] Aggregate scores appear on listing + profiles and update on change.
- [ ] Owner can respond publicly.
- [ ] Reviews can be reported and admin-removed.

#### Testing Checklist
- [ ] Eligibility gate (no interaction → no review).
- [ ] Duplicate-review prevention.
- [ ] Aggregate recompute correctness.
- [ ] Owner response flow.
- [ ] Report → moderation → removal.
- [ ] Response-rate/time metric accuracy.

#### Codebase Mapping
Consumer `/review/[id]`, profile displays on `/providers/[id]` & `/listings/[id]`; `reviews` table; provider `Reviews`; admin moderation.

---

### M9 — Favourites, Saved Searches & Notifications

**Covers:** SRS §3.9, FR-4.7, FR-7.5 · Phase: MVP (favourites/compare), MVP+ (saved searches/alerts)

#### Purpose
Let users save listings into collections and compare them, save searches with alert frequencies, and manage granular multi-channel notification preferences.

#### Functional Requirements
- Save/favourite listings into **collections**; **compare** saved listings side by side.
- **Saved searches** with instant / daily / weekly alert frequency.
- Notification channels: **in-app inbox, push (mobile), email, optional SMS** for high-value events (visit confirmed, new match).
- **Granular notification preferences** per channel and per event type.
- Alerts when saved-search matches appear (FR-4.7); new-message + visit notifications (FR-7.5, FR-6.4).

#### User Stories
- As a seeker, I favourite 5 flats and compare them side by side.
- As a seeker, I save a search and get a daily alert when new matches appear.
- As a user, I turn off email but keep push for new messages.

#### Business Rules
- Favourites require auth; organised into optional collections.
- Saved-search alerts run on a schedule (instant/daily/weekly) and match the saved filter set against newly approved listings.
- High-value events (visit confirmed, new match) may use SMS; users control channels per event.
- Notification preferences are per-channel × per-event-type.

#### UI/UX Requirements
- `/saved`: favourites grid + collections + compare view (side-by-side table of key attributes).
- Saved searches list with frequency control + run-now.
- `/notifications`: in-app inbox with read/unread; preferences screen with channel×event matrix.

#### Validation / Permissions
- Auth required for all. Channel availability depends on contact info (SMS needs phone, email needs verified email).

#### API / Integration
- `POST/DELETE /favourites/:listingId`, `GET /favourites`, collections CRUD.
- `GET /compare?ids=` (or client-side from favourites).
- `POST /saved-searches` (filters + frequency), `GET /saved-searches`, `DELETE`.
- `GET /notifications`, `POST /notifications/:id/read`, `GET/PUT /notifications/preferences`.
- **Integrations:** scheduler/queue for alerts; FCM push; email (SES/SendGrid); SMS gateway.

#### Data Requirements
- `saves`/`favourites`: user_id, listing_id, collection, created_at.
- `saved_searches`: user_id, filter JSON, frequency, last_run_at.
- `notifications`: user_id, type, payload, channels, read_at, created_at.
- `notification_preferences`: user_id, event_type, channel flags.

#### Error Handling / Edge Cases
- Favourited listing later removed/sold → mark in favourites; allow cleanup.
- Saved search yields huge daily volume → cap/batch alerts.
- Channel unavailable (no email/phone) → degrade gracefully + prompt to add.
- Duplicate favourite → idempotent.

#### Acceptance Criteria
- [ ] Favourite/unfavourite + collections work; compare side-by-side renders.
- [ ] Saved searches persist with frequency; alerts fire on new matches.
- [ ] In-app inbox shows notifications with read/unread; badges accurate.
- [ ] Per-channel × per-event preferences respected on send.

#### Testing Checklist
- [ ] Favourite idempotency + removal of stale listings.
- [ ] Saved-search matching correctness + frequency scheduling.
- [ ] Notification fan-out honours preferences + channel availability.
- [ ] Unread badge accuracy.

#### Codebase Mapping
Consumer `/saved`, `/notifications`; `saves`+`notifications` tables; alert scheduler.

---

### M10 — Provider / Agency Dashboard

**Covers:** SRS §3.10, FR-2.8, FR-8.8 · Phase: MVP (core), Phase 3 (agency extras)

#### Purpose
Give providers a workspace to manage listings, leads (visit requests + chats), performance analytics, and — for agencies — team seats, branded profile, bulk tools, and billing/subscriptions.

#### Functional Requirements
- **Overview:** active listings, views, leads, chats, scheduled visits, conversion.
- **Manage listings:** edit, pause, mark rented/sold, **boost/feature** (M12).
- **Lead inbox:** incoming visit requests + chats in one place.
- **Performance analytics per listing:** impressions, saves, chats, visits.
- **Agency extras:** team seats with roles/permissions, branded public profile, **bulk tools (CSV import — FR-2.8)**, billing/subscription management (M12).
- **Response-rate / response-time metrics** on profile (FR-8.8).

#### User Stories
- As an owner, I see all my listings' performance and incoming leads in one place.
- As an owner, I boost a listing to get more visibility (post-monetisation).
- As an agency admin, I invite team members and assign leads to agents.
- As an agency, I bulk-import 50 listings via CSV.

#### Business Rules
- Providers manage only their own listings; agency members operate within their agency's scope per role.
- Listing limits + featured credits + team seats gated by subscription tier (M12).
- Boost/feature only available once monetisation is switched on (post-liquidity).
- Lead inbox unifies visit requests (M6) + chats (M7).
- Response metrics derived from actual responsiveness.

#### UI/UX Requirements
- Overview dashboard with data cards + simple charts.
- Listings table with status chips + quick actions (edit/pause/mark/boost).
- Lead inbox combining visits + chats.
- Per-listing analytics view.
- Agency: team management, branded profile editor, CSV importer, billing screen.

#### Validation / Permissions
| Action | individual owner | agency owner-admin | agency member | admin |
|---|---|---|---|---|
| Manage own listings | ✓ | ✓ | ✓ (scoped) | ✓ |
| Boost/feature | ✓ | ✓ | per role | ✓ |
| Invite/manage seats | — | ✓ | — | ✓ |
| Bulk CSV import | — | ✓ | per role | ✓ |
| Billing/subscription | — | ✓ | — | ✓ |

#### API / Integration
- `GET /providers/me/overview`, `GET /providers/me/listings`, `GET /listings/:id/analytics`.
- `GET /providers/me/leads` (visits + chats merged).
- `POST /agencies/:id/members`, role assignment; `POST /agencies/:id/listings/import` (CSV).
- Billing → M12 endpoints.

#### Data Requirements
- Reads `listings`, `bookings`, `threads`, `saves`, view counters; `owners` (agency, response metrics, subscription); `agency_members` (user, role).

#### Error Handling / Edge Cases
- CSV import: partial failures → row-level error report; don't drop the whole batch.
- Exceeding listing limit for tier → prompt upgrade.
- Member removed mid-work → reassign their leads/listings.
- Analytics with zero data → empty states.

#### Acceptance Criteria
- [ ] Overview shows listings/views/leads/chats/visits/conversion.
- [ ] Listing management actions work (edit/pause/mark/boost).
- [ ] Lead inbox unifies visit requests + chats.
- [ ] Per-listing analytics render real metrics.
- [ ] Agency: seats, branded profile, CSV import, billing all function (Phase 3).
- [ ] Response-rate/time metrics shown.

#### Testing Checklist
- [ ] Scope enforcement (provider sees only own/agency listings).
- [ ] Boost gating (off pre-monetisation).
- [ ] CSV partial-failure handling.
- [ ] Tier limit enforcement + upgrade prompts.
- [ ] Analytics accuracy vs raw events.

#### Codebase Mapping
`provider-app/`: Overview, My Listings, Listing Detail, Leads, Visits, Reviews, Boost, Analytics, Profile. Auth `role === 'owner'`, `getProviderSession()`. Mock data still used for some perf charts/boost/profile — flag for replacement with real data.

---

### M11 — Admin & Moderation Console

**Covers:** FR-11.1 – FR-11.8 · Phase: MVP (verify/dispute/CMS = MVP+)

#### Purpose
Internal console for moderation, verification, user management, configuration, dispute resolution, platform analytics, CMS, and audit logging.

#### Functional Requirements
- **FR-11.1 (Must):** Moderate + approve/reject listings before they go public.
- **FR-11.2 (Should):** Verify user identity + agency documents; assign verified badges.
- **FR-11.3 (Must):** Manage users (suspend/ban/restore); review reported content.
- **FR-11.4 (Must):** Configure areas/blocks, amenities, categories, pricing of paid features.
- **FR-11.5 (Should):** Dispute-resolution workflow for visits, reviews, chats.
- **FR-11.6 (Must):** Platform analytics: supply, demand, conversion, revenue, area heatmaps.
- **FR-11.7 (Should):** CMS control for homepage banners, featured areas, FAQs.
- **FR-11.8 (Must):** Audit log of admin actions.

#### User Stories
- As an admin, I review a pending listing and approve or reject it with a reason.
- As an admin, I verify an owner's NID and grant a verified badge.
- As an admin, I suspend a user reported for scamming.
- As an admin, I add a new area/block and configure its amenities + featured pricing.
- As an admin, I review every admin action in the audit log.

#### Business Rules
- **Moderation is the public-visibility gate** (FR-2.10/FR-11.1): no listing is public until approved.
- KYC/agency verification grants badges (M1/M13).
- User states: active → suspended → banned → restored.
- Config (areas/blocks/amenities/categories/feature pricing) is **data-driven** to support area-agnostic expansion (M14).
- All admin mutations are written to an immutable audit log (FR-11.8).
- Disputes (visits/reviews/chats) follow a tracked workflow with resolution outcomes.

#### UI/UX Requirements
- Moderation queue with listing preview + approve/reject(+reason).
- Verification queue (KYC/trade-licence) with doc viewer.
- Users table with suspend/ban/restore + reported-content review.
- Config screens: Areas & Config (blocks, amenities, categories, feature pricing).
- Analytics dashboards + area heatmaps.
- CMS editor (banners, featured areas, FAQs).
- Audit log viewer (filter by admin/action/date).

#### Validation / Permissions
- **Admin only** (`role === 'admin'`); route-guarded (`proxy.ts`).
- Role-based admin permissions (RBAC) for sensitive actions; rejection requires a reason.

#### API / Integration
- `GET /admin/moderation`, `POST /admin/listings/:id/approve|reject`.
- `GET /admin/verifications`, `POST /admin/verifications/:id/approve|reject`.
- `GET /admin/users`, `POST /admin/users/:id/suspend|ban|restore`.
- `GET /admin/reports`, resolve actions.
- `GET/PUT /admin/config/{areas,amenities,categories,pricing}`.
- `GET /admin/analytics`, `GET /admin/heatmaps`.
- CMS CRUD; `GET /admin/audit-log`.

#### Data Requirements
- Reads/writes across all tables; `zones` (areas/blocks), reference tables (amenities/categories), `reports`, `audit_log`, CMS content, feature-pricing config.

#### Error Handling / Edge Cases
- Concurrent moderation of same listing → lock/idempotency.
- Banning a user with active listings/visits → cascade handling (unpublish, cancel).
- Config change affecting live listings (e.g., remove an amenity) → migration/back-compat.
- Audit log must be append-only/tamper-evident.

#### Acceptance Criteria
- [ ] Pending listings can be approved/rejected (with reason); only approved go public.
- [ ] KYC/agency docs verifiable; badges assigned.
- [ ] Users suspendable/bannable/restorable; reported content reviewable.
- [ ] Areas/blocks/amenities/categories/feature pricing configurable and reflected app-wide.
- [ ] Platform analytics + area heatmaps render.
- [ ] Every admin action recorded in the audit log.

#### Testing Checklist
- [ ] Moderation gate end-to-end (pending invisible in public search).
- [ ] Verification flow + badge propagation.
- [ ] User lifecycle transitions + cascade on ban.
- [ ] Config CRUD reflected in consumer/provider apps.
- [ ] Audit log completeness + immutability.
- [ ] RBAC enforcement.

#### Codebase Mapping
`admin-app/`: Dashboard, Moderation, Listings, Users, Reports, Analytics, Areas & Config, Audit Log, Settings. Auth `role === 'admin'`; guard `proxy.ts`; creds `admin@dwell.bd`. `zones`/`audit_log`/`reports`.

---

### M12 — Monetisation (Featured, Boost, Subscriptions, Partner Services)

**Covers:** SRS §10 + §4.4 · Phase: Phase 1.5 → Phase 3 (OFF at launch)

#### Purpose
Implement the provider-side revenue system — featured/boosted listings, bump/refresh, Pro/Agency subscriptions, lead credits, and partner-services placements — **gated behind liquidity** and built so seekers are never charged.

#### Non-Negotiable Rules (do not violate)
- **Free to post a basic listing. Free to search, forever.** Revenue only from providers paying for visibility/volume. **Never charge seekers.** Never charge a basic listing fee.
- **Most paid features stay OFF at launch.** Featured listings/boosts switch on only after a searcher reliably finds **100+ live listings** (Months 6–12). There must be a **feature flag / kill-switch** controlling monetisation globally (admin config).

#### Revenue Streams (SRS §10.6)
| Stream | Who pays | Description | When |
|---|---|---|---|
| Featured / Boost | Provider | Rank higher / highlight a listing for a period. **Primary stream.** | Phase 1.5 |
| Bump / Refresh | Provider | Low-cost micro-purchase to re-surface as newest. | Phase 1.5 |
| Pro Membership | Landlord/agent | Monthly: higher limits, featured credits, verified badge. | Phase 2 |
| Agency Subscription | Agency | Seats, branding, priority placement, analytics, lead mgmt. | Phase 3 |
| Lead Credits / Management | Agent | Organised leads + follow-up tools; charge high-intent actions. | Phase 3 |
| Partner Services | Partners | Native home-loan, movers, ISP, interior, insurance placements. | Phase 2+ |
| Move-in / Service Add-ons | Partners | Commission from movers, cleaning, internet, agreements. | Phase 3 |

#### Featured/Boost Mechanics (SRS §10.3)
- **Homepage featured carousel** — curated, paid, rotated, capped (scarce).
- **Top of search results** — featured pinned above organic, labelled "Featured"/"Promoted"; highest value (intent-matched).
- **Bump-up/refresh** — re-sort to top of "newest"; high-volume micro-purchase.
- **Visual highlight** — coloured border, "Featured" tag, larger card, photo in search.
- **Urgency/spotlight tags** — "Verified", "Urgent", "Newly listed".
- Sell two ways: **per-listing** (fixed fee, 7–15 days; for individual owners) and **packages/memberships** (for agents). Start per-listing, add tiers later. Indicative boost ≈ low hundreds of BDT.

#### Pricing Tiers (SRS §10.4)
| Tier | For | Includes |
|---|---|---|
| **Free** | Everyone | 1–2 active listings; standard placement; full search/chat/visit tools. |
| **Boost** (per-listing) | Individual owner | One listing featured + bumped for a period; visual highlight + "Featured" tag. |
| **Pro** (monthly) | Active landlord/small agent | 10–20 listings; monthly featured credits; verified badge; basic stats. |
| **Agency** (monthly/annual) | Real-estate firm | Unlimited listings; team seats; branded profile; priority placement; full analytics + lead management. |

#### Payments
- bKash / Nagad / Rocket (MFS) + cards via SSLCOMMERZ/Stripe. **PCI-DSS** via certified gateways; **no raw card storage**.

#### Business Rules
- All monetisation behind a global enable flag + per-feature flags (admin).
- Featured slots capped + rotated; clearly labelled.
- Subscriptions enforce listing limits, featured credits, seats.
- Partner placements are **native/contextual**, not generic banners — protect the premium aesthetic; ad slots reserved in design now, monetised later.

#### UI/UX Requirements
- Provider Boost wizard (select listing → package/duration → pay → confirmation).
- Subscription/billing screens (plan compare, upgrade, invoices).
- "Featured" labelling in search + homepage carousel.
- Payment flows for MFS + cards with clear states.

#### Validation / Permissions
- Provider/agency only. Payment amounts/durations validated server-side. Idempotent payment handling.

#### API / Integration
- `POST /boosts` (listing, package, duration), `GET /boosts`, webhook from gateway.
- `POST /subscriptions`, `GET /subscriptions`, plan management.
- `POST /payments/intent`, gateway webhooks (bKash/Nagad/Rocket/SSLCOMMERZ/Stripe).
- `GET /admin/config/pricing`, feature flags.
- **Integrations:** MFS + card gateways; search ranking boost; invoicing.

#### Data Requirements
- `payments`/`transactions`: id, user_id, type (boost/subscription), amount, currency (BDT), gateway, status, created_at.
- `boosts`: listing_id, package, starts_at, ends_at, status.
- `subscriptions`: owner_id, tier, status, period, seats, featured_credits.
- Feature flags / pricing config (admin).

#### Error Handling / Edge Cases
- Payment pending/failed/duplicate → idempotent reconciliation via webhooks.
- Boost expiry → auto-revert ranking; notify provider.
- Monetisation flag OFF → all paid CTAs hidden/disabled.
- Refund/cancellation policy (M-Legal) honoured.
- Subscription downgrade with listings over new limit → grace handling.

#### Acceptance Criteria
- [ ] Global monetisation kill-switch exists; with it OFF, no seeker or provider is charged and paid CTAs are hidden.
- [ ] Featured/boost ranks listings, labelled "Featured", capped/rotated, expires correctly.
- [ ] Bump/refresh re-surfaces listing in "newest".
- [ ] Subscriptions enforce limits/credits/seats.
- [ ] Payments via MFS + cards succeed with idempotent webhook handling; no raw card storage.
- [ ] Seekers are never charged for any core action.

#### Testing Checklist
- [ ] Kill-switch behaviour (OFF/ON).
- [ ] Boost ranking + labelling + expiry.
- [ ] Payment success/failure/duplicate/refund via each gateway (sandbox).
- [ ] Subscription limit enforcement + downgrade grace.
- [ ] PCI: no raw card data persisted.

#### Codebase Mapping
Provider `Boost`; payments integration (TBD — likely new); admin pricing/feature-flag config; search ranking. Largely **future/Phase 1.5+** — verify presence of kill-switch before enabling anything.

---

### M13 — Trust, Safety & Verification

**Covers:** SRS §4.1 + §4.7 + risk mitigations · Phase: MVP (verification/report/decay), Later (masking)

#### Purpose
Operationalise the **central brand promise** — genuine hyper-local verification — plus the full trust & safety toolkit: report/moderation, stale-listing decay, KYC badges, scam-awareness, block/mute, and (later) phone masking.

#### Features
| Feature | Why | Phase |
|---|---|---|
| **Hyper-local listing verification** (physical/photo/agent-checked) | The core differentiator; genuinely verify each Aftab Nagar listing. | MVP |
| KYC & verified badges | Distinguish genuine owners/agents from scammers. | MVP+ |
| Report & moderation system | Community flags scams/duplicates/offensive content. | MVP |
| **Stale-listing decay** (weekly re-confirm + "available on" stamp) | Solves "is this still available?"; one-tap weekly confirmation. | MVP+ |
| Phone-number masking / in-app calls | Reduce off-platform leakage; protect privacy. | Later |
| Scam-awareness & safe-visit guidelines | Educate users; duty of care. | MVP |
| Block / mute users | Messaging safety hygiene. | MVP |

#### Business Rules
- **Every listing is verified before going public** (ties to M2/M11 moderation gate). Verification can be physical/photo/agent-checked; verified listings show a prominent badge.
- **Stale-listing decay:** listings auto-expire; require **one-tap weekly availability re-confirmation**; show "verified available on [date]" stamp. Unconfirmed listings decay out of search.
- Reports (listings/users/reviews/chats) feed the admin moderation queue (M11).
- Block/mute enforced in chat (M7).
- Phone masking (later): hide numbers until mutual consent (anti-leakage; M12 risk).
- Duplicate-listing detection (FR-2.9) flags likely duplicates for review.

#### UI/UX Requirements
- Verified badges on listings + profiles (prominent, brand-loud).
- Report modals (with reasons) on listings/reviews/users/messages.
- Weekly re-confirm prompt (one tap) + "available on [date]" stamp on cards/detail.
- Safe-visit guidelines surfaced in visit flow.

#### Validation / Permissions
- Verification actions are admin/agent-side (M11). Reporting is open to authed users. Re-confirm is owner-side.

#### API / Integration
- `POST /reports` (entity type + id + reason).
- `POST /listings/:id/reconfirm` (weekly availability).
- Verification endpoints (admin, M11); badge assignment.
- Duplicate-detection job.

#### Data Requirements
- `reports` (entity, reason, reporter, status); `listings.verified`, `listings.available_confirmed_at`, `listings.expires_at`; KYC docs (M1).

#### Acceptance Criteria
- [ ] No listing is public without passing verification/moderation.
- [ ] Verified badge displays prominently on verified listings/profiles.
- [ ] Weekly re-confirm prompt works; "available on [date]" stamp shows; unconfirmed listings decay.
- [ ] Reporting works across listings/reviews/users/messages → moderation queue.
- [ ] Block/mute enforced; scam-awareness guidance shown in visit flow.

#### Testing Checklist
- [ ] Verification gate (unverified not public).
- [ ] Stale-decay timing + re-confirm + stamp.
- [ ] Report routing to moderation.
- [ ] Duplicate detection flags.
- [ ] Block/mute enforcement.

#### Codebase Mapping
`listings.verified`/decay fields; report → admin Moderation/Reports; consumer report actions; block/mute in `/messages`.

---

### M14 — Localisation & Bangladesh-Specific Essentials

**Covers:** SRS §4.3, §5.7, §8.3, constraints §2.5 · Phase: MVP (core), MVP+ (WhatsApp/MFS)

#### Purpose
Make the product Bangladesh-native: full Bangla/English localisation, BDT/Bangla numeral formatting, BD-specific rental fields, MFS payments, WhatsApp-native behaviour, low-bandwidth performance, and an area-agnostic config model for expansion.

#### Features / Requirements
| Feature | Why | Phase |
|---|---|---|
| **Bangla + English** full localisation (i18n) | Majority prefer Bangla; numerals + ৳ expected. | MVP |
| WhatsApp as a channel (notifications + post-visit handoff) | BD users live on WhatsApp; meet them there while retaining in-app chat for records. | MVP+ |
| Assisted listing via phone/WhatsApp | Capture supply from owners who won't fill a web form. | Later |
| bKash / Nagad / Rocket + cards | Card-only would exclude most users. | MVP+ |
| **Bachelor / family / female-only filters** | Culturally critical rental constraint. | MVP |
| **Advance-months & service-charge fields** | Standard BD rental economics. | MVP |
| Low-bandwidth & image compression | Variable networks; must stay fast on 3G. | MVP |
| Offline-tolerant PWA | Browse with patchy connectivity. | Later |

#### Business Rules
- **Phone-first identity (OTP)** is the primary auth (M1).
- Full i18n framework: every user-facing string localisable; locale-aware dates/numbers/currency; **Bangla numerals + ৳** formatting throughout.
- Visible **language switch** everywhere.
- **Area-agnostic:** areas/blocks/amenities/categories are config/data (M11), so new areas/cities are added without code changes (NFR scalability §5.2).
- WhatsApp: match notifications + "continue on WhatsApp" handoff **after visit confirmation**, while in-app chat is retained for records/reviews/safety.
- Low-bandwidth: aggressive media compression, CDN, lean payloads, graceful degradation on 3G.

#### UI/UX Requirements
- Language switch in header/auth/account; Bangla-friendly typography.
- BDT (৳) currency display with locale-aware + Bangla-numeral formatting.
- Tenant-preference filters (family/bachelor/female-only/student) first-class in search (M4).
- Advance-months + service-charge fields in listing + cost breakdown (M2/M5).
- Skeleton loaders + lean images for slow networks.

#### NFR / SEO ties (§5.7)
- Server-rendered SEO-friendly public pages; **per-area/type landing pages** ("flat rent in Aftab Nagar") with structured data.

#### Acceptance Criteria
- [ ] Entire UI switchable Bangla ⇄ English; no hardcoded strings.
- [ ] BDT + Bangla numerals format correctly everywhere money/numbers appear.
- [ ] Tenant-preference filters present and functional.
- [ ] Advance-months + service-charge captured and shown in costs.
- [ ] Adding a new area via admin config surfaces it without code changes.
- [ ] Pages perform acceptably on throttled 3G (compression + skeletons).
- [ ] (MVP+) WhatsApp notifications + post-confirmation handoff work; in-app chat retained.

#### Testing Checklist
- [ ] Locale switch coverage (find untranslated strings).
- [ ] Currency/numeral formatting (en + bn).
- [ ] Config-driven area addition end-to-end.
- [ ] 3G-throttled performance + PWA install.
- [ ] WhatsApp handoff trigger timing (post-confirm only).

#### Codebase Mapping
i18n framework (verify presence); `zones` config; tenant-preference + advance/service fields in `listings`; SEO landing pages; PWA config.

---

### M15 — Area Insights, Price Trends & Platform Analytics

**Covers:** SRS §4.7 (sleeper moat), FR-11.6, §11 KPIs · Phase: MVP+ (insights), Phase 1.5 (price trends)

#### Purpose
Turn collected listing data into a defensible moat: area price-trend & insight data ("average 3-bed rent on this block"), plus platform-wide analytics (supply/demand/conversion/revenue/heatmaps) and KPI tracking.

#### Features
- **Area Price-Trend & Insight data** for Aftab Nagar (every listing = a data point). Surface "average rent in this area / on this block", area demand, trends. Powers trust + SEO + moat. **Prioritise earlier than a generic backlog would.**
- **Platform analytics (FR-11.6):** supply (active/verified listings), demand (MAU seekers, searches, views), conversion (rented/sold via platform), revenue, **area heatmaps**.
- **KPI dashboard (§11):** Supply, Demand, Engagement, Conversion, Trust, Retention, Revenue.

#### KPIs (definitions)
| KPI | Definition |
|---|---|
| Supply | # active, verified listings in Aftab Nagar. |
| Demand | Monthly active seekers, searches, listing views. |
| Engagement | Chats started, visit requests, visit-confirmation rate. |
| Conversion | Listings marked rented/sold via the platform. |
| Trust | Share of verified users/listings + average rating. |
| Retention | Returning users, saved-search alert click-through. |
| Revenue | Featured/boost purchases + (later) subscription MRR. |

#### Business Rules
- Insights computed from aggregated listing/transaction data; per area/block/type.
- Consumer-facing insights (`/insights`) surface trends to build trust + SEO; admin analytics are internal (M11).
- Price-trend accuracy improves with verified data volume — tie to verification (M13).

#### UI/UX Requirements
- Consumer `/insights`: area/block average rents, trends, demand indicators (charts).
- Admin analytics: dashboards + area heatmaps + KPI cards.

#### API / Data
- `GET /insights?area=&type=` (aggregated metrics).
- `GET /admin/analytics`, `GET /admin/heatmaps`.
- Aggregation jobs over `listings`/`bookings`/`reviews`/views.

#### Acceptance Criteria
- [ ] `/insights` shows area/block average rent + trends per type.
- [ ] Admin analytics render supply/demand/conversion/revenue + area heatmaps.
- [ ] KPI definitions implemented and tracked.

#### Testing Checklist
- [ ] Aggregation correctness vs raw data.
- [ ] Per-area/block/type breakdowns.
- [ ] Heatmap rendering + KPI accuracy.

#### Codebase Mapping
Consumer `/insights`; admin `Analytics`; aggregation jobs.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance
- Search results + key pages render **< 2s** on typical 4G.
- Chat delivery latency **< 1s** when both online.
- Responsive images (CDN + modern formats); **LCP < 2.5s**.
- Support **≥ 10,000 concurrent users** at launch; horizontally scalable.

### 5.2 Scalability
- **Area-agnostic data model**: new areas/cities via config + data, not code.
- Stateless services behind load balancer; DB read replicas + caching for hot paths.
- Media + search offloaded to dedicated services (object storage, search engine).

### 5.3 Security
- TLS in transit; encryption at rest for sensitive data/documents.
- OWASP Top 10 mitigations; input validation; rate limiting; bot protection.
- **RBAC** across seeker/provider/agency/admin.
- Secure file handling + **virus scanning** for uploads.
- **PCI-DSS** payment handling via certified gateways; **no raw card storage**.

### 5.4 Usability & Accessibility
- Mobile-first, thumb-friendly, consistent component system.
- **WCAG 2.1 AA**: contrast, focus states, alt text, keyboard navigation.
- Bangla + English with easy in-app switching.
- Clear empty/loading/error/success states everywhere.

### 5.5 Reliability & Availability
- Target **99.9% uptime**; health checks + automated failover.
- Automated daily backups with tested restore; DR plan.
- **Graceful degradation**: browsing stays available if chat/search degrade.

### 5.6 Maintainability & Observability
- Modular, documented codebase; **shared API contract** across web + mobile.
- Centralised logging, error tracking (Sentry), performance monitoring.
- CI/CD with automated tests + staged envs (dev/staging/prod).

### 5.7 Localisation & SEO
- Full i18n; locale-aware dates/numbers/currency.
- Server-rendered SEO pages; per-area/type landing pages + structured data.

---

## 6. Data Model (Indicative — SRS §6.3)

Core entities and relationships:

- **User** (roles: seeker/provider/agency/admin), **Profile**, **VerificationStatus**.
- **Agency** (team members, subscription) — linked to Users.
- **Listing** (type, attributes, location/geo, price, status) — belongs to User/Agency.
- **Media** (photos/videos) — belongs to Listing or Review.
- **VisitRequest** (proposed/suggested/confirmed states) — links Seeker, Provider, Listing.
- **Conversation & Message** (chat, receipts, attachments) — links two Users + Listing.
- **Review** (rating, text, media, sub-scores) — links reviewer, target, Listing/Visit.
- **Favourite, SavedSearch, Notification, Payment/Transaction, Report, AuditLog.**
- **Zone/Area config** (areas/blocks/polygons), reference tables (amenities/categories).

> **As-built tables (Drizzle):** `users`, `owners`, `listings`, `media`, `bookings` (visits), `threads`, `messages`, `reviews`, `saves`, `notifications`, `zones`. Add as needed: `saved_searches`, `payments`/`transactions`, `boosts`, `subscriptions`, `agency_members`, `reports`, `audit_log`, `kyc_documents`, `notification_preferences`.

---

## 7. Key End-to-End User Flows (SRS §7)

### 7.1 Seeker — Find & Visit a Flat
1. Open site → choose intent (Rent) → enter Aftab Nagar → apply filters.
2. Browse list + map → open listing detail → view gallery + facts.
3. Tap Request Visit → propose time(s) → optionally start chat.
4. Negotiate time (accept / suggest new) until confirmed.
5. Attend visit → mark outcome → leave review with photos/videos.

### 7.2 Provider — List & Manage a Property
1. Sign up / switch to provider → start listing wizard.
2. Enter type, location pin, details, media, pricing → preview.
3. Submit for moderation → goes live once approved.
4. Receive visit requests + chats → accept/suggest times → respond.
5. Optionally boost/feature → mark rented/sold → review the seeker.

### 7.3 Student — Find a Hostel Seat
1. Choose Student intent → search near campus → filter by gender, seat type, meals, budget.
2. Open hostel listing → review seat availability + rules.
3. Chat with provider → request visit → confirm a seat.

### 7.4 Agency — Bulk Operations
1. Register as agency → verify trade licence → invite team members.
2. Bulk-import listings → manage in table view → assign leads to agents.
3. Subscribe to a plan → feature key listings → track performance analytics.

---

## 8. UI/UX Design Direction (SRS §8)

### 8.1 Principles
- **Visual-first:** large high-quality imagery/video lead every listing; generous whitespace; soft shadows, rounded cards.
- **Consistency:** single design system (typography scale, colour tokens, spacing, components).
- **Clarity over clutter:** one primary action per screen; progressive disclosure for advanced filters/details.
- **Delight in motion:** subtle, purposeful animations (hover, transitions, skeleton loaders) — never gratuitous.
- **Mobile-first:** one-handed phone use first, then scale to desktop.
- **Trust cues:** verified badges, ratings, response times, real photos surfaced prominently.

### 8.2 Section-level expectations
- **Home:** hero search, intent tabs, featured areas, curated + trending listings, value props, social proof.
- **Search results:** split list + sticky map, clean filter bar with chips, attractive cards with quick favourite + key facts.
- **Listing detail:** immersive gallery, sticky action bar, scannable facts, amenities with icons, trustworthy provider card.
- **Chat:** WhatsApp-like layout, smooth media handling, clear status indicators.
- **Dashboards:** clean data cards, simple tables, obvious primary actions.

### 8.3 Branding & Localisation
- Friendly, trustworthy, modern brand for a Bangladeshi audience; clean minimal imagery.
- Full Bangla/English with visible language switch; Bangla-friendly typography.
- BDT (৳) with locale-aware formatting throughout.

---

## 9. Phased Delivery Roadmap (SRS §9)

### Phase 1 — Web MVP (Launch in Aftab Nagar, Land-grab Mode)
**Goal: liquidity. Everything free (incl. featured slots).** Success = active genuine listings + weekly active seekers, not revenue.
- Accounts (phone OTP), role switching, basic profiles.
- Listing wizard for all core types; media upload; moderation.
- Hyper-local listing verification (brand promise) + report/moderation tooling.
- Search (full filters, list+map, sort) + listing detail.
- Visit request & scheduling (accept / suggest-new-time).
- Real-time in-app chat with media + receipts.
- Two-way reviews with media; favourites; stale-listing decay.
- Bangla/English, BDT; responsive PWA; admin console (core).

### Phase 1.5 — Trust, Revenue & Growth (once liquidity reached: 100+ live listings)
- KYC + verified badges; saved searches + match alerts.
- Featured/boosted listings, bump/refresh + payments (bKash/Nagad/Rocket/cards).
- Area price-trend & insight data (sleeper moat).
- WhatsApp match notifications + post-visit handoff.
- SEO landing pages per area/type; analytics dashboards.

### Phase 2 — Native Mobile Apps (Flutter)
- Feature parity on same APIs; push notifications.
- Native camera/video capture, location, maps.
- App/Play Store submission, privacy declarations, release pipeline.

### Phase 3 — Expansion & Premium
- Roll out to new Dhaka areas + other cities (config-driven).
- Agency subscriptions, roommate matching, virtual tours.
- Digital agreements, in-platform rent payments, partner integrations.

---

## 10. Monetisation Model Summary (SRS §10)

See **M12** for full detail. Core principle: **charge providers, free for seekers, liquidity before monetisation.** Streams sequenced: Featured/Boost + Bump (Phase 1.5) → Pro membership + Partner services (Phase 2) → Agency subscription + Lead credits + Move-in add-ons (Phase 3). Skip generic banner ads in favour of **native partner-services placements** (home-loan, movers, ISP, interior, insurance).

---

## 11. Success Metrics (KPIs — SRS §11)

See **M15** for definitions. Track: Supply · Demand · Engagement · Conversion · Trust · Retention · Revenue.

---

## 12. Risks, Assumptions & Out-of-Scope (SRS §12)

### 12.1 Key Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Cold-start: too few listings at launch | Manual onboarding + partnerships in Aftab Nagar; seed supply before demand push. |
| Fake/duplicate listings erode trust | Mandatory moderation, KYC/verification badges, report tooling from day one. |
| Off-platform leakage (deals on WhatsApp) | Keep value in-platform: scheduling, reviews, masked contact, convenience. |
| Poor performance on weak networks | Aggressive media compression, CDN, PWA caching, lean payloads. |
| Payment approvals delayed | Launch core free experience first; gate monetisation behind gateway readiness. |

### 12.2 Assumptions & Dependencies (SRS §2.6)
- Reliable SMS OTP delivery via a local aggregator.
- Map/geocoding covers BD addresses (+ custom Aftab Nagar polygons).
- Payment gateway approvals obtained before monetisation goes live.
- Initial Aftab Nagar supply seeded via manual onboarding/partnerships.

### 12.3 Out of Scope (for now)
- In-platform mortgage underwriting + legal property due-diligence.
- Full property-management suite (maintenance tickets, accounting).
- Expansion beyond Aftab Nagar at initial launch (architected for, not enabled).

---

## 13. Legal & Compliance (cross-cutting)
- Terms of Service, Privacy Policy, refund/cancellation policy, consent capture.
- Data export + account deletion (privacy compliance) — M1.
- Compliance references: Bangladesh Digital Security Act & Personal Data Protection guidance; PCI-DSS (payments); OWASP ASVS (security); IEEE 830 (SRS practice).
- Rate limiting + anti-bot on listing creation + chat.
- Audit logs + role-based admin permissions — M11.

---

## 14. Operating Environment (SRS §2.4)
- **Web:** latest two versions of Chrome, Safari, Firefox, Edge; responsive **320px → desktop**; installable PWA.
- **Mobile (Phase 2):** iOS 15+, Android 9+ (API 28+).
- **Backend:** cloud-hosted (containerised), region near Bangladesh (Singapore/Mumbai).
- **Connectivity:** optimised for variable mobile networks; graceful degradation on 3G.

---

## 15. Module Index (Quick Reference)

| ID | Module | Primary routes / location | Phase |
|---|---|---|---|
| M1 | Accounts, Auth & Verification | `/auth`, `/account` | MVP |
| M2 | Property Listings (Provider) | `/list`, provider My Listings | MVP |
| M3 | Property Attributes & Categories | `listings.attributes` + config | MVP |
| M4 | Search, Filters & Discovery | `/search`, `/listings` | MVP |
| M5 | Listing Detail Page | `/listings/[id]` | MVP |
| M6 | Visit Request & Scheduling | `/visits`, provider Visits/Leads | MVP |
| M7 | In-App Messaging | `/messages` | MVP |
| M8 | Reviews, Ratings & Reputation | `/review/[id]`, `/providers/[id]` | MVP |
| M9 | Favourites, Saved Searches & Notifications | `/saved`, `/notifications` | MVP/MVP+ |
| M10 | Provider / Agency Dashboard | `provider-app/` | MVP/Phase 3 |
| M11 | Admin & Moderation Console | `admin-app/` | MVP/MVP+ |
| M12 | Monetisation | provider Boost, payments | Phase 1.5+ |
| M13 | Trust, Safety & Verification | cross-cutting | MVP |
| M14 | Localisation & BD Essentials | i18n, config | MVP/MVP+ |
| M15 | Area Insights & Analytics | `/insights`, admin Analytics | MVP+ |

---

*End of Development Specification. Derived from `Dwell_SRS_1.docx` (BariVara SRS v1.0, June 2026). Keep this file in sync with the SRS; when they conflict, flag for product decision.*
