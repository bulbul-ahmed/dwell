# Dwell — Gap Analysis (Codebase vs PROJECT_DEVELOPMENT_SPEC.md)

> Audit of the three apps (`consumer-app`, `admin-app`, `provider-app`) + shared PostgreSQL DB against [PROJECT_DEVELOPMENT_SPEC.md](PROJECT_DEVELOPMENT_SPEC.md). Generated 2026-06-21.
>
> **Verdict:** Read/list views are real DB everywhere. Most write actions are toast-only stubs. Monetisation is 100% mock. Several MVP "Must" requirements are broken or absent. Only **M15 Insights** was fully done at audit time; **M5 Listing Detail** has since been substantially completed (see §6).
>
> **Legend:** 🟢 DONE (wired to real DB/API) · 🟡 PARTIAL (UI exists, mock/hardcoded data or missing sub-features) · 🔴 MISSING/MOCK.

---

## 1. Module status overview

| Module | State | Core gap |
|---|---|---|
| M1 Auth & Verification | 🟡 PARTIAL | OTP is **email**, not SMS/phone (FR-1.1); no data export/delete (FR-1.8); KYC is a UI stub |
| M2 Listing wizard | 🟡 PARTIAL | No autosave, no compression, no media reorder, no hide-pin in wizard, no availability capture, no pause/rented/sold lifecycle |
| M3 Attributes | 🟡 PARTIAL | Amenities hardcoded (API exists, unused); sale legal/ownership fields absent; 6-cat enum not the spec's 7 types |
| M4 Search | 🟡 PARTIAL | price/baths/size/furnishing/amenities/tenant-pref filters are **UI-only, not wired to API**; no type-ahead |
| M5 Listing detail | 🟢 MOSTLY DONE | Video, Share, Report, view counter now shipped (§6). Remaining: provider response-time is static |
| M6 Visits | 🟡 PARTIAL | Only 4 of 6 states; **no suggest/counter loop**; no reschedule/reason/reminders; provider actions are stubs |
| M7 Messages | 🟡 PARTIAL | Text-only; no media/voice/receipts/typing/block/mute/report; **Stream Chat token route is dead code** |
| M8 Reviews | 🟡 PARTIAL | **No verified-interaction gate (FR-8.6 violated)**; no media; no owner response; rating static 4.5; no report |
| M9 Saved/Notif | 🟡 PARTIAL | **Saved searches fully mock**; no collections; no compare; no notification preferences |
| M10 Provider dashboard | 🟡 PARTIAL | Reads real; **all write actions stubbed**; Profile 100% hardcoded; **no view tracking → all view numbers fake** |
| M11 Admin console | 🟡 PARTIAL | Config + audit DONE; **user suspend/ban MISSING**; reports now real (§6); disputes/CMS missing; analytics charts mock |
| M12 Monetisation | 🔴 MOCK | Fake payment; no boosts/payments/subscriptions tables; **no kill-switch** |
| M13 Trust/Safety | 🟡 PARTIAL | Verify gate works; report pipeline now real (§6); **stale-decay missing** |
| M14 Localisation | 🔴 MISSING | **No i18n, no Bangla, no Bangla numerals, no PWA** (multiple MVP Musts) |
| M15 Insights | 🟢 DONE | Real aggregation from `listings` + `price_snapshots` |

---

## 2. Critical fixes (MVP "Must" broken or security)

1. **Security — verification bypass.** `consumer-app/src/app/api/listings/[id]/route.ts` GET returns **any** listing by id with no `verified` filter. Search is gated; detail is not → unverified/rejected/pending listings are publicly fetchable by direct id. Add a `verified=true` guard (with owner/admin bypass).
2. **Auth uses the wrong identity model.** OTP keyed on **email** via Resend (`api/auth/otp/send/route.ts`); no SMS. Spec mandates phone + SMS as primary identity. `users.phone` is nullable and not unique.
3. **Review eligibility gate missing.** `api/reviews/route.ts` lets any signed-in user post a review with no completed-visit check. **FR-8.6 violated.**
4. **Admin reject path broken.** Moderation queue `RejectButton.tsx` posts JSON but the API reads `formData()` → silent failure; the review-page reject form has no reason input (always defaults to "Policy violation"). Only the detail-page `RejectModal` works.
5. **No data export / account deletion** (FR-1.8 Must) — no endpoint, no soft-delete column.
6. **No i18n at all** (M14) — `lang="en"` hardcoded, zero Bangla, no Bangla numerals, no PWA manifest/service worker.

---

## 3. Schema gaps

Live DB had **18 tables** at audit (now 19 — `reports` added, see §6).

### Missing tables (entire)
`media`, `saved_searches`, `payments`/`transactions`, `boosts`, `subscriptions`, `agency_members`, `kyc_documents`, `notification_preferences`, `sessions`. (`reports` — **now added**; `audit_log` — partial as `config_audit`, config mutations only.)

