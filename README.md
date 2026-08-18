# Sadha Portal

A self-hosted operations portal for **Sadha Groups** — a faithful replica of the firm's
[Zoho Creator](https://sadhagroups.zohocreatorportal.com/) application. It manages diesel,
sales, rent, boulders, excavators, accounts, master data, and tyre maintenance.

Built with **TanStack Start** (SSR React + TypeScript), **Supabase** (Postgres + Auth),
**Tailwind CSS v4**, and **Recharts**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Environment Variables](#environment-variables)
4. [Project Structure](#project-structure)
5. [How Authentication Works](#how-authentication-works)
6. [How Data Connections Work](#how-data-connections-work)
7. [Database Schema](#database-schema)
8. [Navigation & Routing](#navigation--routing)
9. [Reports & Entry Forms](#reports--entry-forms)
10. [Dashboard](#dashboard)
11. [Tyre Module](#tyre-module)
12. [Migrations](#migrations)
13. [Scripts](#scripts)

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start (React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (oklch design tokens) + shadcn/ui components |
| Charts | Recharts |
| Backend / DB | Supabase (Postgres + Auth + PostgREST + RLS) |
| Server runtime | Nitro (builds to a Cloudflare-compatible worker) |
| Build tool | Vite 8 |
| Package manager | Bun (lockfile `bun.lock`) |

---

## Getting Started

```sh
# 1. Install dependencies
bun install          # or: npm install

# 2. Configure environment variables (see below)
cp .env.example .env # if an example exists; otherwise create .env manually

# 3. Start development server
bun run dev          # → http://localhost:5173 (or an available port)

# 4. Production build + preview
bun run build
bun run preview
```

> **Prerequisite:** you must have a Supabase project with the migrated schema (see
> [Database Schema](#database-schema)). The app shells are present, but reports/dashboard
> depend on the tables existing.

---

## Environment Variables

Create a `.env` file at the project root (this file is **gitignored** — never commit it).
The app reads different variables on the **client** vs the **server**:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Public "anon" key (`sb_publishable_…`) |
| `VITE_SUPABASE_PROJECT_ID` | Client | Project reference id |
| `SUPABASE_URL` | Server (SSR) | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server (auth middleware) | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (admin client) | Secret key (`sb_secret_…`) — bypasses RLS |
| `SUPABASE_PROJECT_ID` | Server | Project reference id |

> `VITE_*` values are inlined at build time and shipped to the browser. The **service role
> key must never be prefixed with `VITE_`** — it's server-only.

---

## Project Structure

```
sadhaportal/
├── src/
│   ├── server.ts              # SSR entry wrapper: catches h3-swallowed 500s, renders error page
│   ├── start.ts               # createStart(): registers error, CSRF, and auth middleware
│   ├── router.tsx             # creates TanStack Router + React Query client
│   ├── routeTree.gen.ts       # AUTO-GENERATED route tree (do not edit)
│   │
│   ├── routes/
│   │   ├── __root.tsx         # Root layout: <html>/<head>/<body>, auth listener, <Outlet>
│   │   ├── auth.tsx           # Sign in / sign up page (email+password, Google OAuth)
│   │   └── _authenticated/    # Auth-guarded section
│   │       ├── route.tsx      # Guards: redirects to /auth if no session
│   │       ├── index.tsx      # Dashboard (live aggregates)
│   │       ├── all-reports.tsx # All Reports index (searchable, live counts)
│   │       ├── tyre.tsx        # Truck Tyre View (axle diagram)
│   │       ├── tyre-report.tsx # Fleet Tyre Report (grid + CSV export)
│   │       ├── tyre-module.tsx # Tyre Module (inventory/fitment/teeth/services/audit)
│   │       └── p/$.tsx         # Catch-all: report grids + entry forms + family pages
│   │
│   ├── components/
│   │   ├── layout/AppShell.tsx# Sidebar (icon rail + floating submenu) + content shell
│   │   └── ui/                # shadcn/ui components (auto-generated)
│   │
│   ├── integrations/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Client-side Supabase client (lazy Proxy)
│   │   │   ├── client.server.ts # Server-side ADMIN client (service role, bypasses RLS)
│   │   │   ├── auth-attacher.ts # Client middleware: attaches Bearer token to serverFn
│   │   │   ├── auth-middleware.ts # requireSupabaseAuth (server claim verification)
│   │   │   └── types.ts       # Generated Supabase Database types
│   │   └── lovable/index.ts   # Lovable Cloud Auth (Google OAuth)
│   │
│   ├── hooks/
│   │   ├── useDashboardData.ts# Live dashboard aggregates (balances, charts, today)
│   │   ├── useReportData.ts   # Generic report rows + counts + CSV export
│   │   ├── useEntryForms.ts   # Form value coercion + insert mutation
│   │   ├── useTyres.ts        # Tyre positions / events (the position-based module)
│   │   └── useTyreModule.ts   # Tyre inventory/fitment/teeth/services + audit log
│   │
│   ├── lib/
│   │   ├── nav.ts             # Sidebar navigation definition
│   │   ├── reports.ts         # Report registry (slug → table + exact columns)
│   │   ├── entryForms.ts      # Entry form definitions (sections + fields)
│   │   ├── tyres.ts           # Pure tyre geometry/position logic (+ tests)
│   │   ├── utils.ts           # cn() class merge helper
│   │   ├── error-capture.ts   # Global error capture/describe (SSR)
│   │   └── error-page.ts      # Renders the "page didn't load" HTML
│   │
│   └── styles.css             # Tailwind theme: Lato font, dark navy sidebar, oklch palette
│
├── supabase/
│   ├── config.toml            # project_id (points to the active Supabase project)
│   └── migrations/            # SQL migrations (schema, RLS, triggers, seeds)
│
├── scripts/                   # Zoho extraction/scraping utilities + import helpers
├── data/                      # Exported Zoho CSV/JSON (gitignored — PII)
├── public/                    # favicon, robots.txt
├── .env                       # Secrets (gitignored)
├── package.json / bun.lock    # Dependencies + scripts
└── vite.config.ts             # Vite/TanStack/Nitro config
```

---

## How Authentication Works

Authentication is handled entirely by **Supabase Auth**, with the app as the session consumer.

### 1. Sign-in (`src/routes/auth.tsx`)
- **Email + password** → `supabase.auth.signInWithPassword(...)`.
- **Sign up** → `supabase.auth.signUp(...)` (email confirmation; display name auto-derived).
- **Google OAuth** → via `@lovable.dev/cloud-auth-js` (`src/integrations/lovable/index.ts`),
  which calls `lovable.auth.signInWithOAuth("google")` and then `supabase.auth.setSession(...)`.

### 2. Session persistence (`src/integrations/supabase/client.ts`)
- `persistSession: true`, `autoRefreshToken: true`.
- On the browser, the session lives in `localStorage`; on the server it's disabled.

### 3. Route guard (`src/routes/_authenticated/route.tsx`)
- `beforeLoad` runs `supabase.auth.getUser()`.
- If there's no valid user, it throws `redirect({ to: "/auth" })`.
- So every `/`-mapped page under `_authenticated` requires a signed-in session.

### 4. Auth listener (`src/routes/__root.tsx`)
- Subscribes to `supabase.auth.onAuthStateChange(...)`.
- On `SIGNED_IN` / `USER_UPDATED` it invalidates the router + query cache; on `SIGNED_OUT` it
  redirects appropriately.

### 5. Server-function auth (`src/start.ts` + `src/integrations/supabase/auth-attacher.ts`)
- `attachSupabaseAuth` is registered as a client `functionMiddleware`. It reads the current
  Supabase session and attaches `Authorization: Bearer <access_token>` to every server function
  call.
- `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`) is available on the
  server side to **verify** that bearer token via `supabase.auth.getClaims(token)` and inject
  `supabase`/`userId` into the request context. (Wire it into `functionMiddleware` for any
  server function that must enforce the caller's identity.)

> **Postgres/auth link:** a trigger `handle_new_user()` creates a `profiles` row and assigns an
> `admin` role to `md@sadhainfra.com` on signup (see migrations).

---

## How Data Connections Work

All data access flows through Supabase's **PostgREST** API using the `@supabase/supabase-js`
client — there is no custom API server.

### Client → DB (browser)
1. A React hook (e.g. `useReportRows`) calls `supabase.from("<table>").select(...)`.
2. The client attaches the **anon publishable key** (`apikey` header) and, when signed in,
   the user's JWT (`Authorization: Bearer …`).
3. Supabase routes through **Postgres Row Level Security (RLS)** — only rows the logged-in
   user is allowed to see/change are returned.

### Server → DB (SSR / admin)
1. `src/integrations/supabase/client.server.ts` creates an **admin** client using the
   `SUPABASE_SERVICE_ROLE_KEY` (which bypasses RLS).
2. Used only for trusted server operations. Never imported by client-side code (the file is
   explicitly `*.server.ts`).

### Registry-driven table access
Rather than hand-writing a query per page, the app uses two registries:

- **`src/lib/reports.ts`** — maps every report slug → target table + exact column list.
- **`src/lib/entryForms.ts`** — maps every "add" form → target table + section/field list.

The generic hooks (`useReportRows`, `useReportCounts`, `useSubmitEntryForm`) then query/insert
using those registry definitions. This keeps additions to a single config change.

### Env wiring
- Browser reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Server reads `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.

---

## Database Schema

The schema lives in `supabase/migrations/`. Groups:

### Auth & access (from `e9ca7c08` + `0b685d27` + `9fd50b4b`)
- `profiles` — id (FK → `auth.users`), display_name, avatar_url.
- `user_roles` — user_id ↔ role (`admin` | `moderator` | `user`).
- `has_role(user_id, role)` — security-definer function.
- `handle_new_user()` trigger — auto-profiles + auto-assigns admin to `md@sadhainfra.com`.

### Tyre module (from `cdb93652` + `tyre_module` + `tyre_audit`)
- `vehicles` — vehicle_number, wheels, odometer.
- `tyres` — position-based tyre rows (vehicle_id, position_code, brand, km, cost, status).
- `tyre_events` — fitment/repair/rotation event history per tyre.
- `tyre_inventory` / `tyre_fitment` — new | mines | retrading purchase + fitment records.
- `teeth_purchase` / `teeth_fitment` — excavator teeth stock + usage.
- `service_entries` — tyre/vehicle service & repair log.
- `tyre_audit_log` — **audit trail** of INSERT/UPDATE/DELETE across all tyre tables
  (trigger `log_tyre_audit()` captures old/new JSON + `auth.uid()`).

### Operations / reference replica (from `reference_schema` + `entry_form_columns` + `excavator_material_rates`)

**Masters:**
`fleet_vehicles`, `clients`, `vendors`, `drivers`, `materials`, `machines`,
`transporters`, `units`, `categories`, `sub_categories`, `payment_categories`,
`company_profile`, `accounts`

**Entries:**
`diesel_entries`, `def_oil_entries`, `sales_entries`, `rent_entries`,
`day_fees_entries`, `boulder_entries`, `boulder_diesel_entries`, `excavator_entries`,
`excavator_daily_entries`, `excavator_rent_entries`, `excavator_diesel_entries`,
`income_expense_entries`, `material_rates`

> Every table is enrolled in **RLS** (`ENABLE ROW LEVEL SECURITY`) with a permissive
> `authenticated` policy; `service_role` has full access. The generated types in
> `src/integrations/supabase/types.ts` mirror this schema.

---

## Navigation & Routing

- File-based routing (TanStack Router). `routeTree.gen.ts` is regenerated on `dev`/`build`.
- **Sidebar** (`src/lib/nav.ts` + `AppShell.tsx`): a narrow icon rail; clicking a category
  opens a **floating submenu overlay** (does not shift page layout).
- Route mapping:
  - `/` → Dashboard
  - `/auth` → Sign in
  - `/all-reports` → All Reports index
  - `/tyre`, `/tyre-report`, `/tyre-module` → tyre pages
  - `/p/$` (splat) → any report grid, entry form, or family landing page, resolved by slug.

---

## Reports & Entry Forms

### Reports (`/p/<slug>`)
Driven by `src/lib/reports.ts`. Each entry defines:
- `slug`, `label`, `table`, and `columns` (label + key + numeric flag).

The generic grid renderer (`src/routes/_authenticated/p/$.tsx`) provides:
- spreadsheet-style table (numeric right-aligned)
- live search, print, export CSV, record count
- an **Add** button that links to the matching entry form (when one exists).

### Entry Forms (`/p/<add-…>`)
Driven by `src/lib/entryForms.ts`. Four forms mirror the Zoho source exactly:
- **Add Sales Entry** (`add-sales-entry` → `sales_entries`)
- **Add Rent Entry** (`add-rent-entry` → `rent_entries`)
- **Add Day Fees Entry** (`add-day-fees-entry` → `day_fees_entries`)
- **Add Boulders Entries** (`add-boulders-entries` → `boulder_entries`)

Each is sectioned (Basic → Purchase/Day-Fees/Boulders → Transport → Diesel → Profit), with
required-field validation (`*` markers) and a shared `Report For` filter concept.

### Family landing pages
- `/p/boulder-reports` and `/p/excavator-reports` group related reports with live counts.

---

## Dashboard

`src/routes/_authenticated/index.tsx` is fully **live** (no static figures). It aggregates via
`src/hooks/useDashboardData.ts` from: `clients`, `vendors`, `drivers`, `transporters`,
`income_expense_entries`, `sales_entries`, `rent_entries`, `diesel_entries`,
`excavator_daily_entries`.

Sections:
- Balance Overview (client / vendor / diesel / driver)
- Quick Actions
- Transporter-wise accounts (donut + balances)
- Financial Overview (income/expense bar)
- Today Sales / Rent / Direct Diesel / Excavators performance
- Master counts (clickable)

> Date fields from the source use mixed formats (`03-Aug-2026`, `2024-03-20`, `dd/mm/yyyy`,
> ISO). The hook normalizes them for "today" filtering.

---

## Tyre Module

Three complementary surfaces (not part of the Zoho reference site — a separate addition):

1. **Truck Tyre View** (`/tyre`) — axle-wise diagram per vehicle with clickable tyre buttons.
2. **Fleet Tyre Report** (`/tyre-report`) — fleet-wide table with filters + CSV export.
3. **Tyre Module** (`/tyre-module`) — inventory / fitment / excavator teeth / services / audit.

The tyre module's DB tables are audited: every change is recorded in `tyre_audit_log`.

---

## Migrations

Apply in chronological order (filename prefix is the timestamp):

```
supabase/migrations/
├── 20260808074521_*.sql  # profiles, user_roles, triggers
├── 20260808074554_*.sql  # revoke grants
├── 20260812220112_*.sql  # admin role assignment + backfill
├── 20260812220617_*.sql  # vehicles, tyres, tyre_events + seed
├── 20260818160600_tyre_module.sql     # tyre inventory/fitment/teeth/services
├── 20260818160600_tyre_audit.sql      # audit log + triggers
├── 20260818160700_reference_schema.sql# all operations/master tables
├── 20260818160701_entry_form_columns.sql # form-only columns
└── 20260818160702_excavator_material_rates.sql # remaining 2 reports
```

---

## Scripts

`scripts/` contains Zoho-portal extraction/exploration utilities (Playwright-based). They are
run standalone (not part of the app) and require `ZOHO_EMAIL` / `ZOHO_PASSWORD` env vars:

- `zoho_ui_audit.mjs` — captures screenshots, form fields, and theme from the reference site.
- `zoho_extract.mjs` — logs into the portal and dumps API calls/cookies.
- `cleanup.mjs`, `consolidate.mjs`, `finalize.mjs` — normalize/consolidate extracted data into
  `data/zoho_export/`.

---

## Audit Trail

`tyre_audit_log` records **who** changed **what** and **when** across all tyre-related tables.
A generic trigger `log_tyre_audit()` stores `old_data`/`new_data` (JSON) and `changed_by`
(`auth.uid()`), giving full change history (insert/update/delete).