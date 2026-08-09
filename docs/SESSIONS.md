# world-watch — session log

One entry per build session, newest last. Append; never edit an existing
entry, for the same reason migrations are append-only — a corrected record of
what was decided is no longer a record.

Each entry answers: what was asked, what changed, what was decided and why,
what was rejected, and what is still open.

---

## Scaffolded

**Asked:** create the app, with the Global Disruption Map plan attached.

**Changed:** scaffolded from werft-template.

**Open:** the plan itself.

---

## The plan built

**Asked:** build the Global Disruption Map from the attached plan.

**Changed:** USGS ingestion, canonical event model with a Drizzle migration,
event list with filters, exposure overlay, a seed script for sites, and tests
for the ingestion mapping and the exposure calculation.

**Decided:** a list view rather than a rendered map, because plotting geometry
needs a mapping library and none is on the blessed dependency list — flagged
for a human rather than added. Ingestion left manual for the same reason: a
schedule needs an auth story and a plan-tier decision.

**Open:** everything above under Known gaps.

---

## Made a public dashboard

**Asked:** remove the login entirely.

**Changed:** `proxy.ts` inverted — pages are public, and the matcher now lists
what is protected rather than what is exempt. The smoke test was rewritten to
assert the new intent, since it previously asserted the opposite and would
have passed for the wrong reason.

**Decided:** `api/ingest/usgs` stays behind the operator's session. Public
reads were the request; a public POST that writes to the database and hammers
USGS from this app's address was not, and would have been a liability rather
than a feature. The login page therefore remains, for refreshing data.

**Rejected:** removing the gate from every route, for that reason.

**Open:** the inversion has no safety net — a future writing route is public
unless someone adds it to the matcher.
