# Dwell — Local Setup

Three Next.js apps over one Postgres DB.

| App | Dir | Port | URL | Auth |
|---|---|---|---|---|
| Consumer (seeker + light provider) | `consumer-app` | 3001 | http://localhost:3001 | `dwell_token` cookie |
| Admin / moderation | `admin-app` | 3002 | http://localhost:3002 | `role === 'admin'` |
| Provider / agency dashboard | `provider-app` | 3003 | http://localhost:3003 | `role === 'owner'` |

## Prerequisites
- Node 20+ (developed on v25)
- Docker (for Postgres)
- `psql` client

## 1. Clone
```bash
git clone https://github.com/bulbul-ahmed/dwell.git
cd dwell
```

## 2. Database (Docker)
```bash
docker compose up -d        # Postgres 16 on localhost:5434  (user/pass/db = dwell)
```

## 3. Apply migrations — IN ORDER, by hand
> The drizzle journal is out of sync (SQL is applied manually, not via `drizzle-kit migrate`).
> Apply every file in `consumer-app/drizzle/` in numeric order:

```bash
for f in consumer-app/drizzle/*.sql; do
  echo "applying $f"
  PGPASSWORD=dwell psql -h localhost -p 5434 -U dwell -d dwell -f "$f"
done
```
Migrations: `0000` base schema → `0001` listing fields → `0002` booking datetime →
`0003` price snapshots → `0004` owner verification → `0005` visit lifecycle → `0006` visit reminders.

(Optional) seed demo data — see `consumer-app/src/db/seed*.ts` if present.

## 4. Env files — create `.env.local` in EACH app
These are gitignored (secrets). Copy from each `.env.example` and fill.

**`consumer-app/.env.local`**
```
DATABASE_URL=postgresql://dwell:dwell@localhost:5434/dwell
JWT_SECRET=dwell-dev-secret-change-in-production-32chars!!
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_PROVIDER_URL=http://localhost:3003
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<your maps key>
# optional — without these, emails/SMS log to console
RESEND_API_KEY=
EMAIL_FROM=Dwell <noreply@dwell.com.bd>
BULKSMSBD_API_KEY=
BULKSMSBD_SENDER_ID=Dwell
# optional reminder cron guard (leave unset locally = open)
CRON_SECRET=
```

**`admin-app/.env.local`**
```
DATABASE_URL=postgresql://dwell:dwell@localhost:5434/dwell
JWT_SECRET=dwell-dev-secret-change-in-production-32chars!!
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_MARKETPLACE_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<your maps key>
RESEND_API_KEY=
EMAIL_FROM=Dwell <noreply@dwell.com.bd>
BULKSMSBD_API_KEY=
BULKSMSBD_SENDER_ID=Dwell
```

**`provider-app/.env.local`**
```
DATABASE_URL=postgresql://dwell:dwell@localhost:5434/dwell
JWT_SECRET=dwell-secret-key-change-in-production
```

> ⚠️ **JWT secret mismatch (known):** provider uses a *different* `JWT_SECRET` than
> consumer/admin, so a consumer login does NOT carry into the provider app (no SSO).
> To enable cross-app redirect later, set all three to the same value.

## 5. Install + run (each app)
```bash
cd consumer-app && npm install && npm run dev   # :3001
cd admin-app    && npm install && npm run dev   # :3002
cd provider-app && npm install && npm run dev   # :3003
```

## Test credentials
- **Provider:** `rahima@dwell.bd` / `Dwell@1234` (owner "Rahima Properties", linked profile)
- **Admin:** `admin@dwell.bd` (password not seeded — set one:
  `UPDATE users SET password_hash='<bcrypt>' WHERE email='admin@dwell.bd';`)

## Notes / gotchas
- Without `RESEND_API_KEY` → OTP/email logged to server console (dev mode).
- Without `BULKSMSBD_API_KEY` → SMS logged to console (`[sms] would send …`).
- Visit reminders: trigger manually with
  `curl "http://localhost:3001/api/cron/visit-reminders?lead=60"` (no scheduler wired yet).
- Postgres port is **5434** (host) → 5432 (container).
