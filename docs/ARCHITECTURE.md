# Architecture

`world-watch` is a Werft-template app: one Next.js App Router application
(`apps/web`), one operator, one Postgres database (Neon), gated by
`next-auth` on every route. This file describes the app as it stands today;
`AGENTS.md` has the template's hard rules, and `docs/SESSIONS.md` has the
history of how it got here.

## Data model

Two tables, both in `apps/web/src/db/schema.ts`:

- `audit_log` — append-only, from the template. Records sign-ins.
- `alerts` — the app's actual subject: a natural hazard, security incident,
  conflict, or other disruption, located by `latitude`/`longitude` and timed
  by `occurredAt` (when it happened, not when it was entered). `category` and
  `severity` are plain `text` columns constrained to a fixed set of values at
  the TypeScript level (`alertCategories`, `alertSeverities` in the same
  file) — not a Postgres `enum` type, so adding a value later is a data
  question, not a migration.

`apps/web/src/db/alerts.ts` is the only place that queries `alerts`:
`listAlerts` (optionally bounded by an `occurredAt` range) and `createAlert`.

## Homepage (`apps/web/src/app/page.tsx`)

A single server component, gated like every other route. It:

1. Reads `from`/`to` from the query string and parses them with
   `parseDateRange` (`apps/web/src/app/date-range.ts`) — a pure function,
   unit tested, kept separate from the page so the date-window logic doesn't
   depend on Next.js or a database to test.
2. Loads alerts in that window via `listAlerts`.
3. Renders `WorldMap` (below) and a plain list of the same alerts.
4. Renders a "Report an alert" form, posting to the `createAlertAction`
   server action in `apps/web/src/app/actions.ts`.

The date filter is a plain GET form — no client JavaScript, no route
handler — so it works with cookies/JS disabled and is trivially linkable.

## World map (`apps/web/src/app/world-map.tsx`)

Renders as an inline SVG using a plain equirectangular projection
(`apps/web/src/app/world-map-projection.ts`: longitude and latitude map
linearly onto a 1000×500 viewBox — unit tested at the corners and centre).
Continent outlines are hand-simplified, low-poly coordinate lists
(`apps/web/src/app/world-map-continents.ts`) — recognisable, not
survey-accurate. Alerts are plotted as `<circle>` markers sized and coloured
by `severity`.

This is deliberately **not** a mapping library (Leaflet, Mapbox GL, etc.).
Nothing on the blessed-dependency list in `AGENTS.md` does 2D maps, and
adding one is the kind of dependency decision that rule says to raise, not
make unilaterally inside a feature PR. Static SVG covers what's needed today
— plotting a few dozen points on a world outline — with zero new
dependencies, no API keys, and no client bundle weight. If the map ever needs
panning, zooming, or real coastline accuracy, that's the trigger to have that
conversation.

## No ingestion pipeline

Alerts are entered by the operator through the homepage form — there is no
job that pulls from a news feed, seismic API, or similar. `README.md`
describes the eventual product ("real-time and historical map") but building
real-time ingestion means picking an external data source and, per
`AGENTS.md`, that is a dependency/secret decision for a human to make, not
something to add quietly inside a UI feature. See `docs/SESSIONS.md` for
what's still open here.

## Styling

Everything reads from `@werft/tokens` via CSS custom properties
(`apps/web/src/app/globals.css`) — no raw colours. Severity gets a small
colour scale reused for both the SVG markers (`fill`) and the HTML legend
dots (`background`), via a `--severity-color` custom property set per
`.severity--<level>` class, since a value used through two different CSS
properties can't be a single utility class in the usual sense.
