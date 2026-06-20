# Dwell — Project Handoff Summary

## Project
**Name:** Dwell  
**Type:** Property rental & sales marketplace — Aftab Nagar, Dhaka, Bangladesh  
**Phase 1:** Responsive Web App (Next.js)  
**Phase 2:** Flutter iOS/Android (same backend APIs)  
**Language:** English only (no Bangla for MVP)

---

## Design Files (source of truth)
Located at: `/Users/bulbulahmed/start/Dwell/dwell/project/`

| File | What it is |
|---|---|
| `Dwell.dc.html` | Consumer app — 13 screens |
| `Dwell Admin.dc.html` | Admin console — 6+ screens |
| `Dwell Provider.dc.html` | Provider studio — 9 screens |
| `support.js` | Design framework runtime (ignore in production) |

### Consumer app screens (Dwell.dc.html)
All 13 screens in one file, toggled by `s.screen` state in DCLogic class:
1. Home (hero + search + featured listings)
2. Sign In / Sign Up (split layout, Google + phone options)
3. Search Results (filters sidebar + listing grid + map)
4. Property Detail (gallery + facts + amenities + booking card)
5. Booking Modal — 3 steps (slot → note → confirmed)
6. Messages (thread list + WhatsApp-style chat)
7. Saved (saved listings + visits list)
8. List Property Wizard — 5 steps (type → details → photos → pricing → review)
9. Insights (market data, trend charts, block bars)
10. Account (profile, language, notifications, saved searches)
11. Public Provider Profile (listings + reviews)
12. Notifications
13. Write Review (star rating + sub-ratings + text)

### Design tokens
- **Primary accent:** `#1E3A5C` (dark navy)
- **Green/verified:** `#2E7D55`
- **Gold/boost:** `#C9A24B`
- **Background:** `#FFFFFF` (consumer), `#F4F6F9` (admin/provider)
- **Text primary:** `#15243B`
- **Text secondary:** `#6A7180`, `#8B93A1`
- **Border:** `#E7EAEE`
- **Fonts:** Plus Jakarta Sans + Instrument Serif (Google Fonts)
- **Animations:** `bvfade`, `bvpop`, `bvrise` (defined in helmet styles)

### Design prototype format
The HTML uses a custom mini-framework:
- `<sc-if value="{{ condition }}">` — conditional rendering
- `<sc-for list="{{ items }}" as="item">` — list rendering
- `{{ variable }}` — template interpolation
- `DCLogic` class with `renderVals()` → all UI state lives here
- `<helmet>` — styles/fonts injected into head

---

## Confirmed Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Radix UI |
| Animation | Framer Motion |
| Backend | NestJS (Node.js + TypeScript) |
| Database | PostgreSQL 16 + PostGIS |
| Search | Typesense |
| Cache/Queues | Redis + BullMQ |
| Real-time Chat | Stream Chat SDK (Phase 1) |
| Media | Cloudflare R2 + Cloudflare CDN |
| Auth | Custom OTP (NestJS) + JWT + refresh tokens |
| Notifications | FCM (push) + SMS + Resend (email) |
| Maps | **Google Maps** (confirmed by user) |
| Payments | **SSLCOMMERZ** (bKash/Nagad/Rocket/cards) |
| Mobile (Phase 2) | Flutter |
| Infra | Docker + AWS ap-southeast-1 (Singapore) |
| Monitoring | Sentry + Pino logs |

---

## Conversion Approach

**Rule #1: Do not create new design. Convert existing HTML pixel-perfectly.**

Every inline `style={{}}`, every color, every border-radius, every animation — copied exactly from the HTML prototype.

### Template syntax conversion
```
<sc-if value="{{ cond }}">    →  {cond && <div>...</div>}
<sc-for list="{{ list }}" as="item">  →  {list.map(item => <div key={}>...</div>)}
{{ variable }}               →  {variable}
onClick="{{ handler }}"      →  onClick={handler}
```

### State management
- `DCLogic.renderVals()` → **Zustand** store (global: intent, saved, auth, booking, active thread)
- Local UI state → React `useState`
- Server data (listings) → Next.js server components + API routes

### Routing
| Screen | Route |
|---|---|
| Home | `/` |
| Auth | `/auth` |
| Search | `/search` |
| Property Detail | `/listings/[id]` |
| Messages | `/messages` |
| Saved | `/saved` |
| List Wizard | `/list` |
| Insights | `/insights` |
| Account | `/account` |
| Notifications | `/notifications` |
| Write Review | `/review/[id]` |
| Provider Profile | `/providers/[id]` |

---

## Seed Data (from design)
22 listings hardcoded in `Dwell.dc.html` `data()` method. Categories:
- `rent` — 6 listings (Block A, B, C, D, H, Banasree)
- `buy` — 4 listings (Block A, C, D, E)
- `sublet` — 4 listings (Block B, C, D, Banasree)
- `room` — 4 listings (Block C, F, H)
- `student` — 4 listings (Block F, G)

Listing images: Unsplash URLs (keep for seed data, replace with R2 for real listings)

---

## Build Order (consumer app first)

1. **Scaffold** — Next.js project + TypeScript + global styles (copy fonts + CSS from `<helmet>`)
2. **Nav shell** — sticky header with all nav items
3. **Home page** — hero + search bar + featured listings grid + how-it-works
4. **Search page** — filter sidebar + 2-col grid + Google Maps
5. **Property detail** — gallery + booking card (3-step modal)
6. **Auth modal** — sign in / sign up
7. **Messages** — Stream Chat integration
8. **Saved + Notifications**
9. **List wizard** — 5-step form
10. **Insights + Account**

---

## Key Decisions Already Made
- Project name: **Dwell** (not BariVara — that's the internal SRS name)
- Bangla: **skip for MVP**
- Maps: **Google Maps** (not Mapbox)
- Payments: **SSLCOMMERZ** only
- Media: **Cloudflare R2** (zero egress fees)
- Chat: **Stream Chat SDK** (saves 6-8 weeks vs building from Socket.IO)
- Search: **Typesense** (not Elasticsearch)
- Design: **convert existing HTML — no new design**

---

## SRS Location
`/Users/bulbulahmed/start/Dwell/dwell/project/uploads/BariVara_SRS_1.docx`  
Full spec: auth, listings, search, visits, chat, reviews, admin, monetisation, KPIs, risks.

---

## Start Command for New Chat
> "Read HANDOFF.md at /Users/bulbulahmed/start/Dwell/HANDOFF.md and start building the Dwell consumer app. Begin with Step 1: scaffold + global styles. The design source is /Users/bulbulahmed/start/Dwell/dwell/project/Dwell.dc.html — convert it pixel-perfectly, do not create new design."