### Missing columns on existing tables
| Table | Missing |
|---|---|
| `users` | `preferred_language`, `verification_status`, `deleted_at` (soft delete) |
| `listings` | `hide_exact_pin`, `negotiable`, `available_confirmed_at`, `expires_at`, real status-lifecycle (only `moderation_status`). **`views` — now added.** |
| `bookings` | 6-state status enum (has 4: missing `suggested`, `no_show`), `reason`, `history`, `provider_id`, multi-slot proposals |
| `reviews` | `visit_id`, `owner_response`, `status`, `media`, `target_id` (two-way) |
| `messages` | receipt `status`, `type`, `reply_to`, `reactions`, `media_url` |
| `threads` | block/mute flags, second participant |
| `saves` | `collection` |

### Schema drift (not spec — fix opportunistically)
- `admin-app/src/db/schema.ts` was stale on `notifications` (declared `type` as plain text, missing `thread_id`/`count`/`updated_at`); live DB has the richer columns.
- `owners.verified` exists in live DB + admin schema but is omitted from consumer/provider `schema.ts`.

---

## 4. Per-app detail

### consumer-app
- **Real/DONE:** favourites (`saves`), notification inbox + SSE, insights aggregation, listing wizard create→moderation gate, booking create/cancel, custom thread/message chat (text), search list↔map sync + verified-only, Google OAuth, password signin, role switch.
- **Mock/hardcoded:** saved searches ("3 active · 4 new matches"), provider rating (static `owners.rating` 4.5), presence ("Online · Agent", "replies within 24h"), availability ("Available now"), amenities list (hardcoded despite `/api/amenities`).
- **Missing:** i18n, PWA, KYC backend, data export/delete, most search filters server-side, review eligibility gate, chat media/receipts/block/report.

### admin-app
- **Real/DONE:** route guard (`proxy.ts`, `role==='admin'`), moderation queue + approve (gates public search), config CRUD (blocks/amenities/categories/pricing) + `config_audit`, listings/users lists, reports (now real — §6).
- **Mock widgets inside real screens:** Dashboard charts/funnel/heatmap/activity/revenue; Analytics growth + revenue donut.
- **Fully mock / inert:** Audit Log screen (hardcoded rows; moderation/user/verify actions not logged), user suspend/ban/restore (no handler, no status column), CMS (static placeholder), disputes (absent).
- **Bugs:** reject path (see §2.4); `moderation_status` largely vestigial (public gate keys off `verified`).

### provider-app
- **Real/DONE:** Overview core KPIs, My Listings table + counts, Listing Detail counts, Leads list + **Reply (persists message + notification)**, Visits list, Analytics core KPIs, Reviews view + aggregates, scope enforcement, notification read-marking.
- **Stubbed (toast-only, no DB write):** listing pause/mark rented-sold, visit accept/decline/suggest, review respond/report.
- **Mock/fabricated:** perf chart bars, listing-detail impressions estimate, "vs area average" strings, analytics lead-source split, sidebar badges, **Profile screen entirely hardcoded** (never calls `getProviderSession()`), team seats, response-rate/time.
- **Missing:** real payments, featured/bump ranking, subscriptions, monetisation kill-switch, CSV import, billing, view/conversion tracking, visit reminders, seeker counter-loop, sub-ratings display.
- Source of mock: `provider-app/src/lib/provider/data.ts`.

---

## 5. Suggested build order

1. **Security + schema migration** — fix the detail-GET leak; add missing columns/tables (unblocks nearly everything downstream).
2. **MVP correctness** — SMS-OTP + phone identity, review eligibility gate, admin reject fix, data export/delete.
3. **Wire stubs to DB** — provider write actions (pause/mark/accept/suggest), full search filter set server-side, visit negotiation loop (6 states).
4. **M14 localisation** — i18n + Bangla numerals + ৳ + PWA (whole MVP pillar absent).
5. **Trust** — stale-listing decay (weekly re-confirm + "available on" stamp), user suspend/ban, wire admin Listings take-down to the report-remove path.
6. **Later** — M12 monetisation (build kill-switch first), chat media/receipts, agency tools (seats/CSV/billing).

---

## 6. Recently closed (M5 + report pipeline)

Shipped after the audit:

- **`listings.views` column** (DB + all 3 Drizzle schemas) + `POST /api/listings/[id]/view` (atomic increment) + view count displayed on the detail page.
- **Video in gallery** — photos + `listings.videos` merged; hero + lightbox play native `<video controls>`; thumbnails show a ▶ overlay.
- **Share** — Web Share API with clipboard-copy fallback (renter + owner views).
- **Report (admin-only)** — new `reports` table; consumer `POST /api/reports` (auth-required, validated reasons) + report modal; **admin reports page rewritten from mock → real DB** (joins listing + reporter, status tabs, real counts); admin `POST /api/admin/reports` with **Dismiss** and **Remove listing** (takes listing down → `rejected`, notifies owner, resolves open reports).

Effect on gaps: **M5** moves to mostly-done; **M11 "reports fully mock"** and **M13 report pipeline** are now real end-to-end. Verified in the running consumer preview (video playback, view increment 0→1, report persisted + success screen).

Still open on M5: provider response-time on the trust card is static; exact-pin gating logic exists on the map but is not driven by an approved-visit state yet.
