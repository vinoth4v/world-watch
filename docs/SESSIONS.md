# Sessions

Append-only log of notable Claude sessions on this repo: what was asked, what
changed, what was decided and why, what was rejected, and what is still open.

## 2026-08-08 — Remove the login interface

**Asked:** remove the login interface from this app (issue #7).

**Changed:**

- Deleted the entire NextAuth-based single-operator gate: `apps/web/src/auth.ts`,
  `auth.config.ts`, `proxy.ts` (the middleware that redirected every
  unauthenticated request to `/login`), the `/login` route and its
  `signInAction`, `signOutAction` and the `[...nextauth]` API route, and the
  scrypt password module (`apps/web/src/auth/password.ts` + its test) along
  with the `pnpm hash-password` script that generated hashes for it.
- `apps/web/src/app/page.tsx` no longer reads a session or renders a sign-out
  button; it is the template's plain placeholder page again.
- `apps/web/src/env.ts` no longer requires `AUTH_SECRET`, `WERFT_USER_EMAIL`,
  or `WERFT_PASSWORD_HASH` — only `DATABASE_URL` is validated now. Trimmed the
  same three from `.env.example`.
- `apps/web/e2e/smoke.spec.ts` and `playwright.config.ts`: the smoke test used
  to assert an unauthenticated visitor gets redirected to `/login`; it now
  asserts the opposite — a visitor reaches `/` directly — and the styling
  check moved from the (now-deleted) login page to the home page.
- `werft.json`'s `stack` no longer lists `next-auth`.
- `apps/web/src/db/events.ts`'s `AuditKind` widened from the literal union
  `"sign_in" | "sign_in_failed"` to `string`: those were the only two kinds
  ever recorded, and neither can happen anymore.

**Decided:** the app is now fully public — no session, no cookie, no signed-in
concept anywhere. World Watch is a public hazard/incident map; gating it
behind a personal login contradicted its own purpose. This is a genuine,
intentional departure from werft-template's default posture ("closed by
default"), not an oversight — recorded here per AGENTS.md so it reads as a
decision, not a drift.

**Rejected:**

- *Removing the audit log entirely.* `audit_log` and `recordEvent` are now
  unused (their only caller was the auth module), but the table is generic
  infrastructure, not auth-specific, and AGENTS.md lists it as a standalone
  template capability. Deleting a working, documented capability because its
  first caller went away is a bigger call than this issue asked for. Kept it,
  generalized `AuditKind` to `string` so the type stops implying it only ever
  meant sign-ins.
- *Removing the `next-auth` dependency from `apps/web/package.json`.* Correct
  in principle — nothing imports it anymore — but this session's sandbox has
  no working `pnpm`/`corepack`/`npm -g` (each requires an approval this
  headless run cannot grant), so there was no way to regenerate
  `pnpm-lock.yaml` to match. Removing the dependency line while leaving the
  lockfile as-is would fail every `pnpm install --frozen-lockfile` step in
  `pr-checks.yml` — all four real CI gates — which is worse than one unused
  line in `package.json`. Hand-editing the lockfile instead was also
  rejected: AGENTS.md forbids it outright ("never hand-edit generated files
  ... lockfile"), and a hand-patched pnpm lockfile is exactly the kind of
  thing that looks right and fails anyway.

**Still open:**

- `apps/web/package.json` still lists `next-auth` as a dependency; it is
  unused. Whoever next runs `pnpm install` here (updating any other
  dependency, or just tidying) should drop that line and let `pnpm` rewrite
  `pnpm-lock.yaml` in the same change.
- The home page is still the unmodified template placeholder — the actual
  map/data view described in `README.md` has not been started.
