# world-watch

real-time and historical map showing where natural hazards, security incidents, conflicts, and other major disruptions are happening around the world.

Scaffolded from werft-template. Conventions and hard rules live in AGENTS.md.

```bash
pnpm install
pnpm dev
```

Environment lives in `apps/web/.env.local`; `apps/web/.env.example` lists what
is needed. Run `pnpm hash-password` to set the operator password.
