import { and, desc, gte, lte, type SQL } from "drizzle-orm"
import { db } from "@/db/client"
import { alerts, type AlertRow } from "@/db/schema"
import type { DateRange } from "@/lib/date-range"

export async function listAlerts(range: DateRange = {}): Promise<AlertRow[]> {
  const conditions: SQL[] = []
  if (range.from) conditions.push(gte(alerts.occurredAt, range.from))
  if (range.to) conditions.push(lte(alerts.occurredAt, range.to))

  return db()
    .select()
    .from(alerts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alerts.occurredAt))
}
