import { and, desc, gte, lte } from "drizzle-orm"
import { db } from "@/db/client"
import { type AlertRow, alerts, type NewAlertRow } from "@/db/schema"

export type DateRange = {
  from?: Date
  to?: Date
}

/**
 * Alerts within an optional [from, to] window, most recent first.
 *
 * `occurredAt` (not `createdAt`) is what the date filter applies to — the
 * map shows when events happened, not when they were entered.
 */
export async function listAlerts(range: DateRange = {}): Promise<AlertRow[]> {
  const conditions = []
  if (range.from) conditions.push(gte(alerts.occurredAt, range.from))
  if (range.to) conditions.push(lte(alerts.occurredAt, range.to))

  return db()
    .select()
    .from(alerts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alerts.occurredAt))
}

export async function createAlert(input: NewAlertRow): Promise<AlertRow> {
  const [row] = await db().insert(alerts).values(input).returning()
  if (!row) throw new Error("insert into alerts returned no row")
  return row
}
