/**
 * Insert a handful of example plants and supplier sites so the "Exposed
 * sites" panel on /map has something real to compute against locally or on
 * a PR preview.
 *
 * Fixture data only — there is no master-data connection yet (entity
 * resolution against real supplier/plant records is its own story, per the
 * issue). Not run by `db:migrate`; run it yourself once a database exists:
 *
 *   pnpm --filter web run db:seed-sites
 */
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { sites } from "../src/db/schema.ts"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

const db = drizzle(neon(url))

const existing = await db.select().from(sites).limit(1)
if (existing.length > 0) {
  console.log("sites table already has rows — skipping seed")
  process.exit(0)
}

await db.insert(sites).values([
  {
    name: "Rotterdam Plant",
    kind: "own_plant",
    latitude: 51.9244,
    longitude: 4.4777,
    region: "Netherlands",
  },
  {
    name: "Osaka Plant",
    kind: "own_plant",
    latitude: 34.6937,
    longitude: 135.5023,
    region: "Japan",
  },
  {
    name: "Tier-1 supplier — Cebu",
    kind: "supplier_site",
    tier: 1,
    latitude: 10.3157,
    longitude: 123.8854,
    region: "Philippines",
  },
  {
    name: "Tier-1 supplier — Izmir",
    kind: "supplier_site",
    tier: 1,
    latitude: 38.4237,
    longitude: 27.1428,
    region: "Turkey",
  },
])

console.log("seeded 4 example sites")
