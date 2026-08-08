# Architecture

What this app is, as it stands today. Conventions and hard rules live in
`AGENTS.md` — this file describes the running app, not the rules that shape
it.

## What it does

A single-operator Next.js app that shows a world map of alerts — natural
hazards, security incidents, conflicts, and other major disruptions — with a
date filter above it. Every route requires the operator's session; there is
no public page except `/login`.

## Data model

Two tables, both in `apps/web/src/db/schema.ts`:

- `audit_log` — append-only record of sign-ins and sign-in failures. Writes
  swallow their own failures (`src/db/events.ts`) so a database outage can
  never lock the operator out.
- `alerts` — one row per hazard/incident/conflict/disruption: `title`,
  `description`, `category`, `latitude`/`longitude`, `occurredAt`,
  `sourceUrl`, `createdAt`. Indexed on `occurredAt` since every read filters
  or sorts by it. Nothing writes to this table yet — see "What's not built"
  below.

`src/db/alerts.ts` holds the one read path: `listAlerts({ from, to })`,
optionally bounded on `occurredAt`, newest first.

## The home page

`apps/web/src/app/page.tsx` is a server component (`force-dynamic`, since it
reads the session cookie). It:

1. Reads `from`/`to` from the URL's search params and turns them into a UTC
   date range (`src/lib/date-range.ts`) — `to` is pushed to the end of that
   day so the filter is inclusive of the whole day picked, not just its
   midnight.
2. Calls `listAlerts(range)`.
3. Renders a `<form method="get">` with two `<input type="date">` fields —
   plain HTML GET navigation, no client-side state, so the filter is a normal
   bookmarkable/shareable URL and works with JavaScript disabled.
4. Renders `WorldMap` (`src/components/world-map.tsx`) with the filtered
   alerts, then the same alerts as a list underneath.

## The world map

`WorldMap` is an inline SVG on a `viewBox="0 0 360 180"`, so degrees map
directly to SVG user units: `x = lng + 180`, `y = 90 - lat`
(`src/lib/geo.ts`, unit-tested). Every alert becomes a `<circle>` at its
projected position.

The continent shapes drawn behind the markers are **stylised outlines, not
surveyed coastline data** — a handful of hand-picked points per landmass,
enough to read as "world map" at a glance. Getting real coastlines would mean
a geo/topojson dependency, and none is on the blessed dependency list in
`AGENTS.md`; that's a deliberate scope cut for this pass, not an oversight —
see `docs/SESSIONS.md`.

Everything is coloured through `@werft/tokens` custom properties (`.world-map*`
rules in `src/app/globals.css`) — no literal colours, so it follows the
operator's light/dark scheme like the rest of the app.

## Design tokens, auth, migrations, tests

Unchanged from the template: `@werft/tokens` is the only source of colour/
spacing/font values; `next-auth` gates every route except `/login` via
`src/proxy.ts`; schema changes go through `pnpm db:generate` (Drizzle) into
`src/db/migrations/`, applied by `pnpm db:migrate`; unit tests are co-located
`*.test.ts` files run by Vitest, e2e smoke tests live in `apps/web/e2e/` and
run against a production build with Playwright. See `AGENTS.md` for the full
set of hard rules (blessed dependencies, migration append-only-ness, secret
handling, CI gates).

## What's not built

- **Ingestion.** Nothing populates `alerts`. What sources to pull from, how
  often, and how to de-duplicate is a separate decision — the schema and the
  read path exist so that decision has something concrete to design against,
  but the decision itself hasn't been made.
- **Real coastlines.** The current continent outlines are a stylised
  approximation (see above). Swapping in accurate data is a "human decision
  first" per the blessed-dependency rule, not something to add quietly.
- **Category/severity filtering.** Only a date range is filterable today, per
  the issue that asked for this. Filtering by category or severity is a
  natural next step once there's real data to filter.
