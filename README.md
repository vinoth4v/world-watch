# world-watch

Real-time and historical map showing where natural hazards, security
incidents, conflicts, and other major disruptions are happening around the
world.

Scaffolded from werft-template. Conventions and hard rules live in AGENTS.md.
How the app itself is put together lives in `docs/ARCHITECTURE.md`; the
history of what changed and why lives in `docs/SESSIONS.md`.

```bash
pnpm install
pnpm dev
```

Environment lives in `apps/web/.env.local`; `apps/web/.env.example` lists what
is needed. Run `pnpm hash-password` to set the operator password.

## What's here today

Signed in, the operator sees a world map with a marker for every alert in the
`alerts` table, a from/to date filter above it, and a list of the same alerts
below. There is no ingestion pipeline yet — the table exists and the page
renders correctly with zero rows, but nothing currently writes alerts into it.
See `docs/SESSIONS.md` for what that would take.
