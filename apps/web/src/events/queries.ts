import { and, desc, eq, gte, ilike } from "drizzle-orm"
import { db } from "@/db/client"
import {
  type DisruptionEventRow,
  disruptionEvents,
  type FeedIngestionRow,
  feedIngestions,
  type SiteRow,
  sites,
} from "@/db/schema"

export type EventFilters = {
  category?: string
  minSeverity?: number
  region?: string
  status?: string
}

export async function listEvents(filters: EventFilters = {}): Promise<DisruptionEventRow[]> {
  const conditions = []
  if (filters.category) conditions.push(eq(disruptionEvents.category, filters.category))
  if (filters.status) conditions.push(eq(disruptionEvents.status, filters.status))
  if (filters.minSeverity) conditions.push(gte(disruptionEvents.severity, filters.minSeverity))
  if (filters.region) conditions.push(ilike(disruptionEvents.region, `%${filters.region}%`))

  return db()
    .select()
    .from(disruptionEvents)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(disruptionEvents.severity), desc(disruptionEvents.firstSeen))
}

export async function getEvent(id: string): Promise<DisruptionEventRow | undefined> {
  const [row] = await db().select().from(disruptionEvents).where(eq(disruptionEvents.id, id)).limit(1)
  return row
}

export async function listSites(): Promise<SiteRow[]> {
  return db().select().from(sites).orderBy(sites.name)
}

export async function listFeedIngestions(): Promise<FeedIngestionRow[]> {
  return db().select().from(feedIngestions)
}
