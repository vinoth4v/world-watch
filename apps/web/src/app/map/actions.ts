"use server"

import { revalidatePath } from "next/cache"
import { ingestUsgsEarthquakes } from "@/ingestion/usgs"

/**
 * Failures are already recorded in `feed_ingestions` by `ingestUsgsEarthquakes`
 * itself — swallowed here too so a feed outage degrades the page to a stale
 * banner (AC8) instead of an error screen.
 */
export async function refreshUsgsAction(): Promise<void> {
  try {
    await ingestUsgsEarthquakes()
  } catch (error) {
    console.error("USGS refresh failed", error)
  }
  revalidatePath("/map")
}
