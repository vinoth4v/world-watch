import { doublePrecision, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

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

export const alertCategories = ["natural_hazard", "security_incident", "conflict", "other"] as const
export const alertSeverities = ["low", "medium", "high", "critical"] as const

export type AlertCategory = (typeof alertCategories)[number]
export type AlertSeverity = (typeof alertSeverities)[number]

/**
 * A single reported hazard, incident, conflict, or disruption, located by
 * latitude/longitude so it can be plotted on the world map.
 *
 * There is no ingestion pipeline yet, so rows come from the operator via the
 * homepage form — `occurredAt` is when the event happened, `createdAt` is
 * when it was recorded, and they can differ for historical entries.
 */
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category", { enum: alertCategories }).notNull(),
    severity: text("severity", { enum: alertSeverities }).notNull().default("medium"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    summary: text("summary"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("alerts_occurred_at_idx").on(table.occurredAt)],
)

export type AlertRow = typeof alerts.$inferSelect
export type NewAlertRow = typeof alerts.$inferInsert
