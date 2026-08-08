# Architecture

World Watch is a Next.js App Router app, scaffolded from werft-template, that
will show a real-time and historical map of natural hazards, security
incidents, conflicts, and other major disruptions around the world. It is
still at the placeholder stage: `apps/web/src/app/page.tsx` has not yet been
replaced with the actual map/data view.

## Access

The app is public. There is no sign-in gate: every route is reachable by
anyone, and there is no session, no cookie, and no concept of a signed-in
user. This is a deliberate departure from the werft-template default (which
closes every route behind a single-operator login) because World Watch is
meant to be read by the public, not just its operator — a hazard map with a
login screen in front of it defeats the point.

Nothing in the app writes to a request-scoped identity. If a future feature
needs to distinguish the operator from any other visitor (an admin view, a
moderation action), that needs its own access control decided at the time —
see `docs/SESSIONS.md` for what this rules out today.

## Data

- `drizzle-orm` against Neon Postgres, migrations checked into
  `apps/web/src/db/migrations`.
- `audit_log` (`apps/web/src/db/schema.ts`) is a generic, append-only event
  table — `kind` is a free-form string, not tied to any particular feature.
  Nothing currently writes to it (the sign-in/sign-in-failed events it used to
  record no longer happen), but `recordEvent` in `apps/web/src/db/events.ts`
  stays available for whatever World Watch's own features need to record
  later. A write failure there is swallowed, not fatal.

## Environment

Only `DATABASE_URL` is required (`apps/web/src/env.ts`, validated with zod,
read lazily so `next build` needs no secrets). There is no `AUTH_SECRET`, no
operator email, and no password hash — see `docs/SESSIONS.md` for why those
were removed rather than left unused.

## Styling

`@werft/tokens` generates CSS custom properties (light/dark) consumed by
`apps/web/src/app/globals.css`. No raw colour, spacing, or font literals in
stylesheets — add a token instead.

## What this app does not have (yet)

No map, no incident/hazard data model, no ingestion pipeline. The home page
is still the template's placeholder text. That is the next real piece of
work, not something this change attempted.
