# world-watch — architecture

How this app works, in its current form. Rewritten whenever the design
changes, so it describes the present rather than accumulating history —
that is SESSIONS.md's job.

## Purpose

A real-time and historical view of where natural hazards, security incidents,
conflicts and other major disruptions are happening, with the operator's own
footprint overlaid so exposure is visible without manual cross-referencing.

## Domain model

**Disruption event** — something that happened somewhere, with a category, a
severity, a region, a location and a status. **Site** — a place the operator
cares about: an own plant or a supplier site, with a tier. **Exposure** — a
site falling within an event's buffer; derived, never stored.

## Data model

- `disruption_events` — introduced by `0001_disruption_events.sql`
- `sites` — introduced by `0001_disruption_events.sql`
- `audit_log` — inherited from the template (`0000_audit_log.sql`)

## Surfaces

- `/` — signed-out landing, public
- `/map` — the dashboard: filters, exposed sites, event list. **Public**
- `/api/ingest/usgs` — POST, fetches USGS and writes events. **Requires the
  operator's session**, and is the only protected route
- `/login` — sign-in, still needed for ingestion

## External services

- **Neon Postgres** via Drizzle — `DATABASE_URL`
- **USGS earthquake feed** — no credential; the only ingestion source so far
- **Kompass gateway** — `KOMPASS_BASE_URL`, `KOMPASS_TOKEN`, wired but unused

## Decisions in force

- **Public reads, private writes.** The template is closed by default; this app
  inverts it because the map is meant to be shareable. `api/ingest` stays
  gated: a public read surface is a choice, a public write endpoint is a
  liability. The matcher in `proxy.ts` now lists what is *protected*, so a new
  route is public unless added — a future writing route must be added, and
  nothing will remind you.
- **No mapping library yet.** Plotting geometry needs one and none is on the
  blessed list, so the dashboard is a list view. Deliberate, not unfinished.
- **Ingestion is manual.** A scheduled run needs its own auth story (a shared
  secret header) and a Vercel plan decision, neither of which was made quietly.

## Known gaps

- No cron, so data goes stale until someone presses Refresh.
- `db:seed-sites` inserts **invented** sites (Rotterdam, Osaka, Cebu, Izmir).
  Useful for a demo, misleading in production; real sites are not loaded.
- Only earthquakes. The plan's other categories have no source yet.
