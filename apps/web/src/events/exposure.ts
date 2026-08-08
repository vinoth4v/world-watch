import type { DisruptionEventRow, SiteRow } from "@/db/schema"

const EARTH_RADIUS_KM = 6371

type Coordinates = { latitude: number; longitude: number }

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two points, in kilometres. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Default exposure buffer: AC3 asks for "an event's impact geometry
 * intersects a buffer around one of our sites". Without hazard-specific
 * geometry (flood extent, cyclone track cone — see the schema comment on
 * `disruptionEvents`), a flat radius around the event's point is the v1
 * model the issue's own open questions call out as the simple option.
 * 100km is a starting point, not a calibrated value — it wants a real
 * per-category number from risk once there's more than one feed to tune it
 * against.
 */
export const DEFAULT_EXPOSURE_BUFFER_KM = 100

type Impact = { event: DisruptionEventRow; distanceKm: number }

export type SiteExposure = {
  site: SiteRow
  // A non-empty tuple, not a plain array: every entry in the result of
  // `exposedSites` has at least one impact by construction (see the filter
  // below), and this shape lets callers read `impacts[0]` without a
  // redundant undefined check under `noUncheckedIndexedAccess`.
  impacts: [Impact, ...Impact[]]
}

/**
 * Sites within `bufferKm` of at least one active event, each with its
 * intersecting events sorted nearest-and-most-severe first, and the sites
 * themselves sorted the same way — AC3's "ordered by distance and event
 * severity".
 */
export function exposedSites(
  events: DisruptionEventRow[],
  sites: SiteRow[],
  bufferKm: number = DEFAULT_EXPOSURE_BUFFER_KM,
): SiteExposure[] {
  const active = events.filter((event) => event.status === "active")

  const exposed: SiteExposure[] = []
  for (const site of sites) {
    const impacts = active
      .map((event) => ({ event, distanceKm: haversineDistanceKm(site, event) }))
      .filter((impact) => impact.distanceKm <= bufferKm)
      .sort((a, b) => a.distanceKm - b.distanceKm || b.event.severity - a.event.severity)

    const [nearest, ...rest] = impacts
    if (nearest) exposed.push({ site, impacts: [nearest, ...rest] })
  }

  return exposed.sort((a, b) => {
    const [aTop] = a.impacts
    const [bTop] = b.impacts
    return aTop.distanceKm - bTop.distanceKm || bTop.event.severity - aTop.event.severity
  })
}
