import { NextResponse } from "next/server"
import { ingestUsgsEarthquakes } from "@/ingestion/usgs"

/**
 * Manually-triggered ingestion for now: the operator's session gates this
 * route the same as every other page (see `proxy.ts`), which is enough for
 * "click a button while signed in". A scheduled run (Vercel Cron, say) needs
 * its own auth story — a shared secret header, most likely — plus a decision
 * about which Vercel plan tier that requires, which is not this PR's call to
 * make quietly.
 */
export async function POST() {
  try {
    const result = await ingestUsgsEarthquakes()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ source: "usgs", error: message }, { status: 502 })
  }
}
