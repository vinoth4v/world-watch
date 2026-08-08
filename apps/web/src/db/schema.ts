import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Append-only record of things worth knowing after the fact: sign-ins,
 * failed sign-ins, and whatever the app built on this template adds.
 *
 * A single-operator app has no admin console, so this table is the only
 * place a past event is recoverable from.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    kind: text("kind").notNull(),
    actor: text("actor"),
    detail: text("detail"),
  },
  (table) => [index("audit_log_at_idx").on(table.at)],
)

export type AuditLogRow = typeof auditLog.$inferSelect
export type NewAuditLogRow = typeof auditLog.$inferInsert

/** One attribution for a disruption event: who reported it, and where. */
export type EventSourceRef = {
  name: string
  url: string
  sourceEventId: string
  reportedAt: string
}

/**
 * A disruption event on the global map — the canonical model from the
 * Global Disruption Map epic, one shape across every feed.
 *
 * `dedupeKey` is the upsert target for ingestion: `"<source>:<sourceEventId>"`
 * of the event's first-seen source, so re-ingesting the same feed updates the
 * existing row instead of duplicating it (AC7). Stitching reports of the same
 * real-world event from *different* sources into one row — matching by
 * geometry and time instead of a shared ID — is deliberately not attempted
 * here: with a single feed wired up (see the ingestion module) there is
 * nothing yet to stitch, and it is genuinely its own piece of work once a
 * second feed exists.
 *
 * `latitude`/`longitude` plus `geometryPrecision` stand in for the full
 * geometry column (`point`, `polygon`, hazard-specific shapes like a cyclone
 * track cone) the epic describes. A point radius is what AC3's exposure
 * buffer needs; polygon geometry is real follow-up work, not a detail to
 * fold in quietly.
 */
export const disruptionEvents = pgTable(
  "disruption_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dedupeKey: text("dedupe_key").notNull().unique(),
    category: text("category").notNull(),
    subtype: text("subtype").notNull(),
    severity: integer("severity").notNull(),
    status: text("status").notNull().default("active"),
    title: text("title").notNull(),
    summary: text("summary"),
    region: text("region"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    geometryPrecision: text("geometry_precision").notNull().default("point"),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull(),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
    confidence: text("confidence").notNull(),
    sources: jsonb("sources").$type<EventSourceRef[]>().notNull(),
  },
  (table) => [
    index("disruption_events_category_idx").on(table.category),
    index("disruption_events_status_idx").on(table.status),
    index("disruption_events_first_seen_idx").on(table.firstSeen),
  ],
)

export type DisruptionEventRow = typeof disruptionEvents.$inferSelect
export type NewDisruptionEventRow = typeof disruptionEvents.$inferInsert

/**
 * Our own footprint: plants and supplier sites to check event geometry
 * against for AC3's exposure overlay.
 *
 * Hand-entered for now, not sourced from a master-data system — the issue
 * itself calls entity resolution against real supplier/plant master data
 * "the part that will make or break the feature" and worth its own story
 * with MDM ownership. This table is the shape that story would fill in.
 */
export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    tier: integer("tier"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    region: text("region"),
  },
  (table) => [index("sites_kind_idx").on(table.kind)],
)

export type SiteRow = typeof sites.$inferSelect
export type NewSiteRow = typeof sites.$inferInsert

/**
 * One row per ingestion source, tracking the last attempt and last success
 * so a stale or failing feed can be shown as stale rather than silently
 * empty (AC8) instead of inferring staleness from the absence of an event.
 */
export const feedIngestions = pgTable("feed_ingestions", {
  source: text("source").primaryKey(),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastError: text("last_error"),
  eventCount: integer("event_count").notNull().default(0),
})

export type FeedIngestionRow = typeof feedIngestions.$inferSelect
export type NewFeedIngestionRow = typeof feedIngestions.$inferInsert
