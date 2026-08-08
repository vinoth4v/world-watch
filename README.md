# world-watch

Real-time and historical map showing where natural hazards, security
incidents, conflicts, and other major disruptions are happening around the
world.

The homepage plots alerts on a world map, filterable by the date the event
occurred, with a "Report an alert" form for entering new ones — there is no
automated feed yet, so alerts are entered by the operator (see
`docs/ARCHITECTURE.md`).

Scaffolded from werft-template. Conventions and hard rules live in AGENTS.md.

```bash
pnpm install
pnpm dev
```

Environment lives in `apps/web/.env.local`; `apps/web/.env.example` lists what
is needed. Run `pnpm hash-password` to set the operator password.
