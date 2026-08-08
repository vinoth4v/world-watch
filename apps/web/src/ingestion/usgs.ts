import { z } from "zod"
import { db } from "@/db/client"
import { disruptionEvents, feedIngestions, type NewDisruptionEventRow } from "@/db/schema"
import type { EventSeverity } from "@/events/types"

/**
 * USGS's public significant-earthquakes feed: no API key, no commercial
 * agreement, updated continuously. One real feed for one category
 * (natural hazard / earthquake) out of the epic's full taxonomy — GDACS,
 * NOAA/NHC, Copernicus EMS, NASA FIRMS, ACLED, GDELT, ReliefWeb, and any
 * commercial security/logistics feed all need either an API key, a
 * commercial contract, or both, which is a decision for a human, not
 * something to wire up quietly. See the PR description.
 */
const USGS_SIGNIFICANT_MONTH_FEED =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson"

const usgsFeatureSchema = z.object({
  id: z.string(),
  properties: z.object({
    mag: z.number().nullable(),
    place: z.string().nullable(),
    time: z.number(),
    updated: z.number().nullable(),
    url: z.url(),
    title: z.string().nullable(),
  }),
  geometry: z.object({
    type: z.literal("Point"),
    // [longitude, latitude, depth] — USGS always reports all three.
    coordinates: z.tuple([z.number(), z.number(), z.number()]),
  }),
})

const usgsFeedSchema = z.object({
  features: z.array(usgsFeatureSchema),
})

export type UsgsFeature = z.infer<typeof usgsFeatureSchema>

function severityFromMagnitude(magnitude: number | null): EventSeverity {
  const mag = magnitude ?? 0
  if (mag >= 7.5) return 5
  if (mag >= 7) return 4
  if (mag >= 6.5) return 3
  if (mag >= 6) return 2
  return 1
}

/** Pure mapping from one USGS feature to the canonical event shape — no network, no database. */
export function mapUsgsFeatureToEvent(feature: UsgsFeature): NewDisruptionEventRow {
  const [longitude, latitude] = feature.geometry.coordinates
  const { mag, place, time, updated, url, title } = feature.properties
  const reportedAt = new Date(time).toISOString()

  return {
    dedupeKey: `usgs:${feature.id}`,
    category: "natural_hazard",
    subtype: "earthquake",
    severity: severityFromMagnitude(mag),
    status: "active",
    title: title ?? `M${mag ?? "?"} earthquake`,
    summary: place ? `Magnitude ${mag ?? "unknown"} earthquake, ${place}.` : null,
    region: place,
    latitude,
    longitude,
    geometryPrecision: "point",
    firstSeen: new Date(time),
    lastUpdated: new Date(updated ?? time),
    confidence: "high",
    sources: [{ name: "USGS", url, sourceEventId: feature.id, reportedAt }],
  }
}

async function fetchUsgsFeatures(): Promise<UsgsFeature[]> {
  const response = await fetch(USGS_SIGNIFICANT_MONTH_FEED)
  if (!response.ok) {
    throw new Error(`USGS feed responded ${response.status}`)
  }
  return usgsFeedSchema.parse(await response.json()).features
}

export type IngestResult = { source: "usgs"; count: number }

/**
 * Fetch, map, and upsert USGS's significant-earthquake feed. Re-running this
 * updates existing rows by `dedupeKey` instead of duplicating them (AC7);
 * every run — success or failure — records itself in `feed_ingestions` so a
 * stale or broken feed shows up as stale rather than as an empty layer
 * (AC8), instead of the caller having to infer that from silence.
 */
export async function ingestUsgsEarthquakes(): Promise<IngestResult> {
  const attemptedAt = new Date()

  try {
    const features = await fetchUsgsFeatures()
    const rows = features.map(mapUsgsFeatureToEvent)

    for (const row of rows) {
      await db()
        .insert(disruptionEvents)
        .values(row)
        .onConflictDoUpdate({
          target: disruptionEvents.dedupeKey,
          set: {
            severity: row.severity,
            status: row.status,
            title: row.title,
            summary: row.summary,
            region: row.region,
            latitude: row.latitude,
            longitude: row.longitude,
            lastUpdated: row.lastUpdated,
            confidence: row.confidence,
            sources: row.sources,
          },
        })
    }

    await db()
      .insert(feedIngestions)
      .values({
        source: "usgs",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: attemptedAt,
        lastError: null,
        eventCount: rows.length,
      })
      .onConflictDoUpdate({
        target: feedIngestions.source,
        set: {
          lastAttemptAt: attemptedAt,
          lastSuccessAt: attemptedAt,
          lastError: null,
          eventCount: rows.length,
        },
      })

    return { source: "usgs", count: rows.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await db()
      .insert(feedIngestions)
      .values({ source: "usgs", lastAttemptAt: attemptedAt, lastError: message, eventCount: 0 })
      .onConflictDoUpdate({
        target: feedIngestions.source,
        set: { lastAttemptAt: attemptedAt, lastError: message },
      })

    throw error
  }
}
